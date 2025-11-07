import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export const useDarkMode = () => {
  // Inicializa o tema a partir do localStorage ou preferência do sistema
  const [theme, setTheme] = useState<Theme>(() => {
    // Verifica localStorage primeiro
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      return savedTheme;
    }

    // Se não houver preferência salva, usa a preferência do sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  });

  // Aplica o tema ao document root
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove a classe oposta
    root.classList.remove(theme === 'light' ? 'dark' : 'light');

    // Adiciona a classe do tema atual
    root.classList.add(theme);

    // Salva no localStorage
    localStorage.setItem('theme', theme);

    // Atualiza meta theme-color para mobile
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#ffffff');
    }
  }, [theme]);

  // Toggle entre light e dark
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Define o tema manualmente
  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setTheme,
  };
};
