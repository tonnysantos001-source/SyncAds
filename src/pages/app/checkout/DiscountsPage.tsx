import React, { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  CreditCard,
  Percent,
  DollarSign,
  Info,
  CheckCircle2,
  XCircle,
  Zap,
  Target,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useOptimizedSelectors";
import { supabase } from "@/lib/supabase";

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

interface PaymentMethodDiscount {
  id: string;
  userId: string;
  paymentMethod: "CREDIT_CARD" | "PIX" | "BOLETO" | "DEBIT_CARD";
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  isActive: boolean;
  minPurchaseAmount: number;
  maxDiscountAmount: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DiscountFormData {
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: string;
  minPurchaseAmount: string;
  maxDiscountAmount: string;
  description: string;
  isActive: boolean;
}

const PAYMENT_METHODS = [
  {
    key: "CREDIT_CARD",
    label: "Cartão de Crédito",
    icon: CreditCard,
    color: "bg-blue-500",
    description: "Desconto para pagamentos com cartão de crédito",
  },
  {
    key: "PIX",
    label: "PIX",
    icon: DollarSign,
    color: "bg-green-500",
    description: "Desconto para pagamentos via PIX (mais comum)",
  },
  {
    key: "BOLETO",
    label: "Boleto Bancário",
    icon: CreditCard,
    color: "bg-orange-500",
    description: "Desconto para pagamentos com boleto bancário",
  },
  {
    key: "DEBIT_CARD",
    label: "Cartão de Débito",
    icon: CreditCard,
    color: "bg-purple-500",
    description: "Desconto para pagamentos com cartão de débito",
  },
] as const;

const DiscountsPage: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discounts, setDiscounts] = useState<PaymentMethodDiscount[]>([]);

  // Form states para cada método de pagamento
  const [forms, setForms] = useState<
    Record<string, DiscountFormData | undefined>
  >({});

  useEffect(() => {
    if (user?.id) {
      loadDiscounts();
    }
  }, [user?.id]);

  const loadDiscounts = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("PaymentMethodDiscount")
        .select("*")
        .eq("userId", user.id)
        .order("createdAt", { ascending: false });

      if (error) throw error;

      setDiscounts(data || []);

      // Inicializar forms com dados existentes
      const newForms: Record<string, DiscountFormData> = {};
      PAYMENT_METHODS.forEach((method) => {
        const existingDiscount = (data || []).find(
          (d) => d.paymentMethod === method.key,
        );
        if (existingDiscount) {
          newForms[method.key] = {
            discountType: existingDiscount.discountType,
            discountValue: existingDiscount.discountValue.toString(),
            minPurchaseAmount:
              existingDiscount.minPurchaseAmount?.toString() || "0",
            maxDiscountAmount:
              existingDiscount.maxDiscountAmount?.toString() || "",
            description: existingDiscount.description || "",
            isActive: existingDiscount.isActive,
          };
        } else {
          newForms[method.key] = {
            discountType: "PERCENTAGE",
            discountValue: "",
            minPurchaseAmount: "0",
            maxDiscountAmount: "",
            description: "",
            isActive: true,
          };
        }
      });
      setForms(newForms);
    } catch (error: any) {
      console.error("Erro ao carregar descontos:", error);
      toast({
        title: "Erro ao carregar descontos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDiscount = async (paymentMethod: string) => {
    if (!user?.id) return;

    const formData = forms[paymentMethod];
    if (!formData || !formData.discountValue) {
      toast({
        title: "Valor obrigatório",
        description: "Informe o valor do desconto",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const existingDiscount = discounts.find(
        (d) => d.paymentMethod === paymentMethod,
      );

      const discountData = {
        userId: user.id,
        paymentMethod,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minPurchaseAmount: parseFloat(formData.minPurchaseAmount || "0"),
        maxDiscountAmount: formData.maxDiscountAmount
          ? parseFloat(formData.maxDiscountAmount)
          : null,
        description: formData.description || null,
        isActive: formData.isActive,
        updatedAt: new Date().toISOString(),
      };

      if (existingDiscount) {
        // Update
        const { error } = await supabase
          .from("PaymentMethodDiscount")
          .update(discountData)
          .eq("id", existingDiscount.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("PaymentMethodDiscount")
          .insert(discountData);

        if (error) throw error;
      }

      toast({
        title: "Desconto salvo!",
        description: `Desconto para ${PAYMENT_METHODS.find((m) => m.key === paymentMethod)?.label} configurado com sucesso`,
      });

      await loadDiscounts();
    } catch (error: any) {
      console.error("Erro ao salvar desconto:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDiscount = async (id: string, paymentMethod: string) => {
    if (
      !window.confirm(
        `Tem certeza que deseja remover o desconto de ${PAYMENT_METHODS.find((m) => m.key === paymentMethod)?.label}?`,
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("PaymentMethodDiscount")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Desconto removido!",
        description: "O desconto foi removido com sucesso",
      });

      await loadDiscounts();
    } catch (error: any) {
      console.error("Erro ao remover desconto:", error);
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateForm = (
    paymentMethod: string,
    field: keyof DiscountFormData,
    value: any,
  ) => {
    setForms((prev) => ({
      ...prev,
      [paymentMethod]: {
        ...(prev[paymentMethod] || {
          discountType: "PERCENTAGE",
          discountValue: "",
          minPurchaseAmount: "0",
          maxDiscountAmount: "",
          description: "",
          isActive: true,
        }),
        [field]: value,
      },
    }));
  };

  const calculateDiscountPreview = (
    method: string,
    purchaseValue: number = 100,
  ) => {
    const formData = forms[method];
    if (!formData || !formData.discountValue) return 0;

    const value = parseFloat(formData.discountValue);
    let discount = 0;

    if (formData.discountType === "PERCENTAGE") {
      discount = (purchaseValue * value) / 100;
    } else {
      discount = value;
    }

    // Aplicar desconto máximo se configurado
    if (formData.maxDiscountAmount) {
      const max = parseFloat(formData.maxDiscountAmount);
      discount = Math.min(discount, max);
    }

    return discount;
  };

  const stats = {
    total: discounts.length,
    active: discounts.filter((d) => d.isActive).length,
    inactive: discounts.filter((d) => !d.isActive).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando descontos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com animação */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Descontos por Forma de Pagamento
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium mt-2">
          Configure descontos automáticos baseados na forma de pagamento
          escolhida pelo cliente no checkout
        </p>
      </motion.div>

      {/* Métricas com animação */}
      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard
          title="Total de Descontos"
          value={stats.total}
          icon={Percent}
          color="bg-blue-500"
          delay={0.1}
          subtitle={
            stats.total === 0
              ? "Nenhum configurado"
              : `${stats.total} ${stats.total === 1 ? "método" : "métodos"}`
          }
        />
        <MetricCard
          title="Descontos Ativos"
          value={stats.active}
          icon={Zap}
          color="bg-green-500"
          delay={0.2}
          subtitle="Aplicados no checkout"
        />
        <MetricCard
          title="Descontos Inativos"
          value={stats.inactive}
          icon={Target}
          color="bg-gray-500"
          delay={0.3}
          subtitle="Pausados temporariamente"
        />
      </div>

      {/* Alert informativo */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Como funciona</AlertTitle>
        <AlertDescription>
          Os descontos configurados aqui serão aplicados automaticamente no
          checkout público quando o cliente selecionar a forma de pagamento. O
          desconto será exibido de forma clara antes da finalização da compra.
        </AlertDescription>
      </Alert>

      {/* Configuração de Descontos */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Configurar Descontos</h2>

        {PAYMENT_METHODS.map((method, index) => {
          const Icon = method.icon;
          const existingDiscount = discounts.find(
            (d) => d.paymentMethod === method.key,
          );
          const formData = forms[method.key];

          return (
            <motion.div
              key={method.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
            >
              <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${method.color} flex items-center justify-center`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {method.label}
                        </CardTitle>
                        <CardDescription>{method.description}</CardDescription>
                      </div>
                    </div>
                    {existingDiscount && (
                      <Badge
                        variant={
                          existingDiscount.isActive ? "default" : "secondary"
                        }
                      >
                        {existingDiscount.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Tipo de Desconto */}
                    <div className="space-y-2">
                      <Label>Tipo de Desconto</Label>
                      <Select
                        value={formData?.discountType || "PERCENTAGE"}
                        onValueChange={(value) =>
                          updateForm(
                            method.key,
                            "discountType",
                            value as "PERCENTAGE" | "FIXED_AMOUNT",
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">
                            Porcentagem (%)
                          </SelectItem>
                          <SelectItem value="FIXED_AMOUNT">
                            Valor Fixo (R$)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Valor do Desconto */}
                    <div className="space-y-2">
                      <Label>
                        Valor do Desconto{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="0"
                          value={formData?.discountValue || ""}
                          onChange={(e) =>
                            updateForm(
                              method.key,
                              "discountValue",
                              e.target.value,
                            )
                          }
                          min="0"
                          step="0.01"
                        />
                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                          {formData?.discountType === "PERCENTAGE" ? "%" : "R$"}
                        </span>
                      </div>
                    </div>

                    {/* Valor Mínimo da Compra */}
                    <div className="space-y-2">
                      <Label>Valor Mínimo da Compra</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={formData?.minPurchaseAmount || "0"}
                          onChange={(e) =>
                            updateForm(
                              method.key,
                              "minPurchaseAmount",
                              e.target.value,
                            )
                          }
                          min="0"
                          step="0.01"
                        />
                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                          R$
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Desconto só se aplica acima deste valor
                      </p>
                    </div>

                    {/* Desconto Máximo */}
                    <div className="space-y-2">
                      <Label>Desconto Máximo (Opcional)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Sem limite"
                          value={formData?.maxDiscountAmount || ""}
                          onChange={(e) =>
                            updateForm(
                              method.key,
                              "maxDiscountAmount",
                              e.target.value,
                            )
                          }
                          min="0"
                          step="0.01"
                        />
                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                          R$
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Limite máximo do desconto em reais
                      </p>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label>Descrição (Opcional)</Label>
                    <Input
                      placeholder="Ex: Desconto especial para pagamento à vista"
                      value={formData?.description || ""}
                      onChange={(e) =>
                        updateForm(method.key, "description", e.target.value)
                      }
                    />
                  </div>

                  {/* Preview do Desconto */}
                  {formData?.discountValue && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-900">
                        Preview do Desconto
                      </AlertTitle>
                      <AlertDescription className="text-blue-800">
                        <p className="mb-2">
                          Para uma compra de R$ 100,00, o desconto será de{" "}
                          <strong>
                            R${" "}
                            {calculateDiscountPreview(method.key, 100).toFixed(
                              2,
                            )}
                          </strong>
                        </p>
                        <p>
                          Total a pagar:{" "}
                          <strong>
                            R${" "}
                            {(
                              100 - calculateDiscountPreview(method.key, 100)
                            ).toFixed(2)}
                          </strong>
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Separator />

                  {/* Switch Ativo/Inativo */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Status do Desconto</Label>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formData?.isActive
                          ? "Desconto será aplicado no checkout"
                          : "Desconto pausado temporariamente"}
                      </p>
                    </div>
                    <Switch
                      checked={formData?.isActive ?? true}
                      onCheckedChange={(checked) =>
                        updateForm(method.key, "isActive", checked)
                      }
                    />
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    {existingDiscount && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleDeleteDiscount(existingDiscount.id, method.key)
                        }
                        disabled={saving}
                      >
                        Remover
                      </Button>
                    )}
                    <Button
                      onClick={() => handleSaveDiscount(method.key)}
                      disabled={saving || !formData?.discountValue}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      {saving ? "Salvando..." : "Salvar Desconto"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Alert de dúvidas */}
      <Alert className="border-pink-200 bg-pink-50">
        <AlertCircle className="h-4 w-4 text-pink-600" />
        <AlertDescription className="text-pink-900">
          <strong>Dica:</strong> Descontos para PIX geralmente aumentam a taxa
          de conversão. Recomendamos oferecer entre 3% a 10% de desconto.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default DiscountsPage;

