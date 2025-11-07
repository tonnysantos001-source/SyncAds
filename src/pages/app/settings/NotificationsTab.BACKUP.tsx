import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useStore, NotificationSettings } from '@/store/useStore';

const CheckboxNotificationItem: React.FC<{
  id: keyof NotificationSettings;
  title: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}> = ({ id, title, checked, onCheckedChange }) => (
  <div className="flex items-center space-x-2">
    <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
    <Label htmlFor={id} className="text-sm font-normal">
      {title}
    </Label>
  </div>
);

export const NotificationsTab: React.FC = () => {
  const { toast } = useToast();
  const notificationSettings = useStore(state => state.notificationSettings);
  const updateNotificationSettings = useStore(state => state.updateNotificationSettings);

  const [localSettings, setLocalSettings] = useState<NotificationSettings>(notificationSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(notificationSettings);
  }, [notificationSettings]);

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações</CardTitle>
        <CardDescription>Gerencie como você recebe notificações.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-semibold">Notificações por Email</h4>
          <div className="p-4 border rounded-lg space-y-4">
            <CheckboxNotificationItem
              id="emailSummary"
              title="Resumos Semanais de Desempenho"
              checked={localSettings.emailSummary}
              onCheckedChange={(checked) => handleSettingChange('emailSummary', checked)}
            />
            <CheckboxNotificationItem
              id="emailAlerts"
              title="Alertas Críticos de Campanha"
              checked={localSettings.emailAlerts}
              onCheckedChange={(checked) => handleSettingChange('emailAlerts', checked)}
            />
            <CheckboxNotificationItem
              id="emailNews"
              title="Notícias e Atualizações da Plataforma"
              checked={localSettings.emailNews}
              onCheckedChange={(checked) => handleSettingChange('emailNews', checked)}
            />
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h4 className="font-semibold">Notificações Push</h4>
           <div className="p-4 border rounded-lg space-y-4">
            <CheckboxNotificationItem
              id="pushMentions"
              title="Menções no Chat IA"
              checked={localSettings.pushMentions}
              onCheckedChange={(checked) => handleSettingChange('pushMentions', checked)}
            />
            <CheckboxNotificationItem
              id="pushIntegrations"
              title="Status de Conexão de Integrações"
              checked={localSettings.pushIntegrations}
              onCheckedChange={(checked) => handleSettingChange('pushIntegrations', checked)}
            />
            <CheckboxNotificationItem
              id="pushSuggestions"
              title="Novas Sugestões da IA"
              checked={localSettings.pushSuggestions}
              onCheckedChange={(checked) => handleSettingChange('pushSuggestions', checked)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSave} loading={isSaving}>Salvar Preferências</Button>
      </CardFooter>
    </Card>
  );
};
