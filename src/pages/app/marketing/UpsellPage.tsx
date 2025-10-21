import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { marketingApi } from '@/lib/api/marketingApi';
import { productsApi } from '@/lib/api/productsApi';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';

const UpsellPage = () => {
  const [upsells, setUpsells] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUpsell, setEditingUpsell] = useState<any | null>(null);
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    name: '',
    triggerProductId: '',
    upsellProductId: '',
    title: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: 0,
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!user?.organizationId) return;
      const [upsellsData, productsData] = await Promise.all([
        marketingApi.upsells.getAll(user.organizationId),
        productsApi.list(),
      ]);
      setUpsells(upsellsData);
      setProducts(productsData);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.organizationId) return;
      if (editingUpsell) {
        await marketingApi.upsells.update(editingUpsell.id, formData);
        toast({ title: 'Upsell atualizado!' });
      } else {
        await marketingApi.upsells.create({ ...formData, organizationId: user.organizationId });
        toast({ title: 'Upsell criado!' });
      }
      setIsDialogOpen(false);
      setEditingUpsell(null);
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar upsell?')) return;
    try {
      await marketingApi.upsells.delete(id);
      toast({ title: 'Upsell deletado' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const filteredUpsells = upsells.filter((u) => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upsells</h1>
          <p className="text-muted-foreground">Aumente o ticket médio com ofertas de upsell</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingUpsell(null); setFormData({ name: '', triggerProductId: '', upsellProductId: '', title: '', description: '', discountType: 'PERCENTAGE', discountValue: 0, isActive: true }); }}>
              <Plus className="mr-2 h-4 w-4" />Criar Upsell
              </Button>
            </div>

            {/* Ilustração */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Smartphone mockup */}
                <div className="relative">
                  <div className="w-56 h-96 bg-gray-900 rounded-3xl p-2 shadow-2xl">
                    <div className="w-full h-full bg-white rounded-2xl overflow-hidden flex flex-col items-center justify-center p-4">
                      {/* Cabeça de produto */}
                      <div className="w-20 h-20 bg-gray-800 rounded-full mb-4"></div>
                      
                      {/* Setas indicando upgrade */}
                      <div className="flex items-center gap-2 mb-4">
                        <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>

                      {/* Linhas de texto */}
                      <div className="space-y-2 w-full">
                        <div className="h-2 bg-gray-200 rounded w-full"></div>
                        <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pessoa ao lado do celular */}
                <div className="absolute -right-16 bottom-0">
                  <svg width="100" height="180" viewBox="0 0 100 180" fill="none">
                    {/* Cabeça */}
                    <circle cx="50" cy="30" r="15" fill="#000000" />
                    
                    {/* Corpo */}
                    <rect x="40" y="45" width="20" height="35" rx="2" fill="#EC4899" />
                    
                    {/* Braços */}
                    <path d="M40 55 L25 65 L28 70 L43 60 Z" fill="#EC4899" />
                    <path d="M60 55 L75 65 L72 70 L57 60 Z" fill="#000000" />
                    
                    {/* Pernas */}
                    <path d="M42 80 L38 130 L33 130 L33 135 L43 135 Z" fill="#000000" />
                    <path d="M58 80 L62 130 L67 130 L67 135 L57 135 Z" fill="#000000" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpsellPage;
