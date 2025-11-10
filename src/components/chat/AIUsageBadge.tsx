import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { IconSparkles, IconInfinity, IconAlertCircle } from "@tabler/icons-react";
import { canSendAiMessage } from "@/lib/plans/planLimits";
import { useAuthStore } from "@/store/authStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const AIUsageBadge: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [usageData, setUsageData] = useState<{
    current: number;
    limit: number;
    percentage: number;
    message: string;
    allowed: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUsage = async () => {
      try {
        const data = await canSendAiMessage(user.id);
        setUsageData(data);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar uso de IA:", error);
        setLoading(false);
      }
    };

    fetchUsage();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchUsage, 30000);

    return () => clearInterval(interval);
  }, [user]);

  if (loading || !usageData) {
    return null;
  }

  const getVariant = () => {
    if (usageData.limit === 0) return "default"; // Ilimitado
    if (usageData.percentage >= 100) return "destructive";
    if (usageData.percentage >= 80) return "destructive";
    if (usageData.percentage >= 50) return "secondary";
    return "default";
  };

  const getIcon = () => {
    if (usageData.limit === 0) {
      return <IconInfinity className="w-3 h-3" />;
    }
    if (usageData.percentage >= 80) {
      return <IconAlertCircle className="w-3 h-3" />;
    }
    return <IconSparkles className="w-3 h-3" />;
  };

  const getColor = () => {
    if (usageData.limit === 0) return "text-blue-500";
    if (usageData.percentage >= 100) return "text-red-500";
    if (usageData.percentage >= 80) return "text-orange-500";
    if (usageData.percentage >= 50) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={getVariant()}
            className={cn(
              "flex items-center gap-1.5 cursor-help transition-all",
              !usageData.allowed && "opacity-70"
            )}
          >
            <span className={getColor()}>{getIcon()}</span>
            {usageData.limit === 0 ? (
              <span className="text-xs font-medium">IA Ilimitada</span>
            ) : (
              <span className="text-xs font-medium">
                {usageData.current}/{usageData.limit}
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            <p className="font-semibold text-sm">{usageData.message}</p>
            {usageData.limit > 0 && (
              <>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      usageData.percentage >= 100
                        ? "bg-red-500"
                        : usageData.percentage >= 80
                        ? "bg-orange-500"
                        : usageData.percentage >= 50
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    )}
                    style={{ width: `${Math.min(usageData.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(usageData.percentage)}% utilizado
                </p>
              </>
            )}
            {usageData.limit === 0 && (
              <p className="text-xs text-muted-foreground">
                Seu plano permite mensagens ilimitadas com IA
              </p>
            )}
            {!usageData.allowed && (
              <p className="text-xs text-red-500 font-medium">
                Faça upgrade do plano para continuar
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
