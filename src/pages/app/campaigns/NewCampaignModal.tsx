import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, CheckCircle, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { Campaign } from '@/data/mocks';

interface NewCampaignModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  { id: 1, name: 'Detalhes', fields: ['name', 'objective', 'platform'] },
  { id: 2, name: 'Orçamento', fields: ['dailyBudget', 'totalBudget', 'dateRange'] },
  { id: 3, name: 'Público', fields: ['targetCountry', 'targetAge'] },
  { id: 4, name: 'Revisão', fields: [] },
];

const MAX_NAME_CHARS = 50;

const campaignSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }).max(MAX_NAME_CHARS, { message: `O nome deve ter no máximo ${MAX_NAME_CHARS} caracteres.` }),
  objective: z.string({ required_error: 'O objetivo é obrigatório.' }),
  platform: z.string({ required_error: 'A plataforma é obrigatória.' }),
  dailyBudget: z.number({ required_error: 'Orçamento diário é obrigatório.' }).positive(),
  totalBudget: z.number({ required_error: 'Orçamento total é obrigatório.' }).positive(),
  dateRange: z.object({
    from: z.date({ required_error: 'A data de início é obrigatória.' }),
    to: z.date({ required_error: 'A data de término é obrigatória.' }),
  }),
  targetCountry: z.string(),
  targetAge: z.string(),
  interests: z.array(z.string()),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export const NewCampaignModal: React.FC<NewCampaignModalProps> = ({ isOpen, onOpenChange }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const addCampaign = useStore(state => state.addCampaign);
  
  const [interestInput, setInterestInput] = useState('');

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      targetCountry: 'Brasil',
      targetAge: '18-65+',
      interests: [],
    },
  });

  const { formState: { errors, isValid }, trigger, control, watch, setValue, reset } = form;
  const interests = watch('interests');
  const nameValue = watch('name');

  const handleNext = async () => {
    const fields = steps[currentStep - 1].fields;
    const output = await trigger(fields as any, { shouldFocus: true });
    if (!output) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleAddInterest = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && interestInput.trim() !== '') {
      e.preventDefault();
      setValue('interests', [...(interests || []), interestInput.trim()]);
      setInterestInput('');
    }
  };

  const removeInterest = (indexToRemove: number) => {
    setValue('interests', interests.filter((_, index) => index !== indexToRemove));
  };

  const onSubmit = (data: CampaignFormData) => {
    setIsSaving(true);
    setTimeout(() => {
      const newCampaign: Omit<Campaign, 'id'> = {
        name: data.name,
        status: 'Pausada', // Default status for new campaigns
        platform: data.platform as Campaign['platform'],
        budgetSpent: 0,
        budgetTotal: data.totalBudget,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        startDate: data.dateRange.from.toISOString(),
        endDate: data.dateRange.to.toISOString(),
        ctr: 0,
        cpc: 0,
      };
      addCampaign(newCampaign);
      setIsSaving(false);
      onOpenChange(false);
      toast({
        title: "Campanha Criada com Sucesso!",
        description: `A campanha "${data.name}" foi salva e está pronta para ser lançada.`,
      });
    }, 1500);
  };
  
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        reset();
        setCurrentStep(1);
      }, 300);
    }
  }, [isOpen, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Campanha</DialogTitle>
          <DialogDescription>Siga os passos para configurar sua nova campanha de marketing.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between my-4 px-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center transition-colors', currentStep > step.id ? 'bg-primary text-primary-foreground' : currentStep === step.id ? 'bg-primary/20 border-2 border-primary text-primary' : 'bg-muted text-muted-foreground')}>
                  {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : <span className="font-bold">{step.id}</span>}
                </div>
                <p className={cn("text-xs mt-1", currentStep >= step.id ? "text-foreground" : "text-muted-foreground")}>{step.name}</p>
              </div>
              {index < steps.length - 1 && <div className="flex-1 h-0.5 bg-border" />}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4 min-h-[250px]">
            {currentStep === 1 && (
              <div className="grid gap-4 px-4">
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="name">Nome da Campanha</Label>
                    <span className="text-xs text-muted-foreground">{nameValue?.length || 0} / {MAX_NAME_CHARS}</span>
                  </div>
                  <Input id="name" {...form.register('name')} placeholder="Ex: Lançamento de Inverno" maxLength={MAX_NAME_CHARS} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <Controller name="objective" control={control} render={({ field }) => (
                  <div className="grid gap-2">
                    <Label>Objetivo</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Selecione um objetivo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conversions">Conversões</SelectItem>
                        <SelectItem value="traffic">Tráfego</SelectItem>
                        <SelectItem value="brand-awareness">Reconhecimento de Marca</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.objective && <p className="text-sm text-destructive">{errors.objective.message}</p>}
                  </div>
                )} />
                <Controller name="platform" control={control} render={({ field }) => (
                  <div className="grid gap-2">
                    <Label>Plataforma</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Selecione uma plataforma" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Google Ads">Google Ads</SelectItem>
                        <SelectItem value="Meta">Meta (Facebook/Instagram)</SelectItem>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.platform && <p className="text-sm text-destructive">{errors.platform.message}</p>}
                  </div>
                )} />
              </div>
            )}
            {currentStep === 2 && (
              <div className="grid gap-4 px-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="daily-budget">Orçamento Diário (R$)</Label>
                    <Input id="daily-budget" type="number" {...form.register('dailyBudget', { valueAsNumber: true })} placeholder="50.00" />
                    {errors.dailyBudget && <p className="text-sm text-destructive">{errors.dailyBudget.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="total-budget">Orçamento Total (R$)</Label>
                    <Input id="total-budget" type="number" {...form.register('totalBudget', { valueAsNumber: true })} placeholder="1000.00" />
                    {errors.totalBudget && <p className="text-sm text-destructive">{errors.totalBudget.message}</p>}
                  </div>
                </div>
                <Controller name="dateRange" control={control} render={({ field }) => (
                  <div className="grid gap-2">
                    <Label>Período da Campanha</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value?.from ? (field.value.to ? (<>{format(field.value.from, "LLL dd, y", { locale: ptBR })} - {format(field.value.to, "LLL dd, y", { locale: ptBR })}</>) : (format(field.value.from, "LLL dd, y", { locale: ptBR }))) : (<span>Escolha um período</span>)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="range" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                      </PopoverContent>
                    </Popover>
                    {errors.dateRange?.from && <p className="text-sm text-destructive">{errors.dateRange.from.message}</p>}
                  </div>
                )} />
              </div>
            )}
            {currentStep === 3 && (
              <div className="grid gap-4 px-4">
                <div className="grid grid-cols-2 gap-4">
                  <Controller name="targetCountry" control={control} render={({ field }) => (
                    <div className="grid gap-2">
                      <Label>País</Label>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Brasil">Brasil</SelectItem>
                          <SelectItem value="Portugal">Portugal</SelectItem>
                          <SelectItem value="EUA">Estados Unidos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )} />
                  <Controller name="targetAge" control={control} render={({ field }) => (
                    <div className="grid gap-2">
                      <Label>Idade</Label>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="18-24">18-24</SelectItem>
                          <SelectItem value="25-34">25-34</SelectItem>
                          <SelectItem value="35-44">35-44</SelectItem>
                          <SelectItem value="45+">45+</SelectItem>
                          <SelectItem value="18-65+">Todos (18-65+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="interests">Interesses</Label>
                  <Input id="interests" value={interestInput} onChange={e => setInterestInput(e.target.value)} onKeyDown={handleAddInterest} placeholder="Digite um interesse e pressione Enter" />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interests.map((interest, index) => (
                      <Badge key={index} variant="secondary" className="pr-1">
                        {interest}
                        <button onClick={() => removeInterest(index)} className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {currentStep === 4 && (
              <div className="space-y-4 px-4 text-sm">
                <h4 className="font-semibold text-base mb-2">Revise os detalhes da sua campanha</h4>
                <div className="p-4 rounded-lg border bg-muted/50 space-y-3">
                  <p><strong>Nome:</strong> {watch('name') || "Não definido"}</p>
                  <p><strong>Objetivo:</strong> {watch('objective') || "Não definido"}</p>
                  <p><strong>Plataforma:</strong> {watch('platform') || "Não definido"}</p>
                  <p><strong>Orçamento:</strong> R${watch('dailyBudget')} (diário) / R${watch('totalBudget')} (total)</p>
                  <p><strong>Período:</strong> {watch('dateRange.from') ? `${format(watch('dateRange.from'), "P", { locale: ptBR })} até ${watch('dateRange.to') ? format(watch('dateRange.to'), "P", { locale: ptBR }) : 'Indefinido'}` : "Não definido"}</p>
                  <p><strong>Público:</strong> {watch('targetCountry')}, {watch('targetAge')} anos</p>
                  <p><strong>Interesses:</strong> {watch('interests').join(', ') || "Nenhum"}</p>
                </div>
                <p className="text-xs text-muted-foreground">Ao clicar em "Salvar Campanha", você confirma que todos os detalhes estão corretos.</p>
              </div>
            )}
          </div>
        </form>

        <DialogFooter>
          {currentStep > 1 && <Button variant="outline" onClick={handleBack}>Voltar</Button>}
          {currentStep < steps.length && <Button onClick={handleNext}>Próximo</Button>}
          {currentStep === steps.length && (
            <Button onClick={form.handleSubmit(onSubmit)} loading={isSaving} disabled={!isValid}>
              Salvar Campanha
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
