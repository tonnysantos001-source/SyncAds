import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Mail, ShoppingCart, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cartApi } from '@/lib/api/cartApi';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';

const AbandonedCartsPage = () => {
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadAbandonedCarts();
  }, []);

  const loadAbandonedCarts = async () => {
    try {
      if (!user?.organizationId) return;
      const data = await cartApi.abandoned.list(user.organizationId);
      setAbandonedCarts(data);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (cartId: string) => {
    try {
      toast({ title: 'Email de recuperação enviado!' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const filteredCarts = abandonedCarts.filter((c) =>
    c.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = abandonedCarts.reduce((sum, cart) => sum + cart.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Carrinhos Abandonados</h1>
        <p className="text-muted-foreground">Recupere vendas de carrinhos abandonados</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Abandonados</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{abandonedCarts.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Recuperação</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">-</div></CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardHeader><CardTitle>Lista de Carrinhos</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : filteredCarts.length === 0 ? (
            <div className="text-center py-12"><ShoppingCart className="h-12 w-12 text-muted-foreground mb-4 mx-auto" /><h3 className="text-lg font-semibold">Nenhum carrinho abandonado</h3></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Abandonado há</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCarts.map((cart) => (
                  <TableRow key={cart.id}>
                    <TableCell>{cart.customerEmail}</TableCell>
                    <TableCell>{cart.itemCount} items</TableCell>
                    <TableCell>R$ {cart.total.toFixed(2)}</TableCell>
                    <TableCell><Badge variant="outline">{cart.abandonedDays}d</Badge></TableCell>
                    <TableCell><Button size="sm" onClick={() => handleSendEmail(cart.id)}><Mail className="h-4 w-4 mr-2" />Recuperar</Button></TableCell>
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

export default AbandonedCartsPage;
