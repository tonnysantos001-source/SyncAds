import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Plus, Trash2, Edit, CheckCircle2, Loader2, ArrowLeft,
  HelpCircle, MapPin, Globe, FileText, Check, Truck, ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  type: 'FIXED' | 'WEIGHT_BASED' | 'PRICE_BASED' | 'LOCAL_PICKUP';
  basePrice: number;
  price: number;
  pricePerUnit: number;
  estimatedDays: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isBusinessDays: boolean;
  minOrderValue: number;
  isActive: boolean;
  isDefault: boolean;
  userId: string;
}

export default function ShippingPage() {
  const { toast } = useToast();
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para configuração do CEP de Origem e Cálculo Automático
  const [originCep, setOriginCep] = useState('');
  const [calculateAutomatically, setCalculateAutomatically] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Local states for masked text inputs
  const [priceInput, setPriceInput] = useState('0,00');
  const [minOrderInput, setMinOrderInput] = useState('0,00');

  // Formatting helpers
  const formatBRLInput = (value: string | number): string => {
    if (typeof value === 'number') {
      return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) return '0,00';
    const cents = parseInt(cleanValue, 10);
    const realValue = cents / 100;
    return realValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseBRLToNumber = (valueStr: string): number => {
    const cleanValue = valueStr.replace(/\D/g, '');
    if (!cleanValue) return 0;
    return parseInt(cleanValue, 10) / 100;
  };

  // Controle de Visualização: 'list' | 'create' | 'edit'
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'FIXED' as const,
    basePrice: 0,
    price: 0,
    pricePerUnit: 0,
    estimatedDays: 5,
    estimatedDaysMin: 1,
    estimatedDaysMax: 5,
    isBusinessDays: true,
    minOrderValue: 0,
    isActive: true,
    isDefault: false
  });

  useEffect(() => {
    loadMethods();
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('User')
        .select('originCep, calculateAutomatically')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setOriginCep(data.originCep || '');
        setCalculateAutomatically(data.calculateAutomatically || false);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de frete do usuário:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const cleanCep = originCep.replace(/\D/g, '');
      if (calculateAutomatically && cleanCep.length !== 8) {
        toast({
          title: 'CEP de origem inválido',
          description: 'Por favor, informe um CEP com 8 dígitos para ativar o cálculo automático.',
          variant: 'destructive',
        });
        setSavingSettings(false);
        return;
      }

      const { error } = await supabase
        .from('User')
        .update({
          originCep: cleanCep || null,
          calculateAutomatically,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Atualizar localmente no store
      const { useAuthStore } = await import('@/store/authStore');
      useAuthStore.getState().updateUser({
        originCep: cleanCep || null,
        calculateAutomatically,
      });

      toast({
        title: 'Configurações salvas!',
        description: 'CEP de origem e preferências de frete foram salvos com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de frete:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const loadMethods = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ShippingMethod')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      let methodsList = data || [];
      if (methodsList.length === 0) {
        const defaultMethod = {
          name: 'Frete grátis',
          description: 'Entrega padrão',
          type: 'FIXED',
          basePrice: 0,
          price: 0,
          pricePerUnit: 0,
          estimatedDays: 5,
          estimatedDaysMin: 1,
          estimatedDaysMax: 5,
          isBusinessDays: true,
          minOrderValue: 0,
          isActive: true,
          isDefault: true,
          userId: user.id
        };
        const { data: insertData, error: insertError } = await supabase
          .from('ShippingMethod')
          .insert(defaultMethod)
          .select();
        
        if (!insertError && insertData && insertData.length > 0) {
          methodsList = insertData;
        }
      }

      setMethods(methodsList);
    } catch (error) {
      console.error('Erro ao carregar métodos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os métodos de frete',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Por favor, informe o nome do método de frete.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        ...formData,
        // Mantém sincronizado basePrice e price para segurança
        basePrice: formData.price,
        price: formData.price,
      };

      if (view === 'edit' && editingMethod) {
        // Atualizar
        const { error } = await supabase
          .from('ShippingMethod')
          .update(payload)
          .eq('id', editingMethod.id);

        if (error) throw error;

        toast({
          title: 'Método atualizado',
          description: 'O método de frete foi atualizado com sucesso'
        });
      } else {
        // Criar
        const { error } = await supabase
          .from('ShippingMethod')
          .insert({
            ...payload,
            userId: user.id
          });

        if (error) throw error;

        toast({
          title: 'Método criado',
          description: 'O método de frete foi criado com sucesso'
        });
      }

      await loadMethods();
      setView('list');
      setEditingMethod(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar método:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o método de frete',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este método de frete?')) return;

    try {
      const { error } = await supabase
        .from('ShippingMethod')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Método excluído',
        description: 'O método de frete foi excluído com sucesso'
      });

      await loadMethods();
    } catch (error) {
      console.error('Erro ao excluir método:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o método de frete',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'FIXED',
      basePrice: 0,
      price: 0,
      pricePerUnit: 0,
      estimatedDays: 5,
      estimatedDaysMin: 1,
      estimatedDaysMax: 5,
      isBusinessDays: true,
      minOrderValue: 0,
      isActive: true,
      isDefault: false
    });
    setPriceInput('0,00');
    setMinOrderInput('0,00');
    setEditingMethod(null);
  };

  const startEdit = (method: ShippingMethod) => {
    setEditingMethod(method);
    const methodPrice = Number(method.price || method.basePrice || 0);
    const methodMinOrder = Number(method.minOrderValue || 0);
    setFormData({
      name: method.name,
      description: method.description || '',
      type: method.type || 'FIXED',
      basePrice: methodPrice,
      price: methodPrice,
      pricePerUnit: Number(method.pricePerUnit || 0),
      estimatedDays: method.estimatedDays || 5,
      estimatedDaysMin: method.estimatedDaysMin || 1,
      estimatedDaysMax: method.estimatedDaysMax || 5,
      isBusinessDays: method.isBusinessDays !== false,
      minOrderValue: methodMinOrder,
      isActive: method.isActive !== false,
      isDefault: method.isDefault === true
    });
    setPriceInput(formatBRLInput(methodPrice));
    setMinOrderInput(formatBRLInput(methodMinOrder));
    setView('edit');
  };

  const toggleActive = async (method: ShippingMethod) => {
    try {
      const { error } = await supabase
        .from('ShippingMethod')
        .update({ isActive: !method.isActive })
        .eq('id', method.id);

      if (error) throw error;

      // Atualiza localmente rápido para feedback instantâneo
      setMethods(prev =>
        prev.map(m => (m.id === method.id ? { ...m, isActive: !m.isActive } : m))
      );

      toast({
        title: method.isActive ? 'Método desativado' : 'Método ativado',
        description: `O método foi ${method.isActive ? 'desativado' : 'ativado'} com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do método',
        variant: 'destructive'
      });
    }
  };

  if (loading && methods.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0F19] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-gray-400 text-sm">Carregando logística...</p>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: FORMULÁRIO (Criação / Edição)
  // ────────────────────────────────────────────────────────────────────────────
  if (view === 'create' || view === 'edit') {
    return (
      <div className="p-6 sm:p-8 max-w-5xl mx-auto text-gray-100 min-h-screen">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setView('list'); resetForm(); }}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <span>Checkout</span>
                <ChevronRight className="w-3 h-3" />
                <span className="cursor-pointer hover:text-white" onClick={() => { setView('list'); resetForm(); }}>Logística</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-200">{view === 'edit' ? 'Editar frete' : 'Novo frete'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {view === 'edit' ? 'Editar método de frete' : 'Novo método de frete'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => { setView('list'); resetForm(); }}
              className="flex-1 sm:flex-initial border-gray-700 hover:bg-gray-800 text-gray-300 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Salvar alterações
            </Button>
          </div>
        </div>

        {/* Form Body - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Left Column: Form Details */}
          <div className="space-y-6">
            
            {/* Card 1: Informações Básicas */}
            <Card className="bg-[#111827] border-gray-800 text-gray-100 shadow-xl overflow-hidden rounded-xl">
              <div className="px-6 py-5 border-b border-gray-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Informações básicas
                </h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-300">Nome do método *</Label>
                  <Input
                    placeholder="Ex: Frete grátis, SEDEX..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-[#1F2937] border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-300">Preço (R$) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 text-sm">R$</span>
                      <Input
                        type="text"
                        placeholder="0,00"
                        value={priceInput}
                        onChange={(e) => {
                          const formatted = formatBRLInput(e.target.value);
                          setPriceInput(formatted);
                          setFormData({ ...formData, price: parseBRLToNumber(formatted) });
                        }}
                        className="pl-9 bg-[#1F2937] border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-300">Pedido mínimo (R$)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 text-sm">R$</span>
                      <Input
                        type="text"
                        placeholder="0,00"
                        value={minOrderInput}
                        onChange={(e) => {
                          const formatted = formatBRLInput(e.target.value);
                          setMinOrderInput(formatted);
                          setFormData({ ...formData, minOrderValue: parseBRLToNumber(formatted) });
                        }}
                        className="pl-9 bg-[#1F2937] border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <span className="text-xs text-gray-500">Deixe zerado se não quiser exigir valor mínimo.</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Prazo de Entrega */}
            <Card className="bg-[#111827] border-gray-800 text-gray-100 shadow-xl overflow-hidden rounded-xl">
              <div className="px-6 py-5 border-b border-gray-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-indigo-400" />
                  Prazo de entrega
                </h3>
                <p className="text-xs text-gray-400 mt-1">Define o prazo exibido no checkout.</p>
              </div>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-300">Prazo mínimo (dias)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.estimatedDaysMin}
                      onChange={(e) => setFormData({ ...formData, estimatedDaysMin: parseInt(e.target.value) || 0 })}
                      className="bg-[#1F2937] border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-300">Prazo máximo (dias)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.estimatedDaysMax}
                      onChange={(e) => setFormData({ ...formData, estimatedDaysMax: parseInt(e.target.value) || 0 })}
                      className="bg-[#1F2937] border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 border border-gray-800 rounded-xl">
                  <div>
                    <Label className="text-sm font-bold text-white cursor-pointer" htmlFor="isBusinessDays">
                      Prazo em dias úteis
                    </Label>
                    <p className="text-xs text-gray-400 mt-0.5">Contabiliza apenas dias úteis no prazo.</p>
                  </div>
                  <Switch
                    id="isBusinessDays"
                    checked={formData.isBusinessDays}
                    onCheckedChange={(checked) => setFormData({ ...formData, isBusinessDays: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Checkout Customization */}
            <Card className="bg-[#111827] border-gray-800 text-gray-100 shadow-xl overflow-hidden rounded-xl">
              <div className="px-6 py-5 border-b border-gray-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  Checkout
                </h3>
                <p className="text-xs text-gray-400 mt-1">Texto e comportamento exibidos ao cliente.</p>
              </div>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-300">Descrição personalizada</Label>
                  <Input
                    placeholder="Ex: Entrega rápida e segura em todo o Brasil"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-[#1F2937] border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 border border-gray-800 rounded-xl">
                  <div>
                    <Label className="text-sm font-bold text-white cursor-pointer" htmlFor="isDefault">
                      Pré-selecionada
                    </Label>
                    <p className="text-xs text-gray-400 mt-0.5">Seleciona este frete por padrão no checkout.</p>
                  </div>
                  <Switch
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                  />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column: Status Card */}
          <div className="space-y-6">
            <Card className="bg-[#111827] border-gray-800 text-gray-100 shadow-xl overflow-hidden rounded-xl">
              <div className="px-5 py-4 border-b border-gray-800">
                <h3 className="text-sm font-bold text-white">Ativo</h3>
              </div>
              <CardContent className="p-5 space-y-4">
                <p className="text-xs text-gray-400">
                  Define se o frete fica disponível no checkout.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: true })}
                    className={`flex-1 py-2.5 rounded-lg border font-semibold text-xs transition-all ${
                      formData.isActive
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 animate-pulse'
                        : 'border-gray-800 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: false })}
                    className={`flex-1 py-2.5 rounded-lg border font-semibold text-xs transition-all ${
                      !formData.isActive
                        ? 'bg-red-500/10 border-red-500 text-red-400 animate-pulse'
                        : 'border-gray-800 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    Inativo
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: LISTAGEM PRINCIPAL
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto text-gray-100 min-h-screen">
      
      {/* Title Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Logística</h1>
        <p className="text-gray-400 text-sm mt-1">
          Gerencie seus métodos e prazos de frete.
        </p>
      </div>

      {/* Card: Cálculo Automático de Frete */}
      <Card className="bg-[#111827] border-gray-800 shadow-xl rounded-xl overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-800 bg-gray-900/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-400" />
              Cálculo Automático de Frete (Correios & Jadlog)
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">
              Calcule automaticamente o valor do frete do PAC, SEDEX e Jadlog com base no CEP do cliente.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:self-center">
            <span className="text-xs text-gray-400">Ativar cálculo automático:</span>
            <Switch
              checked={calculateAutomatically}
              onCheckedChange={setCalculateAutomatically}
            />
          </div>
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 w-full max-w-sm">
              <Label className="text-sm font-semibold text-gray-300" htmlFor="origin-cep">CEP de Origem *</Label>
              <Input
                id="origin-cep"
                placeholder="00000-000"
                maxLength={9}
                value={originCep}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  if (clean.length <= 5) {
                    setOriginCep(clean);
                  } else {
                    setOriginCep(`${clean.slice(0, 5)}-${clean.slice(5, 8)}`);
                  }
                }}
                className="bg-[#1F2937] border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 h-10"
              />
              <p className="text-[11px] text-gray-400">
                CEP de onde os seus produtos serão despachados.
              </p>
            </div>
            
            <Button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10 px-6 self-start md:self-auto"
            >
              {savingSettings ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configurações'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Methods List Card */}
      <div className="w-full">
        <Card className="bg-[#111827] border-gray-800 shadow-xl rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
            <div>
              <h3 className="text-lg font-bold text-white">Métodos de frete</h3>
              <p className="text-gray-400 text-xs mt-0.5">
                Configure prazos, valores e disponibilidade no checkout.
              </p>
            </div>
            {methods.length > 0 && (
              <Button
                onClick={() => { resetForm(); setView('create'); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Novo frete
              </Button>
            )}
          </div>

          <CardContent className="p-0">
            {methods.length === 0 ? (
              /* Empty State */
              <div className="py-16 px-6 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4 text-gray-500 border border-gray-700">
                  <Truck className="h-8 w-8" />
                </div>
                <h4 className="text-base font-bold text-white mb-1">Nenhum frete cadastrado</h4>
                <p className="text-gray-400 text-xs max-w-sm mx-auto mb-6 leading-relaxed">
                  Crie seu primeiro método de frete para disponibilizar opções de envio no checkout.
                </p>
                <Button
                  onClick={() => { resetForm(); setView('create'); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Novo frete
                </Button>
              </div>
            ) : (
              /* Methods List */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-[11px] font-bold text-gray-400 uppercase bg-[#182235]/40">
                      <th className="py-3 px-6">Nome</th>
                      <th className="py-3 px-6">Preço</th>
                      <th className="py-3 px-6">Pedido Mín.</th>
                      <th className="py-3 px-6">Prazo estimado</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/80">
                    {methods.map((method) => {
                      const price = Number(method.price || method.basePrice || 0);
                      const minOrder = Number(method.minOrderValue || 0);
                      return (
                        <tr key={method.id} className="hover:bg-gray-800/20 transition-colors text-sm text-gray-200">
                          <td className="py-4 px-6 font-semibold text-white">
                            <div className="flex flex-col">
                              <span>{method.name}</span>
                              {method.isDefault && (
                                <span className="text-[10px] text-indigo-400 font-medium mt-0.5">★ Pré-selecionada</span>
                              )}
                            </div>
                          </td>
                           <td className="py-4 px-6">
                             {price === 0 ? (
                               <span className="font-semibold text-green-400">Grátis</span>
                             ) : (
                               `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                             )}
                           </td>
                           <td className="py-4 px-6 text-gray-400">
                             {minOrder === 0 ? (
                               'Sem mínimo'
                             ) : (
                               `R$ ${minOrder.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                             )}
                           </td>
                          <td className="py-4 px-6 text-gray-300">
                            {method.estimatedDaysMin && method.estimatedDaysMax
                              ? `${method.estimatedDaysMin} a ${method.estimatedDaysMax} dias`
                              : `${method.estimatedDays || 5} dias`}
                            {method.isBusinessDays ? ' úteis' : ' corridos'}
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => toggleActive(method)}
                              className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                                method.isActive
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                  : 'bg-gray-800 text-gray-400 border border-gray-700'
                              }`}
                            >
                              {method.isActive ? 'Ativo' : 'Inativo'}
                            </button>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEdit(method)}
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(method.id)}
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-gray-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
