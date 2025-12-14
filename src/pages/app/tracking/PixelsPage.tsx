import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';

interface Pixel {
  id: string;
  organizationId: string;
  name: string;
  type: 'FACEBOOK' | 'GOOGLE_ANALYTICS' | 'GOOGLE_ADS' | 'TIKTOK';
  pixelId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PixelsPage = () => {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [filteredPixels, setFilteredPixels] = useState<Pixel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPixel, setEditingPixel] = useState<Pixel | null>(null);
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    name: '',
    type: 'FACEBOOK' as 'FACEBOOK' | 'GOOGLE_ANALYTICS' | 'GOOGLE_ADS' | 'TIKTOK',
    pixelId: '',
    isActive: true,
  });

  useEffect(() => {
    loadPixels();
  }, []);

  useEffect(() => {
    filterPixels();
  }, [searchTerm, pixels]);

  const loadPixels = async () => {
    try {
      if (!user?.organizationId) return;
      const { data, error } = await supabase
        .from('Pixel')
        .select('*')
        .eq('organizationId', user.organizationId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setPixels(data || []);
      setFilteredPixels(data || []);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar pixels', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filterPixels = () => {
    if (!searchTerm) {
      setFilteredPixels(pixels);
      return;
    }
    const filtered = pixels.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pixelId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPixels(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.organizationId) return;

      if (editingPixel) {
        const { error } = await supabase
          .from('Pixel')
          .update({ ...formData, updatedAt: new Date().toISOString() })
          .eq('id', editingPixel.id);
        if (error) throw error;
        toast({ title: 'Pixel atualizado!' });
      } else {
        const { error } = await supabase
          .from('Pixel')
          .insert({ ...formData, organizationId: user.organizationId });
        if (error) throw error;
        toast({ title: 'Pixel criado!', description: 'O pixel de tracking está pronto para uso.' });
      }

      setIsDialogOpen(false);
      resetForm();
      loadPixels();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este pixel?')) return;
    try {
      const { error } = await supabase.from('Pixel').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Pixel deletado' });
      loadPixels();
    } catch (error: any) {
      toast({ title: 'Erro ao deletar', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleActive = async (pixel: Pixel) => {
    try {
      const { error } = await supabase
        .from('Pixel')
        .update({ isActive: !pixel.isActive, updatedAt: new Date().toISOString() })
        .eq('id', pixel.id);
      if (error) throw error;
      toast({ title: pixel.isActive ? 'Pixel desativado' : 'Pixel ativado' });
      loadPixels();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (pixel: Pixel) => {
    setEditingPixel(pixel);
    setFormData({
      name: pixel.name,
      type: pixel.type,
      pixelId: pixel.pixelId,
      isActive: pixel.isActive,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPixel(null);
    setFormData({
      name: '',
      type: 'FACEBOOK',
      pixelId: '',
      isActive: true,
    });
  };

  const activePixels = pixels.filter((p) => p.isActive).length;

  const getPixelTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FACEBOOK: 'Facebook Pixel',
      GOOGLE_ANALYTICS: 'Google Analytics',
      GOOGLE_ADS: 'Google Ads',
      TIKTOK: 'TikTok Pixel',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pixels de Tracking</h1>
          <p className="text-muted-foreground">Gerencie pixels de rastreamento e eventos de conversão</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Pixel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPixel ? 'Editar Pixel' : 'Novo Pixel'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Pixel Principal"
                  required
                />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })} required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FACEBOOK">Facebook Pixel</SelectItem>
                    <SelectItem value="GOOGLE_ANALYTICS">Google Analytics</SelectItem>
                    <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
                    <SelectItem value="TIKTOK">TikTok Pixel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pixel ID *</Label>
                <Input
                  value={formData.pixelId}
                  onChange={(e) => setFormData({ ...formData, pixelId: e.target.value })}
                  placeholder="Ex: 123456789012345"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.type === 'FACEBOOK' && 'Encontre no Gerenciador de Eventos do Facebook'}
                  {formData.type === 'GOOGLE_ANALYTICS' && 'Formato: G-XXXXXXXXXX ou UA-XXXXXXX-X'}
                  {formData.type === 'GOOGLE_ADS' && 'Formato: AW-XXXXXXXXXX'}
                  {formData.type === 'TIKTOK' && 'Encontre no Gerenciador de Eventos do TikTok'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label>Ativo</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">{editingPixel ? 'Atualizar' : 'Criar'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pixels</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{pixels.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pixels Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{activePixels}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pixels Inativos</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{pixels.length - activePixels}</div></CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar pixels..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardHeader><CardTitle>Lista de Pixels</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredPixels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhum pixel encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm ? 'Tente ajustar sua busca' : 'Comece adicionando seu primeiro pixel de tracking'}
              </p>
              {!searchTerm && <Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" />Adicionar Primeiro Pixel</Button>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Pixel ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPixels.map((pixel) => (
                  <TableRow key={pixel.id}>
                    <TableCell className="font-medium">{pixel.name}</TableCell>
                    <TableCell>{getPixelTypeLabel(pixel.type)}</TableCell>
                    <TableCell className="font-mono text-sm">{pixel.pixelId}</TableCell>
                    <TableCell>
                      <Badge variant={pixel.isActive ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => handleToggleActive(pixel)}>
                        {pixel.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(pixel)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(pixel.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PixelsPage;

