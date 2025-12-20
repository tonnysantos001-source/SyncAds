// Script Node.js para inserir as 3 IAs do Grok
// Execute: node inserir_ias_grok.js

const https = require('https');

const SUPABASE_URL = 'https://ovskepqggmxlfckxqgbr.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDgyNDg1NSwiZXhwIjoyMDc2NDAwODU1fQ.ORCz0Wm7OMfmWWGjHw2LcOz_vZ6AJRAzrqjNgqCKMNc';

const ias = [
    {
        name: 'Grok Thinker - Llama 3.3 70B',
        provider: 'GROQ',
        apiKey: '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',
        baseUrl: 'https://api.groq.com/openai/v1',
        model: 'llama-3.3-70b-versatile',
        maxTokens: 4096,
        temperature: 0.5,
        aiRole: 'REASONING',
        isActive: true
    },
    {
        name: 'Grok Critic - Llama 3.1 8B',
        provider: 'GROQ',
        apiKey: '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',
        baseUrl: 'https://api.groq.com/openai/v1',
        model: 'llama-3.1-8b-instant',
        maxTokens: 2048,
        temperature: 0.3,
        aiRole: 'GENERAL',
        isActive: true
    },
    {
        name: 'Grok Executor - Llama 3.3 70B',
        provider: 'GROQ',
        apiKey: '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',
        baseUrl: 'https://api.groq.com/openai/v1',
        model: 'llama-3.3-70b-versatile',
        maxTokens: 4096,
        temperature: 0.7,
        aiRole: 'EXECUTOR',
        isActive: true
    }
];

async function inserirIA(ia) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(ia);

        const options = {
            hostname: 'ovskepqggmxlfckxqgbr.supabase.co',
            port: 443,
            path: '/rest/v1/GlobalAiConnection',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Prefer': 'return=representation'
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 201) {
                    console.log(`✅ Inserido: ${ia.name}`);
                    console.log(`   - Modelo: ${ia.model}`);
                    console.log(`   - Role: ${ia.aiRole}`);
                    console.log(`   - Temp: ${ia.temperature}\n`);
                    resolve(JSON.parse(responseData));
                } else {
                    console.error(`❌ Erro ao inserir ${ia.name}:`, res.statusCode);
                    console.error(responseData);
                    reject(new Error(responseData));
                }
            });
        });

        req.on('error', (error) => {
            console.error(`❌ Erro de rede:`, error);
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

async function main() {
    console.log('🚀 Iniciando inserção das 3 IAs Grok...\n');

    for (const ia of ias) {
        try {
            await inserirIA(ia);
            await new Promise(resolve => setTimeout(resolve, 500)); // Delay entre inserções
        } catch (error) {
            // Continua mesmo com erro
        }
    }

    console.log('\n🎉 Processo concluído! Verifique o painel Super Admin.');
}

main();
