import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, FolderOpen, Package } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { productsApi } from '@/lib/api/productsApi';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';

const CollectionsPage = () => {
  const [collections, setCollections] = useState<any[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any | null>(null);
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    filterCollections();
  }, [searchTerm, collections]);

  const loadCollections = async () => {
    try {
      if (!user?.organizationId) return;
      const data = await productsApi.collections.list(user.organizationId);
      setCollections(data);
      setFilteredCollections(data);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar coleções', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filterCollections = () => {
    if (!searchTerm) {
      setFilteredCollections(collections);
      return;
    }
    const filtered = collections.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCollections(filtered);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: editingCollection ? formData.slug : generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.organizationId) return;

      if (editingCollection) {
        await productsApi.collections.update(editingCollection.id, formData);
        toast({ title: 'Coleção atualizada!' });
      } else {
        await productsApi.collections.create({
          ...formData,
          organizationId: user.organizationId,
        });
        toast({ title: 'Coleção criada!', description: 'A coleção está pronta para receber produtos.' });
      }

      setIsDialogOpen(false);
      resetForm();
      loadCollections();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta coleção?')) return;
    try {
      await productsApi.collections.delete(id);
      toast({ title: 'Coleção deletada' });
      loadCollections();
    } catch (error: any) {
      toast({ title: 'Erro ao deletar', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (collection: any) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      slug: collection.slug,
      description: collection.description || '',
      isActive: collection.isActive,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCollection(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      isActive: true,
    });
  };

  const activeCollections = collections.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coleções de Produtos</h1>
          <p className="text-muted-foreground">Organize seus produtos em coleções</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />Criar Coleção
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCollection ? 'Editar Coleção' : 'Nova Coleção'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label>Nome da Coleção</Label>
                  <Input value={formData.name} onChange={(e) => handleNameChange(e.target.value)} required />
                </div>
                <div>
                  <Label>Slug (URL)</Label>
                  <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                  <Label>Ativa</Label>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">{editingCollection ? 'Atualizar' : 'Criar'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Coleções</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{collections.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coleções Ativas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{activeCollections}</div></CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar coleções..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardHeader><CardTitle>Lista de Coleções</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : filteredCollections.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
              <h3 className="text-lg font-semibold">Nenhuma coleção encontrada</h3>
              <p className="text-sm text-muted-foreground mb-4">Comece criando a primeira coleção</p>
              <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Criar Primeira Coleção</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCollections.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell className="font-medium">{collection.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{collection.slug}</TableCell>
                    <TableCell><Badge variant={collection.isActive ? 'default' : 'secondary'}>{collection.isActive ? 'Ativa' : 'Inativa'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(collection)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(collection.id)}><Trash2 className="h-4 w-4" /></Button>
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

export default CollectionsPage;
