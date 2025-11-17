import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';
export const MoviePyModule: PromptModule = {
  id: 'moviepy-016', name: 'MoviePy', packageName: 'moviepy', version: '1.0.3',
  category: ModuleCategory.VIDEO_PROCESSING,
  subcategories: ['video-editing', 'effects', 'compositing'],
  description: 'Biblioteca para edição de vídeo: cortes, concatenação, efeitos, legendas.',
  purpose: 'Editar vídeos programaticamente', useCases: ['Cortar vídeos', 'Adicionar áudio', 'Aplicar efeitos', 'Concatenar clipes'],
  complexity: ModuleComplexity.INTERMEDIATE, environment: ExecutionEnvironment.PYTHON,
  dependencies: ['numpy', 'imageio', 'decorator'], installCommand: 'pip install moviepy',
  promptSystem: {systemPrompt: 'Especialista em MoviePy. Use VideoFileClip, concatenate_videoclips, sempre feche clips com .close()', userPromptTemplate: 'Edite vídeo: {task_description}', examples: [{input: 'Cortar vídeo', output: 'from moviepy.editor import VideoFileClip\nclip = VideoFileClip("input.mp4").subclip(10, 20)\nclip.write_videofile("output.mp4")'}], outputFormat: {type: 'object', properties: {success: {type: 'boolean'}, output_path: {type: 'string'}}}},
  tags: ['moviepy', 'video', 'editing'], keywords: ['moviepy', 'video', 'edit', 'cut', 'concatenate'],
  performance: {speed: 6, memory: 5, cpuIntensive: true, gpuAccelerated: false, scalability: 6},
  scoring: {baseScore: 0.85, rules: [{condition: 'keywords include ["video", "edit", "cut"]', adjustment: 0.10, description: 'Ideal para edição'}]},
  config: {maxRetries: 1, timeout: 300000, cacheable: false, requiresAuth: false, rateLimit: null},
  alternatives: [{name: 'FFmpeg', when: 'Performance crítica', reason: 'FFmpeg mais rápido'}],
  documentation: {official: 'https://zulko.github.io/moviepy/', examples: 'https://zulko.github.io/moviepy/getting_started/quick_presentation.html', apiReference: 'https://zulko.github.io/moviepy/ref/ref.html'},
  commonIssues: [{issue: 'Memory error', solution: 'Use resize() para reduzir resolução', code: 'clip = clip.resize(0.5)'}],
  bestPractices: ['Sempre feche clips', 'Use resize() para economizar memória', 'Configure codec adequado'],
  stats: {timesUsed: 0, successRate: 0, averageExecutionTime: 0, lastUsed: null, errors: []}
};
export default MoviePyModule;
