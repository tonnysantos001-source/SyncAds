import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiEye,
  HiCheckCircle,
  HiXCircle,
} from "react-icons/hi2";
import { HiDuplicate } from "react-icons/hi";
import { IoRocketSharp, IoStorefront, IoLockClosed } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Checkout {
  id: string;
  name: string;
  userId: string;
  isActive: boolean;
  theme: any;
  createdAt: string;
  updatedAt: string;
}

interface PricingPlan {
  id: string;
  name: string;
  maxCheckoutPages: number;
}

const CheckoutsManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PricingPlan | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCheckout, setSelectedCheckout] = useState<Checkout | null>(
    null,
  );
  const [newCheckoutName, setNewCheckoutName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCheckouts();
    loadUserPlan();
  }, []);

  const loadCheckouts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("CheckoutCustomization")
        .select("*")
        .eq("userId", user.id)
        .order("createdAt", { ascending: false });

      if (error) throw error;
      setCheckouts(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar checkouts:", error);
      toast({
        title: "Erro ao carregar checkouts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserPlan = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData, error: userError } = await supabase
        .from("User")
        .select("planId")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;

      if (userData?.planId) {
        const { data: planData, error: planError } = await supabase
          .from("PricingPlan")
          .select("id, name, maxCheckoutPages")
          .eq("id", userData.planId)
          .single();

        if (planError) throw planError;
        setCurrentPlan(planData);
      }
    } catch (error: any) {
      console.error("Erro ao carregar plano:", error);
    }
  };

  const handleCreateCheckout = async () => {
    if (!newCheckoutName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o checkout.",
        variant: "destructive",
      });
      return;
    }

    if (currentPlan && checkouts.length >= currentPlan.maxCheckoutPages) {
      toast({
        title: "Limite atingido",
        description: `Seu plano permite apenas ${currentPlan.maxCheckoutPages} checkout(s). Faça upgrade para criar mais.`,
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("CheckoutCustomization")
        .insert({
          name: newCheckoutName,
          userId: user.id,
          isActive: true,
          theme: {},
        })
        .select()
        .single();

      if (error) throw error;

      setCheckouts([data, ...checkouts]);
      setShowCreateDialog(false);
      setNewCheckoutName("");

      toast({
        title: "✅ Checkout criado!",
        description: `"${newCheckoutName}" foi criado com sucesso.`,
      });
    } catch (error: any) {
      console.error("Erro ao criar checkout:", error);
      toast({
        title: "Erro ao criar checkout",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCheckout = async () => {
    if (!selectedCheckout) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("CheckoutCustomization")
        .delete()
        .eq("id", selectedCheckout.id);

      if (error) throw error;

      setCheckouts(checkouts.filter((c) => c.id !== selectedCheckout.id));
      setShowDeleteDialog(false);
      setSelectedCheckout(null);

      toast({
        title: "🗑️ Checkout deletado",
        description: `"${selectedCheckout.name}" foi removido com sucesso.`,
      });
    } catch (error: any) {
      console.error("Erro ao deletar checkout:", error);
      toast({
        title: "Erro ao deletar checkout",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (checkout: Checkout) => {
    try {
      const { error } = await supabase
        .from("CheckoutCustomization")
        .update({ isActive: !checkout.isActive })
        .eq("id", checkout.id);

      if (error) throw error;

      setCheckouts(
        checkouts.map((c) =>
          c.id === checkout.id ? { ...c, isActive: !c.isActive } : c,
        ),
      );

      toast({
        title: checkout.isActive ? "Checkout desativado" : "Checkout ativado",
        description: `"${checkout.name}" foi ${checkout.isActive ? "desativado" : "ativado"}.`,
      });
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDuplicateCheckout = async (checkout: Checkout) => {
    if (currentPlan && checkouts.length >= currentPlan.maxCheckoutPages) {
      toast({
        title: "Limite atingido",
        description: `Seu plano permite apenas ${currentPlan.maxCheckoutPages} checkout(s).`,
        variant: "destructive",
      });
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("CheckoutCustomization")
        .insert({
          name: `${checkout.name} (Cópia)`,
          userId: user.id,
          isActive: false,
          theme: checkout.theme,
        })
        .select()
        .single();

      if (error) throw error;

      setCheckouts([data, ...checkouts]);

      toast({
        title: "✅ Checkout duplicado!",
        description: `"${data.name}" foi criado com sucesso.`,
      });
    } catch (error: any) {
      console.error("Erro ao duplicar checkout:", error);
      toast({
        title: "Erro ao duplicar checkout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCheckoutUrl = (checkoutId: string) => {
    return `${window.location.origin}/checkout/${checkoutId}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "✅ Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const canCreateMore = currentPlan
    ? checkouts.length < currentPlan.maxCheckoutPages
    : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <IoRocketSharp className="h-12 w-12 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <IoStorefront className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white">
                Meus Checkouts
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie suas páginas de checkout personalizadas
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Checkouts Ativos
                  </p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">
                    {checkouts.filter((c) => c.isActive).length}
                    <span className="text-lg text-gray-500">
                      /{checkouts.length}
                    </span>
                  </p>
                </div>

                <div className="h-12 w-px bg-gray-200 dark:bg-gray-800" />

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Limite do Plano
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-black text-gray-900 dark:text-white">
                      {checkouts.length}
                      <span className="text-lg text-gray-500">
                        /{currentPlan?.maxCheckoutPages || "∞"}
                      </span>
                    </p>
                    {currentPlan && (
                      <Badge
                        variant="secondary"
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0"
                      >
                        {currentPlan.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowCreateDialog(true)}
                disabled={!canCreateMore}
                className={cn(
                  "gap-2 font-bold",
                  canCreateMore
                    ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600"
                    : "opacity-50 cursor-not-allowed",
                )}
              >
                {canCreateMore ? (
                  <>
                    <HiPlus className="h-5 w-5" />
                    Novo Checkout
                  </>
                ) : (
                  <>
                    <IoLockClosed className="h-5 w-5" />
                    Limite Atingido
                  </>
                )}
              </Button>
            </div>

            {!canCreateMore && currentPlan && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
              >
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Você atingiu o limite de{" "}
                  <strong>{currentPlan.maxCheckoutPages} checkout(s)</strong> do
                  seu plano. Faça upgrade para criar mais páginas de checkout.
                </p>
                <Button
                  variant="link"
                  className="text-yellow-700 dark:text-yellow-300 font-bold p-0 h-auto mt-2"
                  onClick={() => navigate("/billing")}
                >
                  Ver planos disponíveis →
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Checkouts Grid */}
        {checkouts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-800"
          >
            <div className="max-w-md mx-auto">
              <div className="mb-6 inline-flex p-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
                <IoStorefront className="h-16 w-16 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Nenhum checkout criado ainda
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Crie seu primeiro checkout personalizado e comece a vender com
                uma experiência única para seus clientes.
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="gap-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 font-bold"
              >
                <HiPlus className="h-5 w-5" />
                Criar Primeiro Checkout
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {checkouts.map((checkout, index) => (
                <motion.div
                  key={checkout.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-2xl transition-all duration-300">
                    {/* Card Header */}
                    <div className="p-6 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-b border-gray-200 dark:border-gray-800">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                            {checkout.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ID: {checkout.id.slice(0, 8)}...
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleActive(checkout)}
                          className="ml-2 flex-shrink-0"
                        >
                          {checkout.isActive ? (
                            <HiCheckCircle className="h-8 w-8 text-green-500" />
                          ) : (
                            <HiXCircle className="h-8 w-8 text-gray-400" />
                          )}
                        </button>
                      </div>

                      <Badge
                        variant={checkout.isActive ? "default" : "secondary"}
                        className={cn(
                          checkout.isActive
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-700",
                        )}
                      >
                        {checkout.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                      <div className="space-y-3 mb-4">
                        <div>
                          <Label className="text-xs text-gray-500 dark:text-gray-400">
                            URL do Checkout
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg truncate">
                              {getCheckoutUrl(checkout.id)}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                copyToClipboard(
                                  getCheckoutUrl(checkout.id),
                                  "URL",
                                )
                              }
                            >
                              <HiDuplicate className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>Criado em:</span>
                          <span>
                            {new Date(checkout.createdAt).toLocaleDateString(
                              "pt-BR",
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() =>
                            navigate(`/checkout/customize?id=${checkout.id}`)
                          }
                        >
                          <HiPencil className="h-4 w-4" />
                          Editar
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(getCheckoutUrl(checkout.id), "_blank")
                          }
                        >
                          <HiEye className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDuplicateCheckout(checkout)}
                          disabled={!canCreateMore}
                        >
                          <HiDuplicate className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => {
                            setSelectedCheckout(checkout);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <HiTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Checkout</DialogTitle>
            <DialogDescription>
              Dê um nome para identificar este checkout. Você poderá
              personalizá-lo depois.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Nome do Checkout *</Label>
              <Input
                id="name"
                placeholder="Ex: Checkout Principal, Checkout Black Friday..."
                value={newCheckoutName}
                onChange={(e) => setNewCheckoutName(e.target.value)}
                maxLength={100}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewCheckoutName("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCheckout}
              disabled={creating || !newCheckoutName.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {creating ? "Criando..." : "Criar Checkout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Checkout?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar "{selectedCheckout?.name}"? Esta
              ação não pode ser desfeita e todos os dados de personalização
              serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCheckout}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleting ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CheckoutsManagementPage;
