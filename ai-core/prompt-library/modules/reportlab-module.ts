import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';
export const ReportLabModule: PromptModule = {
  id: 'reportlab-018', name: 'ReportLab', packageName: 'reportlab', version: '4.0.0',
  category: ModuleCategory.FILE_PROCESSING,
  subcategories: ['pdf-generation', 'reports', 'documents'],
  description: 'Biblioteca poderosa para geração de PDFs programaticamente: relatórios, faturas, certificados.',
  purpose: 'Criar documentos PDF complexos', useCases: ['Gerar relatórios PDF', 'Faturas', 'Certificados', 'Gráficos em PDF'],
  complexity: ModuleComplexity.INTERMEDIATE, environment: ExecutionEnvironment.PYTHON,
  dependencies: ['pillow'], installCommand: 'pip install reportlab',
  promptSystem: {systemPrompt: 'Especialista em ReportLab. Use canvas ou platypus, configure pagesize, sempre salve com .save()', userPromptTemplate: 'Gere PDF: {task_description}', examples: [{input: 'PDF simples', output: 'from reportlab.pdfgen import canvas\nc = canvas.Canvas("output.pdf")\nc.drawString(100, 750, "Hello PDF")\nc.save()'}], outputFormat: {type: 'object', properties: {success: {type: 'boolean'}, pdf_path: {type: 'string'}}}},
  tags: ['reportlab', 'pdf', 'document'], keywords: ['reportlab', 'pdf', 'document', 'report', 'invoice'],
  performance: {speed: 8, memory: 7, cpuIntensive: false, gpuAccelerated: false, scalability: 8},
  scoring: {baseScore: 0.92, rules: [{condition: 'keywords include ["pdf", "document", "report"]', adjustment: 0.08, description: 'Ideal para PDFs'}]},
  config: {maxRetries: 2, timeout: 30000, cacheable: true, requiresAuth: false, rateLimit: null},
  alternatives: [{name: 'WeasyPrint', when: 'HTML para PDF', reason: 'WeasyPrint converte HTML'}],
  documentation: {official: 'https://www.reportlab.com/docs/reportlab-userguide.pdf', examples: 'https://www.reportlab.com/documentation/', apiReference: 'https://www.reportlab.com/docs/reportlab-reference.pdf'},
  commonIssues: [{issue: 'Font not found', solution: 'Use fonts padrão ou registre font', code: 'from reportlab.pdfbase import pdfmetrics'}],
  bestPractices: ['Use platypus para layouts complexos', 'Configure pagesize corretamente', 'Otimize imagens antes de adicionar'],
  stats: {timesUsed: 0, successRate: 0, averageExecutionTime: 0, lastUsed: null, errors: []}
};
export default ReportLabModule;
