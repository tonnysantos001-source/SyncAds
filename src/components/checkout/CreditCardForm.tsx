import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditCardFormProps {
  onCardDataChange: (cardData: CardData) => void;
  theme?: {
    primaryButtonBackgroundColor?: string;
    inputBackgroundColor?: string;
    inputBorderColor?: string;
    inputBorderRadius?: string;
    textColor?: string;
    labelColor?: string;
  };
  errors?: Record<string, string>;
}

export interface CardData {
  number: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  brand?: string;
}

const cardBrands = [
  {
    name: "Visa",
    pattern: /^4/,
    color: "from-blue-600 to-blue-800",
    logo: "💳",
  },
  {
    name: "Mastercard",
    pattern: /^5[1-5]/,
    color: "from-red-600 to-orange-600",
    logo: "💳",
  },
  {
    name: "Amex",
    pattern: /^3[47]/,
    color: "from-blue-500 to-blue-700",
    logo: "💳",
  },
  {
    name: "Elo",
    pattern: /^(4011|4312|4389|4514|4576|5041|5066|5067|6277|6362|6363|6504|6505|6516)/,
    color: "from-yellow-500 to-yellow-700",
    logo: "💳",
  },
];

export const CreditCardForm: React.FC<CreditCardFormProps> = ({
  onCardDataChange,
  theme = {},
  errors = {},
}) => {
  const [cardData, setCardData] = useState<CardData>({
    number: "",
    holderName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });

  const [focused, setFocused] = useState<string | null>(null);
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Detectar bandeira do cartão
  useEffect(() => {
    const cleanNumber = cardData.number.replace(/\s/g, "");
    const brand = cardBrands.find((b) => b.pattern.test(cleanNumber));
    setCardBrand(brand?.name || null);

    onCardDataChange({
      ...cardData,
      brand: brand?.name,
    });
  }, [cardData]);

  // Formatar número do cartão (XXXX XXXX XXXX XXXX)
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "").replace(/\D/g, "");
    const limited = cleaned.slice(0, 16);
    const formatted = limited.match(/.{1,4}/g)?.join(" ") || limited;
    return formatted;
  };

  // Formatar data de validade (MM/AA)
  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  // Formatar CVV
  const formatCVV = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 4);
  };

  // Formatar nome (apenas letras e espaços)
  const formatName = (value: string) => {
    return value
      .replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
      .toUpperCase()
      .slice(0, 50);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardData({ ...cardData, number: formatted });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    const [month, year] = formatted.split("/");
    setCardData({
      ...cardData,
      expiryMonth: month || "",
      expiryYear: year || "",
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatName(e.target.value);
    setCardData({ ...cardData, holderName: formatted });
  };

  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCVV(e.target.value);
    setCardData({ ...cardData, cvv: formatted });
  };

  const getBrandColor = () => {
    const brand = cardBrands.find((b) => b.name === cardBrand);
    return brand?.color || "from-slate-700 to-slate-900";
  };

  return (
    <div className="space-y-6">
      {/* CARTÃO VISUAL 3D */}
      <div className="relative h-56 mb-8" style={{ perspective: "1000px" }}>
        <div
          className={cn(
            "absolute w-full h-full transition-transform duration-700 ease-in-out",
            isFlipped && "[transform:rotateY(180deg)]"
          )}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* FRENTE DO CARTÃO */}
          <div
            className={cn(
              "absolute w-full h-full rounded-2xl shadow-2xl p-6 text-white",
              "bg-gradient-to-br",
              getBrandColor(),
              "backdrop-blur-xl"
            )}
            style={{
              backfaceVisibility: "hidden",
              boxShadow:
                "0 20px 60px -15px rgba(0, 0, 0, 0.3), 0 10px 20px -10px rgba(0, 0, 0, 0.2)",
            }}
          >
            {/* Chip do cartão */}
            <div className="flex justify-between items-start mb-8">
              <div className="w-12 h-10 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-md opacity-80" />
              <div className="text-right">
                <div className="text-xs opacity-70 mb-1">
                  {cardBrand || "BANDEIRA"}
                </div>
                <CreditCard className="h-8 w-8 opacity-70" />
              </div>
            </div>

            {/* Número do cartão */}
            <div className="mb-6">
              <div
                className={cn(
                  "text-2xl font-mono tracking-wider transition-all duration-300",
                  focused === "number" && "scale-105"
                )}
              >
                {cardData.number || "•••• •••• •••• ••••"}
              </div>
            </div>

            {/* Nome e Validade */}
            <div className="flex justify-between items-end">
              <div className="flex-1">
                <div className="text-xs opacity-70 mb-1">Nome do Titular</div>
                <div
                  className={cn(
                    "text-sm font-semibold transition-all duration-300 truncate",
                    focused === "name" && "scale-105"
                  )}
                >
                  {cardData.holderName || "SEU NOME AQUI"}
                </div>
              </div>
              <div>
                <div className="text-xs opacity-70 mb-1 text-right">
                  Validade
                </div>
                <div
                  className={cn(
                    "text-sm font-mono transition-all duration-300",
                    focused === "expiry" && "scale-105"
                  )}
                >
                  {cardData.expiryMonth && cardData.expiryYear
                    ? `${cardData.expiryMonth}/${cardData.expiryYear}`
                    : "MM/AA"}
                </div>
              </div>
            </div>
          </div>

          {/* VERSO DO CARTÃO */}
          <div
            className={cn(
              "absolute w-full h-full rounded-2xl shadow-2xl bg-gradient-to-br",
              getBrandColor(),
              "backdrop-blur-xl"
            )}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              boxShadow:
                "0 20px 60px -15px rgba(0, 0, 0, 0.3), 0 10px 20px -10px rgba(0, 0, 0, 0.2)",
            }}
          >
            {/* Tarja magnética */}
            <div className="w-full h-12 bg-black/40 mt-6" />

            {/* CVV */}
            <div className="px-6 mt-6">
              <div className="bg-white rounded p-3 flex justify-end items-center">
                <div className="text-xs text-gray-500 mr-2">CVV</div>
                <div className="text-lg font-mono tracking-wider text-gray-800">
                  {cardData.cvv || "•••"}
                </div>
              </div>
              <div className="text-xs text-white/70 mt-2 text-right">
                Código de segurança
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FORMULÁRIO */}
      <div className="space-y-4">
        {/* Número do Cartão */}
        <div>
          <Label
            htmlFor="cardNumber"
            style={{ color: theme.labelColor }}
            className="flex items-center gap-2 mb-2"
          >
            <CreditCard className="h-4 w-4" />
            Número do Cartão
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cardNumber"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardData.number}
            onChange={handleCardNumberChange}
            onFocus={() => setFocused("number")}
            onBlur={() => setFocused(null)}
            maxLength={19}
            className="text-lg font-mono"
            style={{
              backgroundColor: theme.inputBackgroundColor,
              borderColor:
                focused === "number"
                  ? theme.primaryButtonBackgroundColor
                  : theme.inputBorderColor,
              borderRadius: theme.inputBorderRadius,
              color: theme.textColor,
              borderWidth: focused === "number" ? "2px" : "1px",
              transition: "all 0.3s ease",
            }}
          />
          {errors.cardNumber && (
            <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.cardNumber}
            </div>
          )}
        </div>

        {/* Nome do Titular */}
        <div>
          <Label
            htmlFor="cardName"
            style={{ color: theme.labelColor }}
            className="mb-2 block"
          >
            Nome do Titular (como está no cartão)
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="cardName"
            type="text"
            placeholder="NOME COMPLETO"
            value={cardData.holderName}
            onChange={handleNameChange}
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused(null)}
            className="uppercase"
            style={{
              backgroundColor: theme.inputBackgroundColor,
              borderColor:
                focused === "name"
                  ? theme.primaryButtonBackgroundColor
                  : theme.inputBorderColor,
              borderRadius: theme.inputBorderRadius,
              color: theme.textColor,
              borderWidth: focused === "name" ? "2px" : "1px",
              transition: "all 0.3s ease",
            }}
          />
          {errors.cardName && (
            <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.cardName}
            </div>
          )}
        </div>

        {/* Validade e CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="cardExpiry"
              style={{ color: theme.labelColor }}
              className="mb-2 block"
            >
              Validade
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="cardExpiry"
              type="text"
              placeholder="MM/AA"
              value={
                cardData.expiryMonth && cardData.expiryYear
                  ? `${cardData.expiryMonth}/${cardData.expiryYear}`
                  : ""
              }
              onChange={handleExpiryChange}
              onFocus={() => setFocused("expiry")}
              onBlur={() => setFocused(null)}
              maxLength={5}
              className="font-mono"
              style={{
                backgroundColor: theme.inputBackgroundColor,
                borderColor:
                  focused === "expiry"
                    ? theme.primaryButtonBackgroundColor
                    : theme.inputBorderColor,
                borderRadius: theme.inputBorderRadius,
                color: theme.textColor,
                borderWidth: focused === "expiry" ? "2px" : "1px",
                transition: "all 0.3s ease",
              }}
            />
            {errors.cardExpiry && (
              <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.cardExpiry}
              </div>
            )}
          </div>

          <div>
            <Label
              htmlFor="cardCvv"
              style={{ color: theme.labelColor }}
              className="flex items-center gap-2 mb-2"
            >
              <Lock className="h-4 w-4" />
              CVV
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cardCvv"
              type="text"
              placeholder="123"
              value={cardData.cvv}
              onChange={handleCVVChange}
              onFocus={() => {
                setFocused("cvv");
                setIsFlipped(true);
              }}
              onBlur={() => {
                setFocused(null);
                setIsFlipped(false);
              }}
              maxLength={4}
              className="font-mono"
              style={{
                backgroundColor: theme.inputBackgroundColor,
                borderColor:
                  focused === "cvv"
                    ? theme.primaryButtonBackgroundColor
                    : theme.inputBorderColor,
                borderRadius: theme.inputBorderRadius,
                color: theme.textColor,
                borderWidth: focused === "cvv" ? "2px" : "1px",
                transition: "all 0.3s ease",
              }}
            />
            {errors.cardCvv && (
              <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.cardCvv}
              </div>
            )}
          </div>
        </div>

        {/* Mensagem de Segurança */}
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
          <p className="text-xs text-green-700 dark:text-green-300">
            Seus dados são criptografados e protegidos
          </p>
        </div>
      </div>
    </div>
  );
};
