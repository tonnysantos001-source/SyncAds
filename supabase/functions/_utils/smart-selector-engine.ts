// ============================================================================
// SMART SELECTOR ENGINE - Sistema Inteligente de Seleção de Elementos DOM
// ============================================================================
// Gera múltiplos seletores com fallback e aprende com sucesso/falha
// ============================================================================

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface SelectorStrategy {
  type: 'css' | 'xpath' | 'text' | 'aria';
  selector: string;
  confidence: number;
  source: 'learned' | 'generic' | 'ai_generated';
}

export interface SmartSelectorOptions {
  maxSelectors?: number;
  minConfidence?: number;
  includeGeneric?: boolean;
  domain: string;
}

// ============================================================================
// GERAÇÃO DE SELETORES INTELIGENTES
// ============================================================================

/**
 * Gera múltiplos seletores para um elemento com estratégias de fallback
 */
export async function generateSmartSelectors(
  supabase: SupabaseClient,
  description: string,
  options: SmartSelectorOptions
): Promise<SelectorStrategy[]> {
  const strategies: SelectorStrategy[] = [];
  const { domain, maxSelectors = 10, minConfidence = 0.5 } = options;

  console.log('🎯 Gerando seletores para:', { description, domain });

  // 1. BUSCAR SELETORES APRENDIDOS DO BANCO (MAIOR PRIORIDADE)
  const learnedSelectors = await fetchLearnedSelectors(supabase, description, domain);
  strategies.push(...learnedSelectors);

  // 2. GERAR SELETORES GENÉRICOS BASEADOS EM PADRÕES
  const genericSelectors = generateGenericSelectors(description, domain);
  strategies.push(...genericSelectors);

  // 3. GERAR SELETORES BASEADOS EM TEXTO
  const textSelectors = generateTextBasedSelectors(description);
  strategies.push(...textSelectors);

  // 4. GERAR SELETORES ARIA
  const ariaSelectors = generateAriaSelectors(description);
  strategies.push(...ariaSelectors);

  // 5. REMOVER DUPLICATAS
  const uniqueSelectors = removeDuplicates(strategies);

  // 6. FILTRAR POR CONFIDENCE MÍNIMA
  const filtered = uniqueSelectors.filter(s => s.confidence >= minConfidence);

  // 7. ORDENAR POR CONFIDENCE (MAIOR PRIMEIRO)
  const sorted = filtered.sort((a, b) => b.confidence - a.confidence);

  // 8. LIMITAR QUANTIDADE
  const limited = sorted.slice(0, maxSelectors);

  console.log(`✅ ${limited.length} seletores gerados:`, limited.map(s => ({
    selector: s.selector.substring(0, 50),
    confidence: s.confidence,
    source: s.source
  })));

  return limited;
}

// ============================================================================
// BUSCA DE SELETORES APRENDIDOS
// ============================================================================

async function fetchLearnedSelectors(
  supabase: SupabaseClient,
  description: string,
  domain: string
): Promise<SelectorStrategy[]> {
  try {
    const cleanDesc = description.toLowerCase().trim();

    // Buscar por domínio específico e genérico (*)
    const { data, error } = await supabase
      .from('learned_selectors')
      .select('selector, selector_type, confidence, success_count, failure_count')
      .or(`domain.eq.${domain},domain.eq.*`)
      .ilike('element_description', `%${cleanDesc}%`)
      .order('confidence', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Erro ao buscar seletores aprendidos:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('ℹ️ Nenhum seletor aprendido encontrado');
      return [];
    }

    console.log(`✅ ${data.length} seletores aprendidos encontrados`);

    return data.map(item => ({
      type: item.selector_type as any,
      selector: item.selector,
      confidence: Number(item.confidence),
      source: 'learned' as const,
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar seletores:', error);
    return [];
  }
}

// ============================================================================
// GERAÇÃO DE SELETORES GENÉRICOS
// ============================================================================

function generateGenericSelectors(description: string, domain: string): SelectorStrategy[] {
  const desc = description.toLowerCase().trim();
  const selectors: SelectorStrategy[] = [];

  // BOTÕES
  if (matchesPattern(desc, ['button', 'botão', 'btn', 'click'])) {
    selectors.push(
      { type: 'css', selector: 'button[type="submit"]', confidence: 0.75, source: 'generic' },
      { type: 'css', selector: 'input[type="submit"]', confidence: 0.75, source: 'generic' },
      { type: 'css', selector: 'button[type="button"]', confidence: 0.70, source: 'generic' },
      { type: 'css', selector: '.btn', confidence: 0.65, source: 'generic' },
      { type: 'css', selector: '[role="button"]', confidence: 0.65, source: 'generic' },
      { type: 'css', selector: 'button', confidence: 0.60, source: 'generic' }
    );
  }

  // LOGIN / ENTRAR
  if (matchesPattern(desc, ['login', 'entrar', 'sign in', 'log in'])) {
    selectors.push(
      { type: 'css', selector: '#login', confidence: 0.75, source: 'generic' },
      { type: 'css', selector: '.login-button', confidence: 0.70, source: 'generic' },
      { type: 'css', selector: '[data-testid*="login"]', confidence: 0.70, source: 'generic' },
      { type: 'css', selector: 'button#loginbutton', confidence: 0.75, source: 'generic' }
    );
  }

  // BUSCA / SEARCH
  if (matchesPattern(desc, ['search', 'busca', 'pesquisa', 'procurar'])) {
    selectors.push(
      { type: 'css', selector: 'input[type="search"]', confidence: 0.80, source: 'generic' },
      { type: 'css', selector: 'input[name*="search"]', confidence: 0.75, source: 'generic' },
      { type: 'css', selector: 'input[placeholder*="search"]', confidence: 0.70, source: 'generic' },
      { type: 'css', selector: 'input[placeholder*="busca"]', confidence: 0.70, source: 'generic' },
      { type: 'css', selector: '.search-box', confidence: 0.65, source: 'generic' },
      { type: 'css', selector: '#search', confidence: 0.65, source: 'generic' }
    );
  }

  // EMAIL
  if (matchesPattern(desc, ['email', 'e-mail', 'mail'])) {
    selectors.push(
      { type: 'css', selector: 'input[type="email"]', confidence: 0.85, source: 'generic' },
      { type: 'css', selector: 'input[name="email"]', confidence: 0.80, source: 'generic' },
      { type: 'css', selector: 'input[id="email"]', confidence: 0.80, source: 'generic' },
      { type: 'css', selector: 'input[autocomplete="email"]', confidence: 0.75, source: 'generic' },
      { type: 'css', selector: 'input[name*="email"]', confidence: 0.70, source: 'generic' }
    );
  }

  // SENHA / PASSWORD
  if (matchesPattern(desc, ['password', 'senha', 'pass'])) {
    selectors.push(
      { type: 'css', selector: 'input[type="password"]', confidence: 0.90, source: 'generic' },
      { type: 'css', selector: 'input[name="password"]', confidence: 0.85, source: 'generic' },
      { type: 'css', selector: 'input[id="password"]', confidence: 0.85, source: 'generic' },
      { type: 'css', selector: 'input[autocomplete="current-password"]', confidence: 0.80, source: 'generic' }
    );
  }

  // NOME / NAME
  if (matchesPattern(desc, ['nome', 'name', 'first name', 'primeiro nome'])) {
    selectors.push(
      { type: 'css', selector: 'input[name="name"]', confidence: 0.75, source: 'generic' },
      { type: 'css', selector: 'input[name="firstName"]', confidence: 0.75, source: 'generic' },
      { type: 'css', selector: 'input[autocomplete="name"]', confidence: 0.70, source: 'generic' },
      { type: 'css', selector: 'input[placeholder*="nome"]', confidence: 0.65, source: 'generic' }
    );
  }

  // TELEFONE / PHONE
  if (matchesPattern(desc, ['telefone', 'phone', 'tel', 'celular', 'mobile'])) {
    selectors.push(
      { type: 'css', selector: 'input[type="tel"]', confidence: 0.85, source: 'generic' },
      { type: 'css', selector: 'input[name*="phone"]', confidence: 0.75, source: 'generic' },
      { type: 'css', selector: 'input[name*="tel"]', confidence: 0.75, source: 'generic' },
      { type: 'css', selector: 'input[autocomplete="tel"]', confidence: 0.70, source: 'generic' }
    );
  }

  // SUBMIT / ENVIAR
  if (matchesPattern(desc, ['submit', 'enviar', 'send', 'salvar', 'save'])) {
    selectors.push(
      { type: 'css', selector: 'button[type="submit"]', confidence: 0.80, source: 'generic' },
      { type: 'css', selector: 'input[type="submit"]', confidence: 0.80, source: 'generic' },
      { type: 'css', selector: 'button.submit', confidence: 0.70, source: 'generic' }
    );
  }

  // CLOSE / FECHAR
  if (matchesPattern(desc, ['close', 'fechar', 'x', 'cancel', 'cancelar'])) {
    selectors.push(
      { type: 'css', selector: 'button.close', confidence: 0.75, source: 'generic' },
      { type: 'css', selector: '[aria-label*="close"]', confidence: 0.70, source: 'generic' },
      { type: 'css', selector: '.modal-close', confidence: 0.65, source: 'generic' }
    );
  }

  return selectors;
}

// ============================================================================
// SELETORES BASEADOS EM TEXTO
// ============================================================================

function generateTextBasedSelectors(description: string): SelectorStrategy[] {
  const selectors: SelectorStrategy[] = [];
  const cleanDesc = description.trim();

  // Variações de texto para buscar
  const variations = [
    cleanDesc,
    cleanDesc.toLowerCase(),
    cleanDesc.toUpperCase(),
    capitalizeFirst(cleanDesc),
  ];

  // Remover duplicatas
  const uniqueVariations = [...new Set(variations)];

  uniqueVariations.forEach(text => {
    // Seletor exato
    selectors.push({
      type: 'text',
      selector: `text="${text}"`,
      confidence: 0.70,
      source: 'generic',
    });

    // Seletor parcial (contém)
    selectors.push({
      type: 'text',
      selector: `text*="${text}"`,
      confidence: 0.65,
      source: 'generic',
    });
  });

  return selectors;
}

// ============================================================================
// SELETORES ARIA
// ============================================================================

function generateAriaSelectors(description: string): SelectorStrategy[] {
  const selectors: SelectorStrategy[] = [];
  const cleanDesc = description.toLowerCase().trim();

  // ARIA label
  selectors.push({
    type: 'aria',
    selector: `[aria-label*="${cleanDesc}"]`,
    confidence: 0.75,
    source: 'generic',
  });

  // ARIA labelledby
  selectors.push({
    type: 'aria',
    selector: `[aria-labelledby*="${cleanDesc}"]`,
    confidence: 0.70,
    source: 'generic',
  });

  // ARIA described by
  selectors.push({
    type: 'aria',
    selector: `[aria-describedby*="${cleanDesc}"]`,
    confidence: 0.65,
    source: 'generic',
  });

  // Role + name
  const roleMap: Record<string, string> = {
    button: 'button',
    link: 'link',
    input: 'textbox',
    search: 'searchbox',
    checkbox: 'checkbox',
    radio: 'radio',
  };

  Object.entries(roleMap).forEach(([keyword, role]) => {
    if (cleanDesc.includes(keyword)) {
      selectors.push({
        type: 'aria',
        selector: `[role="${role}"]`,
        confidence: 0.70,
        source: 'generic',
      });
    }
  });

  return selectors;
}

// ============================================================================
// REGISTRO DE RESULTADO (APRENDIZADO)
// ============================================================================

/**
 * Registra resultado de uso de um seletor (sucesso ou falha)
 * Sistema aprende com o tempo
 */
export async function recordSelectorResult(
  supabase: SupabaseClient,
  domain: string,
  description: string,
  selector: string,
  selectorType: string,
  success: boolean
): Promise<void> {
  try {
    console.log('📝 Registrando resultado:', { domain, description, selector, success });

    // Buscar seletor existente
    const { data: existing } = await supabase
      .from('learned_selectors')
      .select('*')
      .eq('domain', domain)
      .eq('element_description', description)
      .eq('selector', selector)
      .maybeSingle();

    if (existing) {
      // ATUALIZAR EXISTENTE
      const newSuccessCount = success ? existing.success_count + 1 : existing.success_count;
      const newFailureCount = success ? existing.failure_count : existing.failure_count + 1;
      const totalAttempts = newSuccessCount + newFailureCount;

      // Calcular nova confidence (taxa de sucesso)
      const newConfidence = Math.min(newSuccessCount / totalAttempts, 0.99);

      await supabase
        .from('learned_selectors')
        .update({
          success_count: newSuccessCount,
          failure_count: newFailureCount,
          confidence: newConfidence,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      console.log('✅ Seletor atualizado:', {
        confidence: newConfidence,
        success: newSuccessCount,
        failure: newFailureCount,
      });
    } else {
      // CRIAR NOVO
      await supabase
        .from('learned_selectors')
        .insert({
          domain,
          element_description: description.toLowerCase().trim(),
          selector,
          selector_type: selectorType,
          success_count: success ? 1 : 0,
          failure_count: success ? 0 : 1,
          confidence: success ? 0.90 : 0.10,
          last_used_at: new Date().toISOString(),
        });

      console.log('✅ Novo seletor aprendido');
    }
  } catch (error) {
    console.error('❌ Erro ao registrar resultado:', error);
  }
}

// ============================================================================
// ESTATÍSTICAS E LIMPEZA
// ============================================================================

/**
 * Obtém estatísticas de seletores para um domínio
 */
export async function getSelectorStats(
  supabase: SupabaseClient,
  domain: string
): Promise<{
  total: number;
  avgConfidence: number;
  topSelectors: Array<{ selector: string; confidence: number; uses: number }>;
}> {
  try {
    const { data } = await supabase
      .from('learned_selectors')
      .select('selector, confidence, success_count, failure_count')
      .eq('domain', domain)
      .order('confidence', { ascending: false });

    if (!data || data.length === 0) {
      return { total: 0, avgConfidence: 0, topSelectors: [] };
    }

    const total = data.length;
    const avgConfidence = data.reduce((sum, s) => sum + Number(s.confidence), 0) / total;
    const topSelectors = data.slice(0, 10).map(s => ({
      selector: s.selector,
      confidence: Number(s.confidence),
      uses: s.success_count + s.failure_count,
    }));

    return { total, avgConfidence, topSelectors };
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    return { total: 0, avgConfidence: 0, topSelectors: [] };
  }
}

/**
 * Remove seletores com baixa performance
 */
export async function cleanupPoorSelectors(
  supabase: SupabaseClient,
  minConfidence: number = 0.2,
  minAttempts: number = 10
): Promise<number> {
  try {
    // Buscar seletores com baixa confidence e tentativas suficientes
    const { data: poorSelectors } = await supabase
      .from('learned_selectors')
      .select('id, confidence, success_count, failure_count')
      .lt('confidence', minConfidence);

    if (!poorSelectors || poorSelectors.length === 0) {
      return 0;
    }

    // Filtrar apenas os que têm tentativas suficientes
    const toDelete = poorSelectors.filter(s =>
      (s.success_count + s.failure_count) >= minAttempts
    );

    if (toDelete.length === 0) {
      return 0;
    }

    // Deletar
    const ids = toDelete.map(s => s.id);
    await supabase
      .from('learned_selectors')
      .delete()
      .in('id', ids);

    console.log(`🧹 ${toDelete.length} seletores ruins removidos`);
    return toDelete.length;
  } catch (error) {
    console.error('❌ Erro ao limpar seletores:', error);
    return 0;
  }
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function matchesPattern(text: string, patterns: string[]): boolean {
  return patterns.some(pattern => text.includes(pattern));
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function removeDuplicates(selectors: SelectorStrategy[]): SelectorStrategy[] {
  const seen = new Map<string, SelectorStrategy>();

  for (const selector of selectors) {
    const key = `${selector.type}:${selector.selector}`;
    const existing = seen.get(key);

    // Manter o de maior confidence
    if (!existing || selector.confidence > existing.confidence) {
      seen.set(key, selector);
    }
  }

  return Array.from(seen.values());
}

/**
 * Converte seletor para formato Playwright/Puppeteer
 */
export function toPlaywrightSelector(strategy: SelectorStrategy): string {
  switch (strategy.type) {
    case 'text':
      return strategy.selector; // Já está no formato text=...
    case 'aria':
      return strategy.selector; // Já está no formato [aria-...]
    case 'css':
      return `css=${strategy.selector}`;
    case 'xpath':
      return `xpath=${strategy.selector}`;
    default:
      return strategy.selector;
  }
}
