import React from "react";
import { motion } from "framer-motion";
import { Routes, Route, NavLink } from "react-router-dom";
import { ProfileTab } from "./settings/ProfileTab";
import { SecurityTab } from "./settings/SecurityTab";
import { NotificationsTab } from "./settings/NotificationsTab";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  User,
  ShieldCheck,
  Bell,
  Settings as SettingsIcon,
} from "lucide-react";

const settingsNav = [
  {
    path: "",
    label: "Perfil",
    icon: User,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    path: "security",
    label: "Segurança",
    icon: ShieldCheck,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    path: "notifications",
    label: "Notificações",
    icon: Bell,
    gradient: "from-purple-500 to-pink-500",
  },
];

const SettingsPage: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20">
      <motion.div
        className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Configurações
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-14">
            Gerencie as configurações da sua conta e preferências
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col lg:flex-row gap-6"
        >
          {/* Navigation Sidebar */}
          <nav className="w-full lg:w-64 shrink-0">
            <div className="sticky top-6 space-y-2">
              {settingsNav.map((item, index) => {
                const targetPath = item.path
                  ? `/settings/${item.path}`
                  : "/settings";
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <NavLink
                      to={targetPath}
                      end={item.path === ""}
                      className={({ isActive }) =>
                        cn(
                          buttonVariants({ variant: "ghost", size: "default" }),
                          "w-full justify-start text-base h-12 relative overflow-hidden group transition-all duration-300",
                          isActive
                            ? "bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg font-semibold text-gray-900 dark:text-white border border-gray-200/50 dark:border-gray-700/50"
                            : "hover:bg-white/50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.div
                              layoutId="activeTab"
                              className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-10`}
                              transition={{ type: "spring", duration: 0.6 }}
                            />
                          )}
                          <div
                            className={cn(
                              "p-1.5 rounded-lg mr-3 transition-all duration-300",
                              isActive
                                ? `bg-gradient-to-br ${item.gradient} shadow-md`
                                : "bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600",
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-5 w-5 transition-colors",
                                isActive
                                  ? "text-white"
                                  : "text-gray-600 dark:text-gray-400",
                              )}
                            />
                          </div>
                          <span className="relative z-10">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </motion.div>
                );
              })}
            </div>
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Routes>
                <Route index element={<ProfileTab />} />
                <Route path="security" element={<SecurityTab />} />
                <Route path="notifications" element={<NotificationsTab />} />
              </Routes>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
