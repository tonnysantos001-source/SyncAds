import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
  DialogTrigger,
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
  HiPlus,
  HiMagnifyingGlass,
  HiCog6Tooth,
  HiUsers,
  HiBuildingOffice2,
  HiArrowPath,
} from "react-icons/hi2";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  maxUsers: number;
  maxCampaigns: number;
  maxChatMessages: number;
  createdAt: string;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    plan: "FREE",
    maxUsers: 2,
    maxCampaigns: 5,
    maxChatMessages: 100,
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from("Organization")
        .select("*")
        .order("createdAt", { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar organizações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrganization = async () => {
    try {
      const { error } = await supabase.from("Organization").insert({
        name: formData.name,
        slug: formData.slug,
        plan: formData.plan,
        status: "TRIAL",
        maxUsers: formData.maxUsers,
        maxCampaigns: formData.maxCampaigns,
        maxChatMessages: formData.maxChatMessages,
        trialEndsAt: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 14 days
      });

      if (error) throw error;

      toast({
        title: "✅ Organização criada!",
        description: `${formData.name} foi criada com sucesso.`,
      });

      setIsDialogOpen(false);
      loadOrganizations();

      // Reset form
      setFormData({
        name: "",
        slug: "",
        plan: "FREE",
        maxUsers: 2,
        maxCampaigns: 5,
        maxChatMessages: 100,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar organização",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateOrganizationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("Organization")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Organização ${status === "ACTIVE" ? "ativada" : "suspensa"}.`,
      });

      loadOrganizations();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      ACTIVE: {
        className: "bg-gradient-to-r from-green-500 to-emerald-600 text-white",
        label: "Ativa",
      },
      TRIAL: {
        className: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white",
        label: "Trial",
      },
      SUSPENDED: {
        className: "bg-gradient-to-r from-red-500 to-rose-600 text-white",
        label: "Suspensa",
      },
      CANCELLED: {
        className:
          "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        label: "Cancelada",
      },
    };
    const config = variants[status] || variants.TRIAL;
    return (
      <Badge className={`${config.className} border-0`}>{config.label}</Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      FREE: "bg-gradient-to-r from-gray-400 to-gray-500 text-white",
      STARTER: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
      PRO: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
      ENTERPRISE: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[plan] || colors.FREE}`}
      >
        {plan}
      </span>
    );
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-76px)]">
          <HiArrowPath className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="p-8">
        {/* Header com gradiente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
              <HiBuildingOffice2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Organizações
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gerenciar todos os clientes do sistema
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <HiPlus className="h-5 w-5 mr-2" />
                Nova Organização
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  Nova Organização
                </DialogTitle>
                <DialogDescription>
                  Criar uma nova organização cliente no sistema
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="font-semibold">
                    Nome da Organização
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: Acme Inc"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="bg-white dark:bg-gray-800"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug" className="font-semibold">
                    Slug (URL)
                  </Label>
                  <Input
                    id="slug"
                    placeholder="acme-inc"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="bg-white dark:bg-gray-800"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="plan" className="font-semibold">
                    Plano
                  </Label>
                  <Select
                    value={formData.plan}
                    onValueChange={(value) =>
                      setFormData({ ...formData, plan: value })
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREE">FREE</SelectItem>
                      <SelectItem value="STARTER">STARTER</SelectItem>
                      <SelectItem value="PRO">PRO</SelectItem>
                      <SelectItem value="ENTERPRISE">ENTERPRISE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="maxUsers" className="font-semibold text-xs">
                      Max Users
                    </Label>
                    <Input
                      id="maxUsers"
                      type="number"
                      value={formData.maxUsers}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxUsers: parseInt(e.target.value),
                        })
                      }
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="maxCampaigns"
                      className="font-semibold text-xs"
                    >
                      Max Campanhas
                    </Label>
                    <Input
                      id="maxCampaigns"
                      type="number"
                      value={formData.maxCampaigns}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxCampaigns: parseInt(e.target.value),
                        })
                      }
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="maxChatMessages"
                      className="font-semibold text-xs"
                    >
                      Max Msgs
                    </Label>
                    <Input
                      id="maxChatMessages"
                      type="number"
                      value={formData.maxChatMessages}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxChatMessages: parseInt(e.target.value),
                        })
                      }
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={createOrganization}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  Criar Organização
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <HiUsers className="h-6 w-6 text-blue-600" />
                    Todas as Organizações
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {organizations.length} organizações cadastradas
                  </CardDescription>
                </div>
                <div className="relative w-72">
                  <HiMagnifyingGlass className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Buscar organizações..."
                    className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 h-11"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                      <TableHead className="font-semibold">
                        Organização
                      </TableHead>
                      <TableHead className="font-semibold">Plano</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Limites</TableHead>
                      <TableHead className="font-semibold">Criada em</TableHead>
                      <TableHead className="text-right font-semibold">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrganizations.map((org, index) => (
                      <motion.tr
                        key={org.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <TableCell>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {org.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                              {org.slug}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getPlanBadge(org.plan)}</TableCell>
                        <TableCell>{getStatusBadge(org.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600">👥</span>
                              <span className="font-medium">
                                {org.maxUsers} users
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-purple-600">🎯</span>
                              <span className="font-medium">
                                {org.maxCampaigns} campanhas
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-600">💬</span>
                              <span className="font-medium">
                                {org.maxChatMessages} msgs
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {new Date(org.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {org.status === "SUSPENDED" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateOrganizationStatus(org.id, "ACTIVE")
                                }
                                className="hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors"
                              >
                                Ativar
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateOrganizationStatus(org.id, "SUSPENDED")
                                }
                                className="hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                              >
                                Suspender
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/20 transition-colors"
                            >
                              <HiCog6Tooth className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SuperAdminLayout>
  );
}
