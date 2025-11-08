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
import { Plus, Search, Edit, Trash2, Package2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { productsApi } from "@/lib/api/productsApi";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";

const KitsPage = () => {
  const [kits, setKits] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<any | null>(null);
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!user?.organizationId) return;
      const [kitsData, productsData] = await Promise.all([
        productsApi.kits.list(user.organizationId),
        productsApi.list(),
      ]);
      setKits(kitsData);
      setProducts(productsData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.organizationId) return;
      if (editingKit) {
        await productsApi.kits.update(editingKit.id, formData);
        toast({ title: "Kit atualizado!" });
      } else {
        await productsApi.kits.create({
          ...formData,
          organizationId: user.organizationId,
        });
        toast({ title: "Kit criado!" });
      }
      setIsDialogOpen(false);
      setEditingKit(null);
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
    if (!confirm("Deletar kit?")) return;
    try {
      await productsApi.kits.delete(id);
      toast({ title: "Kit deletado" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredKits = kits.filter((k) =>
    k.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-teal-600 via-emerald-600 to-lime-600 bg-clip-text text-transparent">
            Kits de Produtos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Crie kits com múltiplos produtos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingKit(null);
                setFormData({
                  name: "",
                  description: "",
                  price: 0,
                  isActive: true,
                });
              }}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 hover:from-teal-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Kit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingKit ? "Editar Kit" : "Novo Kit"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label>Nome do Kit</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Preço</Label>
                  <Input
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
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                  <Label>Ativo</Label>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingKit ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500 opacity-10 rounded-full blur-3xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total de Kits
            </CardTitle>
            <div className="p-2 rounded-lg bg-teal-500 bg-opacity-10">
              <Package2 className="h-4 w-4 text-teal-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-br from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              {kits.length}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Kits cadastrados
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar kits..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm dark:text-white dark:placeholder:text-gray-500"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Lista de Kits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredKits.length === 0 ? (
              <div className="text-center py-12">
                <Package2 className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                <h3 className="text-lg font-semibold">Nenhum kit encontrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comece criando o primeiro kit
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Kit
                </Button>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 hover:from-teal-100 hover:to-emerald-100 dark:hover:from-gray-700 dark:hover:to-gray-700">
                      <TableHead className="font-semibold dark:text-gray-300">
                        Nome
                      </TableHead>
                      <TableHead className="font-semibold dark:text-gray-300">
                        Descrição
                      </TableHead>
                      <TableHead className="font-semibold dark:text-gray-300">
                        Preço
                      </TableHead>
                      <TableHead className="font-semibold dark:text-gray-300">
                        Status
                      </TableHead>
                      <TableHead className="text-right font-semibold dark:text-gray-300">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKits.map((kit, index) => (
                      <motion.tr
                        key={kit.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gradient-to-r hover:from-teal-50/50 hover:to-emerald-50/50 dark:hover:from-gray-800/50 dark:hover:to-gray-800/50 transition-all duration-200"
                      >
                        <TableCell className="font-medium">
                          {kit.name}
                        </TableCell>
                        <TableCell>R$ {kit.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={kit.isActive ? "default" : "secondary"}
                            className={
                              kit.isActive
                                ? "bg-gradient-to-r from-emerald-100 to-lime-100 dark:from-emerald-900/30 dark:to-lime-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                                : ""
                            }
                          >
                            {kit.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingKit(kit);
                                setFormData({
                                  name: kit.name,
                                  description: kit.description,
                                  price: kit.price,
                                  isActive: kit.isActive,
                                });
                                setIsDialogOpen(true);
                              }}
                              className="hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 dark:hover:from-gray-800 dark:hover:to-gray-800"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(kit.id)}
                              className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
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

export default KitsPage;
