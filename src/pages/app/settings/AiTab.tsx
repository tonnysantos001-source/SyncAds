import React from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Brain, MessageSquare } from "lucide-react";
import { AiPersonalityTab } from "./AiPersonalityTab";
import { AiGreetingsTab } from "./AiGreetingsTab";

const aiSubNav = [
  { path: "", label: "Personalidade", icon: Brain },
  { path: "greetings", label: "Falas Iniciais", icon: MessageSquare },
];

export const AiTab: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-6 space-y-6">
      <div>
        <h2 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Configurações de IA
        </h2>
        <p className="text-gray-600 font-medium">
          Personalize o comportamento e as mensagens do seu assistente de IA.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Submenu */}
        <nav className="flex flex-row md:flex-col w-full md:w-48 shrink-0 gap-2 overflow-x-auto">
          {aiSubNav.map((item) => {
            const targetPath = item.path
              ? `/settings/ai/${item.path}`
              : "/settings/ai";
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={targetPath}
                end={item.path === ""}
                className={({ isActive }) =>
                  cn(
                    buttonVariants({ variant: "ghost", size: "default" }),
                    "w-full justify-start text-sm h-10 whitespace-nowrap",
                    isActive
                      ? "bg-muted hover:bg-muted font-semibold text-primary"
                      : "hover:bg-muted/50 text-muted-foreground",
                  )
                }
              >
                <Icon className="mr-3 h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Content Area */}
        <div className="flex-1">
          <Routes>
            <Route index element={<AiPersonalityTab />} />
            <Route path="greetings" element={<AiGreetingsTab />} />
            <Route path="*" element={<Navigate to="/settings/ai" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};
