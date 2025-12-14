import { useEffect, useState } from "react";
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
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { useSocialProofExamples } from "@/hooks/useSocialProofExamples";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const { createExamplesForUser, loading: examplesLoading } =
    useSocialProofExamples();

  const [formData, setFormData] = useState({
    type: "RECENT_PURCHASE" as "RECENT_PURCHASE" | "VISITOR_COUNT" | "REVIEW",
    message: "",
    displayDuration: 5,
    isActive: true,
  });

  useEffect(() => {
    loadSocialProofs();
  }, []);

  const handleCreateExamples = async () => {
    if (!user?.id) return;

    const success = await createExamplesForUser(user.id, 8);
    if (success) {
      loadSocialProofs();
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prova Social</h1>
          <p className="text-muted-foreground">
            Notificações em tempo real para aumentar confiança
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Prova Social
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingProof ? "Editar Prova Social" : "Nova Prova Social"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Tipo *</Label>
                <select
                  className="w-full p-2 border rounded-md"
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
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.type === "RECENT_PURCHASE" &&
                    'Ex: "João acabou de comprar há 5 minutos"'}
                  {formData.type === "VISITOR_COUNT" &&
                    'Ex: "23 pessoas estão visualizando este produto"'}
                  {formData.type === "REVIEW" &&
                    'Ex: "★★★★★ Produto excelente! - Maria S."'}
                </p>
              </div>
              <div>
                <Label>Mensagem *</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Digite a mensagem que será exibida..."
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label>Duração de Exibição (segundos)</Label>
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
                  required
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
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProof ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{socialProofs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProofs}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar provas sociais..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Alerta quando não há provas sociais */}
      {!loading && socialProofs.length === 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-blue-900 mb-1">
                Comece com exemplos prontos!
              </p>
              <p className="text-sm text-blue-700">
                Crie 8 provas sociais de exemplo para testar no seu checkout.
                Você pode editá-las ou excluí-las depois.
              </p>
            </div>
            <Button
              onClick={handleCreateExamples}
              disabled={examplesLoading}
              className="ml-4 bg-blue-600 hover:bg-blue-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {examplesLoading ? "Criando..." : "Criar Exemplos"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Provas Sociais</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredProofs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                Nenhuma prova social encontrada
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm
                  ? "Tente ajustar sua busca"
                  : "Comece criando a primeira prova social"}
              </p>
              {!searchTerm && (
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Prova Social
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProofs.map((proof) => (
                  <TableRow key={proof.id}>
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
                      <Badge variant={proof.isActive ? "default" : "secondary"}>
                        {proof.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(proof)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(proof.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

export default SocialProofPage;

