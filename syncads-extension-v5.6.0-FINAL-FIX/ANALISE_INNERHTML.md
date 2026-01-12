# 🔍 Análise: Por que innerHTML não funciona?

## Problema Atual

✅ **Funciona**: Documento criado, URL capturado  
❌ **Falha**: Conteúdo não aparece no documento

## Causa Raiz

**Google Docs usa CANVAS RENDERING**, não DOM innerHTML!

O editor `.kix-canvas-tile-content` é apenas um container. O conteúdo real é renderizado em:
- Canvas (para visualização)
- Modelo interno do Google Docs (para dados)

## Por que innerHTML falha?

```javascript
element.innerHTML = value; // ❌ Seta HTML mas Google Docs IGNORA
```

O Google Docs:
1. Renderiza via canvas (não lê innerHTML)
2. Usa modelo de dados interno
3. Precisa de eventos específicos para sincronizar

## Soluções Possíveis

### 1. textContent (SIMPLES)
```javascript
element.textContent = value;
```
- Pode funcionar para texto puro
- Perde formatação

### 2. Simulação de Digitação (COMPLEXO)
```javascript
for (let char of value) {
  document.execCommand('insertText', false, char);
  await delay(10);
}
```
- Muito lento
- Mais confiável

### 3. Selection + insertText (RECOMENDADO)
```javascript
const selection = window.getSelection();
const range = document.createRange();
range.selectNodeContents(element);
range.collapse(false);
selection.removeAllRanges();
selection.addRange(range);
document.execCommand('insertText', false, value);
```

### 4. Google Docs API (IDEAL mas precisa OAuth)
- Requer autenticação
- 100% confiável
- Fora de escopo para extensão

## Próxima Tentativa

Vou implementar **Opção 3**: Selection API + insertText
