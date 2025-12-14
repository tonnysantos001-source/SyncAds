import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VirtualizedTable, VirtualizedTableColumn } from '@/components/ui/VirtualizedTable';
import { Edit, Trash2, Eye, Package } from 'lucide-react';
import { Product } from '@/hooks/useProducts';

// ============================================================================
// TYPES
// ============================================================================

export interface VirtualizedProductsTableProps {
  /**
   * Array of products to display
   */
  products: Product[];

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Table height
   */
  height?: string | number;

  /**
   * On edit product
   */
  onEdit?: (product: Product) => void;

  /**
   * On delete product
   */
  onDelete?: (productId: string) => void;

  /**
   * On view product
   */
  onView?: (product: Product) => void;

  /**
   * Enable actions column
   */
  showActions?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getStatusBadge(status: string) {
  const variants: Record<string, { label: string; variant: any }> = {
    ACTIVE: { label: 'Ativo', variant: 'default' },
    DRAFT: { label: 'Rascunho', variant: 'secondary' },
    ARCHIVED: { label: 'Arquivado', variant: 'outline' },
  };

  const config = variants[status] || variants.ACTIVE;

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}

function getStockBadge(stock: number) {
  if (stock === 0) {
    return <Badge variant="destructive">Esgotado</Badge>;
  }
  if (stock < 10) {
    return <Badge variant="secondary">{stock} un.</Badge>;
  }
  return <Badge variant="default">{stock} un.</Badge>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VirtualizedProductsTable({
  products,
  isLoading = false,
  height = 600,
  onEdit,
  onDelete,
  onView,
  showActions = true,
}: VirtualizedProductsTableProps) {
  // Define columns
  const columns: VirtualizedTableColumn<Product>[] = [
    // Image column
    {
      header: 'Imagem',
      width: '80px',
      accessor: (product) => {
        const imageUrl = product.imageUrl || (product as any).metadata?.images?.[0];

        if (imageUrl) {
          return (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-12 h-12 object-cover rounded-md border"
            />
          );
        }

        return (
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-md flex items-center justify-center">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
        );
      },
    },

    // Product name column
    {
      header: 'Produto',
      accessor: (product) => (
        <div>
          <div className="font-medium dark:text-white line-clamp-1">
            {product.name}
          </div>
          {product.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {product.description}
            </div>
          )}
        </div>
      ),
      width: '35%',
    },

    // SKU column
    {
      header: 'SKU',
      accessor: (product) => (
        <code className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-2 py-1 rounded dark:text-gray-300">
          {product.sku || 'N/A'}
        </code>
      ),
      width: '120px',
    },

    // Price column
    {
      header: 'Preço',
      accessor: (product) => (
        <div>
          <div className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {formatCurrency(product.price)}
          </div>
          {product.comparePrice && product.comparePrice > product.price && (
            <div className="text-xs text-muted-foreground line-through">
              {formatCurrency(product.comparePrice)}
            </div>
          )}
        </div>
      ),
      width: '120px',
    },

    // Stock column
    {
      header: 'Estoque',
      accessor: (product) => getStockBadge(product.stock),
      width: '120px',
      align: 'center',
    },

    // Status column
    {
      header: 'Status',
      accessor: (product) => getStatusBadge(product.status),
      width: '120px',
      align: 'center',
    },
  ];

  // Add actions column if enabled
  if (showActions) {
    columns.push({
      header: 'Ações',
      width: '120px',
      align: 'right',
      accessor: (product) => (
        <div className="flex gap-2 justify-end">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView(product);
              }}
              title="Visualizar"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product);
              }}
              className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-gray-800 dark:hover:to-gray-800"
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(product.id);
              }}
              className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
              title="Deletar"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    });
  }

  return (
    <VirtualizedTable
      data={products}
      columns={columns}
      height={height}
      isLoading={isLoading}
      estimateRowHeight={70}
      emptyMessage="Nenhum produto encontrado"
      enableHover
      getRowKey={(product) => product.id}
      overscan={5}
    />
  );
}

export default VirtualizedProductsTable;

