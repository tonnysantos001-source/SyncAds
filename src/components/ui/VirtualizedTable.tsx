import { useRef, ReactNode, CSSProperties } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ============================================================================
// TYPES
// ============================================================================

export interface VirtualizedTableColumn<TData = any> {
  /**
   * Column header label
   */
  header: string | ReactNode;

  /**
   * Accessor key or render function
   */
  accessor: keyof TData | ((row: TData, index: number) => ReactNode);

  /**
   * Column width (CSS value)
   */
  width?: string | number;

  /**
   * Column alignment
   */
  align?: 'left' | 'center' | 'right';

  /**
   * Custom cell className
   */
  cellClassName?: string;

  /**
   * Custom header className
   */
  headerClassName?: string;
}

export interface VirtualizedTableProps<TData = any> {
  /**
   * Array of data to display
   */
  data: TData[];

  /**
   * Column definitions
   */
  columns: VirtualizedTableColumn<TData>[];

  /**
   * Estimated row height in pixels (for better performance)
   */
  estimateRowHeight?: number;

  /**
   * Table container height (default: 600px)
   */
  height?: string | number;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Empty state message
   */
  emptyMessage?: string | ReactNode;

  /**
   * Custom row className
   */
  rowClassName?: string | ((row: TData, index: number) => string);

  /**
   * Custom row key
   */
  getRowKey?: (row: TData, index: number) => string | number;

  /**
   * On row click handler
   */
  onRowClick?: (row: TData, index: number) => void;

  /**
   * Enable row hover effect
   */
  enableHover?: boolean;

  /**
   * Custom loading component
   */
  loadingComponent?: ReactNode;

  /**
   * Custom empty component
   */
  emptyComponent?: ReactNode;

  /**
   * Overscan count (number of items to render outside viewport)
   */
  overscan?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VirtualizedTable<TData = any>({
  data,
  columns,
  estimateRowHeight = 50,
  height = 600,
  isLoading = false,
  emptyMessage = 'Nenhum item encontrado',
  rowClassName,
  getRowKey,
  onRowClick,
  enableHover = true,
  loadingComponent,
  emptyComponent,
  overscan = 10,
}: VirtualizedTableProps<TData>) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Initialize virtualizer
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Helper to get cell value
  const getCellValue = (
    row: TData,
    column: VirtualizedTableColumn<TData>,
    index: number
  ): ReactNode => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row, index);
    }
    return row[column.accessor] as ReactNode;
  };

  // Helper to get row key
  const getKey = (row: TData, index: number): string | number => {
    if (getRowKey) {
      return getRowKey(row, index);
    }
    // Try to use id field, fallback to index
    if (row && typeof row === 'object' && 'id' in row) {
      return String((row as any).id);
    }
    return index;
  };

  // Helper to get row class name
  const getRowClassName = (row: TData, index: number): string => {
    const baseClasses = cn(
      'border-b transition-colors',
      enableHover && 'hover:bg-muted/50',
      onRowClick && 'cursor-pointer'
    );

    if (typeof rowClassName === 'function') {
      return cn(baseClasses, rowClassName(row, index));
    }

    return cn(baseClasses, rowClassName);
  };

  // Render loading state
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div
        style={{ height }}
        className="flex items-center justify-center border rounded-md"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Render empty state
  if (data.length === 0) {
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }

    return (
      <div
        style={{ height }}
        className="flex items-center justify-center border rounded-md"
      >
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Render virtualized table
  return (
    <div className="border rounded-md overflow-hidden">
      <div
        ref={parentRef}
        style={{ height, overflow: 'auto' }}
        className="relative"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((column, colIndex) => (
                  <TableHead
                    key={colIndex}
                    style={{
                      width: column.width,
                      textAlign: column.align || 'left',
                    }}
                    className={cn(
                      'font-semibold bg-muted/50',
                      column.headerClassName
                    )}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          </Table>
        </div>

        {/* Virtual Body */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <Table>
            <TableBody>
              {virtualItems.map((virtualRow) => {
                const row = data[virtualRow.index];
                const key = getKey(row, virtualRow.index);

                return (
                  <TableRow
                    key={key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={getRowClassName(row, virtualRow.index)}
                    onClick={() => onRowClick?.(row, virtualRow.index)}
                  >
                    {columns.map((column, colIndex) => (
                      <TableCell
                        key={colIndex}
                        style={{
                          width: column.width,
                          textAlign: column.align || 'left',
                        }}
                        className={column.cellClassName}
                      >
                        {getCellValue(row, column, virtualRow.index)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer with count */}
      <div className="border-t bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
        Mostrando {virtualItems.length} de {data.length} items
      </div>
    </div>
  );
}

// ============================================================================
// SIMPLE LIST VARIANT (for non-table data)
// ============================================================================

export interface VirtualizedListProps<TData = any> {
  data: TData[];
  renderItem: (item: TData, index: number) => ReactNode;
  estimateItemHeight?: number;
  height?: string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  overscan?: number;
  getItemKey?: (item: TData, index: number) => string | number;
}

export function VirtualizedList<TData = any>({
  data,
  renderItem,
  estimateItemHeight = 60,
  height = 600,
  isLoading = false,
  emptyMessage = 'Nenhum item encontrado',
  overscan = 5,
  getItemKey,
}: VirtualizedListProps<TData>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateItemHeight,
    overscan,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  const getKey = (item: TData, index: number): string | number => {
    if (getItemKey) {
      return getItemKey(item, index);
    }
    if (item && typeof item === 'object' && 'id' in item) {
      return String((item as any).id);
    }
    return index;
  };

  if (isLoading) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center border rounded-md"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center border rounded-md"
      >
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      style={{ height, overflow: 'auto' }}
      className="border rounded-md"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = data[virtualItem.index];
          const key = getKey(item, virtualItem.index);

          return (
            <div
              key={key}
              data-index={virtualItem.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VirtualizedTable;
