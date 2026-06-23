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
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Sparkles,
  Lock,
  Mail,
  Key,
  ShieldCheck,
  Bell,
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
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25 },
    },
  };

  return (
    <div className="space-y-6 w-full">
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
          {/* CARD 1: Informações da Loja */}
          <motion.div variants={itemVariants}>
            <Card className="border border-gray-100 dark:border-gray-800/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    Informações da loja
                  </CardTitle>
                  <CardDescription>
                    Nome exibido no dashboard e em comunicações da loja.
                  </CardDescription>
                </div>
                <Button
                  onClick={handleSaveStore}
                  loading={isSavingStore}
                  className="bg-primary hover:bg-primary/90 text-white shadow-sm rounded-lg font-semibold h-9 px-4 shrink-0"
                >
                  Salvar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="store-name" className="text-sm font-semibold text-gray-900 dark:text-white">
                    Nome da loja
                  </Label>
                  <Input
                    id="store-name"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/50 transition-all font-medium text-gray-900 dark:text-white rounded-lg h-11 text-sm"
                    placeholder="Ex: Minha Loja Sync"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CARD 2: Dados do Proprietário */}
          <motion.div variants={itemVariants}>
            <Card className="border border-gray-100 dark:border-gray-800/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    Dados do proprietário
                  </CardTitle>
                  <CardDescription>
                    Nome editável. E-mail e documento são fixos por segurança e conformidade fiscal.
                  </CardDescription>
                </div>
                <Button
                  onClick={handleSaveOwner}
                  loading={isSavingOwner}
                  className="bg-primary hover:bg-primary/90 text-white shadow-sm rounded-lg font-semibold h-9 px-4 shrink-0"
                >
                  Salvar
                </Button>
              </CardHeader>
              <CardContent className="pb-6">
                {/* Inputs Grid - 4 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Name field (Editable) */}
                  <div className="space-y-2">
                    <Label htmlFor="owner-name" className="text-sm font-semibold text-gray-900 dark:text-white">
                      Nome completo
                    </Label>
                    <Input
                      id="owner-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/50 transition-all font-medium text-gray-900 dark:text-white rounded-lg h-11 text-sm"
                      placeholder="Nome completo do proprietário"
                    />
                    <p className="text-[11px] text-green-600 dark:text-green-400 mt-1 font-medium">Editável</p>
                  </div>

                  {/* Email field */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                      E-mail
                    </Label>
                    <Input
                      value={user?.email || ""}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-75 font-medium text-gray-500 dark:text-gray-400 rounded-lg h-11 text-sm"
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Não pode ser alterado</p>
                  </div>

                  {/* CPF field */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                      CPF
                    </Label>
                    <Input
                      value={maskCpf(cpf)}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-75 font-medium text-gray-500 dark:text-gray-400 rounded-lg h-11 text-sm"
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Dado fiscal da conta</p>
                  </div>

                  {/* Birth Date field */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                      Data de Nascimento
                    </Label>
                    <Input
                      value={formatDate(birthDate)}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-75 font-medium text-gray-500 dark:text-gray-400 rounded-lg h-11 text-sm"
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Data vinculada à conta</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CARD 3: Segurança */}
          <motion.div variants={itemVariants}>
            <Card className="border border-gray-100 dark:border-gray-800/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  Segurança
                </CardTitle>
                <CardDescription>
                  Proteja o acesso à sua conta gerenciando suas credenciais de login.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pb-6">
                {/* Seção 1: Alterar E-mail */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Alterar E-mail de Acesso
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-end max-w-2xl">
                    <div className="flex-1 w-full space-y-2">
                      <Label htmlFor="new-email" className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Novo endereço de e-mail
                      </Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/50 transition-all font-medium text-gray-900 dark:text-white rounded-lg h-11 text-sm"
                        placeholder="Digite o novo e-mail"
                      />
                    </div>
                    <Button
                      onClick={handleChangeEmail}
                      loading={isSavingEmail}
                      variant="outline"
                      className="border-primary/20 hover:bg-primary/10 text-primary font-bold rounded-lg h-11 px-6 transition-all shrink-0 w-full md:w-auto"
                    >
                      Atualizar E-mail
                    </Button>
                  </div>
                </div>

                {/* Seção 2: Alterar Senha */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
                    <Key className="h-4 w-4 text-primary" />
                    Alterar Senha de Segurança
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-end max-w-3xl">
                    <div className="flex-1 w-full space-y-2">
                      <Label htmlFor="new-password-input" className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Nova senha (mínimo 8 caracteres)
                      </Label>
                      <Input
                        id="new-password-input"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/50 transition-all font-medium text-gray-900 dark:text-white rounded-lg h-11 text-sm"
                        placeholder="Nova senha"
                      />
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <Label htmlFor="confirm-password-input" className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Confirmar nova senha
                      </Label>
                      <Input
                        id="confirm-password-input"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/50 transition-all font-medium text-gray-900 dark:text-white rounded-lg h-11 text-sm"
                        placeholder="Confirmar senha"
                      />
                    </div>
                    <Button
                      onClick={handleChangePassword}
                      loading={isSavingPassword}
                      className="bg-primary hover:bg-primary/90 text-white shadow-sm rounded-lg font-bold h-11 px-6 transition-all shrink-0 w-full md:w-auto"
                    >
                      Atualizar Senha
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CARD 4: Notificações */}
          <motion.div variants={itemVariants}>
            <Card className="border border-gray-100 dark:border-gray-800/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  Notificações
                </CardTitle>
                <CardDescription>
                  Selecione quais eventos de vendas você deseja notificar no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                {/* Toggles - Horizontal 3 columns grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Toggle 1: Novo pedido criado */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-850">
                    <div className="space-y-0.5 pr-2">
                      <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                        Novo pedido criado
                      </Label>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                        Notificar ao iniciar ou gerar um pedido
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.newOrderCreated}
                      onCheckedChange={(val) => handleToggleNotification("newOrderCreated", val)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  {/* Toggle 2: Pagamento confirmado */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-850">
                    <div className="space-y-0.5 pr-2">
                      <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                        Pagamento confirmado
                      </Label>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                        Notificar ao processar pagamento
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.paymentConfirmed}
                      onCheckedChange={(val) => handleToggleNotification("paymentConfirmed", val)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  {/* Toggle 3: Pedido gerado */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-850">
                    <div className="space-y-0.5 pr-2">
                      <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                        Pedido gerado (Pix/Boleto)
                      </Label>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                        Notificar ao gerar Pix ou boleto
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.orderGenerated}
                      onCheckedChange={(val) => handleToggleNotification("orderGenerated", val)}
                      className="data-[state=checked]:bg-primary"
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
