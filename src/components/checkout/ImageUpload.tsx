import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  Link,
  Check,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  description?: string;
  bucket?: string;
  path?: string;
  aspectRatio?: string;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  showUrlInput?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = "Imagem",
  description,
  bucket = "checkout-images",
  path = "uploads",
  aspectRatio = "auto",
  maxSizeMB = 5,
  acceptedFormats = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ],
  showUrlInput = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(value || "");
  const [showUrlMode, setShowUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState(value || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Validar arquivo
  const validateFile = (file: File): boolean => {
    if (!acceptedFormats.includes(file.type)) {
      toast({
        title: "Formato não suportado",
        description: `Use apenas: ${acceptedFormats.map((f) => f.split("/")[1]).join(", ")}`,
        variant: "destructive",
      });
      return false;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        title: "Arquivo muito grande",
        description: `O tamanho máximo é ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Upload para Supabase Storage
  const uploadToStorage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Gerar nome único
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split(".").pop();
      const fileName = `${timestamp}-${randomString}.${extension}`;
      const filePath = `${path}/${fileName}`;

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Upload
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        throw error;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error("Não foi possível obter a URL pública");
      }

      toast({
        title: "Upload concluído!",
        description: "Imagem enviada com sucesso",
      });

      return urlData.publicUrl;
    } catch (error: any) {
      console.error("Erro no upload:", error);
      toast({
        title: "Erro no upload",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Processar arquivo selecionado
  const handleFile = async (file: File) => {
    if (!validateFile(file)) return;

    // Criar preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    const url = await uploadToStorage(file);
    if (url) {
      onChange(url);
      setPreviewUrl(url);
    }
  };

  // Drag and Drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await handleFile(files[0]);
      }
    },
    [handleFile],
  );

  // Paste do clipboard - APENAS dentro da área do componente
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await handleFile(file);
            break;
          }
        }
      }
    },
    [handleFile],
  );

  // Selecionar arquivo
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  };

  // Aplicar URL manualmente
  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setPreviewUrl(urlInput.trim());
      setShowUrlMode(false);
      toast({
        title: "URL aplicada",
        description: "Imagem carregada com sucesso",
      });
    }
  };

  // Remover imagem
  const handleRemove = () => {
    setPreviewUrl("");
    setUrlInput("");
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <div>
          <Label className="text-xs font-medium">{label}</Label>
          {description && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Preview da Imagem */}
      {previewUrl ? (
        <div className="relative group">
          <div
            className="relative rounded-md overflow-hidden border border-gray-300 bg-gray-50"
            style={{ aspectRatio, maxHeight: "80px" }}
          >
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1" />
                  <p className="text-xs font-medium">{uploadProgress}%</p>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleRemove}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md opacity-0 group-hover:opacity-100"
            disabled={isUploading}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <>
          {/* Área de Upload */}
          {!showUrlMode ? (
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onPaste={handlePaste}
              onClick={() => fileInputRef.current?.click()}
              tabIndex={0}
              className={cn(
                "border-2 border-dashed rounded-md p-3 text-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats.join(",")}
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />

              {isUploading ? (
                <div className="space-y-1.5">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Enviando...</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{uploadProgress}%</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="mx-auto w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-gray-700">
                      Clique ou arraste
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Max: {maxSizeMB}MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Modo URL */
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 text-sm h-8"
                />
                <Button onClick={handleUrlSubmit} size="sm" className="h-8">
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Toggle URL / Upload */}
          {showUrlInput && (
            <div className="flex items-center justify-center mt-2">
              <button
                onClick={() => setShowUrlMode(!showUrlMode)}
                className="text-xs text-gray-500 hover:text-gray-700 underline flex items-center gap-1"
              >
                {showUrlMode ? (
                  <>
                    <ImageIcon className="h-3 w-3" />
                    Upload
                  </>
                ) : (
                  <>
                    <Link className="h-3 w-3" />
                    URL
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImageUpload;

