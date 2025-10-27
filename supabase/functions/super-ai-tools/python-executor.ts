// Python Executor com Deno Subprocess
// Alternativa mais segura usando Deno subprocess

export interface PythonResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
}

export async function executePython(
  code: string,
  libraries: string[] = [],
  timeout: number = 30000
): Promise<PythonResult> {
  const startTime = Date.now();

  try {
    // Preparar imports
    const imports = libraries.length > 0 
      ? `import ${libraries.join(', ')}\n\n` 
      : '';
    
    const fullCode = imports + code;

    // Executar via subprocess do Deno
    const command = new Deno.Command('python3', {
      args: ['-c', fullCode],
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped'
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let output: Uint8Array;
    let errorOutput: Uint8Array;

    try {
      const process = command.spawn();
      
      const [stdout, stderr, status] = await Promise.all([
        process.stdout.getReader().read().then(({ value }) => value),
        process.stderr.getReader().read().then(({ value }) => value),
        process.status
      ]);

      clearTimeout(timeoutId);

      output = stdout || new Uint8Array();
      errorOutput = stderr || new Uint8Array();

      if (!status.success) {
        const errorText = new TextDecoder().decode(errorOutput);
        return {
          success: false,
          output: '',
          error: errorText || 'Erro na execução Python',
          executionTime: Date.now() - startTime
        };
      }

    } catch (error: any) {
      clearTimeout(timeoutId);
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }

    const outputText = new TextDecoder().decode(output);

    return {
      success: true,
      output: outputText.trim(),
      executionTime: Date.now() - startTime
    };

  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message,
      executionTime: Date.now() - startTime
    };
  }
}

// Função helper para executar cálculos matemáticos simples
export async function executeCalculation(expression: string): Promise<number> {
  try {
    // Validar expressão matemática
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    
    const pythonCode = `result = ${sanitized}\nprint(result)`;
    
    const result = await executePython(pythonCode);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return parseFloat(result.output);
  } catch (error: any) {
    throw new Error(`Erro ao calcular: ${error.message}`);
  }
}

