import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

const DiscountsPage: React.FC = () => {
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [discounts, setDiscounts] = useState({
    creditCard: '',
    pix: '',
    bankSlip: '',
  });

  useEffect(() => {
    if (user?.organizationId) {
      loadDiscounts();
    }
  }, [user?.organizationId]);

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      
      // Buscar descontos configurados da organização
      const { data, error } = await supabase
        .from('PaymentDiscount')
        .select('*')
        .eq('organizationId', user?.organizationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setDiscounts({
          creditCard: data.creditCard?.toString() || '',
          pix: data.pix?.toString() || '',
          bankSlip: data.bankSlip?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar descontos:', error);
      toast({
        title: 'Erro ao carregar descontos',
        description: 'Não foi possível carregar as configurações',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.organizationId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('PaymentDiscount')
        .upsert({
          organizationId: user.organizationId,
          creditCard: discounts.creditCard ? parseFloat(discounts.creditCard) : null,
          pix: discounts.pix ? parseFloat(discounts.pix) : null,
          bankSlip: discounts.bankSlip ? parseFloat(discounts.bankSlip) : null,
          updatedAt: new Date().toISOString()
        });

      if (error) throw error;
      
      toast({
        title: 'Descontos salvos!',
        description: 'Suas configurações foram salvas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao salvar descontos:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os descontos',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    loadDiscounts();
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">DESCONTO POR FORMA DE PAGAMENTO</h1>
        <p className="text-gray-600 mt-1">
          Ofereça descontos por forma de pagamento.
        </p>
      </div>

      {/* Card com formulário */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Cartão de crédito */}
          <div>
            <Label htmlFor="creditCard" className="text-sm font-medium text-gray-700 mb-2 block">
              Cartão de crédito
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="creditCard"
                type="number"
                placeholder="0"
                value={discounts.creditCard}
                onChange={(e) => setDiscounts({ ...discounts, creditCard: e.target.value })}
                className="flex-1"
                min="0"
                max="100"
              />
              <span className="text-gray-500 font-medium">%</span>
            </div>
          </div>

          {/* Pix */}
          <div>
            <Label htmlFor="pix" className="text-sm font-medium text-gray-700 mb-2 block">
              Pix
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="pix"
                type="number"
                placeholder="0"
                value={discounts.pix}
                onChange={(e) => setDiscounts({ ...discounts, pix: e.target.value })}
                className="flex-1"
                min="0"
                max="100"
              />
              <span className="text-gray-500 font-medium">%</span>
            </div>
          </div>

          {/* Boleto bancário */}
          <div>
            <Label htmlFor="bankSlip" className="text-sm font-medium text-gray-700 mb-2 block">
              Boleto bancário
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="bankSlip"
                type="number"
                placeholder="0"
                value={discounts.bankSlip}
                onChange={(e) => setDiscounts({ ...discounts, bankSlip: e.target.value })}
                className="flex-1"
                min="0"
                max="100"
              />
              <span className="text-gray-500 font-medium">%</span>
            </div>
          </div>

          {/* Alert de ajuda */}
          <Alert className="border-pink-200 bg-pink-50">
            <AlertCircle className="h-4 w-4 text-pink-600" />
            <AlertDescription className="text-pink-900">
              Está com dúvidas?{' '}
              <a
                href="#"
                className="font-medium underline hover:no-underline"
              >
                Aprenda como criar um desconto por forma de pagamento
              </a>
            </AlertDescription>
          </Alert>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="px-6"
              disabled={saving || loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-pink-600 hover:bg-pink-700 text-white px-6"
              disabled={saving || loading}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiscountsPage;
