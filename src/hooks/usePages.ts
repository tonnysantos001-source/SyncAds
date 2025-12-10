/**
 * usePages Hook - Multi-Page Management
 * Gerencia múltiplas páginas no Visual Editor
 */

import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';

export interface Page {
    id: string;
    name: string;
    path: string;
    htmlCode: string;
    cssCode: string;
    jsCode: string;
    isHome: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface usePagesReturn {
    pages: Page[];
    currentPage: Page | null;
    addPage: (name: string, path: string) => void;
    deletePage: (id: string) => void;
    updatePage: (id: string, updates: Partial<Page>) => void;
    setCurrentPage: (id: string) => void;
    setHomePage: (id: string) => void;
    duplicatePage: (id: string) => void;
    renamePage: (id: string, newName: string) => void;
}

export function usePages(): usePagesReturn {
    const [pages, setPages] = useState<Page[]>([
        {
            id: nanoid(),
            name: 'Home',
            path: '/',
            htmlCode: getDefaultHTML(),
            cssCode: '',
            jsCode: '',
            isHome: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ]);

    const [currentPageId, setCurrentPageId] = useState<string>(pages[0].id);

    const currentPage = pages.find(p => p.id === currentPageId) || pages[0];

    const addPage = useCallback((name: string, path: string) => {
        const newPage: Page = {
            id: nanoid(),
            name,
            path,
            htmlCode: getDefaultHTML(),
            cssCode: '',
            jsCode: '',
            isHome: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        setPages(prev => [...prev, newPage]);
        setCurrentPageId(newPage.id);
    }, []);

    const deletePage = useCallback((id: string) => {
        setPages(prev => {
            const filtered = prev.filter(p => p.id !== id);

            // Can't delete if only one page
            if (filtered.length === 0) return prev;

            // If deleting current page, switch to first page
            if (id === currentPageId) {
                setCurrentPageId(filtered[0].id);
            }

            return filtered;
        });
    }, [currentPageId]);

    const updatePage = useCallback((id: string, updates: Partial<Page>) => {
        setPages(prev => prev.map(p =>
            p.id === id
                ? { ...p, ...updates, updatedAt: new Date() }
                : p
        ));
    }, []);

    const setCurrentPage = useCallback((id: string) => {
        setCurrentPageId(id);
    }, []);

    const setHomePage = useCallback((id: string) => {
        setPages(prev => prev.map(p => ({
            ...p,
            isHome: p.id === id,
        })));
    }, []);

    const duplicatePage = useCallback((id: string) => {
        const page = pages.find(p => p.id === id);
        if (!page) return;

        const duplicated: Page = {
            ...page,
            id: nanoid(),
            name: `${page.name} (Copy)`,
            path: `${page.path}-copy`,
            isHome: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        setPages(prev => [...prev, duplicated]);
        setCurrentPageId(duplicated.id);
    }, [pages]);

    const renamePage = useCallback((id: string, newName: string) => {
        updatePage(id, { name: newName });
    }, [updatePage]);

    return {
        pages,
        currentPage,
        addPage,
        deletePage,
        updatePage,
        setCurrentPage,
        setHomePage,
        duplicatePage,
        renamePage,
    };
}

function getDefaultHTML(): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova Página</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Nova Página</h1>
      <p class="text-xl text-gray-600">Comece a editar...</p>
    </div>
  </div>
</body>
</html>`;
}
