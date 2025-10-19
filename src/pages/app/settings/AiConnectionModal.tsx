import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useStore, AiConnection } from '@/store/useStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface AiConnectionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  connection?: AiConnection;
}

// Presets de provedores populares
const AI_PROVIDERS = [
  { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'] },
  { name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', models: ['openai/gpt-4', 'anthropic/claude-3-opus', 'meta-llama/llama-3-70b'] },
  { name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', models: ['llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'] },
  { name: 'Together AI', baseUrl: 'https://api.together.xyz/v1', models: ['meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1'] },
  { name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'] },
  { name: 'Personalizado', baseUrl: '', models: [] },
];

const connectionSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  apiKey: z.string().min(1, 'A chave de API é obrigatória.'),
  baseUrl: z.string().optional().or(z.literal('')),
  model: z.string().optional().or(z.literal('')),
});

type ConnectionFormData = z.infer<typeof connectionSchema>;

export const AiConnectionModal: React.FC<AiConnectionModalProps> = ({ isOpen, onOpenChange, connection }) => {
  const { toast } = useToast();
  const { addAiConnection, updateAiConnection } = useStore();
  const isEditing = !!connection;
  const [selectedProvider, setSelectedProvider] = useState('Personalizado');
  const [selectedModel, setSelectedModel] = useState('');

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ConnectionFormData>({
    resolver: zodResolver(connectionSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        reset({
          name: connection.name,
          apiKey: connection.apiKey,
          baseUrl: connection.baseUrl || '',
          model: connection.model || '',
        });
        setSelectedModel(connection.model || '');
      } else {
        reset({ name: '', apiKey: '', baseUrl: '', model: '' });
        setSelectedProvider('Personalizado');
        setSelectedModel('');
      }
    }
  }, [isOpen, connection, isEditing, reset]);

  const handleProviderChange = (providerName: string) => {
    setSelectedProvider(providerName);
    const provider = AI_PROVIDERS.find(p => p.name === providerName);
    if (provider) {
      setValue('baseUrl', provider.baseUrl);
      setValue('name', providerName);
      if (provider.models.length > 0) {
        setSelectedModel(provider.models[0]);
        setValue('model', provider.models[0]);
      }
    }
  };

  const onSubmit = (data: ConnectionFormData) => {
    try {
      if (isEditing) {
        updateAiConnection(connection.id, { ...data, status: 'untested' });
        toast({ title: "Conexão Atualizada!", description: `A conexão "${data.name}" foi atualizada.` });
      } else {
        addAiConnection(data);
        toast({ title: "Conexão Adicionada!", description: `A conexão "${data.name}" foi criada com sucesso.` });
      }
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível salvar a conexão.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Conexão de IA' : 'Adicionar Nova Conexão de IA'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edite os detalhes da sua conexão.' : 'Preencha os detalhes para adicionar uma nova conexão.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {selectedProvider === 'OpenRouter' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>OpenRouter:</strong> Obtenha sua chave em{' '}
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">
                    openrouter.ai/keys
                  </a>
                  . Você ganha $1 de crédito grátis! 🎉
                </AlertDescription>
              </Alert>
            )}
            {!isEditing && (
              <div className="grid gap-2">
                <Label>Provedor de IA</Label>
                <Select value={selectedProvider} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.map(provider => (
                      <SelectItem key={provider.name} value={provider.name}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Escolha um provedor pré-configurado ou use "Personalizado" para qualquer outro.
                </p>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Conexão</Label>
              <Input id="name" placeholder="Ex: Groq Gratuito" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apiKey">Chave de API</Label>
              <Input id="apiKey" type="password" placeholder="Sua chave de API..." {...register('apiKey')} />
              {errors.apiKey && <p className="text-sm text-destructive">{errors.apiKey.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="baseUrl">URL Base da API</Label>
              <Input id="baseUrl" placeholder="https://api.provedor.com/v1" {...register('baseUrl')} />
              {errors.baseUrl && <p className="text-sm text-destructive">{errors.baseUrl.message}</p>}
              <p className="text-xs text-muted-foreground">
                URL do endpoint da API do provedor escolhido.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model">Modelo (Opcional)</Label>
              {AI_PROVIDERS.find(p => p.name === selectedProvider)?.models.length ? (
                <Select value={selectedModel} onValueChange={(value) => { setSelectedModel(value); setValue('model', value); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.find(p => p.name === selectedProvider)?.models.map(model => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input id="model" placeholder="gpt-3.5-turbo" {...register('model')} />
              )}
              <p className="text-xs text-muted-foreground">
                Modelo de IA a ser usado. Deixe vazio para usar o padrão do provedor.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
