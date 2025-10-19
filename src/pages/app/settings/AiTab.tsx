import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useStore } from '@/store/useStore';
import Textarea from 'react-textarea-autosize';
import { cn } from '@/lib/utils';

const MAX_CHARS = 2000;

export const AiTab: React.FC = () => {
  const { toast } = useToast();
  const aiSystemPrompt = useStore(state => state.aiSystemPrompt);
  const setAiSystemPrompt = useStore(state => state.setAiSystemPrompt);
  
  const [prompt, setPrompt] = useState(aiSystemPrompt);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setAiSystemPrompt(prompt);
      setIsSaving(false);
      toast({
        title: "Prompt da IA Atualizado!",
        description: "As novas instruções foram salvas com sucesso.",
        variant: "success",
      });
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalidade da IA</CardTitle>
        <CardDescription>
          Defina as instruções, capacidades e o comportamento do seu assistente de IA. Este é o prompt de sistema principal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="ai-prompt">Prompt do Sistema</Label>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Você é um assistente de marketing prestativo e criativo..."
            className="w-full resize-none rounded-lg border bg-background p-2 min-h-[200px] text-sm font-mono"
            minRows={10}
            maxLength={MAX_CHARS}
          />
           <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Use esta área para dar instruções detalhadas sobre o tom, estilo de resposta e funcionalidades da IA.</p>
            <p className={cn("text-xs", prompt.length > MAX_CHARS ? "text-destructive" : "text-muted-foreground")}>
                {prompt.length} / {MAX_CHARS}
            </p>
           </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSave} loading={isSaving}>
          Salvar Instruções
        </Button>
      </CardFooter>
    </Card>
  );
};
