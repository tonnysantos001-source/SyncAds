// ============================================================================
// CONTENT SCRIPT ENHANCED - Com Visual Feedback Integrado
// ============================================================================
// Integração do sistema de feedback visual com todas as ações DOM
// ============================================================================

console.log('🚀 Content Script Enhanced carregado');

// ============================================================================
// EXECUTAR COMANDO DOM COM FEEDBACK VISUAL
// ============================================================================

async function executeDomCommand(command) {
  const { type, data } = command;

  console.log('🎯 Executando comando DOM:', { type, data });

  // 🎨 MOSTRAR "PENSANDO"
  if (window.aiVisualFeedback) {
    const actionNames = {
      DOM_CLICK: 'Clicando',
      DOM_FILL: 'Preenchendo',
      DOM_READ: 'Lendo',
      SCREENSHOT: 'Capturando tela',
      NAVIGATE: 'Navegando',
      SCROLL: 'Rolando página',
      WAIT: 'Aguardando',
      DOM_HOVER: 'Posicionando cursor',
      DOM_SELECT: 'Selecionando',
      FORM_SUBMIT: 'Enviando formulário',
      GET_PAGE_INFO: 'Analisando página',
      LIST_TABS: 'Listando abas',
      READ_TEXT: 'Extraindo texto',
      EXECUTE_JS: 'Executando código',
      FILL_FORM: 'Preenchendo formulário',
      EXTRACT_TABLE: 'Extraindo tabela',
      EXTRACT_IMAGES: 'Extraindo imagens',
      EXTRACT_LINKS: 'Extraindo links',
      EXTRACT_EMAILS: 'Extraindo emails',
      EXTRACT_ALL: 'Extraindo dados',
      WAIT_ELEMENT: 'Aguardando elemento',
    };

    window.aiVisualFeedback.showThinking(actionNames[type] || 'Executando...');
  }

  try {
    let result = null;

    switch (type) {
      case 'DOM_CLICK':
        result = await executeClickWithFeedback(data.selector);
        break;

      case 'DOM_FILL':
        result = await executeFillWithFeedback(data.selector, data.value);
        break;

      case 'DOM_READ':
        result = await executeReadWithFeedback(data.selector);
        break;

      case 'SCREENSHOT':
        result = await executeScreenshotWithFeedback(data);
        break;

      case 'NAVIGATE':
        result = await executeNavigationWithFeedback(data.url);
        break;

      case 'SCROLL':
        result = await executeScrollWithFeedback(data);
        break;

      case 'WAIT':
        result = await executeWait(data.ms || 1000);
        break;

      case 'DOM_HOVER':
        result = await executeHoverWithFeedback(data.selector);
        break;

      case 'DOM_SELECT':
        result = await executeSelectWithFeedback(data.selector, data.value);
        break;

      case 'FORM_SUBMIT':
        result = await executeFormSubmitWithFeedback(data.selector);
        break;

      case 'GET_PAGE_INFO':
        result = await executeGetPageInfo();
        break;

      case 'LIST_TABS':
        result = await executeListTabs();
        break;

      case 'READ_TEXT':
        result = await executeReadTextWithFeedback(data.selector);
        break;

      case 'EXECUTE_JS':
        result = await executeJS(data.code);
        break;

      case 'FILL_FORM':
        result = await fillFormWithFeedback(data);
        break;

      case 'EXTRACT_TABLE':
        result = await extractTable(data);
        break;

      case 'EXTRACT_IMAGES':
        result = await extractImages(data);
        break;

      case 'EXTRACT_LINKS':
        result = await extractLinks(data);
        break;

      case 'EXTRACT_EMAILS':
        result = await extractEmails();
        break;

      case 'EXTRACT_ALL':
        result = await extractAllData(data);
        break;

      case 'WAIT_ELEMENT':
        result = await waitForElement(data);
        break;

      default:
        throw new Error(`Comando desconhecido: ${type}`);
    }

    // 🎨 REMOVER "PENSANDO" E MOSTRAR SUCESSO
    if (window.aiVisualFeedback) {
      window.aiVisualFeedback.hideThinking();
      window.aiVisualFeedback.showSuccess(`✅ ${actionNames[type] || 'Ação'} concluída!`);
    }

    console.log('✅ Comando executado com sucesso:', { type, result });
    return { success: true, result };

  } catch (error) {
    console.error('❌ Erro ao executar comando:', error);

    // 🎨 MOSTRAR ERRO
    if (window.aiVisualFeedback) {
      window.aiVisualFeedback.hideThinking();
      window.aiVisualFeedback.showError(`❌ Erro: ${error.message}`);
    }

    return { success: false, error: error.message };
  }
}

// ============================================================================
// AÇÕES COM FEEDBACK VISUAL
// ============================================================================

async function executeClickWithFeedback(selector) {
  // 🎨 HIGHLIGHT + CURSOR VIRTUAL
  if (window.aiVisualFeedback) {
    const highlighted = window.aiVisualFeedback.highlightElement(selector);
    if (highlighted) {
      await window.aiVisualFeedback.showCursorMovement(selector);
    }
  }

  await sleep(300); // Delay para usuário ver

  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Elemento não encontrado: ${selector}`);
  }

  // Scroll suave até elemento
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(500);

  // Click
  element.click();

  return {
    clicked: true,
    text: element.textContent?.trim(),
    tagName: element.tagName,
  };
}

async function executeFillWithFeedback(selector, value) {
  // 🎨 HIGHLIGHT
  if (window.aiVisualFeedback) {
    window.aiVisualFeedback.highlightElement(selector);
  }

  await sleep(300);

  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Campo não encontrado: ${selector}`);
  }

  // Scroll até elemento
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(500);

  // Focus
  element.focus();

  // Limpar campo
  element.value = '';

  // Digitar valor (efeito de digitação)
  if (value && value.length > 0) {
    for (let i = 0; i < value.length; i++) {
      element.value += value[i];
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(30); // Efeito de digitação
    }
  }

  // Eventos de mudança
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));

  return {
    filled: true,
    value: element.value,
    tagName: element.tagName,
  };
}

async function executeReadWithFeedback(selector) {
  // 🎨 HIGHLIGHT
  if (window.aiVisualFeedback) {
    window.aiVisualFeedback.highlightElement(selector);
  }

  await sleep(300);

  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Elemento não encontrado: ${selector}`);
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(300);

  return {
    text: element.textContent?.trim(),
    html: element.innerHTML,
    value: element.value,
    tagName: element.tagName,
  };
}

async function executeScreenshotWithFeedback(data) {
  // 🎨 MOSTRAR PROGRESSO
  if (window.aiVisualFeedback) {
    window.aiVisualFeedback.showProgress('Capturando screenshot', 1, 2);
  }

  await sleep(500);

  // Solicitar screenshot ao background
  const response = await chrome.runtime.sendMessage({
    type: 'CAPTURE_SCREENSHOT',
    data: data || {}
  });

  if (window.aiVisualFeedback) {
    window.aiVisualFeedback.showProgress('Capturando screenshot', 2, 2);
  }

  return {
    success: true,
    type: 'screenshot',
    dataUrl: response.dataUrl,
  };
}

async function executeNavigationWithFeedback(url) {
  // 🎨 MOSTRAR PROGRESSO
  if (window.aiVisualFeedback) {
    window.aiVisualFeedback.showProgress('Abrindo página', 0, 1);
  }

  const response = await chrome.runtime.sendMessage({
    type: 'OPEN_NEW_TAB',
    url: url,
  });

  if (window.aiVisualFeedback) {
    window.aiVisualFeedback.showProgress('Abrindo página', 1, 1);
  }

  return { navigated: true, newTab: true, message: 'Nova aba aberta' };
}

async function executeScrollWithFeedback(data) {
  const { position, selector } = data;

  if (selector) {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Elemento não encontrado: ${selector}`);
    }

    // 🎨 HIGHLIGHT
    if (window.aiVisualFeedback) {
      window.aiVisualFeedback.highlightElement(selector);
    }

    await sleep(300);
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else if (position === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (position === 'bottom') {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  } else {
    window.scrollBy({ top: 300, behavior: 'smooth' });
  }

  await sleep(500);

  return {
    scrolled: true,
    currentScroll: {
      x: window.scrollX,
      y: window.scrollY,
    },
  };
}

async function executeHoverWithFeedback(selector) {
  // 🎨 HIGHLIGHT
  if (window.aiVisualFeedback) {
    window.aiVisualFeedback.highlightElement(selector);
  }

  await sleep(300);

  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Elemento não encontrado: ${selector}`);
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(500);

  // Eventos de hover
  const mouseOverEvent = new MouseEvent('mouseover', {
    view: window,
    bubbles: true,
    cancelable: true,
  });

  const mouseEnterEvent = new MouseEvent('mouseenter', {
    view: window,
    bubbles: true,
    cancelable: true,
  });

  element.dispatchEvent(mouseOverEvent);
  element.dispatchEvent(mouseEnterEvent);

  return {
    hovered: true,
    tagName: element.tagName,
  };
}

async function executeSelectWithFeedback(selector, value) {
  // 🎨 HIGHLIGHT
  if (window.aiVisualFeedback) {
    window.aiVisualFeedback.highlightElement(selector);
  }

  await sleep(300);

  const element = document.querySelector(selector);
  if (!element || element.tagName !== 'SELECT') {
    throw new Error(`Select não encontrado: ${selector}`);
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(500);

  element.value = value;
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('input', { bubbles: true }));

  return {
    selected: true,
    value: element.value,
    selectedText: element.options[element.selectedIndex]?.text,
  };
}

async function executeFormSubmitWithFeedback(selector) {
  // 🎨 HIGHLIGHT
  if (window.aiVisualFeedback) {
    window.aiVisualFeedback.highlightElement(selector);
  }

  await sleep(300);

  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Formulário não encontrado: ${selector}`);
  }

  let form = element.tagName === 'FORM' ? element : element.closest('form');

  if (!form) {
    throw new Error('Formulário não encontrado');
  }

  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(500);

  form.submit();

  return {
    submitted: true,
    action: form.action,
    method: form.method,
  };
}

async function executeReadTextWithFeedback(selector) {
  if (!selector) {
    return { text: document.body.innerText, selector: 'body' };
  }

  // 🎨 HIGHLIGHT
  if (window.aiVisualFeedback) {
    window.aiVisualFeedback.highlightElement(selector);
  }

  await sleep(300);

  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Elemento não encontrado: ${selector}`);
  }

  return {
    text: element.innerText || element.textContent,
    selector: selector,
  };
}

async function fillFormWithFeedback(data) {
  const { formData, selector } = data;

  if (!formData || typeof formData !== 'object') {
    throw new Error('formData é obrigatório');
  }

  // Encontrar formulário
  let form = null;
  if (selector) {
    form = document.querySelector(selector);
  } else {
    form = document.querySelector('form');
  }

  if (!form) {
    throw new Error('Formulário não encontrado');
  }

  // 🎨 HIGHLIGHT FORM
  if (window.aiVisualFeedback) {
    window.aiVisualFeedback.highlightElement(selector || 'form');
  }

  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(500);

  const results = [];
  const totalFields = Object.keys(formData).length;
  let currentField = 0;

  for (const [fieldName, value] of Object.entries(formData)) {
    currentField++;

    // 🎨 MOSTRAR PROGRESSO
    if (window.aiVisualFeedback) {
      window.aiVisualFeedback.showProgress(
        `Preenchendo ${fieldName}`,
        currentField,
        totalFields
      );
    }

    // Tentar múltiplos seletores
    const selectors = [
      `[name="${fieldName}"]`,
      `#${fieldName}`,
      `[id*="${fieldName}"]`,
      `[placeholder*="${fieldName}"]`,
      `[aria-label*="${fieldName}"]`,
    ];

    let field = null;
    let usedSelector = null;

    for (const sel of selectors) {
      field = form.querySelector(sel);
      if (field) {
        usedSelector = sel;
        break;
      }
    }

    if (!field) {
      results.push({
        field: fieldName,
        success: false,
        error: 'Campo não encontrado',
      });
      continue;
    }

    // 🎨 HIGHLIGHT CAMPO
    if (window.aiVisualFeedback) {
      window.aiVisualFeedback.highlightElement(usedSelector, 1000);
    }

    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(300);

    // Preencher com efeito de digitação
    field.focus();
    field.value = '';

    if (typeof value === 'string' && value.length > 0) {
      for (let i = 0; i < value.length; i++) {
        field.value += value[i];
        field.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(20);
      }
    } else {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }

    field.dispatchEvent(new Event('change', { bubbles: true }));

    results.push({
      field: fieldName,
      success: true,
      value: field.value,
      selector: usedSelector,
    });

    await sleep(200);
  }

  return {
    success: true,
    filledCount: results.filter(r => r.success).length,
    totalFields: totalFields,
    results: results,
  };
}

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Funções existentes mantidas
async function executeGetPageInfo() {
  return {
    title: document.title,
    url: window.location.href,
    html: document.documentElement.outerHTML.substring(0, 5000),
  };
}

async function executeListTabs() {
  const response = await chrome.runtime.sendMessage({ type: 'LIST_TABS' });
  return response;
}

async function executeJS(code) {
  const result = eval(code);
  return { success: true, result };
}

async function extractTable(data) {
  const tables = document.querySelectorAll('table');
  const results = [];

  tables.forEach(table => {
    const rows = Array.from(table.querySelectorAll('tr'));
    const data = rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td, th')).map(cell =>
        cell.textContent.trim()
      );
      return cells;
    });
    results.push(data);
  });

  return { success: true, tables: results, count: results.length };
}

async function extractImages(data) {
  const images = Array.from(document.querySelectorAll('img')).map(img => ({
    src: img.src,
    alt: img.alt,
    width: img.width,
    height: img.height,
  }));

  return { success: true, images, totalCount: images.length };
}

async function extractLinks(data) {
  const links = Array.from(document.querySelectorAll('a[href]')).map(link => ({
    href: link.href,
    text: link.textContent.trim(),
    title: link.title,
  }));

  return { success: true, links, count: links.length };
}

async function extractEmails() {
  const text = document.body.innerText;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = [...new Set(text.match(emailRegex) || [])];

  return { success: true, emails, count: emails.length };
}

async function extractAllData(data) {
  const result = {
    success: true,
    url: window.location.href,
    title: document.title,
  };

  const links = await extractLinks({});
  const images = await extractImages({});

  result.linkCount = links.count;
  result.imageCount = images.totalCount;

  return result;
}

async function executeWait(ms) {
  await sleep(ms);
  return { waited: true, ms };
}

async function waitForElement(data) {
  const { selector, timeout = 10000 } = data;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      return { success: true, found: true, waitTime: Date.now() - startTime };
    }
    await sleep(100);
  }

  throw new Error(`Timeout aguardando elemento: ${selector}`);
}

// ============================================================================
// LISTENER DE MENSAGENS
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📩 Mensagem recebida:', message);

  if (message.type === 'EXECUTE_COMMAND') {
    // Executar comando de forma assíncrona
    (async () => {
      try {
        const result = await executeDomCommand({
          type: message.command,
          data: message.params,
        });

        sendResponse({ success: true, result });
      } catch (error) {
        console.error('❌ Erro:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Mantém canal aberto para resposta assíncrona
  }

  if (message.type === 'PING') {
    sendResponse({ pong: true, timestamp: Date.now() });
  }
});

console.log('✅ Content Script Enhanced inicializado');
