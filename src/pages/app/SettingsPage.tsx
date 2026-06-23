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
  Settings as SettingsIcon,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  ShieldAlert,
  Loader2,
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
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20">
      <motion.div
        className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Configurações
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Gerencie as preferências da sua conta, segurança e informações da loja
              </p>
            </div>
          </div>
        </motion.div>

        {isLoadingDbData ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <p className="text-gray-500 dark:text-gray-400 text-sm animate-pulse">
              Carregando suas informações...
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* CARD 1: Dados do Proprietário */}
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-500/5 dark:to-cyan-500/5">
                  <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    Dados do Proprietário
                  </CardTitle>
                  <CardDescription>
                    Informações pessoais registradas no seu cadastro. Os campos bloqueados não podem ser editados.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Name field (Editable) */}
                  <div className="space-y-2">
                    <Label htmlFor="owner-name" className="text-sm font-semibold text-gray-900 dark:text-white">
                      Nome completo
                    </Label>
                    <Input
                      id="owner-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-white/50 dark:bg-gray-850/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-gray-900 dark:text-white"
                      placeholder="Nome completo do proprietário"
                    />
                  </div>

                  {/* Readonly Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Email field */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                          E-mail
                        </Label>
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                          Trocar abaixo
                        </span>
                      </div>
                      <Input
                        value={user?.email || ""}
                        readOnly
                        className="bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-75 font-medium text-gray-500 dark:text-gray-400"
                      />
                    </div>

                    {/* CPF field */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                          CPF
                        </Label>
                        <span className="text-[10px] bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-200/50 dark:border-red-900/30 font-medium">
                          Bloqueado
                        </span>
                      </div>
                      <Input
                        value={maskCpf(cpf)}
                        readOnly
                        className="bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-75 font-medium text-gray-500 dark:text-gray-400"
                      />
                    </div>

                    {/* Birth Date field */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                          Data de Nascimento
                        </Label>
                        <span className="text-[10px] bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-200/50 dark:border-red-900/30 font-medium">
                          Bloqueado
                        </span>
                      </div>
                      <Input
                        value={formatDate(birthDate)}
                        readOnly
                        className="bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-75 font-medium text-gray-500 dark:text-gray-400"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4 flex justify-end">
                  <Button
                    onClick={handleSaveOwner}
                    loading={isSavingOwner}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Salvar Proprietário
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            {/* CARD 2: Informações da Loja */}
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-500/5 dark:to-amber-500/5">
                  <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-md">
                      <Store className="h-5 w-5 text-white" />
                    </div>
                    Informações da Loja
                  </CardTitle>
                  <CardDescription>
                    Configure os dados principais da sua loja. O nome será sincronizado automaticamente com todos os templates de checkout.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Store Name field */}
                  <div className="space-y-2">
                    <Label htmlFor="store-name" className="text-sm font-semibold text-gray-900 dark:text-white">
                      Nome da loja
                    </Label>
                    <Input
                      id="store-name"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="bg-white/50 dark:bg-gray-805/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-orange-500/50 transition-all font-medium text-gray-900 dark:text-white"
                      placeholder="Ex: Minha Loja Sync"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200/50 dark:border-orange-900/30">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-md text-white">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                          Sincronização Ativa
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Ao salvar o nome da loja, atualizamos automaticamente a propriedade visual em todos os checkouts que você já criou. Você não precisará editá-los um a um!
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4 flex justify-end">
                  <Button
                    onClick={handleSaveStore}
                    loading={isSavingStore}
                    className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Salvar Loja
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            {/* CARD 3: Segurança da Conta */}
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5">
                  <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                      <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    Segurança da Conta
                  </CardTitle>
                  <CardDescription>
                    Gerencie o e-mail de acesso e senha de segurança da sua conta.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  {/* Seção 1: Alterar E-mail */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-md font-semibold text-gray-900 dark:text-white">
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
                          className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-gray-900 dark:text-white"
                          placeholder="Digite o novo e-mail"
                        />
                      </div>
                      <Button
                        onClick={handleChangeEmail}
                        loading={isSavingEmail}
                        variant="outline"
                        className="border-emerald-200/50 hover:bg-emerald-500/10 hover:text-emerald-600 text-emerald-500 font-semibold w-full"
                      >
                        Atualizar E-mail
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-gray-200/50 dark:bg-gray-800/50" />

                  {/* Seção 2: Alterar Senha */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-md font-semibold text-gray-900 dark:text-white">
                      <Lock className="h-4 w-4 text-emerald-500" />
                      Alterar Senha de Segurança
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="new-password-input" className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          Nova senha (mínimo 8 caracteres)
                        </Label>
                        <Input
                          id="new-password-input"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-gray-900 dark:text-white"
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
                          className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-gray-900 dark:text-white"
                          placeholder="Confirmar senha"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleChangePassword}
                        loading={isSavingPassword}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Atualizar Senha
                      </Button>
                    </div>
                  </div>

                  {/* Security tips warning box */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/50 dark:border-emerald-900/30">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md text-white">
                        <ShieldAlert className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                          Aviso Importante
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Ao solicitar alteração de e-mail, uma confirmação será enviada para o novo endereço. A alteração no painel é refletida assim que você confirmar o e-mail.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* CARD 4: Notificações de Vendas */}
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/5 dark:to-pink-500/5">
                  <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-md">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                    Notificações de Vendas
                  </CardTitle>
                  <CardDescription>
                    Selecione quais eventos de vendas você deseja notificar no sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Toggles */}
                  <div className="space-y-4">
                    {/* Toggle 1: Novo pedido criado */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-150 dark:border-gray-800">
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
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-600"
                      />
                    </div>

                    {/* Toggle 2: Pagamento confirmado */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-150 dark:border-gray-800">
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
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-600"
                      />
                    </div>

                    {/* Toggle 3: Pedido gerado */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-150 dark:border-gray-800">
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
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-600"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SettingsPage;
