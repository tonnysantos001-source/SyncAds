import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Copy,
  Check,
  Download,
  Printer,
  Calendar,
  Barcode,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BoletoPaymentProps {
  boletoData?: {
    boletoUrl?: string;
    barcode: string;
    digitableLine: string;
    dueDate: string;
    amount: number;
    pdf?: string;
  };
  theme?: {
    primaryButtonBackgroundColor?: string;
    primaryButtonTextColor?: string;
    textColor?: string;
    headingColor?: string;
  };
}

export const BoletoPayment: React.FC<BoletoPaymentProps> = ({
  boletoData,
  theme = {},
}) => {
  const [copied, setCopied] = useState(false);
  const [daysUntilDue, setDaysUntilDue] = useState<number>(0);

  // Calcular dias até o vencimento
  useEffect(() => {
    if (!boletoData?.dueDate) return;

    const calculateDays = () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const due = new Date(boletoData.dueDate);
      due.setHours(0, 0, 0, 0);

      const diffTime = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setDaysUntilDue(diffDays);
    };

    calculateDays();
  }, [boletoData?.dueDate]);

  const handleCopyCode = async () => {
    if (!boletoData?.digitableLine) return;

    try {
      await navigator.clipboard.writeText(boletoData.digitableLine);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Erro ao copiar código:", err);
    }
  };

  const handleDownloadBoleto = () => {
    if (boletoData?.boletoUrl) {
      window.open(boletoData.boletoUrl, "_blank");
    } else if (boletoData?.pdf) {
      // Se tiver PDF em base64
      const link = document.createElement("a");
      link.href = boletoData.pdf;
      link.download = `boleto-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrintBoleto = () => {
    if (boletoData?.boletoUrl) {
      const printWindow = window.open(boletoData.boletoUrl, "_blank");
      printWindow?.print();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDigitableLine = (line: string) => {
    // Formatar linha digitável do boleto (XXXXX.XXXXX XXXXX.XXXXXX XXXXX.XXXXXX X XXXXXXXXXXXXXXXX)
    return line.replace(
      /^(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d)(\d{14})$/,
      "$1.$2 $3.$4 $5.$6 $7 $8"
    );
  };

  if (!boletoData) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 mb-4">
          <Barcode className="h-8 w-8 text-orange-600 dark:text-orange-400 animate-pulse" />
        </div>
        <h3
          className="text-xl font-semibold mb-2"
          style={{ color: theme.headingColor }}
        >
          Gerando boleto...
        </h3>
        <p className="text-sm opacity-70" style={{ color: theme.textColor }}>
          Aguarde enquanto preparamos seu boleto bancário
        </p>
      </div>
    );
  }

  const isOverdue = daysUntilDue < 0;
  const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;

  return (
    <div className="space-y-6">
      {/* Status de Vencimento */}
      <div
        className={cn(
          "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
          isOverdue
            ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
            : isDueSoon
              ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800"
              : "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
        )}
      >
        <div className="flex items-center gap-3">
          <Calendar
            className={cn(
              "h-6 w-6",
              isOverdue
                ? "text-red-600 dark:text-red-400"
                : isDueSoon
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-blue-600 dark:text-blue-400"
            )}
          />
          <div>
            <p
              className={cn(
                "text-sm font-medium",
                isOverdue
                  ? "text-red-700 dark:text-red-300"
                  : isDueSoon
                    ? "text-yellow-700 dark:text-yellow-300"
                    : "text-blue-700 dark:text-blue-300"
              )}
            >
              {isOverdue
                ? "Vencido"
                : isDueSoon
                  ? "Vence em breve"
                  : "Vencimento"}
            </p>
            <p
              className={cn(
                "text-lg font-bold",
                isOverdue
                  ? "text-red-800 dark:text-red-200"
                  : isDueSoon
                    ? "text-yellow-800 dark:text-yellow-200"
                    : "text-blue-800 dark:text-blue-200"
              )}
            >
              {formatDate(boletoData.dueDate)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-70" style={{ color: theme.textColor }}>
            Valor
          </p>
          <p
            className="text-xl font-bold"
            style={{ color: theme.headingColor }}
          >
            R$ {boletoData.amount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Card Principal */}
      <Card className="overflow-hidden border-2">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 mb-2">
              <Barcode className="h-8 w-8 text-white" />
            </div>

            <div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{ color: theme.headingColor }}
              >
                Boleto Bancário
              </h3>
              <p className="text-sm opacity-70" style={{ color: theme.textColor }}>
                Pague em qualquer banco, lotérica ou internet banking
              </p>
            </div>

            {/* Código de Barras Visual */}
            <div className="py-6 px-4 bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <div className="flex justify-center items-end gap-[2px] h-20">
                {boletoData.barcode.split("").map((digit, index) => {
                  const heights = [60, 80, 70, 90, 75, 85, 65, 95, 70, 80];
                  const height = heights[parseInt(digit) % heights.length];
                  return (
                    <div
                      key={index}
                      className="w-1 bg-black dark:bg-white"
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
              <p className="text-xs font-mono mt-3 text-gray-500 dark:text-gray-400">
                {boletoData.barcode}
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={handleDownloadBoleto}
                variant="outline"
                className="gap-2 h-12 font-semibold"
                disabled={!boletoData.boletoUrl && !boletoData.pdf}
              >
                <Download className="h-4 w-4" />
                Baixar Boleto
              </Button>

              <Button
                onClick={handlePrintBoleto}
                variant="outline"
                className="gap-2 h-12 font-semibold"
                disabled={!boletoData.boletoUrl}
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Linha Digitável */}
      <div className="space-y-3">
        <label
          className="text-sm font-medium block"
          style={{ color: theme.textColor }}
        >
          Linha digitável (para pagar no internet banking):
        </label>

        <div className="space-y-2">
          <div
            className="px-4 py-4 bg-gray-50 dark:bg-gray-900 rounded-lg border"
            style={{ color: theme.textColor }}
          >
            <code className="text-sm font-mono block text-center">
              {formatDigitableLine(boletoData.digitableLine)}
            </code>
          </div>

          <Button
            onClick={handleCopyCode}
            className="w-full gap-2 h-12 font-semibold"
            style={{
              backgroundColor: theme.primaryButtonBackgroundColor,
              color: theme.primaryButtonTextColor,
            }}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Código Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar Código
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Instruções */}
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h4
              className="font-semibold text-lg flex items-center gap-2"
              style={{ color: theme.headingColor }}
            >
              <ExternalLink className="h-5 w-5" />
              Como pagar o boleto:
            </h4>

            <ol className="space-y-3 text-sm" style={{ color: theme.textColor }}>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold">
                  1
                </span>
                <span>
                  <strong>Baixe ou imprima</strong> o boleto usando os botões
                  acima
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold">
                  2
                </span>
                <span>
                  Pague no <strong>banco</strong>, <strong>lotérica</strong> ou{" "}
                  <strong>internet banking</strong> até a data de vencimento
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold">
                  3
                </span>
                <span>
                  No internet banking, use a{" "}
                  <strong>linha digitável</strong> acima
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold">
                  4
                </span>
                <span>
                  A confirmação do pagamento pode levar até{" "}
                  <strong>2 dias úteis</strong>
                </span>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Avisos */}
      {isOverdue && (
        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 dark:text-red-300 font-medium mb-1">
                  Boleto Vencido
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Este boleto está vencido. Para pagá-lo, você precisará gerar
                  uma segunda via ou entrar em contato com o suporte.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isDueSoon && !isOverdue && (
        <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-700 dark:text-yellow-300 font-medium mb-1">
                  Vencimento Próximo
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Seu boleto vence em {daysUntilDue}{" "}
                  {daysUntilDue === 1 ? "dia" : "dias"}. Não se esqueça de
                  pagá-lo para evitar juros.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
