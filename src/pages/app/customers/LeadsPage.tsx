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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { customersApi } from "@/lib/api/customersApi";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { useLeads } from "@/hooks/useLeads";

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

const LeadsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  // Debounce search para evitar queries excessivas
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Hook otimizado com React Query
  const {
    data: leads,
    isLoading: loading,
    totalCount,
    totalPages,
    refetch: refetchLeads,
  } = useLeads({
    userId: user?.id || "",
    page: currentPage,
    pageSize: 50,
    search: debouncedSearch,
    status: statusFilter,
    enabled: !!user?.id,
  });

  // Usar leads diretamente
  const filteredLeads = leads;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "NEW" as "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED",
    source: "",
  });

  useEffect(() => {
    // Reset page quando search ou filtros mudarem
    setCurrentPage(0);
  }, [searchTerm, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.organizationId) return;
      if (editingLead) {
        await customersApi.leads.update(editingLead.id, formData);
        toast({ title: "Lead atualizado!" });
      } else {
        await customersApi.leads.create({
          ...formData,
          organizationId: user.organizationId,
        });
        toast({
          title: "Lead criado!",
          description: "Novo lead adicionado com sucesso.",
        });
      }
      setIsDialogOpen(false);
      resetForm();
      refetchLeads();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este lead?")) return;
    try {
      await customersApi.leads.delete(id);
      toast({ title: "Lead deletado" });
      refetchLeads();
    } catch (error: any) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (lead: any) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      status: lead.status || "NEW",
      source: lead.source || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingLead(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      status: "NEW",
      source: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { className: string; label: string; icon: React.ElementType }
    > = {
      NEW: {
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        label: "Novo",
        icon: UserX,
      },
      CONTACTED: {
        className:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        label: "Contatado",
        icon: Users,
      },
      QUALIFIED: {
        className:
          "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        label: "Qualificado",
        icon: TrendingUp,
      },
      CONVERTED: {
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        label: "Convertido",
        icon: UserCheck,
      },
    };
    const config = variants[status] || variants.NEW;
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const newLeads = leads.filter((l) => l.status === "NEW").length;
  const convertedLeads = leads.filter((l) => l.status === "CONVERTED").length;
  const conversionRate =
    leads.length > 0 ? ((convertedLeads / leads.length) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
            Leads
          </h1>
          <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">
            Gerencie seus leads e contatos
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="mr-2 h-5 w-5" />
                Adicionar Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {editingLead ? "Editar Lead" : "Novo Lead"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">
                      Nome Completo
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="mt-1.5 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">
                      E-mail
                    </Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="mt-1.5 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">
                      Telefone
                    </Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="(11) 99999-9999"
                      className="mt-1.5 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v: any) =>
                        setFormData({ ...formData, status: v })
                      }
                    >
                      <SelectTrigger className="mt-1.5 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">Novo</SelectItem>
                        <SelectItem value="CONTACTED">Contatado</SelectItem>
                        <SelectItem value="QUALIFIED">Qualificado</SelectItem>
                        <SelectItem value="CONVERTED">Convertido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">
                      Origem
                    </Label>
                    <Input
                      value={formData.source}
                      onChange={(e) =>
                        setFormData({ ...formData, source: e.target.value })
                      }
                      placeholder="Ex: Facebook, Google Ads..."
                      className="mt-1.5 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-gray-200 dark:border-gray-700"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {editingLead ? "Atualizar" : "Criar"}
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
          title="Total de Leads"
          value={leads.length}
          icon={Users}
          color="bg-blue-500"
          delay={0.1}
        />
        <MetricCard
          title="Novos"
          value={newLeads}
          icon={UserX}
          color="bg-purple-500"
          delay={0.2}
          subtitle={`${((newLeads / leads.length) * 100 || 0).toFixed(0)}% do total`}
        />
        <MetricCard
          title="Convertidos"
          value={convertedLeads}
          icon={UserCheck}
          color="bg-green-500"
          delay={0.3}
          subtitle={`${((convertedLeads / leads.length) * 100 || 0).toFixed(0)}% do total`}
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${conversionRate}%`}
          icon={TrendingUp}
          color="bg-pink-500"
          delay={0.4}
        />
      </div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg text-base"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-64 h-12 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os Status</SelectItem>
            <SelectItem value="NEW">Novos</SelectItem>
            <SelectItem value="CONTACTED">Contatados</SelectItem>
            <SelectItem value="QUALIFIED">Qualificados</SelectItem>
            <SelectItem value="CONVERTED">Convertidos</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Tabela */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Lista de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredLeads.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-3xl rounded-full" />
                  <Users className="relative h-20 w-20 text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Nenhum lead encontrado
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                  {searchTerm
                    ? "Tente ajustar os filtros de busca"
                    : "Comece adicionando o primeiro lead"}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Adicionar Primeiro Lead
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-gray-200 dark:border-gray-700">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                        Nome
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                        E-mail
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                        Telefone
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                        Origem
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                        Status
                      </TableHead>
                      <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead, index) => (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-gray-200 dark:border-gray-700"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {lead.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {lead.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-300">
                          {lead.email}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                          {lead.phone || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                          {lead.source || "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(lead.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(lead)}
                              className="hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(lead.id)}
                              className="hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
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

            {/* Paginação */}
            {!loading && filteredLeads.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-2">
                <div className="text-sm text-muted-foreground">
                  Página {currentPage + 1} de {totalPages} ({totalCount} leads
                  no total)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                    }
                    disabled={currentPage >= totalPages - 1}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LeadsPage;

