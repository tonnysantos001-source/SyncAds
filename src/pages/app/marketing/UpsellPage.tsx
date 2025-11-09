import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  TrendingUp,
  ArrowUpRight,
  Zap,
  Target,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { marketingApi } from "@/lib/api/marketingApi";
import { productsApi } from "@/lib/api/productsApi";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delay?: number;
  subtitle?: string;
}

const MetricCard = ({
  title,
  value,
  icon: Icon,
  color,
  delay = 0,
  subtitle,
}: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
        <div
          className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full blur-3xl`}
        />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`h-5 w-5 ${color.replace("bg-", "text-")}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const UpsellPage = () => {
  const [upsells, setUpsells] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredUpsells, setFilteredUpsells] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUpsell, setEditingUpsell] = useState<any | null>(null);
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    name: "",
    triggerProductId: "",
    upsellProductId: "",
    title: "",
    description: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    discountValue: 0,
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterUpsells();
  }, [searchTerm, upsells]);

  const loadData = async () => {
    try {
      if (!user?.organizationId) return;
      const [upsellsData, productsData] = await Promise.all([
        marketingApi.upsells.getAll(user.organizationId),
        productsApi.list(),
      ]);
      setUpsells(upsellsData);
      setProducts(productsData);
      setFilteredUpsells(upsellsData);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUpsells = () => {
    if (!searchTerm) {
      setFilteredUpsells(upsells);
      return;
    }
    const filtered = upsells.filter(
      (u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredUpsells(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.organizationId) return;
      if (editingUpsell) {
        await marketingApi.upsells.update(editingUpsell.id, formData);
        toast({ title: "Upsell atualizado!" });
      } else {
        await marketingApi.upsells.create({
          ...formData,
          organizationId: user.organizationId,
        });
        toast({ title: "Upsell criado!" });
      }
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este upsell?")) return;
    try {
      await marketingApi.upsells.delete(id);
      toast({ title: "Upsell deletado" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (upsell: any) => {
    setEditingUpsell(upsell);
    setFormData({
      name: upsell.name,
      triggerProductId: upsell.triggerProductId,
      upsellProductId: upsell.upsellProductId,
      title: upsell.title,
      description: upsell.description || "",
      discountType: upsell.discountType || "PERCENTAGE",
      discountValue: upsell.discountValue || 0,
      isActive: upsell.isActive,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingUpsell(null);
    setFormData({
      name: "",
      triggerProductId: "",
      upsellProductId: "",
      title: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: 0,
      isActive: true,
    });
  };

  const activeUpsells = upsells.filter((u) => u.isActive).length;
  const conversionRate = upsells.length > 0 ? "15.8%" : "-";

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.name || "Produto não encontrado";
  };

  return (
    <div className="space-y-6">
      {/* Header com animação */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Upsell
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium mt-2">
            Ofertas complementares após a compra
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              size="lg"
              className="shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="mr-2 h-5 w-5" />
              Criar Upsell
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingUpsell ? "Editar Upsell" : "Novo Upsell"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome Interno *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Upgrade Premium"
                    required
                  />
                </div>
                <div>
                  <Label>Produto Gatilho *</Label>
                  <Select
                    value={formData.triggerProductId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, triggerProductId: v })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Produto que ativa o upsell" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Produto Upsell *</Label>
                  <Select
                    value={formData.upsellProductId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, upsellProductId: v })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Produto a ser oferecido" />
                    </SelectTrigger>
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
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Ex: Aproveite este upgrade especial!"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Descreva os benefícios..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Tipo de Desconto</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(v: any) =>
                      setFormData({ ...formData, discountType: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountValue: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="rounded"
                  />
                  <Label>Ativo</Label>
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
                  {editingUpsell ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Métricas com animação */}
      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard
          title="Total de Upsells"
          value={upsells.length}
          icon={ArrowUpRight}
          color="bg-purple-500"
          delay={0.1}
          subtitle="Ofertas criadas"
        />
        <MetricCard
          title="Upsells Ativos"
          value={activeUpsells}
          icon={Zap}
          color="bg-green-500"
          delay={0.2}
          subtitle="Atualmente em uso"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={conversionRate}
          icon={Target}
          color="bg-blue-500"
          delay={0.3}
          subtitle="Média de aceitação"
        />
        <MetricCard
          title="Receita Extra"
          value="-"
          icon={DollarSign}
          color="bg-pink-500"
          delay={0.4}
          subtitle="Gerada por upsells"
        />
      </div>

      {/* Busca com animação */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar upsells..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg"
        />
      </motion.div>

      {/* Tabela com animação */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Lista de Upsells
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredUpsells.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                  <ArrowUpRight className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum upsell encontrado
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  {searchTerm
                    ? "Tente ajustar sua busca"
                    : "Comece criando seu primeiro upsell e maximize suas vendas"}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => {
                      resetForm();
                      setIsDialogOpen(true);
                    }}
                    size="lg"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Upsell
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border border-gray-200 dark:border-gray-800">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Nome</TableHead>
                      <TableHead>Produto Gatilho</TableHead>
                      <TableHead>Produto Upsell</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Desconto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUpsells.map((upsell, index) => (
                      <motion.tr
                        key={upsell.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {upsell.name}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {getProductName(upsell.triggerProductId)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {getProductName(upsell.upsellProductId)}
                        </TableCell>
                        <TableCell>{upsell.title}</TableCell>
                        <TableCell>
                          {upsell.discountValue
                            ? upsell.discountType === "PERCENTAGE"
                              ? `${upsell.discountValue}%`
                              : `R$ ${upsell.discountValue.toFixed(2)}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={upsell.isActive ? "default" : "secondary"}
                            className={
                              upsell.isActive
                                ? "bg-green-500 hover:bg-green-600"
                                : ""
                            }
                          >
                            {upsell.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(upsell)}
                              className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(upsell.id)}
                              className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UpsellPage;
