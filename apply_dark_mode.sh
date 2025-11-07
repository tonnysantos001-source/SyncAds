#!/bin/bash

# Script para aplicar dark mode em todas as páginas

# Padrão de substituição
# bg-white -> bg-white dark:bg-gray-900
# bg-gray-50 -> bg-gray-50 dark:bg-gray-950
# text-gray-900 -> text-gray-900 dark:text-white
# text-gray-600 -> text-gray-600 dark:text-gray-300
# text-gray-500 -> text-gray-500 dark:text-gray-400
# border-gray-200 -> border-gray-200 dark:border-gray-700

find src/pages/app -name "*.tsx" -not -name "*.BACKUP.tsx" -type f | while read file; do
  echo "Processing: $file"
  # Aplicar substituições básicas (sem quebrar código existente)
  sed -i 's/className="bg-white"/className="bg-white dark:bg-gray-900"/g' "$file"
  sed -i 's/className="bg-gray-50"/className="bg-gray-50 dark:bg-gray-950"/g' "$file"
done

echo "Dark mode aplicado!"
