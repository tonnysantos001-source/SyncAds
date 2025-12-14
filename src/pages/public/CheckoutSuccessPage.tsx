import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Share2, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const CheckoutSuccessPage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (transactionId) {
      loadTransaction();
    }
  }, [transactionId]);

  const loadTransaction = async () => {
    try {
      const { data, error } = await supabase
        .from('Transaction')
        .select('*, Order(*)')
        .eq('id', transactionId)
        .single();

      if (error) throw error;
      setTransaction(data);
    } catch (error) {
      console.error('Erro ao carregar transação:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Pagamento Aprovado!</CardTitle>
            <p className="text-gray-600">
              Seu pagamento foi processado com sucesso
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {transaction && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">ID da Transação:</span>
                    <p className="font-medium">{transaction.transactionId}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Valor:</span>
                    <p className="font-medium">R$ {transaction.amount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      {transaction.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Método:</span>
                    <p className="font-medium">{transaction.paymentMethod}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Button 
                onClick={() => window.print()} 
                variant="outline" 
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Comprovante
              </Button>
              
              <Button 
                onClick={() => navigator.share?.({ 
                  title: 'Comprovante de Pagamento',
                  text: `Pagamento aprovado - ID: ${transactionId}`
                })} 
                variant="outline" 
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
              
              <Button 
                onClick={() => navigate('/')} 
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;

