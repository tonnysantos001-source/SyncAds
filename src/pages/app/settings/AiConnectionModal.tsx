import React, { useEffect } from 'react';
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

interface AiConnectionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  connection?: AiConnection;
}

const connectionSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  apiKey: z.string().min(1, 'A chave de API é obrigatória.'),
  baseUrl: z.string().url('A URL deve ser válida.').optional().or(z.literal('')),
});

type ConnectionFormData = z.infer<typeof connectionSchema>;

export const AiConnectionModal: React.FC<AiConnectionModalProps> = ({ isOpen, onOpenChange, connection }) => {
  const { toast } = useToast();
  const { addAiConnection, updateAiConnection } = useStore();
  const isEditing = !!connection;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ConnectionFormData>({
    resolver: zodResolver(connectionSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        reset({
          name: connection.name,
          apiKey: connection.apiKey,
          baseUrl: connection.baseUrl || '',
        });
      } else {
        reset({ name: '', apiKey: '', baseUrl: '' });
      }
    }
  }, [isOpen, connection, isEditing, reset]);

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
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Conexão</Label>
              <Input id="name" placeholder="Ex: OpenRouter Pessoal" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apiKey">Chave de API</Label>
              <Input id="apiKey" type="password" placeholder="sk-..." {...register('apiKey')} />
              {errors.apiKey && <p className="text-sm text-destructive">{errors.apiKey.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="baseUrl">URL Base da API (Opcional)</Label>
              <Input id="baseUrl" placeholder="https://openrouter.ai/api/v1" {...register('baseUrl')} />
              {errors.baseUrl && <p className="text-sm text-destructive">{errors.baseUrl.message}</p>}
              <p className="text-xs text-muted-foreground">
                Para OpenRouter, use https://openrouter.ai/api/v1. Deixe em branco para usar o padrão da OpenAI.
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
