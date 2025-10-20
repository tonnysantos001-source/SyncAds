import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PixelPlatform {
  id: string;
  name: string;
  category: string;
  colorClass: string;
  hasButton?: boolean;
}

const PIXEL_PLATFORMS: PixelPlatform[] = [
  // Metas
  { id: 'facebook', name: 'Facebook', category: 'METAS', colorClass: 'bg-blue-600' },
  { id: 'tiktok', name: 'TikTok', category: 'METAS', colorClass: 'bg-gray-900' },
  { id: 'facebook-2', name: 'Facebook', category: 'METAS', colorClass: 'bg-blue-600', hasButton: true },
  { id: 'whatsapp', name: 'WhatsApp', category: 'METAS', colorClass: 'bg-green-500' },
  { id: 'linktree', name: 'Linktree', category: 'METAS', colorClass: 'bg-green-600' },
  { id: 'linkedin', name: 'LinkedIn', category: 'METAS', colorClass: 'bg-blue-700' },
  
  // Gtag
  { id: 'google-analytics', name: 'Google Analytics', category: 'GTAG', colorClass: 'bg-orange-500' },
  { id: 'google-ads', name: 'Google Ads', category: 'GTAG', colorClass: 'bg-yellow-500' },
  { id: 'snapchat', name: 'Snapchat', category: 'GTAG', colorClass: 'bg-yellow-400' },
  { id: 'taboola', name: 'Taboola', category: 'GTAG', colorClass: 'bg-orange-600', hasButton: true },
  { id: 'twitter', name: 'Twitter', category: 'GTAG', colorClass: 'bg-blue-400' },
  { id: 'pinterest', name: 'Pinterest', category: 'GTAG', colorClass: 'bg-red-600' },
  { id: 'hotjar', name: 'Hotjar', category: 'GTAG', colorClass: 'bg-orange-500' },
  { id: 'criteo', name: 'Criteo', category: 'GTAG', colorClass: 'bg-orange-600' },
  
  // Clarity
  { id: 'clarity-microsoft', name: 'Clarity (Microsoft)', category: 'CLARITY', colorClass: 'bg-blue-500', hasButton: true },
  { id: 'taboola-2', name: 'Taboola', category: 'CLARITY', colorClass: 'bg-orange-600' },
  { id: 'criteo-2', name: 'Criteo', category: 'CLARITY', colorClass: 'bg-orange-600' },
  
  // Others
  { id: 'outbrain-amplify', name: 'Outbrain Amplify', category: 'OTHERS', colorClass: 'bg-orange-400', hasButton: true },
  { id: 'taboola-3', name: 'Taboola', category: 'OTHERS', colorClass: 'bg-orange-600' },
  { id: 'criteo-3', name: 'Criteo', category: 'OTHERS', colorClass: 'bg-orange-600' },
  { id: 'kwai', name: 'Kwai', category: 'OTHERS', colorClass: 'bg-green-400' },
  { id: 'microsoft-clarity', name: 'Microsoft Clarity', category: 'OTHERS', colorClass: 'bg-purple-600' },
];

const PixelsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['METAS', 'GTAG', 'CLARITY', 'OTHERS'];

  const getPixelsByCategory = (category: string) => {
    return PIXEL_PLATFORMS.filter(
      (pixel) =>
        pixel.category === category &&
        pixel.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">PIXELS</h1>
        <p className="text-gray-600 mt-2">
          Gerencie seus pixels de rastreamento de diferentes plataformas.
        </p>
      </div>

      {/* Barra de busca */}
      <div className="flex gap-4">
        <Input
          type="text"
          placeholder="Buscar pixel..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Lista de Pixels por Categoria */}
      {categories.map((category) => {
        const pixels = getPixelsByCategory(category);
        if (pixels.length === 0) return null;

        return (
          <div key={category}>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">{category}</h2>
            <div className="space-y-3">
              {pixels.map((pixel) => (
                <Card key={pixel.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Logo do Pixel */}
                        <div className={`w-12 h-12 rounded ${pixel.colorClass} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-bold text-lg">
                            {pixel.name.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{pixel.name}</h3>
                          <p className="text-xs text-gray-500">
                            Adicione o pixel {pixel.name} para rastreamento
                          </p>
                        </div>
                      </div>

                      {/* Botão de Adicionar */}
                      {pixel.hasButton && (
                        <Button
                          size="sm"
                          className="bg-pink-600 hover:bg-pink-700 text-white text-xs"
                        >
                          CADASTRAR PIXEL
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PixelsPage;
