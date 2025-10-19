import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { chartData } from '@/data/mocks';

export const DashboardChart: React.FC = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis 
          dataKey="name" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value / 1000}k`}
        />
        <Tooltip 
          cursor={{stroke: 'hsl(var(--border))', strokeWidth: 2, strokeDasharray: '3 3'}}
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)"
          }}
        />
        <Legend
          iconType="circle"
          iconSize={10}
        />
        <Line
          type="monotone"
          dataKey="Cliques"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone"
          dataKey="Conversoes" 
          stroke="#8B5CF6"
          strokeWidth={2}
          dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
