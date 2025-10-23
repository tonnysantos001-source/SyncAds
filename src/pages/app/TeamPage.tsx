import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Mail, Shield, User as UserIcon, Eye, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useStore } from '@/store/useStore';
import { invitesApi, PendingInvite } from '@/lib/api/invites';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  avatar: string | null;
  createdAt: string;
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const { toast } = useToast();
  const user = useStore((state) => state.user);

  const [formData, setFormData] = useState({
    email: '',
    role: 'MEMBER' as 'ADMIN' | 'MEMBER' | 'VIEWER',
  });

  useEffect(() => {
    loadTeamMembers();
    loadPendingInvites();
  }, []);

  const loadTeamMembers = async () => {
    try {
      if (!user?.id) return;

      // Get current user's organization
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('organizationId')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // Get all team members from same organization
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('organizationId', userData.organizationId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar membros',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvites = async () => {
    try {
      const invites = await invitesApi.getPendingInvites();
      setPendingInvites(invites);
    } catch (error: any) {
      console.error('Erro ao carregar convites pendentes:', error);
    }
  };

  const inviteUser = async () => {
    try {
      setInviting(true);
      
      // Enviar convite via Edge Function
      const result = await invitesApi.sendInvite(formData.email, formData.role);

      toast({
        title: '✅ Convite enviado!',
        description: result.message || `Convite enviado para ${formData.email}`,
      });

      // Mostrar URL do convite (em dev)
      if (result.inviteUrl) {
        console.log('Invite URL:', result.inviteUrl);
      }

      setIsDialogOpen(false);
      loadPendingInvites();
      setFormData({ email: '', role: 'MEMBER' });
    } catch (error: any) {
      toast({
        title: 'Erro ao convidar usuário',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setInviting(false);
    }
  };

  const cancelInvite = async (inviteId: string) => {
    try {
      await invitesApi.cancelInvite(inviteId);
      toast({
        title: 'Convite cancelado',
        description: 'O convite foi cancelado com sucesso.',
      });
      loadPendingInvites();
    } catch (error: any) {
      toast({
        title: 'Erro ao cancelar convite',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resendInvite = async (inviteId: string) => {
    try {
      const result = await invitesApi.resendInvite(inviteId);
      toast({
        title: 'Convite reenviado',
        description: result.message || 'Novo convite foi enviado.',
      });
      loadPendingInvites();
    } catch (error: any) {
      toast({
        title: 'Erro ao reenviar convite',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('User')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: '✅ Role atualizada',
        description: 'Permissões do usuário foram atualizadas.',
      });

      loadTeamMembers();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar role',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('User')
        .update({ isActive: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: currentStatus ? '⏸️ Usuário desativado' : '✅ Usuário ativado',
        description: currentStatus
          ? 'O usuário não poderá mais acessar o sistema.'
          : 'O usuário pode acessar o sistema novamente.',
      });

      loadTeamMembers();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const config: Record<string, { color: string; icon: any; label: string }> = {
      ADMIN: { color: 'bg-red-100 text-red-800', icon: Shield, label: 'Admin' },
      MEMBER: { color: 'bg-blue-100 text-blue-800', icon: UserIcon, label: 'Membro' },
      VIEWER: { color: 'bg-gray-100 text-gray-800', icon: Eye, label: 'Visualizador' },
    };
    const { color, icon: Icon, label } = config[role] || config.MEMBER;
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Equipe</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerencie os membros da equipe
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Novo Membro</DialogTitle>
              <DialogDescription>
                Envie um convite para um novo membro da equipe
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  Um convite será enviado para este endereço de email
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Permissão</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin - Controle total</SelectItem>
                    <SelectItem value="MEMBER">Membro - Criar e editar</SelectItem>
                    <SelectItem value="VIEWER">Visualizador - Apenas ver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={inviteUser} disabled={inviting}>
                <Mail className="h-4 w-4 mr-2" />
                {inviting ? 'Enviando...' : 'Enviar Convite'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription>{teamMembers.length} membros no total</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entrou em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        {member.id === user?.id && (
                          <span className="text-xs text-gray-500">Você</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Select
                      value={member.role}
                      onValueChange={(value) => updateUserRole(member.id, value)}
                      disabled={member.id === user?.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MEMBER">Membro</SelectItem>
                        <SelectItem value="VIEWER">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {member.isActive ? (
                      <Badge>Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(member.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    {member.id !== user?.id && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleUserStatus(member.id, member.isActive)}
                        >
                          {member.isActive ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // TODO: Implement remove member
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Convites Pendentes */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Convites Pendentes</CardTitle>
            <CardDescription>{pendingInvites.length} convite(s) aguardando aceite</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Permissão</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {invite.role === 'ADMIN' && 'Admin'}
                        {invite.role === 'MEMBER' && 'Membro'}
                        {invite.role === 'VIEWER' && 'Visualizador'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(invite.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resendInvite(invite.id)}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Reenviar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelInvite(invite.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
