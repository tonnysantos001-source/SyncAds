import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface AnimatedPieChartProps {
  data: DataPoint[];
  colors?: string[];
  showLegend?: boolean;
  showPercentage?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

const DEFAULT_COLORS = [
  "#ec4899", // Pink
  "#a855f7", // Purple
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white px-4 py-3 rounded-lg shadow-xl border-2 border-gray-100">
        <p className="text-sm font-semibold text-gray-900">{data.name}</p>
        <p className="text-lg font-bold text-pink-600 mt-1">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(data.value)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {data.payload.percentage?.toFixed(1)}% do total
        </p>
      </div>
    );
  }
  return null;
};

const CustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Não mostrar label para valores muito pequenos

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-bold drop-shadow-lg"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const AnimatedPieChart: React.FC<AnimatedPieChartProps> = ({
  data,
  colors = DEFAULT_COLORS,
  showLegend = true,
  showPercentage = true,
  innerRadius = 0,
  outerRadius = 100,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  // Calcular total e percentagens
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = data.map((item, index) => ({
    ...item,
    percentage: (item.value / total) * 100,
    color: item.color || colors[index % colors.length],
  }));

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div
            key={`legend-${index}`}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer ${
              activeIndex === index
                ? "bg-gray-100 scale-105 shadow-md"
                : "hover:bg-gray-50"
            }`}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(undefined)}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs font-medium text-gray-700">
              {entry.value}
            </span>
            <span className="text-xs font-bold text-gray-900">
              {dataWithPercentage[index]?.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataWithPercentage}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showPercentage ? CustomLabel : false}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {dataWithPercentage.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke={activeIndex === index ? "#fff" : "transparent"}
                strokeWidth={activeIndex === index ? 3 : 0}
                style={{
                  filter:
                    activeIndex === index
                      ? "drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
                      : "none",
                  transform:
                    activeIndex === index ? "scale(1.05)" : "scale(1)",
                  transformOrigin: "center",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend content={<CustomLegend />} />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnimatedPieChart;

