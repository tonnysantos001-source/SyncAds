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
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  MessageSquare,
  TrendingUp,
  Sparkles,
  Zap,
  Target,
  Eye,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
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

interface SocialProof {
  id: string;

  userId: string;
  type: "RECENT_PURCHASE" | "VISITOR_COUNT" | "REVIEW";

  message: string;

  displayDuration: number;

  isActive: boolean;

  createdAt: string;

  updatedAt: string;
}

const SocialProofPage = () => {
  const [socialProofs, setSocialProofs] = useState<SocialProof[]>([]);
  const [filteredProofs, setFilteredProofs] = useState<SocialProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProof, setEditingProof] = useState<SocialProof | null>(null);
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    type: "RECENT_PURCHASE" as "RECENT_PURCHASE" | "VISITOR_COUNT" | "REVIEW",
    message: "",
    displayDuration: 5,
    isActive: true,
  });

  useEffect(() => {
    loadSocialProofs();
  }, []);

  useEffect(() => {
    filterProofs();
  }, [searchTerm, socialProofs]);

  const loadSocialProofs = async () => {
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("SocialProof")
        .select("*")
        .eq("userId", user.id)
        .order("createdAt", { ascending: false });

      if (error) throw error;
      setSocialProofs(data || []);
      setFilteredProofs(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProofs = () => {
    if (!searchTerm) {
      setFilteredProofs(socialProofs);
      return;
    }
    const filtered = socialProofs.filter((p) =>
      p.message.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredProofs(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.id) return;

      if (editingProof) {
        const { error } = await supabase
          .from("SocialProof")
          .update({ ...formData, updatedAt: new Date().toISOString() })
          .eq("id", editingProof.id);
        if (error) throw error;
        toast({ title: "Prova social atualizada!" });
      } else {
        const { error } = await supabase
          .from("SocialProof")
          .insert({ ...formData, userId: user.id });
        if (error) throw error;
        toast({
          title: "Prova social criada!",
          description: "A notificação está pronta para exibição.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadSocialProofs();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta prova social?")) return;
    try {
      const { error } = await supabase
        .from("SocialProof")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Prova social deletada" });
      loadSocialProofs();
    } catch (error: any) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (proof: SocialProof) => {
    setEditingProof(proof);
    setFormData({
      type: proof.type,
      message: proof.message,
      displayDuration: proof.displayDuration,
      isActive: proof.isActive,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProof(null);
    setFormData({
      type: "RECENT_PURCHASE",
      message: "",
      displayDuration: 5,
      isActive: true,
    });
  };

  const activeProofs = socialProofs.filter((p) => p.isActive).length;

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      RECENT_PURCHASE: "Compra Recente",
      VISITOR_COUNT: "Contador de Visitantes",
      REVIEW: "Avaliação",
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "RECENT_PURCHASE":
        return <TrendingUp className="h-4 w-4" />;
      case "VISITOR_COUNT":
        return <Users className="h-4 w-4" />;
      case "REVIEW":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return null;
    }
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
          <h1 className="text-4xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
            Prova Social
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium mt-2">
            Notificações em tempo real para aumentar confiança e conversões
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
              Criar Prova Social
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                {editingProof ? "Editar Prova Social" : "Nova Prova Social"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <div className="p-1 rounded bg-gradient-to-br from-purple-500 to-pink-600">
                    <Target className="h-3 w-3 text-white" />
                  </div>
                  Tipo *
                </Label>
                <select
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500/50 transition-all"
                  value={formData.type}
                  onChange={(e: any) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  required
                >
                  <option value="RECENT_PURCHASE">Compra Recente</option>
                  <option value="VISITOR_COUNT">Contador de Visitantes</option>
                  <option value="REVIEW">Avaliação</option>
                </select>
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200/50 dark:border-blue-800/50">
                  <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {formData.type === "RECENT_PURCHASE" &&
                      'Ex: "João acabou de comprar há 5 minutos"'}
                    {formData.type === "VISITOR_COUNT" &&
                      'Ex: "23 pessoas estão visualizando este produto"'}
                    {formData.type === "REVIEW" &&
                      'Ex: "★★★★★ Produto excelente! - Maria S."'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <div className="p-1 rounded bg-gradient-to-br from-blue-500 to-cyan-600">
                    <MessageSquare className="h-3 w-3 text-white" />
                  </div>
                  Mensagem *
                </Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Digite a mensagem que será exibida..."
                  rows={3}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <div className="p-1 rounded bg-gradient-to-br from-green-500 to-emerald-600">
                    <Eye className="h-3 w-3 text-white" />
                  </div>
                  Duração de Exibição (segundos)
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.displayDuration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayDuration: parseInt(e.target.value),
                    })
                  }
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-green-500/50 transition-all"
                  required
                />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-2"
                />
                <Label className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  Ativo
                </Label>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {editingProof ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Métricas com animação */}
      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard
          title="Total de Provas"
          value={socialProofs.length}
          icon={Sparkles}
          color="bg-orange-500"
          delay={0.1}
          subtitle="Notificações criadas"
        />
        <MetricCard
          title="Provas Ativas"
          value={activeProofs}
          icon={Zap}
          color="bg-green-500"
          delay={0.2}
          subtitle="Exibindo no checkout"
        />
        <MetricCard
          title="Impacto"
          value="Alto"
          icon={Target}
          color="bg-red-500"
          delay={0.3}
          subtitle="Aumenta confiança"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3" style={{ display: "none" }}>
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{socialProofs.length}</div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProofs}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600 dark:text-gray-400" />
        <Input
          placeholder="Buscar provas sociais..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 backdrop-blur-sm"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Lista de Provas Sociais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredProofs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 mb-4">
                  <MessageSquare className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Nenhuma prova social encontrada
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  {searchTerm
                    ? "Tente ajustar sua busca"
                    : "Comece criando provas sociais para aumentar a confiança dos seus clientes"}
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
                    Criar Primeira Prova Social
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border border-gray-200 dark:border-gray-800">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Tipo</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProofs.map((proof, index) => (
                      <motion.tr
                        key={proof.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(proof.type)}
                            <span className="text-sm">
                              {getTypeLabel(proof.type)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {proof.message}
                        </TableCell>
                        <TableCell>{proof.displayDuration}s</TableCell>
                        <TableCell>
                          <Badge
                            variant={proof.isActive ? "default" : "secondary"}
                            className={
                              proof.isActive
                                ? "bg-green-500 hover:bg-green-600"
                                : ""
                            }
                          >
                            {proof.isActive ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(proof)}
                              className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(proof.id)}
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

export default SocialProofPage;
