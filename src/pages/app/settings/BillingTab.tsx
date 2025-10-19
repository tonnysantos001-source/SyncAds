import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { billingHistory } from '@/data/mocks';
import { useStore } from '@/store/useStore';
import { CreditCard, Download, FileText } from 'lucide-react';

export const BillingTab: React.FC = () => {
  const user = useStore(state => state.user);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plano Atual</CardTitle>
          <CardDescription>Você está atualmente no plano {user?.plan}.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-lg border bg-muted/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold">Plano {user?.plan}</h3>
              <p className="text-muted-foreground">R$ 99,00 / mês</p>
            </div>
            <Button variant="outline">Mudar Plano</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Método de Pagamento</CardTitle>
          <CardDescription>O cartão que será usado para as próximas cobranças.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-lg border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-semibold">Visa terminando em 1234</p>
                <p className="text-sm text-muted-foreground">Expira em 12/2028</p>
              </div>
            </div>
            <Button variant="outline">Atualizar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturamento</CardTitle>
          <CardDescription>Veja e baixe suas faturas anteriores.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID da Fatura</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingHistory.length > 0 ? (
                billingHistory.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'Paga' ? 'success' : 'warning'}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell>{invoice.amount}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="h-8 w-8" />
                      <p>Nenhuma fatura encontrada.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
