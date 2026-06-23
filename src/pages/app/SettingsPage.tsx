import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Store,
  ShieldCheck,
  Bell,
  Mail,
  Lock,
  Key,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const notificationSettings = useSettingsStore((state) => state.notificationSettings);
  const updateNotificationSettings = useSettingsStore((state) => state.updateNotificationSettings);
  const { toast } = useToast();

  // Loading states
  const [isLoadingDbData, setIsLoadingDbData] = useState(true);
  const [isSavingOwner, setIsSavingOwner] = useState(false);
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Card 1 state: Owner Data
  const [name, setName] = useState(user?.name || "");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");

  // Card 2 state: Store Data
  const [storeName, setStoreName] = useState("");

  // Card 3 state: Security Data
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Mask CPF function
  const maskCpf = (cpfStr: string | null | undefined): string => {
    if (!cpfStr) return "Não informado";
    const cleaned = cpfStr.replace(/\D/g, "");
    if (cleaned.length !== 11) return cpfStr; // Return as is if not standard
    const lastTwo = cleaned.substring(9);
    return `***.***.***-${lastTwo}`;
  };

  // Format Birth Date function
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "Não informado";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Load user details from Database
  useEffect(() => {
    const fetchUserDbDetails = async () => {
      if (!user?.id) return;
      try {
        setIsLoadingDbData(true);
        const { data, error } = await supabase
          .from("User")
          .select("cpf, birthDate, storeName")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setCpf(data.cpf || "");
          setBirthDate(data.birthDate || "");
          setStoreName(data.storeName || "");
        }
      } catch (err: any) {
        console.error("Erro ao carregar detalhes do proprietário:", err);
      } finally {
        setIsLoadingDbData(false);
      }
    };

    fetchUserDbDetails();
  }, [user?.id]);

  // Handler: Save Card 1 (Owner Data)
  const handleSaveOwner = async () => {
    if (!user?.id) return;
    if (!name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome completo não pode ficar em branco.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingOwner(true);
      const { error } = await supabase
        .from("User")
        .update({ name: name.trim() })
        .eq("id", user.id);

      if (error) throw error;

      // Update local state in store
      updateUser({ name: name.trim() });

      toast({
        title: "Sucesso!",
        description: "Os dados do proprietário foram atualizados.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description: err.message || "Erro inesperado ao atualizar nome.",
        variant: "destructive",
      });
    } finally {
      setIsSavingOwner(false);
    }
  };

  // Handler: Save Card 2 (Store Info & Sync to Checkouts)
  const handleSaveStore = async () => {
    if (!user?.id) return;
    if (!storeName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome da loja não pode ficar em branco.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingStore(true);

      // 1. Update User storeName in Database
      const { error: userError } = await supabase
        .from("User")
        .update({ storeName: storeName.trim() })
        .eq("id", user.id);

      if (userError) throw userError;

      // 2. Fetch all user's checkout customizations to sync
      const { data: checkouts, error: fetchError } = await supabase
        .from("CheckoutCustomization")
        .select("id, theme")
        .eq("userId", user.id);

      if (fetchError) throw fetchError;

      // 3. Update each checkout's theme.storeName
      if (checkouts && checkouts.length > 0) {
        const updatePromises = checkouts.map((checkout) => {
          const currentTheme = typeof checkout.theme === "object" ? checkout.theme : {};
          return supabase
            .from("CheckoutCustomization")
            .update({
              theme: {
                ...currentTheme,
                storeName: storeName.trim(),
              },
            })
            .eq("id", checkout.id);
        });

        const results = await Promise.all(updatePromises);
        const errorResult = results.find((r) => r.error);
        if (errorResult && errorResult.error) throw errorResult.error;
      }

      // 4. Update local state in store
      updateUser({ storeName: storeName.trim() });

      toast({
        title: "Sucesso!",
        description: "Nome da loja salvo e todos os checkouts foram sincronizados.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description: err.message || "Erro ao atualizar informações da loja.",
        variant: "destructive",
      });
    } finally {
      setIsSavingStore(false);
    }
  };

  // Handler: Change Email
  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite o novo e-mail.",
        variant: "destructive",
      });
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      toast({
        title: "E-mail inválido",
        description: "Insira um endereço de e-mail no formato correto.",
        variant: "destructive",
      });
      return;
    }

    if (newEmail.trim() === user?.email) {
      toast({
        title: "Aviso",
        description: "O novo e-mail deve ser diferente do atual.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingEmail(true);

      // Supabase auth update email
      const { error: authError } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      });

      if (authError) throw authError;

      // Update User email in Database directly
      const { error: dbError } = await supabase
        .from("User")
        .update({ email: newEmail.trim() })
        .eq("id", user.id);

      if (dbError) throw dbError;

      // Update local state in store
      updateUser({ email: newEmail.trim() });
      setNewEmail("");

      toast({
        title: "E-mail Atualizado!",
        description: "Verifique o seu novo e-mail para confirmar a alteração.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Erro ao atualizar e-mail",
        description: err.message || "Ocorreu um erro ao tentar alterar o e-mail.",
        variant: "destructive",
      });
    } finally {
      setIsSavingEmail(false);
    }
  };

  // Handler: Change Password
  const handleChangePassword = async () => {
    if (!newPassword) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, digite a nova senha.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Senha fraca",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas divergentes",
        description: "A nova senha e a confirmação não conferem.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingPassword(true);

      // Supabase auth update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");

      toast({
        title: "Senha Atualizada!",
        description: "Sua nova senha foi salva com sucesso.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Erro ao atualizar senha",
        description: err.message || "Ocorreu um erro ao tentar alterar a senha.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Toggle notification switch
  const handleToggleNotification = (key: "newOrderCreated" | "paymentConfirmed" | "orderGenerated", value: boolean) => {
    updateNotificationSettings({ [key]: value });
  };

  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
          Configurações
        </h1>
        <p className="text-gray-600 dark:text-gray-300 font-medium">
          Gerencie as preferências da sua conta, segurança e informações da loja
        </p>
      </div>

      {isLoadingDbData ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 text-sm animate-pulse">
            Carregando suas informações...
          </p>
        </div>
      ) : (
        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* CARD 1: Dados do Proprietário */}
          <motion.div variants={itemVariants}>
            <Card className="border border-gray-100 dark:border-gray-800/80 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl shadow-lg transition-all duration-300 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-gray-900 dark:text-white">
                  <User className="h-5 w-5 text-blue-500" />
                  Dados do Proprietário
                </CardTitle>
                <CardDescription>
                  Informações pessoais registradas no seu cadastro. Os campos bloqueados não podem ser editados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Name field (Editable) */}
                <div className="space-y-2">
                  <Label htmlFor="owner-name" className="text-sm font-semibold text-gray-900 dark:text-white">
                    Nome completo
                  </Label>
                  <Input
                    id="owner-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-gray-900 dark:text-white rounded-xl"
                    placeholder="Nome completo do proprietário"
                  />
                </div>

                {/* Readonly Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Email field */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                        E-mail
                      </Label>
                      <span className="text-[10px] bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                        Alterar abaixo
                      </span>
                    </div>
                    <Input
                      value={user?.email || ""}
                      readOnly
                      className="bg-gray-100/50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-75 font-medium text-gray-500 dark:text-gray-400 rounded-xl"
                    />
                  </div>

                  {/* CPF field */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                        CPF
                      </Label>
                      <span className="text-[10px] bg-red-500/10 text-red-500 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 font-medium">
                        Bloqueado
                      </span>
                    </div>
                    <Input
                      value={maskCpf(cpf)}
                      readOnly
                      className="bg-gray-100/50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-75 font-medium text-gray-500 dark:text-gray-400 rounded-xl"
                    />
                  </div>

                  {/* Birth Date field */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                        Data de Nascimento
                      </Label>
                      <span className="text-[10px] bg-red-500/10 text-red-500 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 font-medium">
                        Bloqueado
                      </span>
                    </div>
                    <Input
                      value={formatDate(birthDate)}
                      readOnly
                      className="bg-gray-100/50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-75 font-medium text-gray-500 dark:text-gray-400 rounded-xl"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/30 dark:bg-gray-900/20 px-6 py-4 flex justify-end">
                <Button
                  onClick={handleSaveOwner}
                  loading={isSavingOwner}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none shadow-md transition-all duration-300 rounded-xl font-bold"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Salvar Proprietário
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* CARD 2: Informações da Loja */}
          <motion.div variants={itemVariants}>
            <Card className="border border-gray-100 dark:border-gray-800/80 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl shadow-lg transition-all duration-300 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-gray-900 dark:text-white">
                  <Store className="h-5 w-5 text-purple-500" />
                  Informações da Loja
                </CardTitle>
                <CardDescription>
                  Configure os dados principais da sua loja. O nome será sincronizado automaticamente com todos os templates de checkout.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Store Name field */}
                <div className="space-y-2">
                  <Label htmlFor="store-name" className="text-sm font-semibold text-gray-900 dark:text-white">
                    Nome da loja
                  </Label>
                  <Input
                    id="store-name"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500/50 transition-all font-medium text-gray-900 dark:text-white rounded-xl"
                    placeholder="Ex: Minha Loja Sync"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 pt-1">
                    <Sparkles className="h-3.5 w-3.5 text-purple-500 animate-pulse" />
                    O nome da loja será atualizado automaticamente em todos os seus templates de checkout.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/30 dark:bg-gray-900/20 px-6 py-4 flex justify-end">
                <Button
                  onClick={handleSaveStore}
                  loading={isSavingStore}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none shadow-md transition-all duration-300 rounded-xl font-bold"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Salvar Loja
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* CARD 3: Segurança da Conta */}
          <motion.div variants={itemVariants}>
            <Card className="border border-gray-100 dark:border-gray-800/80 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl shadow-lg transition-all duration-300 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-gray-900 dark:text-white">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  Segurança da Conta
                </CardTitle>
                <CardDescription>
                  Gerencie o e-mail de acesso e senha de segurança da sua conta.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Seção 1: Alterar E-mail */}
                <div className="space-y-3 p-4 rounded-xl bg-gray-50/30 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800/80">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                    <Mail className="h-4 w-4 text-emerald-500" />
                    Alterar E-mail de Acesso
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="new-email" className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Novo endereço de e-mail
                      </Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-gray-900 dark:text-white rounded-xl"
                        placeholder="Digite o novo e-mail"
                      />
                    </div>
                    <Button
                      onClick={handleChangeEmail}
                      loading={isSavingEmail}
                      variant="outline"
                      className="border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-500 font-bold rounded-xl h-10 transition-all"
                    >
                      Atualizar E-mail
                    </Button>
                  </div>
                </div>

                {/* Seção 2: Alterar Senha */}
                <div className="space-y-4 p-4 rounded-xl bg-gray-50/30 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800/80">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                    <Lock className="h-4 w-4 text-emerald-500" />
                    Alterar Senha de Segurança
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password-input" className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Nova senha (mínimo 8 caracteres)
                      </Label>
                      <Input
                        id="new-password-input"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-gray-900 dark:text-white rounded-xl"
                        placeholder="Nova senha"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password-input" className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Confirmar nova senha
                      </Label>
                      <Input
                        id="confirm-password-input"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-gray-900 dark:text-white rounded-xl"
                        placeholder="Confirmar senha"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleChangePassword}
                      loading={isSavingPassword}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none shadow-md transition-all duration-300 rounded-xl font-bold"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Atualizar Senha
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CARD 4: Notificações de Vendas */}
          <motion.div variants={itemVariants}>
            <Card className="border border-gray-100 dark:border-gray-800/80 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl shadow-lg transition-all duration-300 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-gray-900 dark:text-white">
                  <Bell className="h-5 w-5 text-pink-500" />
                  Notificações de Vendas
                </CardTitle>
                <CardDescription>
                  Selecione quais eventos de vendas você deseja notificar no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Toggles */}
                <div className="grid grid-cols-1 gap-3.5">
                  {/* Toggle 1: Novo pedido criado */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/30 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800/80">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                        Novo pedido criado
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Notificar quando o cliente inicia ou gera um novo pedido
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.newOrderCreated}
                      onCheckedChange={(val) => handleToggleNotification("newOrderCreated", val)}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-purple-600"
                    />
                  </div>

                  {/* Toggle 2: Pagamento confirmado */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/30 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800/80">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                        Pagamento confirmado
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Notificar assim que o pagamento do pedido for processado e confirmado
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.paymentConfirmed}
                      onCheckedChange={(val) => handleToggleNotification("paymentConfirmed", val)}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-purple-600"
                    />
                  </div>

                  {/* Toggle 3: Pedido gerado */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/30 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800/80">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                        Pedido gerado (Pix/Boleto)
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Notificar quando um Pix ou boleto de compra é gerado
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.orderGenerated}
                      onCheckedChange={(val) => handleToggleNotification("orderGenerated", val)}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-purple-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default SettingsPage;
