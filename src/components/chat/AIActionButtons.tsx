import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ExternalLink, Key, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

type AIActionButtonsProps = {
  action: {
    type: 'oauth' | 'credentials' | 'confirmation';
    url?: string;
    platform?: string;
    fields?: Array<{ name: string; type: string; label: string; placeholder?: string }>;
    message?: string;
  };
  onComplete: (data?: any) => void;
  onCancel?: () => void;
};

export const AIActionButtons: React.FC<AIActionButtonsProps> = ({ action, onComplete, onCancel }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OAuth Button
  if (action.type === 'oauth' && action.url) {
    const handleOAuth = () => {
      // Abrir popup OAuth
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        action.url,
        'oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listener para quando popup fechar
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          onComplete({ connected: true });
        }
      }, 500);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 mt-2"
      >
        <Button
          onClick={handleOAuth}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          size="sm"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Conectar com {action.platform || 'Plataforma'}
        </Button>
        {onCancel && (
          <Button onClick={onCancel} variant="outline" size="sm">
            Cancelar
          </Button>
        )}
      </motion.div>
    );
  }

  // Credentials Modal
  if (action.type === 'credentials' && action.fields) {
    const handleSubmit = async () => {
      setIsSubmitting(true);
      
      // Simular envio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onComplete(formData);
      setIsModalOpen(false);
      setIsSubmitting(false);
    };

    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mt-2"
        >
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
            size="sm"
          >
            <Key className="h-4 w-4 mr-2" />
            Fornecer Credenciais
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="outline" size="sm">
              Cancelar
            </Button>
          )}
        </motion.div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Credenciais {action.platform}</DialogTitle>
              <DialogDescription>
                {action.message || 'Forneça as credenciais necessárias para conectar'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {action.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.name]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  onCancel?.();
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-600 to-emerald-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Conectar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Confirmation Button
  if (action.type === 'confirmation') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 mt-2"
      >
        <Button
          onClick={() => onComplete({ confirmed: true })}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          size="sm"
        >
          <Check className="h-4 w-4 mr-2" />
          Confirmar
        </Button>
        {onCancel && (
          <Button onClick={onCancel} variant="outline" size="sm">
            Cancelar
          </Button>
        )}
      </motion.div>
    );
  }

  return null;
};

