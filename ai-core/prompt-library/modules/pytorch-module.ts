/**
 * PYTORCH MODULE - Deep Learning Framework
 */
import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';

export const PyTorchModule: PromptModule = {
  id: 'pytorch-013',
  name: 'PyTorch',
  packageName: 'torch',
  version: '2.1.0',
  category: ModuleCategory.DEEP_LEARNING,
  subcategories: ['neural-networks', 'computer-vision', 'nlp', 'training', 'inference'],
  description: 'Framework de deep learning desenvolvido pelo Facebook. API Pythônica, computação dinâmica, forte em pesquisa e produção.',
  purpose: 'Construir e treinar redes neurais profundas, fazer inferência com modelos DL',
  useCases: ['Treinar redes neurais', 'Computer vision (CNNs)', 'NLP (RNNs, Transformers)', 'Transfer learning', 'Inferência de modelos'],
  complexity: ModuleComplexity.ADVANCED,
  environment: ExecutionEnvironment.PYTHON,
  dependencies: ['numpy'],
  installCommand: 'pip install torch torchvision torchaudio',
  promptSystem: {
    systemPrompt: 'Especialista em PyTorch. Use torch.nn para modelos, DataLoader para dados, GPU quando disponível (.cuda()), sempre faça model.eval() para inferência.',
    userPromptTemplate: 'Tarefa: {task_description}\nUse PyTorch para deep learning.',
    examples: [{input: 'Criar rede neural simples', output: 'import torch\nimport torch.nn as nn\nclass Net(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.fc1 = nn.Linear(10, 64)\n        self.fc2 = nn.Linear(64, 2)\n    def forward(self, x):\n        x = torch.relu(self.fc1(x))\n        return self.fc2(x)'}],
    outputFormat: {type: 'object', properties: {success: {type: 'boolean'}, model: {type: 'any'}, metrics: {type: 'object'}}}
  },
  tags: ['pytorch', 'deep-learning', 'neural-networks', 'ai', 'ml'],
  keywords: ['pytorch', 'torch', 'deep learning', 'neural network', 'cnn', 'rnn', 'transformer', 'gpu'],
  performance: {speed: 9, memory: 6, cpuIntensive: true, gpuAccelerated: true, scalability: 9},
  scoring: {
    baseScore: 0.85,
    rules: [
      {condition: 'keywords include ["neural", "deep learning", "cnn", "rnn"]', adjustment: 0.10, description: 'Perfeito para DL'},
      {condition: 'keywords include ["gpu", "cuda"]', adjustment: 0.05, description: 'Suporte nativo a GPU'},
      {condition: 'keywords include ["simple ml", "linear regression"]', adjustment: -0.30, description: 'Use scikit-learn para ML clássico'}
    ]
  },
  config: {maxRetries: 1, timeout: 300000, cacheable: true, requiresAuth: false, rateLimit: null},
  alternatives: [{name: 'TensorFlow', when: 'Produção enterprise, TPU', reason: 'TensorFlow mais maduro para produção'}],
  documentation: {official: 'https://pytorch.org/docs/', examples: 'https://pytorch.org/tutorials/', apiReference: 'https://pytorch.org/docs/stable/nn.html'},
  commonIssues: [{issue: 'CUDA out of memory', solution: 'Reduzir batch size ou usar gradient checkpointing', code: 'torch.cuda.empty_cache()'}],
  bestPractices: ['Use DataLoader', 'model.eval() para inferência', 'with torch.no_grad() para economizar memória', 'Mova tensores para GPU: .cuda()'],
  stats: {timesUsed: 0, successRate: 0, averageExecutionTime: 0, lastUsed: null, errors: []}
};
export default PyTorchModule;
