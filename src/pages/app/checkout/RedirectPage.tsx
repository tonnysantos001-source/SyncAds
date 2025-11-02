import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";

const RedirectPage: React.FC = () => {
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [urls, setUrls] = useState({
    cartao: "",
    boleto: "",
    pix: "",
  });

  useEffect(() => {
    if (user?.id) {
      loadRedirects();
    }
  }, [user?.id]);

  const loadRedirects = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase

        .from("CheckoutRedirect")

        .select("*")

        .eq("userId", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setUrls({
          cartao: data.creditCardUrl || "",
          boleto: data.bankSlipUrl || "",
          pix: data.pixUrl || "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar redirecionamentos:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar as configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

      const { error } = await supabase.from("CheckoutRedirect").upsert({

        userId: user.id,
        creditCardUrl: urls.cartao,

        bankSlipUrl: urls.boleto,

        pixUrl: urls.pix,

        updatedAt: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "URLs salvas!",
        description: "Suas configurações foram salvas com sucesso",
      });
    } catch (error) {
      console.error("Erro ao salvar URLs:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as URLs",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">REDIRECIONAMENTO</h1>
        <p className="text-gray-600 mt-2">
          Redirecione seus compradores para uma página personalizada.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>URLs de Redirecionamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cartão */}
          <div>
            <Label htmlFor="cartao" className="text-base font-medium">
              Cartão
            </Label>
            <Input
              id="cartao"
              type="url"
              placeholder="https://"
              value={urls.cartao}
              onChange={(e) => setUrls({ ...urls, cartao: e.target.value })}
              className="mt-2"
            />
          </div>

          {/* Boleto */}
          <div>
            <Label htmlFor="boleto" className="text-base font-medium">
              Boleto
            </Label>
            <Input
              id="boleto"
              type="url"
              placeholder="https://"
              value={urls.boleto}
              onChange={(e) => setUrls({ ...urls, boleto: e.target.value })}
              className="mt-2"
            />
          </div>

          {/* Pix */}
          <div>
            <Label htmlFor="pix" className="text-base font-medium">
              Pix
            </Label>
            <Input
              id="pix"
              type="url"
              placeholder="https://"
              value={urls.pix}
              onChange={(e) => setUrls({ ...urls, pix: e.target.value })}
              className="mt-2"
            />
          </div>

          {/* Alert de ajuda */}
          <Alert className="border-pink-200 bg-pink-50">
            <AlertCircle className="h-4 w-4 text-pink-600" />
            <AlertDescription className="text-pink-900">
              Está com dúvidas?{" "}
              <a href="#" className="font-medium underline hover:no-underline">
                Aprenda com o nosso redirecionamento.
              </a>
            </AlertDescription>
          </Alert>

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              className="bg-pink-600 hover:bg-pink-700 text-white px-8"
              disabled={saving || loading}
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RedirectPage;
