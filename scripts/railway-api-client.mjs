#!/usr/bin/env node

/**
 * ============================================
 * RAILWAY API CLIENT
 * Gerenciar Railway via GraphQL API
 * ============================================
 */

import https from 'https';

// ============================================
// CONFIGURAÇÃO
// ============================================
const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2';
const PROJECT_ID = '5f47519b-0823-45aa-ab00-bc9bcaaa1c94';
const ENVIRONMENT_ID = '44abe3b5-91e1-4189-b24d-81e2931e5f28';

// Token será passado via variável de ambiente
const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;

if (!RAILWAY_TOKEN) {
    console.error('❌ ERRO: RAILWAY_TOKEN não definido!');
    console.error('');
    console.error('📝 Como obter seu token:');
    console.error('1. Acesse: https://railway.app/account/tokens');
    console.error('2. Clique em "Create New Token"');
    console.error('3. Dê um nome (ex: "CLI-Access")');
    console.error('4. Copie o token');
    console.error('5. Execute:');
    console.error('   $env:RAILWAY_TOKEN="seu_token_aqui"');
    console.error('   node scripts/railway-api-client.mjs [comando]');
    console.error('');
    process.exit(1);
}

// ============================================
// FUNÇÕES API
// ============================================

/**
 * Faz uma chamada GraphQL para a Railway API
 */
async function railwayGraphQL(query, variables = {}) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ query, variables });

        const options = {
            hostname: 'backboard.railway.app',
            path: '/graphql/v2',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'Authorization': `Bearer ${RAILWAY_TOKEN}`,
            },
        };

        const req = https.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (response.errors) {
                        reject(new Error(JSON.stringify(response.errors, null, 2)));
                    } else {
                        resolve(response.data);
                    }
                } catch (err) {
                    reject(err);
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.write(data);
        req.end();
    });
}

/**
 * Obter informações do projeto
 */
async function getProjectInfo() {
    const query = `
    query GetProject($projectId: String!) {
      project(id: $projectId) {
        id
        name
        createdAt
        updatedAt
        services {
          edges {
            node {
              id
              name
              createdAt
            }
          }
        }
      }
    }
  `;

    return await railwayGraphQL(query, { projectId: PROJECT_ID });
}

/**
 * Obter deployments do serviço
 */
async function getDeployments(serviceId) {
    const query = `
    query GetDeployments($projectId: String!, $environmentId: String!) {
      deployments(
        input: {
          projectId: $projectId
          environmentId: $environmentId
        }
      ) {
        edges {
          node {
            id
            status
            createdAt
            meta
            staticUrl
          }
        }
      }
    }
  `;

    return await railwayGraphQL(query, {
        projectId: PROJECT_ID,
        environmentId: ENVIRONMENT_ID
    });
}

/**
 * Trigger redeploy
 */
async function triggerRedeploy(serviceId) {
    const query = `
    mutation ServiceInstanceRedeploy($serviceId: String!, $environmentId: String!) {
      serviceInstanceRedeploy(
        serviceId: $serviceId
        environmentId: $environmentId
      )
    }
  `;

    return await railwayGraphQL(query, {
        serviceId,
        environmentId: ENVIRONMENT_ID
    });
}

/**
 * Obter logs do deployment
 */
async function getDeploymentLogs(deploymentId) {
    const query = `
    query DeploymentLogs($deploymentId: String!) {
      deploymentLogs(deploymentId: $deploymentId) {
        logs
      }
    }
  `;

    return await railwayGraphQL(query, { deploymentId });
}

/**
 * Obter variáveis de ambiente
 */
async function getVariables(serviceId) {
    const query = `
    query Variables($serviceId: String!, $environmentId: String!) {
      variables(serviceId: $serviceId, environmentId: $environmentId)
    }
  `;

    return await railwayGraphQL(query, {
        serviceId,
        environmentId: ENVIRONMENT_ID
    });
}

// ============================================
// COMANDOS CLI
// ============================================

async function cmdStatus() {
    console.log('🔍 Obtendo status do projeto...\n');

    try {
        const data = await getProjectInfo();
        const project = data.project;

        console.log('📊 PROJETO:');
        console.log(`   ID: ${project.id}`);
        console.log(`   Nome: ${project.name}`);
        console.log(`   Criado em: ${new Date(project.createdAt).toLocaleString()}`);
        console.log('');

        console.log('🚀 SERVIÇOS:');
        for (const edge of project.services.edges) {
            const service = edge.node;
            console.log(`   - ${service.name} (ID: ${service.id})`);
        }
        console.log('');

        // Pegar o primeiro serviço
        if (project.services.edges.length > 0) {
            const serviceId = project.services.edges[0].node.id;
            const deployments = await getDeployments(serviceId);

            console.log('📦 ÚLTIMOS DEPLOYMENTS:');
            if (deployments.deployments && deployments.deployments.edges.length > 0) {
                for (const edge of deployments.deployments.edges.slice(0, 5)) {
                    const dep = edge.node;
                    console.log(`   - ${dep.status} | ${new Date(dep.createdAt).toLocaleString()}`);
                    if (dep.staticUrl) {
                        console.log(`     URL: ${dep.staticUrl}`);
                    }
                }
            } else {
                console.log('   Nenhum deployment encontrado');
            }
        }

    } catch (err) {
        console.error('❌ Erro:', err.message);
        process.exit(1);
    }
}

async function cmdRedeploy() {
    console.log('🚀 Iniciando redeploy...\n');

    try {
        const data = await getProjectInfo();
        const project = data.project;

        if (project.services.edges.length === 0) {
            console.error('❌ Nenhum serviço encontrado');
            process.exit(1);
        }

        const serviceId = project.services.edges[0].node.id;
        const serviceName = project.services.edges[0].node.name;

        console.log(`📦 Serviço: ${serviceName}`);
        console.log(`🔄 Triggering redeploy...`);

        const result = await triggerRedeploy(serviceId);

        console.log('✅ Redeploy iniciado!');
        console.log('');
        console.log('⏱️  Aguarde 3-5 minutos para o build completar');
        console.log('📊 Acompanhe em: https://railway.app/project/' + PROJECT_ID);

    } catch (err) {
        console.error('❌ Erro:', err.message);
        process.exit(1);
    }
}

async function cmdLogs() {
    console.log('📋 Obtendo logs...\n');

    try {
        const data = await getProjectInfo();
        const serviceId = data.project.services.edges[0].node.id;
        const deployments = await getDeployments(serviceId);

        if (deployments.deployments.edges.length === 0) {
            console.log('❌ Nenhum deployment encontrado');
            process.exit(1);
        }

        const latestDeployment = deployments.deployments.edges[0].node;
        console.log(`📦 Deployment: ${latestDeployment.id}`);
        console.log(`📊 Status: ${latestDeployment.status}`);
        console.log('');

        const logs = await getDeploymentLogs(latestDeployment.id);

        if (logs.deploymentLogs && logs.deploymentLogs.logs) {
            console.log('📋 LOGS:');
            console.log(logs.deploymentLogs.logs);
        } else {
            console.log('❌ Logs não disponíveis');
        }

    } catch (err) {
        console.error('❌ Erro:', err.message);
        process.exit(1);
    }
}

async function cmdVariables() {
    console.log('🔐 Obtendo variáveis de ambiente...\n');

    try {
        const data = await getProjectInfo();
        const serviceId = data.project.services.edges[0].node.id;
        const variables = await getVariables(serviceId);

        console.log('🔐 VARIÁVEIS:');
        console.log(JSON.stringify(variables, null, 2));

    } catch (err) {
        console.error('❌ Erro:', err.message);
        process.exit(1);
    }
}

function printHelp() {
    console.log('🚂 RAILWAY API CLIENT');
    console.log('');
    console.log('Comandos disponíveis:');
    console.log('  status      - Ver status do projeto e deployments');
    console.log('  redeploy    - Fazer redeploy do serviço');
    console.log('  logs        - Ver logs do último deployment');
    console.log('  variables   - Ver variáveis de ambiente');
    console.log('  help        - Mostrar esta ajuda');
    console.log('');
    console.log('Uso:');
    console.log('  $env:RAILWAY_TOKEN="seu_token"');
    console.log('  node scripts/railway-api-client.mjs [comando]');
    console.log('');
}

// ============================================
// MAIN
// ============================================

async function main() {
    const command = process.argv[2] || 'help';

    switch (command) {
        case 'status':
            await cmdStatus();
            break;
        case 'redeploy':
            await cmdRedeploy();
            break;
        case 'logs':
            await cmdLogs();
            break;
        case 'variables':
            await cmdVariables();
            break;
        case 'help':
        default:
            printHelp();
            break;
    }
}

main().catch((err) => {
    console.error('❌ ERRO FATAL:', err.message);
    process.exit(1);
});
