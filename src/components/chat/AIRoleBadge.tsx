import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Globe, Sparkles } from "lucide-react";

export type AIRole = "REASONING" | "EXECUTOR" | "NAVIGATOR" | "GENERAL";

interface AIRoleBadgeProps {
    role: AIRole;
    size?: "sm" | "md" | "lg";
    showIcon?: boolean;
    className?: string;
}

const roleConfig = {
    REASONING: {
        label: "Raciocínio",
        icon: Brain,
        gradient: "from-purple-500 to-indigo-500",
        bgColor: "bg-purple-500/20",
        textColor: "text-purple-300",
        borderColor: "border-purple-500/30",
    },
    EXECUTOR: {
        label: "Executora",
        icon: Zap,
        gradient: "from-orange-500 to-red-500",
        bgColor: "bg-orange-500/20",
        textColor: "text-orange-300",
        borderColor: "border-orange-500/30",
    },
    NAVIGATOR: {
        label: "Navegação",
        icon: Globe,
        gradient: "from-blue-500 to-cyan-500",
        bgColor: "bg-blue-500/20",
        textColor: "text-blue-300",
        borderColor: "border-blue-500/30",
    },
    GENERAL: {
        label: "Geral",
        icon: Sparkles,
        gradient: "from-gray-500 to-gray-600",
        bgColor: "bg-gray-500/20",
        textColor: "text-gray-300",
        borderColor: "border-gray-500/30",
    },
};

const sizeConfig = {
    sm: {
        badge: "px-2 py-0.5 text-xs",
        icon: "w-3 h-3",
    },
    md: {
        badge: "px-3 py-1 text-sm",
        icon: "w-4 h-4",
    },
    lg: {
        badge: "px-4 py-1.5 text-base",
        icon: "w-5 h-5",
    },
};

export const AIRoleBadge: React.FC<AIRoleBadgeProps> = ({
    role,
    size = "md",
    showIcon = true,
    className,
}) => {
    const config = roleConfig[role];
    const sizeClass = sizeConfig[size];
    const Icon = config.icon;

    return (
        <Badge
            variant="outline"
            className={cn(
                "gap-1.5 font-medium border",
                config.bgColor,
                config.textColor,
                config.borderColor,
                sizeClass.badge,
                className
            )}
        >
            {showIcon && <Icon className={sizeClass.icon} />}
            {config.label}
        </Badge>
    );
};

export default AIRoleBadge;
