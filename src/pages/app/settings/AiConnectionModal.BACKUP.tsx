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

// Presets de provedores populares com padrões de chave
const AI_PROVIDERS = [
  { 
    name: 'OpenAI', 
    baseUrl: 'https://api.openai.com/v1', 
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    keyPattern: /^sk-[a-zA-Z0-9]{20,}$/
  },
  { 
    name: 'OpenRouter', 
    baseUrl: 'https://openrouter.ai/api/v1', 
    models: ['openai/gpt-4', 'openai/gpt-3.5-turbo', 'anthropic/claude-3-opus', 'meta-llama/llama-3-70b-instruct', 'deepseek/deepseek-chat'],
    keyPattern: /^sk-or-v1-[a-zA-Z0-9]+$/
  },
  { 
    name: 'Groq', 
    baseUrl: 'https://api.groq.com/openai/v1', 
    models: ['llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'],
    keyPattern: /^gsk_[a-zA-Z0-9]+$/
  },
  { 
    name: 'Together AI', 
    baseUrl: 'https://api.together.xyz/v1', 
    models: ['meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
    keyPattern: /^[a-f0-9]{64}$/
  },
  { 
    name: 'Anthropic', 
    baseUrl: 'https://api.anthropic.com/v1', 
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
    keyPattern: /^sk-ant-[a-zA-Z0-9\-]+$/
  },
];

// Detectar provedor pela chave de API
const detectProvider = (apiKey: string) => {
  const trimmedKey = apiKey.trim();
  for (const provider of AI_PROVIDERS) {
    if (provider.keyPattern.test(trimmedKey)) {
      return provider;
    }
  }
  return null;
};

const connectionSchema = z.object({
  name: z.string().trim().min(1, 'O nome é obrigatório.'),
  apiKey: z.string().trim().min(1, 'A chave de API é obrigatória.'),
  baseUrl: z.string().trim().optional().or(z.literal('')),
  model: z.string().trim().optional().or(z.literal('')),
});

type ConnectionFormData = z.infer<typeof connectionSchema>;

export const AiConnectionModal: React.FC<AiConnectionModalProps> = ({ isOpen, onOpenChange, connection }) => {
  const { toast } = useToast();
  const { addAiConnection, updateAiConnection } = useStore();
  const isEditing = !!connection;
  const [detectedProvider, setDetectedProvider] = useState<typeof AI_PROVIDERS[0] | null>(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [apiKeyValue, setApiKeyValue] = useState('');

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
        setApiKeyValue(connection.apiKey);
        // Detectar provedor da chave existente
        const provider = detectProvider(connection.apiKey);
        setDetectedProvider(provider);
      } else {
        reset({ name: '', apiKey: '', baseUrl: '', model: '' });
        setSelectedModel('');
        setApiKeyValue('');
        setDetectedProvider(null);
      }
    }
  }, [isOpen, connection, isEditing, reset]);

  // Detectar provedor quando a chave de API muda
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setApiKeyValue(key);
    setValue('apiKey', key);
    
    const provider = detectProvider(key);
    setDetectedProvider(provider);
    
    if (provider) {
      // Auto-preencher campos baseado no provedor detectado
      setValue('baseUrl', provider.baseUrl);
      if (!isEditing) {
        setValue('name', provider.name);
      }
      if (provider.models.length > 0 && !selectedModel) {
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
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Cole sua chave de API abaixo. O provedor será detectado automaticamente! 
                {detectedProvider && (
                  <span className="block mt-1 font-semibold text-primary">
                    ✨ {detectedProvider.name} detectado!
                  </span>
                )}
              </AlertDescription>
            </Alert>
            
            <div className="grid gap-2">
              <Label htmlFor="apiKey">Chave de API</Label>
              <Input 
                id="apiKey" 
                type="password" 
                placeholder="Cole sua chave de API aqui..." 
                value={apiKeyValue}
                onChange={handleApiKeyChange}
              />
              {errors.apiKey && <p className="text-sm text-destructive">{errors.apiKey.message}</p>}
              <p className="text-xs text-muted-foreground">
                Suporta: OpenAI, OpenRouter, Groq, Anthropic, Together AI
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Conexão</Label>
              <Input id="name" placeholder="Ex: OpenRouter GPT-4" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            {detectedProvider && detectedProvider.models.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="model">Modelo</Label>
                <Select value={selectedModel} onValueChange={(value: string) => { setSelectedModel(value); setValue('model', value); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {detectedProvider.models.map(model => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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

