import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Users, Download, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { customersApi } from '@/lib/api/customersApi';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';

const LeadsPage = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'NEW' as 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED',
    source: '',
  });

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      if (!user?.organizationId) return;
      const data = await customersApi.leads.list(user.organizationId);
      setLeads(data);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar leads', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.organizationId) return;
      if (editingLead) {
        await customersApi.leads.update(editingLead.id, formData);
        toast({ title: 'Lead atualizado!' });
      } else {
        await customersApi.leads.create({ ...formData, organizationId: user.organizationId });
        toast({ title: 'Lead criado!' });
      }
      setIsDialogOpen(false);
      setEditingLead(null);
      loadLeads();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar lead?')) return;
    try {
      await customersApi.leads.delete(id);
      toast({ title: 'Lead deletado' });
      loadLeads();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const filteredLeads = leads.filter((l) =>
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">LEADS</h1>
        <p className="text-gray-600 mt-1">
          Leads que abandonaram o checkout e não finalizaram uma compra.
        </p>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Buscar por e-mail"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Data de Cadastro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    E-mail
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.registrationDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.email}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <div className="w-full max-w-md h-16 bg-gray-100 rounded mb-4"></div>
                        <p className="text-gray-500">Nenhum lead encontrado</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadsPage;
