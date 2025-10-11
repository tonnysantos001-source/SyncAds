import React, { useState, useEffect } from 'react';
import { Cpu, PlusCircle, Edit, Trash2, LoaderCircle, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';

import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/Select';

const modelSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  api_key: z.string().min(1, 'A chave de API é obrigatória.'),
  type: z.enum(['Language Processing', 'Image Generation']),
  status: z.enum(['active', 'inactive']),
  model_identifier: z.string().optional(),
  system_prompt: z.string().optional(),
});

type AIModel = z.infer<typeof modelSchema> & { id: string; created_at: string };
type AIModelFormData = z.infer<typeof modelSchema>;

const MotherAIPage: React.FC = () => {
    const [models, setModels] = useState<AIModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<AIModel | null>(null);
    const [isTestingKey, setIsTestingKey] = useState(false);
    const [testKeyStatus, setTestKeyStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } = useForm<AIModelFormData>({
        resolver: zodResolver(modelSchema),
        defaultValues: {
            type: 'Language Processing',
            status: 'active',
        }
    });

    const apiKeyFromForm = watch('api_key');
    const modelType = watch('type');

    useEffect(() => {
        setTestKeyStatus('idle');
    }, [apiKeyFromForm]);

    useEffect(() => {
        fetchModels();
    }, []);

    async function fetchModels() {
        setIsLoading(true);
        const { data, error } = await supabase.from('ai_models').select('*').order('created_at', { ascending: false });
        if (error) {
            toast.error('Falha ao buscar modelos de IA.');
            console.error(error);
        } else {
            setModels(data as AIModel[]);
        }
        setIsLoading(false);
    }
    
    const testApiKey = async (key?: string) => {
        const apiKey = key || control._getWatch('api_key');
        if (!apiKey) {
            toast.error('Por favor, insira uma chave de API para testar.');
            return;
        }
        setIsTestingKey(true);
        setTestKeyStatus('idle');
        try {
            await axios.get('https://openrouter.ai/api/v1/models', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            toast.success('Chave de API válida e funcionando!');
            setTestKeyStatus('success');
        } catch (error) {
            toast.error('A chave de API é inválida ou a OpenRouter não pôde ser contatada.');
            setTestKeyStatus('error');
        } finally {
            setIsTestingKey(false);
        }
    };

    const openDialogToEdit = (model: AIModel) => {
        setEditingModel(model);
        reset({
            name: model.name,
            api_key: model.api_key,
            type: model.type,
            status: model.status,
            model_identifier: model.model_identifier || '',
            system_prompt: model.system_prompt || '',
        });
        setIsDialogOpen(true);
    };

    const openDialogToCreate = () => {
        setEditingModel(null);
        reset({
            name: '',
            api_key: '',
            type: 'Language Processing',
            status: 'active',
            model_identifier: '',
            system_prompt: '',
        });
        setIsDialogOpen(true);
    };

    const onSubmit = async (formData: AIModelFormData) => {
        setIsSubmitting(true);
        let error;

        if (editingModel) {
            const { error: updateError } = await supabase.from('ai_models').update(formData).eq('id', editingModel.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('ai_models').insert(formData);
            error = insertError;
        }

        if (error) {
            toast.error(`Falha ao salvar modelo: ${error.message}`);
        } else {
            toast.success(`Modelo ${editingModel ? 'atualizado' : 'adicionado'} com sucesso!`);
            setIsDialogOpen(false);
            await fetchModels();
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (modelId: string) => {
        if (window.confirm('Tem certeza que deseja apagar este modelo? Esta ação não pode ser desfeita.')) {
            const { error } = await supabase.from('ai_models').delete().eq('id', modelId);
            if (error) {
                toast.error(`Falha ao apagar modelo: ${error.message}`);
            } else {
                toast.success('Modelo apagado com sucesso.');
                await fetchModels();
            }
        }
    };

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">IA Mãe</h1>
            <p className="text-gray-600 dark:text-gray-400">Adicione e gerencie as chaves de API das IAs que dão vida ao sistema.</p>
        </div>
        <Button onClick={openDialogToCreate}>
            <PlusCircle className="h-5 w-5 mr-2" />
            Adicionar Chave de API
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
                <DialogTitle>{editingModel ? 'Editar Modelo de IA' : 'Adicionar Novo Modelo de IA'}</DialogTitle>
                <DialogDescription>
                    Preencha os detalhes da sua chave de API. A chave será armazenada de forma segura.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nome</Label>
                    <div className="col-span-3">
                        <Input id="name" {...register('name')} placeholder="Ex: Meu Chatbot de Marketing" className="w-full" />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="api_key" className="text-right">Chave API</Label>
                    <div className="col-span-3 flex items-center gap-2">
                        <div className="relative flex-grow">
                            <Input id="api_key" type="password" {...register('api_key')} className="w-full pr-10" />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                {isTestingKey ? (
                                    <LoaderCircle className="h-4 w-4 animate-spin text-gray-400" />
                                ) : testKeyStatus === 'success' ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : testKeyStatus === 'error' ? (
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                ) : null}
                            </div>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => testApiKey()} disabled={isTestingKey} className="flex-shrink-0">
                            {isTestingKey ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Testar'}
                        </Button>
                    </div>
                    {errors.api_key && <p className="col-start-2 col-span-3 text-red-500 text-xs mt-1">{errors.api_key.message}</p>}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Tipo</Label>
                    <div className="col-span-3">
                         <Select onValueChange={(value) => setValue('type', value as 'Language Processing' | 'Image Generation')} value={watch('type')}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Language Processing">Processamento de Linguagem</SelectItem>
                                <SelectItem value="Image Generation">Geração de Imagem</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                {modelType === 'Language Processing' && (
                    <fieldset className="col-span-4 border-t border-light-border dark:border-dark-border pt-4 mt-2">
                        <legend className="text-sm font-medium text-gray-900 dark:text-white px-1 -ml-1">Instruções para a IA (Opcional)</legend>
                        <div className="grid grid-cols-4 items-start gap-4 mt-4">
                            <Label htmlFor="system_prompt" className="text-right pt-2">
                                Instrução Inicial
                                <span className="block text-xs font-normal text-gray-500">(System Prompt)</span>
                            </Label>
                            <div className="col-span-3">
                                <Textarea id="system_prompt" {...register('system_prompt')} placeholder="Ex: Você é um assistente de marketing especialista em copywriting para anúncios de alta conversão. Seja sempre direto, criativo e focado em resultados." rows={5} />
                                <p className="text-gray-500 text-xs mt-1 flex gap-1.5"><Info size={16} className="flex-shrink-0 mt-0.5"/>Define o comportamento, a personalidade e a especialidade da IA. Boas instruções levam a melhores resultados.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4 mt-4">
                            <Label htmlFor="model_identifier" className="text-right">
                                Identificador 
                                <span className="block text-xs font-normal text-gray-500">(Model ID)</span>
                            </Label>
                            <div className="col-span-3">
                                <Input id="model_identifier" {...register('model_identifier')} placeholder="Ex: mistralai/mistral-7b-instruct" className="w-full" />
                                <p className="text-gray-500 text-xs mt-1">Se deixado em branco, o modelo padrão gratuito será usado.</p>
                            </div>
                        </div>
                    </fieldset>
                )}

                {modelType === 'Image Generation' && (
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="model_identifier" className="text-right">
                            Identificador
                            <span className="block text-xs font-normal text-gray-500">(Model ID)</span>
                        </Label>
                        <div className="col-span-3">
                            <Input id="model_identifier" {...register('model_identifier')} placeholder="Ex: stabilityai/sdxl" className="w-full" />
                            <p className="text-gray-500 text-xs mt-1">Opcional. ID do modelo na API (ex: OpenRouter).</p>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">Status</Label>
                    <div className="col-span-3 flex items-center">
                        <Switch id="status" checked={watch('status') === 'active'} onCheckedChange={(checked) => setValue('status', checked ? 'active' : 'inactive')} />
                        <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">{watch('status') === 'active' ? 'Ativo' : 'Inativo'}</span>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        {editingModel ? 'Salvar Alterações' : 'Adicionar Modelo'}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>


      <div className="bg-light-card dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border">
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Modelos Conectados</h2>
        </div>
        {isLoading ? (
            <div className="flex justify-center items-center h-40">
                <LoaderCircle className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
        ) : models.length === 0 ? (
            <div className="text-center py-10 px-6 border-t border-light-border dark:border-dark-border">
                <Cpu className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Nenhum modelo de IA encontrado</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Comece adicionando uma chave de API para conectar uma IA.</p>
            </div>
        ) : (
            <div className="divide-y divide-light-border dark:divide-dark-border">
                {models.map(model => (
                    <AIModelItem key={model.id} model={model} onEdit={openDialogToEdit} onDelete={handleDelete} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

const AIModelItem = ({ model, onEdit, onDelete }: { model: AIModel, onEdit: (model: AIModel) => void, onDelete: (id: string) => void }) => (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-card/50 transition-colors">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 dark:bg-dark-border rounded-lg">
                <Cpu className="h-6 w-6 text-brand-primary" />
            </div>
            <div>
                <p className="font-semibold text-gray-900 dark:text-white">{model.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{model.type}</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 text-sm ${model.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                <span className={`h-2 w-2 rounded-full ${model.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                {model.status === 'active' ? 'Ativo' : 'Inativo'}
            </div>
            <Button variant="ghost" size="icon" onClick={() => onEdit(model)}>
                <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(model.id)}>
                <Trash2 className="h-4 w-4 text-red-500/80 hover:text-red-500" />
            </Button>
        </div>
    </div>
)

export default MotherAIPage;
