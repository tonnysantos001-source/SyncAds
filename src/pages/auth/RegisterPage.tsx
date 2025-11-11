import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MapPin,
  User,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import * as z from "zod";
import { validateCPF, formatCPF } from "@/lib/utils/cpfValidator";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/use-toast";
import Logo from "@/components/Logo";

// Schemas de validação
const step1Schema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  cpf: z.string().min(11, "CPF inválido").max(14),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
});

const step2Schema = z.object({
  cep: z.string().min(8, "CEP inválido").max(9),
  street: z.string().min(3, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "Estado deve ter 2 caracteres"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form Step 1
  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      cpf: "",
      birthDate: "",
    },
  });

  // Form Step 2
  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      cep: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    },
  });

  // Buscar CEP na API ViaCEP
  const handleCepBlur = async () => {
    const cep = form2.getValues("cep").replace(/\D/g, "");

    if (cep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
          toast({
            title: "CEP não encontrado",
            description: "Verifique o CEP e tente novamente.",
            variant: "destructive",
          });
          return;
        }

        // Preencher campos automaticamente
        form2.setValue("street", data.logradouro || "");
        form2.setValue("neighborhood", data.bairro || "");
        form2.setValue("city", data.localidade || "");
        form2.setValue("state", data.uf || "");

        toast({
          title: "CEP encontrado!",
          description: "Endereço preenchido automaticamente.",
        });
      } catch (error) {
        toast({
          title: "Erro ao buscar CEP",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  // Submit Step 1
  const onSubmitStep1 = (data: Step1Data) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  // Submit Step 2 (Final)
  const onSubmitStep2 = async (addressData: Step2Data) => {
    if (!step1Data) return;

    try {
      // Registrar usuário com todos os dados
      await registerUser(
        step1Data.email,
        step1Data.password,
        step1Data.name,
        step1Data.cpf,
        step1Data.birthDate,
        addressData,
      );

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao SyncAds.",
      });

      navigate("/onboarding");
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  // Formatar CPF
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  // Formatar CEP
  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 py-12">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-3xl"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Botão Voltar */}
      <Link
        to="/landing"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors z-10"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="text-sm font-medium">Voltar</span>
      </Link>

      <Card className="w-full max-w-2xl relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl z-10">
        {/* Gradient top border */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        <CardHeader className="text-center pt-8 pb-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-50" />
              <div className="relative h-16 w-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-white font-black text-3xl">S</span>
              </div>
            </motion.div>
          </div>

          <CardTitle className="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Criar Conta
          </CardTitle>
          <CardDescription className="text-base">
            {currentStep === 1
              ? "Preencha seus dados pessoais"
              : "Agora, informe seu endereço"}
          </CardDescription>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  currentStep >= 1
                    ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                }`}
              >
                {currentStep > 1 ? <CheckCircle2 className="h-5 w-5" /> : "1"}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Dados
              </span>
            </div>

            <div className="w-16 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                initial={{ width: "0%" }}
                animate={{ width: currentStep >= 2 ? "100%" : "0%" }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  currentStep >= 2
                    ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Endereço
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={form1.handleSubmit(onSubmitStep1)}
                className="space-y-4"
              >
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    {...form1.register("name")}
                    placeholder="Seu nome completo"
                    className="border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                  />
                  {form1.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {form1.formState.errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form1.register("email")}
                    placeholder="seu@email.com"
                    className="border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                  />
                  {form1.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {form1.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Senha */}
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    {...form1.register("password")}
                    placeholder="Mínimo 6 caracteres"
                    className="border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                  />
                  {form1.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {form1.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* CPF e Data de Nascimento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      {...form1.register("cpf")}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      onChange={(e) => {
                        e.target.value = formatCPF(e.target.value);
                        form1.setValue("cpf", e.target.value);
                      }}
                      className="border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {form1.formState.errors.cpf && (
                      <p className="text-sm text-red-500">
                        {form1.formState.errors.cpf.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de Nascimento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      {...form1.register("birthDate")}
                      className="border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {form1.formState.errors.birthDate && (
                      <p className="text-sm text-red-500">
                        {form1.formState.errors.birthDate.message}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={form1.formState.isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30"
                >
                  Próximo: Endereço
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={form2.handleSubmit(onSubmitStep2)}
                className="space-y-4"
              >
                {/* CEP */}
                <div className="space-y-2">
                  <Label htmlFor="cep" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    CEP
                  </Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      {...form2.register("cep")}
                      placeholder="00000-000"
                      maxLength={9}
                      onChange={(e) => {
                        e.target.value = formatCEP(e.target.value);
                        form2.setValue("cep", e.target.value);
                      }}
                      onBlur={handleCepBlur}
                      className="border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                    />
                    {isLoadingCep && (
                      <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-purple-600" />
                    )}
                  </div>
                  {form2.formState.errors.cep && (
                    <p className="text-sm text-red-500">
                      {form2.formState.errors.cep.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    O endereço será preenchido automaticamente
                  </p>
                </div>

                {/* Rua e Número */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="street">Rua</Label>
                    <Input
                      id="street"
                      {...form2.register("street")}
                      placeholder="Nome da rua"
                      className="border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                    />
                    {form2.formState.errors.street && (
                      <p className="text-sm text-red-500">
                        {form2.formState.errors.street.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      {...form2.register("number")}
                      placeholder="123"
                      className="border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                    />
                    {form2.formState.errors.number && (
                      <p className="text-sm text-red-500">
                        {form2.formState.errors.number.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Complemento */}
                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento (opcional)</Label>
                  <Input
                    id="complement"
                    {...form2.register("complement")}
                    placeholder="Apto, bloco, etc."
                    className="border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                {/* Bairro */}
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    {...form2.register("neighborhood")}
                    placeholder="Nome do bairro"
                    className="border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                  />
                  {form2.formState.errors.neighborhood && (
                    <p className="text-sm text-red-500">
                      {form2.formState.errors.neighborhood.message}
                    </p>
                  )}
                </div>

                {/* Cidade e Estado */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      {...form2.register("city")}
                      placeholder="Nome da cidade"
                      className="border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                    />
                    {form2.formState.errors.city && (
                      <p className="text-sm text-red-500">
                        {form2.formState.errors.city.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      {...form2.register("state")}
                      placeholder="UF"
                      maxLength={2}
                      className="border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500 uppercase"
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                        form2.setValue("state", e.target.value);
                      }}
                    />
                    {form2.formState.errors.state && (
                      <p className="text-sm text-red-500">
                        {form2.formState.errors.state.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 border-gray-300 dark:border-gray-700"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    disabled={form2.formState.isSubmitting}
                    className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30"
                  >
                    {form2.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      <>
                        Criar Conta
                        <CheckCircle2 className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Link para Login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Já tem uma conta?{" "}
              <Link
                to="/login"
                className="font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent hover:underline"
              >
                Faça login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
