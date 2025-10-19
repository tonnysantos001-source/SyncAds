import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useStore } from '@/store/useStore';

export const SecurityTab: React.FC = () => {
  const { toast } = useToast();
  const isTwoFactorEnabled = useStore(state => state.isTwoFactorEnabled);
  const setTwoFactorEnabled = useStore(state => state.setTwoFactorEnabled);

  const [localTwoFactor, setLocalTwoFactor] = useState(isTwoFactorEnabled);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveChanges = () => {
    setIsSaving(true);
    setTimeout(() => {
      setTwoFactorEnabled(localTwoFactor);
      setIsSaving(false);
      toast({
        title: "Segurança Atualizada",
        description: "Suas configurações de segurança foram salvas com sucesso.",
        variant: "success",
      });
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Segurança</CardTitle>
        <CardDescription>Gerencie sua senha e autenticação de dois fatores.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="current-password">Senha Atual</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <Input id="confirm-password" type="password" />
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <h4 className="font-semibold">Autenticação de Dois Fatores (2FA)</h4>
            <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança à sua conta.</p>
          </div>
          <Switch checked={localTwoFactor} onCheckedChange={setLocalTwoFactor} />
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSaveChanges} loading={isSaving}>Salvar Alterações</Button>
      </CardFooter>
    </Card>
  );
};
