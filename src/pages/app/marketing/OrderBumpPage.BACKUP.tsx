import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { marketingApi, OrderBump } from '@/lib/api/marketingApi';
import { productsApi } from '@/lib/api/productsApi';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';

const OrderBumpPage = () => {
  const [orderBumps, setOrderBumps] = useState<OrderBump[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredBumps, setFilteredBumps] = useState<OrderBump[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBump, setEditingBump] = useState<OrderBump | null>(null);
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    name: '',
    productId: '',
    title: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: 0,
    position: 'CHECKOUT' as 'CHECKOUT' | 'CART',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterBumps();
  }, [searchTerm, orderBumps]);

  const loadData = async () => {
    try {
      if (!user?.organizationId) return;
      const [bumpsData, productsData] = await Promise.all([
        marketingApi.orderBumps.getAll(user.organizationId),
        productsApi.list(),
      ]);
      setOrderBumps(bumpsData);
      setProducts(productsData);
      setFilteredBumps(bumpsData);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filterBumps = () => {
    if (!searchTerm) {
      setFilteredBumps(orderBumps);
      return;
    }
    const filtered = orderBumps.filter((b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBumps(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.organizationId) return;

      if (editingBump) {
        await marketingApi.orderBumps.update(editingBump.id, formData);
        toast({ title: 'Order Bump atualizado!' });
      } else {
        await marketingApi.orderBumps.create({
          ...formData,
          organizationId: user.organizationId,
        });
        toast({ title: 'Order Bump criado!', description: 'A oferta está pronta para uso.' });
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este order bump?')) return;
    try {
      await marketingApi.orderBumps.delete(id);
      toast({ title: 'Order Bump deletado' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro ao deletar', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (bump: OrderBump) => {
    setEditingBump(bump);
    setFormData({
      name: bump.name,
      productId: bump.productId,
      title: bump.title,
      description: bump.description || '',
      discountType: bump.discountType || 'PERCENTAGE',
      discountValue: bump.discountValue || 0,
      position: bump.position,
      isActive: bump.isActive,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingBump(null);
    setFormData({
      name: '',
      productId: '',
      title: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      position: 'CHECKOUT',
      isActive: true,
    });
  };

  const activeBumps = orderBumps.filter((b) => b.isActive).length;
  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.name || 'Produto não encontrado';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Bumps</h1>
          <p className="text-muted-foreground">Ofertas especiais exibidas durante o checkout</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Order Bump
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBump ? 'Editar Order Bump' : 'Novo Order Bump'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome Interno *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Acessório Premium"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label>Produto *</Label>
                  <Select value={formData.productId} onValueChange={(v) => setFormData({ ...formData, productId: v })} required>
                    <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - R$ {product.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Título da Oferta *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Adicione Proteção Estendida"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva a oferta..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Tipo de Desconto</Label>
                  <Select value={formData.discountType} onValueChange={(v: any) => setFormData({ ...formData, discountType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Porcentagem</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Valor Fixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor do Desconto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Posição *</Label>
                  <Select value={formData.position} onValueChange={(v: any) => setFormData({ ...formData, position: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHECKOUT">Checkout</SelectItem>
                      <SelectItem value="CART">Carrinho</SelectItem>
                    </SelectContent>
                  </Select>
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
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">{editingBump ? 'Atualizar' : 'Criar'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Order Bumps</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{orderBumps.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{activeBumps}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Conversão</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">-</div></CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar order bumps..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardHeader><CardTitle>Lista de Order Bumps</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : filteredBumps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhum order bump encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando seu primeiro order bump'}
              </p>
              {!searchTerm && <Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" />Criar Primeiro Order Bump</Button>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Posição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBumps.map((bump) => (
                  <TableRow key={bump.id}>
                    <TableCell className="font-medium">{bump.name}</TableCell>
                    <TableCell>{getProductName(bump.productId)}</TableCell>
                    <TableCell>{bump.title}</TableCell>
                    <TableCell>
                      {bump.discountValue ? (
                        bump.discountType === 'PERCENTAGE' 
                          ? `${bump.discountValue}%` 
                          : `R$ ${bump.discountValue.toFixed(2)}`
                      ) : '-'}
                    </TableCell>
                    <TableCell><Badge variant="outline">{bump.position === 'CHECKOUT' ? 'Checkout' : 'Carrinho'}</Badge></TableCell>
                    <TableCell><Badge variant={bump.isActive ? 'default' : 'secondary'}>{bump.isActive ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(bump)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(bump.id)}><Trash2 className="h-4 w-4" /></Button>
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

export default OrderBumpPage;

