import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface ImageUploadFieldProps {
  label: string;
  description?: string;
  value?: string;
  onChange: (url: string) => void;
  bucket?: string;
  path?: string;
  acceptedFormats?: string[];
  maxSizeMB?: number;
  aspectRatio?: string;
  className?: string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  description,
  value,
  onChange,
  bucket = "checkout-images",
  path = "uploads",
  acceptedFormats = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
  ],
  maxSizeMB = 5,
  aspectRatio,
  className,
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    // Validar tipo
    if (!acceptedFormats.includes(file.type)) {
      return `Formato não suportado. Use: ${acceptedFormats.map((f) => f.split("/")[1]).join(", ")}`;
    }

    // Validar tamanho
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`;
    }

    return null;
  };

  const uploadToSupabase = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(uploadError.message);
      }

      // Obter URL pública
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading to Supabase:", error);
      return null;
    }
  };

  const handleFileSelect = async (file: File) => {
    // Validar arquivo
    const error = validateFile(file);
    if (error) {
      toast({
        title: "Erro na validação",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Criar preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload para Supabase
      const url = await uploadToSupabase(file);

      if (url) {
        onChange(url);
        toast({
          title: "Imagem enviada!",
          description: "A imagem foi carregada com sucesso.",
        });
      } else {
        throw new Error("Falha no upload");
      }
    } catch (error) {
      console.error("Error handling file:", error);
      toast({
        title: "Erro ao enviar imagem",
        description: "Não foi possível fazer o upload. Tente novamente.",
        variant: "destructive",
      });
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <div className="p-1 rounded bg-gradient-to-br from-violet-500 to-purple-600">
            <ImageIcon className="h-3 w-3 text-white" />
          </div>
          {label}
        </Label>
      )}
      {description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          {description}
        </p>
      )}

      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(",")}
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative group"
            >
              <div className="relative overflow-hidden rounded-xl border-2 border-violet-200/50 dark:border-violet-800/50 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-2 shadow-lg">
                {/* Container de imagem com altura fixa */}
                <div className="relative w-full h-16 rounded-lg overflow-hidden bg-white dark:bg-gray-950">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Overlay com ações */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center p-3 gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleClick}
                    disabled={uploading}
                    className="bg-white/90 hover:bg-white text-gray-900 backdrop-blur-sm shadow-lg"
                  >
                    <Upload className="h-3 w-3 mr-1.5" />
                    Alterar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRemove}
                    disabled={uploading}
                    className="bg-red-500/90 hover:bg-red-600 backdrop-blur-sm shadow-lg"
                  >
                    <X className="h-3 w-3 mr-1.5" />
                    Remover
                  </Button>
                </div>

                {/* Badge de sucesso */}
                {value && !uploading && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3"
                  >
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-1.5 rounded-full shadow-lg">
                      <Check className="h-3 w-3" />
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={handleClick}
              className={cn(
                "relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300",
                dragActive
                  ? "border-violet-500 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 shadow-lg shadow-violet-500/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-violet-400 dark:hover:border-violet-500 bg-white/50 dark:bg-gray-800/50 hover:bg-gradient-to-br hover:from-violet-50 hover:to-purple-50 dark:hover:from-violet-950/20 dark:hover:to-purple-950/20 backdrop-blur-sm",
                uploading && "pointer-events-none opacity-60",
              )}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2.5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse" />
                    <Loader2 className="relative h-8 w-8 text-violet-600 dark:text-violet-400 animate-spin" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Enviando imagem...
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Aguarde enquanto fazemos o upload
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full blur-xl opacity-30" />
                    <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                      <ImageIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                      Clique ou arraste aqui
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {acceptedFormats
                        .map((f) => f.split("/")[1].toUpperCase())
                        .join(", ")}{" "}
                      • até {maxSizeMB}MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-1 border-violet-300 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-600 dark:hover:text-violet-400 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClick();
                    }}
                  >
                    <Upload className="h-3 w-3 mr-1.5" />
                    Escolher arquivo
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
