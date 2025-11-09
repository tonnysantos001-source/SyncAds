import React, { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useStore, NotificationSettings } from "@/store/useStore";
import {
  Bell,
  Mail,
  Smartphone,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Zap,
  TrendingUp,
} from "lucide-react";

const CheckboxNotificationItem: React.FC<{
  id: keyof NotificationSettings;
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: React.ReactNode;
  delay?: number;
}> = ({
  id,
  title,
  description,
  checked,
  onCheckedChange,
  icon,
  delay = 0,
}) => (
  <motion.div
    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300 group"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    whileHover={{ x: 5 }}
  >
    <div className="mt-0.5">{icon}</div>
    <div className="flex-1 space-y-1">
      <Label
        htmlFor={id}
        className="text-sm font-medium cursor-pointer text-gray-900 dark:text-white"
      >
        {title}
      </Label>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-600 data-[state=checked]:border-none"
    />
  </motion.div>
);

export const NotificationsTab: React.FC = () => {
  const { toast } = useToast();
  const notificationSettings = useStore((state) => state.notificationSettings);
  const updateNotificationSettings = useStore(
    (state) => state.updateNotificationSettings,
  );

  const [localSettings, setLocalSettings] =
    useState<NotificationSettings>(notificationSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(notificationSettings);
  }, [notificationSettings]);

  const handleSettingChange = (
    key: keyof NotificationSettings,
    value: boolean,
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      updateNotificationSettings(localSettings);
      setIsSaving(false);
      toast({
        title: "Preferências Salvas",
        description: "Suas configurações de notificação foram atualizadas.",
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
        <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/5 dark:to-pink-500/5">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-md">
              <Bell className="h-5 w-5 text-white" />
            </div>
            Notificações
          </CardTitle>
          <CardDescription>
            Gerencie como você recebe notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Email Notifications Section */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notificações por Email
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50 space-y-1">
              <CheckboxNotificationItem
                id="emailSummary"
                title="Resumos Semanais de Desempenho"
                description="Receba relatórios semanais sobre suas campanhas e vendas"
                checked={localSettings.emailSummary}
                onCheckedChange={(checked) =>
                  handleSettingChange("emailSummary", checked)
                }
                icon={
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                    <TrendingUp className="h-3.5 w-3.5 text-white" />
                  </div>
                }
                delay={0.1}
              />
              <CheckboxNotificationItem
                id="emailAlerts"
                title="Alertas Críticos de Campanha"
                description="Seja notificado sobre problemas importantes em suas campanhas"
                checked={localSettings.emailAlerts}
                onCheckedChange={(checked) =>
                  handleSettingChange("emailAlerts", checked)
                }
                icon={
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 shadow-sm">
                    <AlertCircle className="h-3.5 w-3.5 text-white" />
                  </div>
                }
                delay={0.15}
              />
              <CheckboxNotificationItem
                id="emailNews"
                title="Notícias e Atualizações da Plataforma"
                description="Fique por dentro de novos recursos e melhorias"
                checked={localSettings.emailNews}
                onCheckedChange={(checked) =>
                  handleSettingChange("emailNews", checked)
                }
                icon={
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                }
                delay={0.2}
              />
            </div>
          </motion.div>

          <Separator className="my-6" />

          {/* Push Notifications Section */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-md">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notificações Push
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200/50 dark:border-purple-800/50 space-y-1">
              <CheckboxNotificationItem
                id="pushMentions"
                title="Menções no Chat IA"
                description="Receba notificações quando a IA sugerir ações importantes"
                checked={localSettings.pushMentions}
                onCheckedChange={(checked) =>
                  handleSettingChange("pushMentions", checked)
                }
                icon={
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-sm">
                    <MessageSquare className="h-3.5 w-3.5 text-white" />
                  </div>
                }
                delay={0.25}
              />
              <CheckboxNotificationItem
                id="pushIntegrations"
                title="Status de Conexão de Integrações"
                description="Alertas sobre problemas de conexão com suas integrações"
                checked={localSettings.pushIntegrations}
                onCheckedChange={(checked) =>
                  handleSettingChange("pushIntegrations", checked)
                }
                icon={
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm">
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                }
                delay={0.3}
              />
              <CheckboxNotificationItem
                id="pushSuggestions"
                title="Novas Sugestões da IA"
                description="Receba notificações sobre insights e recomendações da IA"
                checked={localSettings.pushSuggestions}
                onCheckedChange={(checked) =>
                  handleSettingChange("pushSuggestions", checked)
                }
                icon={
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                }
                delay={0.35}
              />
            </div>
          </motion.div>

          {/* Info Card */}
          <motion.div
            className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200/50 dark:border-indigo-800/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                  Controle Total
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Você pode alterar suas preferências de notificação a qualquer
                  momento. Suas escolhas serão aplicadas imediatamente após
                  salvar.
                </p>
              </div>
            </div>
          </motion.div>
        </CardContent>
        <CardFooter className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleSave}
              loading={isSaving}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Bell className="h-4 w-4 mr-2" />
              Salvar Preferências
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
