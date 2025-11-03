import React, { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface LiveSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  showTrend?: boolean;
  animate?: boolean;
  maxPoints?: number;
}

export const LiveSparkline: React.FC<LiveSparklineProps> = ({
  data,
  color,
  height = 60,
  showTrend = true,
  animate = true,
  maxPoints = 20,
}) => {
  const [animatedData, setAnimatedData] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!animate) {
      setAnimatedData(data);
      return;
    }

    setIsAnimating(true);
    const limitedData = data.slice(-maxPoints);

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= limitedData.length) {
        setAnimatedData(limitedData.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsAnimating(false);
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [data, animate, maxPoints]);

  // Calcular tendência
  const trend = data.length >= 2 ? data[data.length - 1] - data[0] : 0;
  const isPositive = trend >= 0;

  // Determinar cor baseado na tendência
  const lineColor = color || (isPositive ? "#10b981" : "#ef4444");

  // Formatar dados para o gráfico
  const chartData = animatedData.map((value, index) => ({
    index,
    value,
  }));

  // Calcular min e max para escala
  const minValue = Math.min(...animatedData);
  const maxValue = Math.max(...animatedData);
  const padding = (maxValue - minValue) * 0.1;

  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      {/* Indicador de tendência */}
      {showTrend && data.length > 0 && (
        <div
          className={`absolute top-0 right-0 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold z-10 ${
            isPositive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {Math.abs(trend).toFixed(1)}
        </div>
      )}

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <defs>
            <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            fill="url(#sparklineGradient)"
            isAnimationActive={animate}
            animationDuration={800}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Efeito de brilho animado */}
      {isAnimating && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${lineColor}20, transparent)`,
            animation: "shimmer 1.5s infinite",
          }}
        />
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default LiveSparkline;
