/**
 * SyncAds - Teste Simples
 * Versão minimal para debug
 */

console.log('========================================');
console.log('🚀 SYNCADS SCRIPT CARREGADO!');
console.log('========================================');
console.log('Timestamp:', new Date().toISOString());
console.log('URL:', window.location.href);
console.log('Shopify?', window.Shopify ? 'SIM' : 'NÃO');
if (window.Shopify) {
  console.log('Shop:', window.Shopify.shop);
}
console.log('========================================');

// Função de teste
window.testSyncAds = function() {
  alert('✅ Script SyncAds está funcionando!');
  console.log('✅ Teste executado com sucesso!');
};

console.log('💡 Para testar, digite no console: testSyncAds()');
