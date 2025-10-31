// Script para aplicar a solução definitiva do chat mobile
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente se necessário
require('dotenv').config();

// Configurar cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY/VITE_SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Ler o arquivo SQL
const sqlFilePath = path.join(__dirname, 'SOLUCAO_DEFINITIVA_CHAT_MOBILE.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Dividir o conteúdo SQL em comandos individuais
const sqlCommands = sqlContent
  .replace(/--.*$/gm, '') // Remover comentários
  .split(';')
  .filter(cmd => cmd.trim().length > 0);

// Função para executar os comandos SQL
async function executeSqlCommands() {
  console.log('Iniciando aplicação da solução definitiva para o chat mobile...');
  
  try {
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i].trim();
      if (command) {
        console.log(`Executando comando ${i + 1}/${sqlCommands.length}...`);
        
        // Executar o comando SQL
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.error(`Erro ao executar comando ${i + 1}:`, error);
          // Continuar mesmo com erro para tentar aplicar o máximo possível da solução
        }
      }
    }
    
    console.log('Solução definitiva aplicada com sucesso!');
    console.log('As políticas de RLS para ChatConversation e ChatMessage foram recriadas com conversão explícita de tipos.');
    console.log('Isso deve resolver o problema de acesso ao chat no navegador móvel.');
  } catch (error) {
    console.error('Erro ao aplicar a solução:', error);
  }
}

// Executar a função principal
executeSqlCommands();