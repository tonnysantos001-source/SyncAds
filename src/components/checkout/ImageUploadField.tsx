import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Loader2, Image as ImageIcon, Check } from "lucide-react";
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
  acceptedFormats = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"],
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
      return `Formato não suportado. Use: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`;
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
        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {label}
        </Label>
      )}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
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
              <div
                className={cn(
                  "relative overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800",
                  aspectRatio && `aspect-${aspectRatio}`
                )}
              >
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />

                {/* Overlay com ações */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleClick}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Alterar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRemove}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                </div>

                {/* Badge de sucesso */}
                {value && !uploading && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
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
                "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                dragActive
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                  : "border-gray-300 dark:border-gray-600 hover:border-violet-400 hover:bg-gray-50 dark:hover:bg-gray-800/50",
                uploading && "pointer-events-none opacity-60"
              )}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enviando imagem...
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Aguarde enquanto fazemos o upload
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-500/20">
                    <ImageIcon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Clique para selecionar ou arraste aqui
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} até {maxSizeMB}MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClick();
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
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
