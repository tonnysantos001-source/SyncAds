/**
 * StepEndereco - Step 2 do Checkout SyncAds
 * Formulário de endereço com busca automática de CEP
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Home, Hash, Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { CheckoutTheme } from "@/config/defaultCheckoutTheme";
import { formatCep, searchCep } from "@/lib/utils/cepUtils";

interface AddressData {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

interface StepEnderecoProps {
  addressData: AddressData;
  setAddressData: React.Dispatch<React.SetStateAction<AddressData>>;
  theme: CheckoutTheme;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export const StepEndereco: React.FC<StepEnderecoProps> = ({
  addressData,
  setAddressData,
  theme,
}) => {
  const { toast } = useToast();
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepFound, setCepFound] = useState(false);

  const handleCepChange = async (value: string) => {
    const formatted = formatCep(value);
    setAddressData({ ...addressData, zipCode: formatted });
    setCepFound(false);

    if (formatted.replace(/\D/g, "").length === 8) {
      await handleCepSearch(formatted);
    }
  };

  const handleCepSearch = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const result = await searchCep(cleanCep);
      if (result) {
        setAddressData((prev) => ({
          ...prev,
          street: result.street || result.logradouro || "",
          neighborhood: result.neighborhood || result.bairro || "",
          city: result.city || result.localidade || "",
          state: result.state || result.uf || "",
        }));
        setCepFound(true);
        toast({
          title: "CEP encontrado!",
          description: `${result.city || result.localidade} - ${result.state || result.uf}`,
        });
      } else {
        setCepFound(false);
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP digitado e tente novamente",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setCepFound(false);
      toast({
        title: "Erro ao buscar CEP",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoadingCep(false);
    }
  };

  return (
    <motion.div {...fadeInUp}>
      <Card
        style={{
          backgroundColor: theme.cardBackgroundColor,
          borderColor: theme.cardBorderColor,
          borderRadius: theme.cardBorderRadius,
          boxShadow: theme.cardShadow,
        }}
      >
        <CardContent className="p-5 md:p-6 space-y-5">
          <div>
            <h2
              className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2"
              style={{ color: theme.headingColor }}
            >
              <MapPin className="w-6 h-6" />
              Endereço de Entrega
            </h2>
            <p
              className="text-sm opacity-75"
              style={{ color: theme.textColor }}
            >
              Informe onde deseja receber
            </p>
          </div>

          <div className="space-y-4">
            {/* CEP */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Label
                htmlFor="zipCode"
                className="flex items-center gap-2"
                style={{
                  color: theme.labelColor,
                  fontWeight: theme.labelFontWeight,
                }}
              >
                <MapPin className="w-4 h-4" />
                CEP *
              </Label>
              <div className="relative">
                <Input
                  id="zipCode"
                  placeholder="00000-000"
                  value={addressData.zipCode}
                  onChange={(e) => handleCepChange(e.target.value)}
                  maxLength={9}
                  className={cn(
                    "mt-1.5 text-base pr-10 transition-all duration-300",
                    cepFound && "border-green-500 bg-green-50/50",
                  )}
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    height: 48,
                    borderRadius: theme.inputBorderRadius,
                    color: theme.textColor,
                  }}
                />
                {loadingCep && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  </motion.div>
                )}
                {cepFound && !loadingCep && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Rua e Número */}
            <div className="grid grid-cols-[1fr_120px] gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label
                  htmlFor="street"
                  className="flex items-center gap-2"
                  style={{
                    color: theme.labelColor,
                    fontWeight: theme.labelFontWeight,
                  }}
                >
                  <Home className="w-4 h-4" />
                  Rua *
                </Label>
                <Input
                  id="street"
                  placeholder="Nome da rua"
                  value={addressData.street}
                  onChange={(e) =>
                    setAddressData({
                      ...addressData,
                      street: e.target.value,
                    })
                  }
                  className="mt-1.5 text-base transition-all duration-300"
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    height: 48,
                    borderRadius: theme.inputBorderRadius,
                    color: theme.textColor,
                  }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Label
                  htmlFor="number"
                  className="flex items-center gap-2"
                  style={{
                    color: theme.labelColor,
                    fontWeight: theme.labelFontWeight,
                  }}
                >
                  <Hash className="w-4 h-4" />
                  Número *
                </Label>
                <Input
                  id="number"
                  placeholder="123"
                  value={addressData.number}
                  onChange={(e) =>
                    setAddressData({
                      ...addressData,
                      number: e.target.value,
                    })
                  }
                  className="mt-1.5 text-base transition-all duration-300"
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    height: 48,
                    borderRadius: theme.inputBorderRadius,
                    color: theme.textColor,
                  }}
                />
              </motion.div>
            </div>

            {/* Complemento e Bairro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label
                  htmlFor="complement"
                  style={{
                    color: theme.labelColor,
                    fontWeight: theme.labelFontWeight,
                  }}
                >
                  Complemento
                </Label>
                <Input
                  id="complement"
                  placeholder="Apto 101"
                  value={addressData.complement}
                  onChange={(e) =>
                    setAddressData({
                      ...addressData,
                      complement: e.target.value,
                    })
                  }
                  className="mt-1.5 text-base transition-all duration-300"
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    height: 48,
                    borderRadius: theme.inputBorderRadius,
                    color: theme.textColor,
                  }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                <Label
                  htmlFor="neighborhood"
                  style={{
                    color: theme.labelColor,
                    fontWeight: theme.labelFontWeight,
                  }}
                >
                  Bairro *
                </Label>
                <Input
                  id="neighborhood"
                  placeholder="Nome do bairro"
                  value={addressData.neighborhood}
                  onChange={(e) =>
                    setAddressData({
                      ...addressData,
                      neighborhood: e.target.value,
                    })
                  }
                  className="mt-1.5 text-base transition-all duration-300"
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    height: 48,
                    borderRadius: theme.inputBorderRadius,
                    color: theme.textColor,
                  }}
                />
              </motion.div>
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-[1fr_100px] gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Label
                  htmlFor="city"
                  style={{
                    color: theme.labelColor,
                    fontWeight: theme.labelFontWeight,
                  }}
                >
                  Cidade *
                </Label>
                <Input
                  id="city"
                  placeholder="Cidade"
                  value={addressData.city}
                  onChange={(e) =>
                    setAddressData({
                      ...addressData,
                      city: e.target.value,
                    })
                  }
                  className="mt-1.5 text-base transition-all duration-300"
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    height: 48,
                    borderRadius: theme.inputBorderRadius,
                    color: theme.textColor,
                  }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
              >
                <Label
                  htmlFor="state"
                  style={{
                    color: theme.labelColor,
                    fontWeight: theme.labelFontWeight,
                  }}
                >
                  UF *
                </Label>
                <Input
                  id="state"
                  placeholder="SP"
                  maxLength={2}
                  value={addressData.state}
                  onChange={(e) =>
                    setAddressData({
                      ...addressData,
                      state: e.target.value.toUpperCase(),
                    })
                  }
                  className="mt-1.5 text-base transition-all duration-300"
                  style={{
                    backgroundColor: theme.inputBackgroundColor,
                    borderColor: theme.inputBorderColor,
                    height: 48,
                    borderRadius: theme.inputBorderRadius,
                    color: theme.textColor,
                  }}
                />
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StepEndereco;
