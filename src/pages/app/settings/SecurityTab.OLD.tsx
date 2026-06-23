import React, { useState } from "react";
import { motion } from "framer-motion";
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
import { useToast } from "@/components/ui/use-toast";
import { useStore } from "@/store/useStore";
import {
  ShieldCheck,
  Lock,
  Key,
  Smartphone,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export const SecurityTab: React.FC = () => {
  const { toast } = useToast();
  const isTwoFactorEnabled = useStore((state) => state.isTwoFactorEnabled);
  const setTwoFactorEnabled = useStore((state) => state.setTwoFactorEnabled);

  const [localTwoFactor, setLocalTwoFactor] = useState(isTwoFactorEnabled);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveChanges = () => {
    setIsSaving(true);
    setTimeout(() => {
      setTwoFactorEnabled(localTwoFactor);
      setIsSaving(false);
      toast({
        title: "Segurança Atualizada",
        description:
          "Suas configurações de segurança foram salvas com sucesso.",
        variant: "success",
      });
    }, 1000);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={itemVariants}>
      <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/5 dark:to-emerald-500/5">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            Segurança
          </CardTitle>
          <CardDescription>
            Gerencie sua senha e autenticação de dois fatores
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Password Section */}
          <motion.div
            className="space-y-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-700/50"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Alterar Senha
              </h3>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="current-password"
                className="text-sm font-semibold flex items-center gap-2"
              >
                <div className="p-1 rounded bg-gradient-to-br from-gray-500 to-gray-600">
                  <Key className="h-3 w-3 text-white" />
                </div>
                Senha Atual
              </Label>
              <Input
                id="current-password"
                type="password"
                className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-green-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="new-password"
                className="text-sm font-semibold flex items-center gap-2"
              >
                <div className="p-1 rounded bg-gradient-to-br from-green-500 to-emerald-600">
                  <Key className="h-3 w-3 text-white" />
                </div>
                Nova Senha
              </Label>
              <Input
                id="new-password"
                type="password"
                className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-green-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirm-password"
                className="text-sm font-semibold flex items-center gap-2"
              >
                <div className="p-1 rounded bg-gradient-to-br from-emerald-500 to-green-600">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
                Confirmar Nova Senha
              </Label>
              <Input
                id="confirm-password"
                type="password"
                className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </motion.div>

          <Separator className="my-6" />

          {/* Two-Factor Authentication */}
          <motion.div
            className="p-5 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-800/50"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    Autenticação de Dois Fatores (2FA)
                    {localTwoFactor && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ativo
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Adicione uma camada extra de segurança à sua conta usando um
                    código de verificação do seu celular.
                  </p>
                </div>
              </div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Switch
                  checked={localTwoFactor}
                  onCheckedChange={setLocalTwoFactor}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-600"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Security Info */}
          <motion.div
            className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                  Dicas de Segurança
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                    Use senhas fortes com pelo menos 8 caracteres
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                    Ative a autenticação de dois fatores para maior segurança
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                    Nunca compartilhe suas credenciais com terceiros
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </CardContent>
        <CardFooter className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleSaveChanges}
              loading={isSaving}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

