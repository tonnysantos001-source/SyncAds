import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { aiSuggestions } from '@/data/mocks';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const AiSuggestionsCard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sugestões da IA</CardTitle>
        <CardDescription>Otimizações recomendadas para suas campanhas.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {aiSuggestions.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <li key={suggestion.id} className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground flex-1">{suggestion.text}</p>
              </li>
            );
          })}
        </ul>
        <Button variant="outline" className="w-full mt-6">
            Ver todas as sugestões <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
