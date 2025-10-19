import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/use-toast';

export const ProfileTab: React.FC = () => {
  const user = useStore(state => state.user);
  const updateUser = useStore(state => state.updateUser);
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      updateUser({ name, email, avatarUrl: avatarPreview || user?.avatarUrl });
      setIsSaving(false);
      toast({
        title: "Perfil Atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Atualize seu avatar e detalhes do perfil.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarPreview || user?.avatarUrl} />
            <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || 'P'}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1.5">
            <Label htmlFor="picture">Avatar</Label>
            <Input id="picture" type="file" className="w-full" onChange={handleAvatarChange} accept="image/png, image/jpeg, image/gif" />
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF até 10MB</p>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSave} loading={isSaving}>
          Salvar Alterações
        </Button>
      </CardFooter>
    </Card>
  );
};
