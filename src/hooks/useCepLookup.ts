/**
 * useCepLookup.ts
 * Hook para busca automática de endereço via API ViaCEP.
 * API gratuita, sem autenticação: https://viacep.com.br
 */

import { useState, useCallback } from 'react';

export interface CepResult {
  street: string;      // logradouro
  neighborhood: string; // bairro
  city: string;        // localidade
  state: string;       // uf
  ibge?: string;
}

export interface UseCepLookupReturn {
  /** Busca o CEP e retorna os dados do endereço, ou null se não encontrado */
  lookup: (cep: string) => Promise<CepResult | null>;
  /** true enquanto a busca está em andamento */
  loading: boolean;
  /** Mensagem de erro, se houver */
  error: string | null;
}

export function useCepLookup(): UseCepLookupReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (cep: string): Promise<CepResult | null> => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;

    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        setError('CEP não encontrado.');
        return null;
      }

      const data = await res.json();

      if (data.erro) {
        setError('CEP não encontrado.');
        return null;
      }

      return {
        street: data.logradouro ?? '',
        neighborhood: data.bairro ?? '',
        city: data.localidade ?? '',
        state: data.uf ?? '',
        ibge: data.ibge,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Tempo esgotado ao buscar o CEP.');
      } else {
        setError('Erro ao consultar o CEP. Verifique sua conexão.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookup, loading, error };
}
