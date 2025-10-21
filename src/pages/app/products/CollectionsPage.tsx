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
              <Plus className="mr-2 h-4 w-4" />
              Criar Coleção
              </Button>
            </div>

            {/* Ilustração */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Quadro com produtos */}
                <div className="w-72 h-56 border-4 border-gray-900 rounded-lg bg-white p-4 relative">
                  <div className="grid grid-cols-3 gap-3 h-full">
                    {/* Item 1 - Vestido */}
                    <div className="bg-gray-100 rounded flex items-center justify-center">
                      <svg className="w-8 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L8 6H6v14h12V6h-2l-4-4z" />
                      </svg>
                    </div>
                    {/* Item 2 - Vestido preto */}
                    <div className="bg-gray-100 rounded flex items-center justify-center">
                      <svg className="w-8 h-12 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L8 6H6v14h12V6h-2l-4-4z" />
                      </svg>
                    </div>
                    {/* Item 3 - Calça */}
                    <div className="bg-gray-100 rounded flex items-center justify-center">
                      <svg className="w-8 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 2H8l-2 7v11h4V9h4v11h4V9l-2-7z" />
                      </svg>
                    </div>
                    {/* Item 4 - Camisa */}
                    <div className="bg-gray-100 rounded flex items-center justify-center">
                      <svg className="w-10 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 3H8l-2 2v3h12V5l-2-2zm0 18H8V9h8v12z" />
                      </svg>
                    </div>
                    {/* Item 5 - Camisa cinza */}
                    <div className="bg-gray-100 rounded flex items-center justify-center">
                      <svg className="w-10 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 3H8l-2 2v3h12V5l-2-2zm0 18H8V9h8v12z" />
                      </svg>
                    </div>
                    {/* Item 6 - Camiseta preta */}
                    <div className="bg-gray-100 rounded flex items-center justify-center">
                      <svg className="w-10 h-8 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 3H8l-2 2v3h12V5l-2-2zm0 18H8V9h8v12z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Caixas no chão */}
                <div className="absolute -bottom-8 -left-8 flex gap-2">
                  <div className="w-16 h-12 border-2 border-gray-900 bg-white"></div>
                  <div className="w-16 h-12 border-2 border-gray-900 bg-white"></div>
                </div>

                {/* Pessoa carregando caixa */}
                <div className="absolute -right-12 top-8">
                  <svg width="120" height="180" viewBox="0 0 120 180" fill="none">
                    {/* Cabeça */}
                    <circle cx="60" cy="30" r="18" fill="#000000" />
                    
                    {/* Corpo rosa */}
                    <rect x="48" y="48" width="24" height="35" rx="2" fill="#EC4899" />
                    
                    {/* Braços segurando caixa */}
                    <path d="M48 58 L30 65 L30 75 L48 68 Z" fill="#EC4899" />
                    <path d="M72 58 L90 65 L90 75 L72 68 Z" fill="#000000" />
                    
                    {/* Caixa na frente */}
                    <rect x="35" y="60" width="30" height="25" rx="1" fill="white" stroke="#000000" strokeWidth="2" />
                    
                    {/* Pernas */}
                    <path d="M50 83 L45 140 L40 140 L40 146 L50 146 Z" fill="#000000" />
                    <path d="M70 83 L75 140 L80 140 L80 146 L70 146 Z" fill="#000000" />
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

export default CollectionsPage;
