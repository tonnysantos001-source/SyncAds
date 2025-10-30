import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface GatewayCardProps {
  id: string;
  name: string;
  slug: string;
  logo: string;
  type: 'nacional' | 'global' | 'both';
  status: 'active' | 'inactive';
  onClick?: () => void;
}

export const GatewayCard: React.FC<GatewayCardProps> = ({
  id,
  name,
  slug,
  logo,
  type,
  status,
  onClick,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/checkout/gateways/${slug}`);
    }
  };

  return (
    <Card
      className="relative cursor-pointer transition-all hover:shadow-lg hover:border-pink-300 dark:hover:border-pink-700"
      onClick={handleClick}
    >
      <CardContent className="p-6">
        {/* Status Indicator (Bolinha) - Top Right */}
        <div className="absolute top-4 right-4">
          <div
            className={cn(
              'h-3 w-3 rounded-full',
              status === 'active' ? 'bg-green-500' : 'bg-red-500'
            )}
            title={status === 'active' ? 'Ativo' : 'Inativo'}
          />
        </div>

        {/* Gateway Logo and Name */}
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden p-2">
            <img
              src={logo}
              alt={`${name} logo`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                // Fallback se a imagem não carregar
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `
                  <div class="text-2xl font-bold text-gray-400">${name.charAt(0)}</div>
                `;
              }}
            />
          </div>

          {/* Name and Badges */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2 truncate">
              {name}
            </h3>

            {/* Type Badges */}
            <div className="flex gap-2 flex-wrap">
              {(type === 'nacional' || type === 'both') && (
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs"
                >
                  Nacional
                </Badge>
              )}
              {(type === 'global' || type === 'both') && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs"
                >
                  Global
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GatewayCard;

