import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';
export const PydubModule: PromptModule = {
  id: 'pydub-017', name: 'Pydub', packageName: 'pydub', version: '0.25.1',
  category: ModuleCategory.AUDIO_PROCESSING,
  subcategories: ['audio-editing', 'format-conversion', 'effects'],
  description: 'Biblioteca simples para manipulação de áudio: cortar, concatenar, converter formatos, aplicar efeitos.',
  purpose: 'Processar arquivos de áudio facilmente', useCases: ['Converter MP3/WAV', 'Cortar áudio', 'Ajustar volume', 'Concatenar arquivos'],
  complexity: ModuleComplexity.BASIC, environment: ExecutionEnvironment.PYTHON,
  dependencies: ['ffmpeg'], installCommand: 'pip install pydub',
  promptSystem: {systemPrompt: 'Especialista em Pydub. Use AudioSegment, export() para salvar, configure ffmpeg path se necessário', userPromptTemplate: 'Processe áudio: {task_description}', examples: [{input: 'Cortar áudio', output: 'from pydub import AudioSegment\naudio = AudioSegment.from_mp3("input.mp3")\ncut = audio[10000:20000]\ncut.export("output.mp3", format="mp3")'}], outputFormat: {type: 'object', properties: {success: {type: 'boolean'}, output_path: {type: 'string'}}}},
  tags: ['pydub', 'audio', 'mp3', 'wav'], keywords: ['pydub', 'audio', 'mp3', 'wav', 'sound', 'music'],
  performance: {speed: 7, memory: 7, cpuIntensive: false, gpuAccelerated: false, scalability: 7},
  scoring: {baseScore: 0.90, rules: [{condition: 'keywords include ["audio", "mp3", "wav", "sound"]', adjustment: 0.08, description: 'Perfeito para áudio'}]},
  config: {maxRetries: 2, timeout: 60000, cacheable: false, requiresAuth: false, rateLimit: null},
  alternatives: [{name: 'librosa', when: 'Análise de áudio científica', reason: 'librosa para análise avançada'}],
  documentation: {official: 'https://github.com/jiaaro/pydub', examples: 'https://github.com/jiaaro/pydub#quick-start', apiReference: 'https://github.com/jiaaro/pydub/blob/master/API.markdown'},
  commonIssues: [{issue: 'FFmpeg not found', solution: 'Install ffmpeg', code: 'AudioSegment.converter = "/path/to/ffmpeg"'}],
  bestPractices: ['Instale FFmpeg', 'Use from_mp3/from_wav corretos', 'Configure bitrate ao exportar'],
  stats: {timesUsed: 0, successRate: 0, averageExecutionTime: 0, lastUsed: null, errors: []}
};
export default PydubModule;
