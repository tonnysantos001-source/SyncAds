import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Package,
  Search,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Boxes,
  RefreshCw,
  ShoppingBag,
  Tag,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { productsApi, Product } from "@/lib/api/productsApi";
import { shopifySyncApi } from "@/lib/api/shopifySync";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AllProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [syncStats, setSyncStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    lastSync: null as string | null,
  });
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    comparePrice: 0,
    sku: "",
    stock: 0,
    categoryId: "",
    status: "ACTIVE" as "DRAFT" | "ACTIVE" | "ARCHIVED",
  });

  // Estatísticas
  const stats = {
    total: products.length,
    active: products.filter((p) => p.status === "ACTIVE").length,
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
  };

  useEffect(() => {
    loadProducts();
    loadSyncStats();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, statusFilter, products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsApi.list();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSyncStats = async () => {
    if (!user?.id) return;
    try {
      const stats = await shopifySyncApi.getSyncStats(user.id);
      setSyncStats(stats);
    } catch (error) {
      console.error("Error loading sync stats:", error);
    }
  };

  const handleSyncShopify = async () => {
    if (!user?.id || !user?.organizationId) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    try {
      setSyncing(true);

      toast({
        title: "Sincronizando...",
        description: "Buscando produtos da Shopify",
      });

      const result = await shopifySyncApi.syncProducts(
        user.id,
        user.organizationId,
      );

      if (result.success) {
        toast({
          title: "Sincronização concluída!",
          description: result.message,
        });

        // Recarregar produtos
        await loadProducts();
        await loadSyncStats();
      } else {
        toast({
          title: "Erro na sincronização",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao sincronizar",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filtro de status
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    setFilteredProducts(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !user?.organizationId) return;

    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, formData);
        toast({
          title: "Produto atualizado!",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        await productsApi.create({
          ...formData,
          userId: user.id,
          organizationId: user.organizationId,
          slug: formData.name.toLowerCase().replace(/\s+/g, "-"),
          lowStockThreshold: 5,
          trackStock: true,
          isFeatured: false,
          isActive: formData.status === "ACTIVE",
        });
        toast({
          title: "Produto criado!",
          description: "O produto foi adicionado ao catálogo.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      comparePrice: product.comparePrice || 0,
      sku: product.sku || "",
      stock: product.stock,
      categoryId: product.categoryId || "",
      status: product.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      await productsApi.delete(id);
      toast({
        title: "Produto excluído",
        description: "O produto foi removido do catálogo.",
      });
      loadProducts();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      comparePrice: 0,
      sku: "",
      stock: 0,
      categoryId: "",
      status: "ACTIVE",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
            <p className="text-muted-foreground">
              Gerencie o catálogo completo de produtos da sua loja
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSyncShopify}
              variant="outline"
              disabled={syncing}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Sincronizando..." : "Sincronizar Shopify"}
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Produto
            </Button>
          </div>
        </div>

        {/* Sync Stats Alert */}
        {syncStats.lastSync && (
          <Alert>
            <ShoppingBag className="h-4 w-4" />
            <AlertTitle>Integração Shopify Ativa</AlertTitle>
            <AlertDescription>
              Última sincronização:{" "}
              {new Date(syncStats.lastSync).toLocaleString("pt-BR")} •
              {syncStats.totalProducts} produtos importados
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Produtos
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Produtos Ativos
              </CardTitle>
              <Boxes className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                Disponíveis para venda
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Estoque valorizado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Busque e filtre produtos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, SKU ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="DRAFT">Rascunho</SelectItem>
                  <SelectItem value="ARCHIVED">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Catálogo ({filteredProducts.length})</CardTitle>
            <CardDescription>
              {filteredProducts.length === products.length
                ? "Mostrando todos os produtos"
                : `Mostrando ${filteredProducts.length} de ${products.length} produtos`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Nenhum produto encontrado com os filtros aplicados"
                    : "Nenhum produto cadastrado"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSyncShopify}
                      variant="outline"
                      disabled={syncing}
                    >
                      <RefreshCw
                        className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                      />
                      Sincronizar Shopify
                    </Button>
                    <Button
                      onClick={() => {
                        resetForm();
                        setIsDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Primeiro Produto
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {product.description}
                              </div>
                            )}
                            {product.metadata?.shopifyId && (
                              <Badge variant="outline" className="mt-1">
                                <ShoppingBag className="h-3 w-3 mr-1" />
                                Shopify
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {product.sku || "N/A"}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {formatCurrency(product.price)}
                            </div>
                            {product.comparePrice &&
                              product.comparePrice > product.price && (
                                <div className="text-xs text-muted-foreground line-through">
                                  {formatCurrency(product.comparePrice)}
                                </div>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.stock > 10
                                ? "default"
                                : product.stock > 0
                                  ? "warning"
                                  : "destructive"
                            }
                          >
                            {product.stock} un.
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.status === "ACTIVE"
                                ? "default"
                                : product.status === "DRAFT"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {product.status === "ACTIVE"
                              ? "Ativo"
                              : product.status === "DRAFT"
                                ? "Rascunho"
                                : "Arquivado"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              disabled={!!product.metadata?.shopifyId}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Product Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? "Atualize as informações do produto"
                  : "Adicione um novo produto ao catálogo"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Preço *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseFloat(e.target.value),
                        })
                      }
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="comparePrice">Preço Comparação</Label>
                    <Input
                      id="comparePrice"
                      type="number"
                      step="0.01"
                      value={formData.comparePrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          comparePrice: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData({ ...formData, sku: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="stock">Estoque *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stock: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "DRAFT" | "ACTIVE" | "ARCHIVED") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Ativo</SelectItem>
                      <SelectItem value="DRAFT">Rascunho</SelectItem>
                      <SelectItem value="ARCHIVED">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProduct ? "Atualizar" : "Criar"} Produto
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AllProductsPage;
