import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Completado', value: 450 },
  { name: 'Restante', value: 550 },
];
const COLORS = ['#3B82F6', 'hsl(var(--muted))'];

export const ConversionGoalsCard: React.FC = () => {
  const percentage = (data[0].value / (data[0].value + data[1].value)) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metas de Conversão</CardTitle>
        <CardDescription>Meta mensal de 1.000 conversões.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="h-40 w-40 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))"
                }}
              />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={450}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-3xl font-bold">{percentage.toFixed(0)}%</span>
            <span className="text-sm text-muted-foreground">atingido</span>
          </div>
        </div>
        <div className="mt-4 text-center">
            <p className="text-lg font-semibold">{data[0].value} / {data[0].value + data[1].value}</p>
            <p className="text-sm text-muted-foreground">Conversões este mês</p>
        </div>
      </CardContent>
    </Card>
  );
};
