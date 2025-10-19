import React, { useState, useEffect } from 'react';
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
import { useStore } from '@/store/useStore';
import { Campaign } from '@/data/mocks';

interface EditCampaignModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign;
}

const campaignSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  budgetTotal: z.number({ required_error: 'Orçamento total é obrigatório.' }).positive(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export const EditCampaignModal: React.FC<EditCampaignModalProps> = ({ isOpen, onOpenChange, campaign }) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const updateCampaign = useStore(state => state.updateCampaign);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: campaign.name,
      budgetTotal: campaign.budgetTotal,
    }
  });
  
  useEffect(() => {
    if (campaign) {
      reset({
        name: campaign.name,
        budgetTotal: campaign.budgetTotal,
      });
    }
  }, [campaign, reset]);

  const onSubmit = (data: CampaignFormData) => {
    setIsSaving(true);
    setTimeout(() => {
      updateCampaign(campaign.id, {
        name: data.name,
        budgetTotal: data.budgetTotal,
      });
      setIsSaving(false);
      onOpenChange(false);
      toast({
        title: "Campanha Atualizada!",
        description: `A campanha "${data.name}" foi atualizada com sucesso.`,
      });
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Campanha</DialogTitle>
          <DialogDescription>
            Faça alterações na sua campanha aqui. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Campanha</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budgetTotal">Orçamento Total (R$)</Label>
              <Input id="budgetTotal" type="number" {...register('budgetTotal', { valueAsNumber: true })} />
              {errors.budgetTotal && <p className="text-sm text-destructive">{errors.budgetTotal.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" loading={isSaving}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
