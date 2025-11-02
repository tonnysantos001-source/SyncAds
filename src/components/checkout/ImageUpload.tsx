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

  // Paste do clipboard
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
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

  // Registrar event listener para paste
  React.useEffect(() => {
    document.addEventListener("paste", handlePaste as any);
    return () => {
      document.removeEventListener("paste", handlePaste as any);
    };
  }, [handlePaste]);

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
          <Label className="text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}

      {/* Preview da Imagem */}
      {previewUrl ? (
        <div className="relative group">
          <div
            className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50"
            style={{ aspectRatio }}
          >
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm font-medium">{uploadProgress}%</p>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
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
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
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
                <div className="space-y-3">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Enviando imagem...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{uploadProgress}%</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">
                      Arraste uma imagem ou clique para selecionar
                    </p>
                    <p className="text-xs text-gray-500">
                      Ou cole (Ctrl+V) uma imagem da área de transferência
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Formatos: JPG, PNG, WEBP, GIF • Máx: {maxSizeMB}MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Modo URL */
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleUrlSubmit} size="sm">
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Toggle URL / Upload */}
          {showUrlInput && (
            <div className="flex items-center justify-center">
              <button
                onClick={() => setShowUrlMode(!showUrlMode)}
                className="text-xs text-gray-500 hover:text-gray-700 underline flex items-center gap-1"
              >
                {showUrlMode ? (
                  <>
                    <ImageIcon className="h-3 w-3" />
                    Voltar para upload
                  </>
                ) : (
                  <>
                    <Link className="h-3 w-3" />
                    Usar URL da imagem
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
