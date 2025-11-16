import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Chrome, Loader2 } from "lucide-react";

export default function ExtensionSetupPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar automaticamente para /app após 1 segundo
    const timer = setTimeout(() => {
      navigate("/app");
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 mb-6">
          <Chrome className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Extensão SyncAds AI
        </h1>

        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Redirecionando para o painel...
        </p>

        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
      </motion.div>
    </div>
  );
}
