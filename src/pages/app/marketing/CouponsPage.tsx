import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Percent,
  DollarSign,
  Ticket,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { marketingApi, Coupon } from "@/lib/api/marketingApi";
import { shopifyDiscountsApi } from "@/lib/api/shopifyDiscounts";
import { shopifySyncApi } from "@/lib/api/shopifySync";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const CouponsPage = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING",
    value: 0,
    minPurchaseAmount: 0,
    maxDiscountAmount: 0,
    usageLimit: 0,
    perCustomerLimit: 1,
    startsAt: "",
    expiresAt: "",
    isActive: true,
  });

  useEffect(() => {
    if (user?.id) {
      loadCoupons();
    }
  }, [user?.id]);

  useEffect(() => {
    filterCoupons();
  }, [searchTerm, coupons]);

  const loadCoupons = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await shopifyDiscountsApi.listFromShopify(user.id);
      setCoupons(data);
      setFilteredCoupons(data);
    } catch (error: any) {
      console.error("Erro ao carregar cupons:", error);
      toast({
        title: "Erro ao carregar cupons",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncShopify = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Faça login para sincronizar",
        variant: "destructive",
      });
      return;
    }

    try {
      setSyncing(true);
      toast({
        title: "Sincronizando...",
        description: "Buscando descontos da Shopify",
      });

      const result = await shopifySyncApi.syncDiscounts(user.id);

      if (result.success) {
        toast({
          title: "Sincronização concluída!",
          description: result.message,
        });
        await loadCoupons();
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
        description: "Configure a integração Shopify em Integrações",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const filterCoupons = () => {
    if (!searchTerm) {
      setFilteredCoupons(coupons);
      return;
    }
    const filtered = coupons.filter(
      (c) =>
        c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredCoupons(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.organizationId) return;

      if (editingCoupon) {
        await marketingApi.coupons.update(editingCoupon.id, formData);
        toast({
          title: "Cupom atualizado!",
          description: "As alterações foram salvas.",
        });
      } else {
        await marketingApi.coupons.create({
          ...formData,
          organizationId: user.organizationId,
          usageCount: 0,
        });
        toast({
          title: "Cupom criado!",
          description: "O cupom está pronto para uso.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadCoupons();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este cupom?")) return;
    try {
      await marketingApi.coupons.delete(id);
      toast({ title: "Cupom deletado" });
      loadCoupons();
    } catch (error: any) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      type: coupon.type,
      value: coupon.value,
      minPurchaseAmount: coupon.minPurchaseAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      usageLimit: coupon.usageLimit || 0,
      perCustomerLimit: coupon.perCustomerLimit || 1,
      startsAt: coupon.startsAt || "",
      expiresAt: coupon.expiresAt || "",
      isActive: coupon.isActive,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      name: "",
      type: "PERCENTAGE",
      value: 0,
      minPurchaseAmount: 0,
      maxDiscountAmount: 0,
      usageLimit: 0,
      perCustomerLimit: 1,
      startsAt: "",
      expiresAt: "",
      isActive: true,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getDiscountDisplay = (coupon: any) => {
    if (coupon.type === "PERCENTAGE") {
      return `${coupon.value}%`;
    } else if (coupon.type === "FIXED_AMOUNT") {
      return formatCurrency(coupon.value);
    } else {
      return "Frete Grátis";
    }
  };

  const totalUsage = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
  const activeCoupons = coupons.filter((c) => c.isActive).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
              Cupons de Desconto
            </h1>
            <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">
              Gerencie cupons sincronizados com Shopify
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex gap-3"
          >
            <Button
              onClick={handleSyncShopify}
              disabled={syncing}
              variant="outline"
              size="lg"
              className="border-2 hover:border-purple-500"
            >
              <RefreshCw
                className={`mr-2 h-5 w-5 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Sincronizando..." : "Sincronizar Shopify"}
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={resetForm}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Criar Cupom
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {editingCoupon ? "Editar Cupom" : "Novo Cupom"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Código *</Label>
                      <Input
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            code: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="DESCONTO20"
                        className="mt-1.5"
                        required
                      />
                    </div>
                    <div>
                      <Label>Nome *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Nome do cupom"
                        className="mt-1.5"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Desconto</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(v: any) =>
                          setFormData({ ...formData, type: v })
                        }
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">
                            Percentual (%)
                          </SelectItem>
                          <SelectItem value="FIXED_AMOUNT">
                            Valor Fixo (R$)
                          </SelectItem>
                          <SelectItem value="FREE_SHIPPING">
                            Frete Grátis
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Valor</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            value: parseFloat(e.target.value),
                          })
                        }
                        placeholder="0.00"
                        className="mt-1.5"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Compra Mínima (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.minPurchaseAmount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minPurchaseAmount: parseFloat(e.target.value),
                          })
                        }
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Desconto Máximo (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.maxDiscountAmount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxDiscountAmount: parseFloat(e.target.value),
                          })
                        }
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Limite Total de Uso</Label>
                      <Input
                        type="number"
                        value={formData.usageLimit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            usageLimit: parseInt(e.target.value),
                          })
                        }
                        placeholder="0 = ilimitado"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Limite por Cliente</Label>
                      <Input
                        type="number"
                        value={formData.perCustomerLimit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            perCustomerLimit: parseInt(e.target.value),
                          })
                        }
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data de Início</Label>
                      <Input
                        type="datetime-local"
                        value={formData.startsAt}
                        onChange={(e) =>
                          setFormData({ ...formData, startsAt: e.target.value })
                        }
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Data de Expiração</Label>
                      <Input
                        type="datetime-local"
                        value={formData.expiresAt}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expiresAt: e.target.value,
                          })
                        }
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked })
                      }
                    />
                    <Label>Cupom Ativo</Label>
                  </div>

                  <DialogFooter className="mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      {editingCoupon ? "Atualizar" : "Criar"} Cupom
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>
        </motion.div>

        {/* Métricas */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total de Cupons"
            value={coupons.length}
            icon={Ticket}
            color="bg-blue-500"
            delay={0.1}
          />
          <MetricCard
            title="Cupons Ativos"
            value={activeCoupons}
            icon={TrendingUp}
            color="bg-green-500"
            delay={0.2}
            subtitle={`${((activeCoupons / coupons.length) * 100 || 0).toFixed(0)}% do total`}
          />
          <MetricCard
            title="Usos Totais"
            value={totalUsage}
            icon={Users}
            color="bg-purple-500"
            delay={0.3}
          />
          <MetricCard
            title="Média de Uso"
            value={(totalUsage / coupons.length || 0).toFixed(1)}
            icon={Percent}
            color="bg-pink-500"
            delay={0.4}
            subtitle="por cupom"
          />
        </div>

        {/* Busca */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por código ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg"
          />
        </motion.div>

        {/* Tabela */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Lista de Cupons
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredCoupons.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-3xl rounded-full" />
                    <Ticket className="relative h-20 w-20 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    Nenhum cupom encontrado
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm
                      ? "Tente ajustar os filtros"
                      : "Sincronize com Shopify ou crie um cupom"}
                  </p>
                  {!searchTerm && (
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSyncShopify}
                        disabled={syncing}
                        variant="outline"
                        size="lg"
                      >
                        <RefreshCw
                          className={`mr-2 h-5 w-5 ${syncing ? "animate-spin" : ""}`}
                        />
                        Sincronizar Shopify
                      </Button>
                      <Button
                        onClick={() => setIsDialogOpen(true)}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600"
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        Criar Cupom
                      </Button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Desconto</TableHead>
                      <TableHead>Usos</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCoupons.map((coupon, index) => (
                      <motion.tr
                        key={coupon.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                              <Ticket className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-mono font-semibold">
                              {coupon.code}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {coupon.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {coupon.type === "PERCENTAGE" ? (
                              <Percent className="h-4 w-4 text-green-500" />
                            ) : (
                              <DollarSign className="h-4 w-4 text-green-500" />
                            )}
                            <span className="font-semibold">
                              {getDiscountDisplay(coupon)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {coupon.usageCount || 0}
                          {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                        </TableCell>
                        <TableCell className="text-sm">
                          {coupon.expiresAt
                            ? format(new Date(coupon.expiresAt), "dd/MM/yyyy", {
                                locale: ptBR,
                              })
                            : "Sem expiração"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              coupon.isActive
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                            }
                          >
                            {coupon.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(coupon)}
                              className="hover:bg-blue-100 dark:hover:bg-blue-900/30"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(coupon.id)}
                              className="hover:bg-red-100 dark:hover:bg-red-900/30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CouponsPage;
