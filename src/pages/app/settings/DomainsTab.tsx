import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Globe,
  Plus,
  CheckCircle,
  XCircle,
  RefreshCw,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const DomainsTab: React.FC = () => {
  const [newDomain, setNewDomain] = useState("");
  const [domains, setDomains] = useState([
    {
      id: "1",
      domain: "checkout.minhaloja.com.br",
      status: "verified",
      createdAt: "2025-10-15",
      dnsRecord: "CNAME: checkout -> syncads.app",
    },
    {
      id: "2",
      domain: "comprar.minhaloja.com.br",
      status: "pending",
      createdAt: "2025-10-18",
      dnsRecord: "CNAME: comprar -> syncads.app",
    },
  ]);

  const handleAddDomain = () => {
    if (!newDomain) return;

    const newDomainObj = {
      id: Date.now().toString(),
      domain: newDomain,
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
      dnsRecord: `CNAME: ${newDomain.split(".")[0]} -> syncads.app`,
    };

    setDomains([...domains, newDomainObj]);
    setNewDomain("");
  };

  const handleVerify = (id: string) => {
    setDomains(
      domains.map((d) => (d.id === id ? { ...d, status: "verified" } : d)),
    );
  };

  const handleCopyDns = (record: string) => {
    navigator.clipboard.writeText(record);
  };

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Globe className="h-4 w-4" />
        <AlertTitle>Configuração de Domínio</AlertTitle>
        <AlertDescription>
          Configure um domínio personalizado para o seu checkout. Isso aumenta a
          confiança dos clientes e melhora a taxa de conversão.
        </AlertDescription>
      </Alert>

      {/* Add New Domain */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Domínio</CardTitle>
          <CardDescription>
            Conecte um domínio personalizado ao seu checkout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="domain">Domínio</Label>
              <Input
                id="domain"
                placeholder="checkout.seusite.com.br"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAddDomain} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Domínio
          </Button>
        </CardFooter>
      </Card>

      {/* Domains List */}
      <Card>
        <CardHeader>
          <CardTitle>Seus Domínios</CardTitle>
          <CardDescription>
            Gerencie os domínios conectados ao seu checkout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domínio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registro DNS</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.length > 0 ? (
                domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        {domain.domain}
                      </div>
                    </TableCell>
                    <TableCell>
                      {domain.status === "verified" ? (
                        <Badge variant="default" className="gap-1 bg-green-500">
                          <CheckCircle className="h-3 w-3" />
                          Verificado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {domain.dnsRecord}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyDns(domain.dnsRecord)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(domain.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {domain.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleVerify(domain.id)}
                          >
                            <RefreshCw className="h-3 w-3" />
                            Verificar
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Testar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhum domínio configurado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Como Configurar</CardTitle>
          <CardDescription>
            Siga os passos abaixo para configurar seu domínio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold">Adicione o domínio</h4>
              <p className="text-sm text-muted-foreground">
                Digite o subdomínio que deseja usar para o checkout (ex:
                checkout.seusite.com.br)
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold">Configure o DNS</h4>
              <p className="text-sm text-muted-foreground">
                Acesse o painel do seu provedor de domínio e adicione o registro
                CNAME fornecido
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold">Aguarde a propagação</h4>
              <p className="text-sm text-muted-foreground">
                A propagação DNS pode levar de alguns minutos até 48 horas
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white font-bold">
              4
            </div>
            <div>
              <h4 className="font-semibold">Verifique o domínio</h4>
              <p className="text-sm text-muted-foreground">
                Clique em "Verificar" para confirmar que o domínio está
                configurado corretamente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
