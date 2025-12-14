import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStore } from "@/store/useStore";
import { useToast } from "@/components/ui/use-toast";
import { User, Mail, Upload, Sparkles } from "lucide-react";

export const ProfileTab: React.FC = () => {
  const user = useStore((state) => state.user);
  const updateUser = useStore((state) => state.updateUser);
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatarUrl || null,
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      updateUser({ name, email, avatarUrl: avatarPreview || user?.avatarUrl });
      setIsSaving(false);
      toast({
        title: "Perfil Atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    }, 1000);
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
    <motion.div initial="hidden" animate="visible" variants={itemVariants}>
      <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-500/5 dark:to-cyan-500/5">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md">
              <User className="h-5 w-5 text-white" />
            </div>
            Perfil
          </CardTitle>
          <CardDescription>
            Atualize seu avatar e detalhes do perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Avatar Section */}
          <motion.div
            className="flex flex-col sm:flex-row items-center gap-6"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="relative group"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-300 animate-pulse"></div>
              <Avatar className="relative h-24 w-24 border-4 border-white dark:border-gray-800 shadow-xl">
                <AvatarImage src={avatarPreview || user?.avatarUrl} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || "P"}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <div className="flex-1 w-full space-y-2">
              <Label
                htmlFor="picture"
                className="text-sm font-semibold flex items-center gap-2"
              >
                <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Avatar
              </Label>
              <div className="relative">
                <Input
                  id="picture"
                  type="file"
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-cyan-600 file:text-white hover:file:from-blue-600 hover:file:to-cyan-700 file:cursor-pointer"
                  onChange={handleAvatarChange}
                  accept="image/png, image/jpeg, image/gif"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                PNG, JPG, GIF até 10MB
              </p>
            </div>
          </motion.div>

          {/* Name Field */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label
              htmlFor="name"
              className="text-sm font-semibold flex items-center gap-2"
            >
              <div className="p-1 rounded bg-gradient-to-br from-blue-500 to-cyan-600">
                <User className="h-3 w-3 text-white" />
              </div>
              Nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/50 transition-all"
              placeholder="Seu nome completo"
            />
          </motion.div>

          {/* Email Field */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Label
              htmlFor="email"
              className="text-sm font-semibold flex items-center gap-2"
            >
              <div className="p-1 rounded bg-gradient-to-br from-cyan-500 to-blue-600">
                <Mail className="h-3 w-3 text-white" />
              </div>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-cyan-500/50 transition-all"
              placeholder="seu@email.com"
            />
          </motion.div>

          {/* Info Card */}
          <motion.div
            className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200/50 dark:border-blue-800/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                  Dica de Segurança
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use um email válido para recuperação de conta e notificações
                  importantes.
                </p>
              </div>
            </div>
          </motion.div>
        </CardContent>
        <CardFooter className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleSave}
              loading={isSaving}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

