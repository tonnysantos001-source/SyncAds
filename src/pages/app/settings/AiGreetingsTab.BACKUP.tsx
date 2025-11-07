import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useStore } from '@/store/useStore';
import Textarea from 'react-textarea-autosize';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Save, Sparkles } from 'lucide-react';

const MAX_CHARS = 500;

export const AiGreetingsTab: React.FC = () => {
  const { toast } = useToast();
  const aiInitialGreetings = useStore(state => state.aiInitialGreetings);
  const setAiInitialGreetings = useStore(state => state.setAiInitialGreetings);
  const addAiGreeting = useStore(state => state.addAiGreeting);
  const removeAiGreeting = useStore(state => state.removeAiGreeting);
  const updateAiGreeting = useStore(state => state.updateAiGreeting);
  
  const [greetings, setGreetings] = useState(aiInitialGreetings);
  const [newGreeting, setNewGreeting] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setAiInitialGreetings(greetings);
      setIsSaving(false);
      toast({
        title: "Falas Iniciais Atualizadas!",
        description: "As mensagens de boas-vindas foram salvas com sucesso.",
      });
    }, 800);
  };

  const handleAddGreeting = () => {
    if (newGreeting.trim() && newGreeting.length <= MAX_CHARS) {
      setGreetings([...greetings, newGreeting.trim()]);
      setNewGreeting('');
      toast({
        title: "Fala adicionada!",
        description: "Nova mensagem de boas-vindas adicionada.",
      });
    }
  };

  const handleRemoveGreeting = (index: number) => {
    if (greetings.length > 1) {
      setGreetings(greetings.filter((_, i) => i !== index));
      toast({
        title: "Fala removida",
        description: "Mensagem de boas-vindas removida.",
      });
    } else {
      toast({
        title: "Não é possível remover",
        description: "Mantenha pelo menos uma mensagem de boas-vindas.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateGreeting = (index: number, value: string) => {
    const newGreetings = [...greetings];
    newGreetings[index] = value;
    setGreetings(newGreetings);
  };

  const getRandomGreeting = () => {
    if (greetings.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * greetings.length);
    return greetings[randomIndex];
  };

  return (
    <div className="space-y-6">
      {/* Card de Explicação */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Como Funciona</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            As <strong>Falas Iniciais</strong> são mensagens que a IA envia automaticamente quando o usuário:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-2">
            <li>Abre uma nova conversa</li>
            <li>Inicia o chat pela primeira vez</li>
            <li>Retorna após um período de inatividade</li>
          </ul>
          <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-lg border">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">EXEMPLO DE USO:</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
              "{getRandomGreeting()}"
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            💡 <strong>Dica:</strong> A IA escolhe aleatoriamente uma das falas cadastradas para variar a experiência do usuário.
          </p>
        </CardContent>
      </Card>

      {/* Lista de Falas Existentes */}
      <Card>
        <CardHeader>
          <CardTitle>Falas Cadastradas</CardTitle>
          <CardDescription>
            Gerencie as mensagens de boas-vindas que a IA usará. Pelo menos uma fala deve estar cadastrada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {greetings.map((greeting, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Label htmlFor={`greeting-${index}`} className="text-sm font-medium">
                  Fala #{index + 1}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveGreeting(index)}
                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  disabled={greetings.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                id={`greeting-${index}`}
                value={greeting}
                onChange={(e) => handleUpdateGreeting(index, e.target.value)}
                placeholder="Digite uma mensagem de boas-vindas..."
                className="w-full resize-none rounded-lg border bg-background p-3 text-sm"
                minRows={2}
                maxRows={5}
                maxLength={MAX_CHARS}
              />
              <div className="flex justify-end">
                <p className={cn(
                  "text-xs",
                  greeting.length > MAX_CHARS ? "text-destructive" : "text-muted-foreground"
                )}>
                  {greeting.length} / {MAX_CHARS}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Adicionar Nova Fala */}
      <Card className="border-green-200 dark:border-green-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-600" />
            <CardTitle>Adicionar Nova Fala</CardTitle>
          </div>
          <CardDescription>
            Crie uma nova mensagem de boas-vindas para diversificar as interações.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-greeting">Nova Mensagem</Label>
            <Textarea
              id="new-greeting"
              value={newGreeting}
              onChange={(e) => setNewGreeting(e.target.value)}
              placeholder="Ex: Olá! 👋 Como posso ajudar você hoje?"
              className="w-full resize-none rounded-lg border bg-background p-3 text-sm"
              minRows={3}
              maxRows={5}
              maxLength={MAX_CHARS}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                💡 Use emojis e seja acolhedor para criar uma boa primeira impressão!
              </p>
              <p className={cn(
                "text-xs",
                newGreeting.length > MAX_CHARS ? "text-destructive" : "text-muted-foreground"
              )}>
                {newGreeting.length} / {MAX_CHARS}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button
            onClick={handleAddGreeting}
            disabled={!newGreeting.trim() || newGreeting.length > MAX_CHARS}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Fala
          </Button>
        </CardFooter>
      </Card>

      {/* Botão de Salvar Geral */}
      <Card>
        <CardFooter className="pt-6">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              Total de {greetings.length} {greetings.length === 1 ? 'fala' : 'falas'} cadastrada{greetings.length === 1 ? '' : 's'}
            </p>
            <Button onClick={handleSave} disabled={isSaving || greetings.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar Todas as Alterações'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
