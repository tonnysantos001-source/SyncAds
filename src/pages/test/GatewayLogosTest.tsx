import React, { useState } from "react";
import GatewayLogo from "@/components/gateway/GatewayLogo";
import { gatewaysWithLocalLogos } from "@/components/gateway/LocalGatewayLogos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

const GatewayLogosTest: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  // Lista de todos os gateways com logos locais
  const gateways = [
    // Grupo 1 - Logos Oficiais (13)
    { name: "Mercado Pago", slug: "mercadopago" },
    { name: "Stripe", slug: "stripe" },
    { name: "Cielo", slug: "cielo" },
    { name: "PicPay", slug: "picpay" },
    { name: "Rede", slug: "rede" },
    { name: "Stone", slug: "stone" },
    { name: "Iugu", slug: "iugu" },
    { name: "Wirecard/Moip", slug: "wirecard" },
    { name: "SafetyPay", slug: "safetypay" },
    { name: "Asaas", slug: "asaas" },
    { name: "Getnet", slug: "getnet" },
    { name: "Vindi", slug: "vindi" },
    { name: "EFI Pay", slug: "efipay" },

    // Grupo 2 - Customizados (5)
    { name: "PagSeguro", slug: "pagseguro" },
    { name: "PayPal", slug: "paypal" },
    { name: "PagueX", slug: "paguex" },
    { name: "PIX", slug: "pix" },
    { name: "Boleto", slug: "boleto" },

    // Grupo 3 - Brasileiros (5)
    { name: "Pagar.me", slug: "pagarme" },
    { name: "Ebanx", slug: "ebanx" },
    { name: "Juno", slug: "juno" },
    { name: "PagBank", slug: "pagbank" },
    { name: "Sumup", slug: "sumup" },

    // Grupo 4 - Globais (5)
    { name: "Adyen", slug: "adyen" },
    { name: "Braintree", slug: "braintree" },
    { name: "Square", slug: "square" },
    { name: "Authorize.net", slug: "authorizenet" },
    { name: "2Checkout", slug: "2checkout" },
  ];

  const sizes: Array<"sm" | "md" | "lg" | "xl"> = ["sm", "md", "lg", "xl"];

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Gateway Logos Test
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Visualização de {gateways.length} logos locais de gateways de pagamento
              </p>
            </div>
            <Button
              onClick={() => setDarkMode(!darkMode)}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              {darkMode ? (
                <>
                  <Sun className="w-5 h-5" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5" />
                  Dark Mode
                </>
              )}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  28
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total de Logos
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                  13
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Logos Oficiais
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  15
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Logos Customizados
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                  4
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Grupos Criados
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Size Preview */}
        <div className="max-w-7xl mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Tamanhos Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-8 justify-center py-4">
                {sizes.map((size) => (
                  <div key={size} className="flex flex-col items-center gap-2">
                    <GatewayLogo name="Stripe" slug="stripe" size={size} />
                    <span className="text-xs text-gray-600 dark:text-gray-400 uppercase font-medium">
                      {size}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gateway Grid */}
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Logos ({gateways.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {gateways.map((gateway) => (
                  <div
                    key={gateway.slug}
                    className="flex flex-col items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <GatewayLogo
                      name={gateway.name}
                      slug={gateway.slug}
                      size="lg"
                    />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {gateway.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {gateway.slug}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Groups Breakdown */}
        <div className="max-w-7xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grupo 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grupo 1 - Logos Oficiais (13)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {gateways.slice(0, 13).map((gateway) => (
                  <div key={gateway.slug} className="flex flex-col items-center gap-2">
                    <GatewayLogo name={gateway.name} slug={gateway.slug} size="md" />
                    <span className="text-xs text-center text-gray-600 dark:text-gray-400">
                      {gateway.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grupo 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grupo 2 - Customizados (5)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {gateways.slice(13, 18).map((gateway) => (
                  <div key={gateway.slug} className="flex flex-col items-center gap-2">
                    <GatewayLogo name={gateway.name} slug={gateway.slug} size="md" />
                    <span className="text-xs text-center text-gray-600 dark:text-gray-400">
                      {gateway.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grupo 3 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grupo 3 - Brasileiros (5)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {gateways.slice(18, 23).map((gateway) => (
                  <div key={gateway.slug} className="flex flex-col items-center gap-2">
                    <GatewayLogo name={gateway.name} slug={gateway.slug} size="md" />
                    <span className="text-xs text-center text-gray-600 dark:text-gray-400">
                      {gateway.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grupo 4 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grupo 4 - Globais (5)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {gateways.slice(23, 28).map((gateway) => (
                  <div key={gateway.slug} className="flex flex-col items-center gap-2">
                    <GatewayLogo name={gateway.name} slug={gateway.slug} size="md" />
                    <span className="text-xs text-center text-gray-600 dark:text-gray-400">
                      {gateway.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="max-w-7xl mx-auto mt-8">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Sistema de Fallback de 5 Níveis
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  1️⃣ Logos locais (prioridade máxima) • 2️⃣ React-pay-icons • 3️⃣ Logo externa (URL) •
                  4️⃣ SVG customizado • 5️⃣ Inicial com gradiente
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GatewayLogosTest;

