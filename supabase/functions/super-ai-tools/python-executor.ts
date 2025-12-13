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
    const pythonServiceUrl = Deno.env.get("PYTHON_SERVICE_URL") || "https://python-service-production.up.railway.app";
    const endpoint = `${pythonServiceUrl}/api/browser-automation/execute-python`;

    console.log(`🐍 Executing Python via Service: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        libraries,
        timeout: Math.floor(timeout / 1000)
      }),
    });

    if (!response.ok) {
      throw new Error(`Service Error ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();

    return {
      success: result.success,
      output: result.output || "",
      error: result.error,
      executionTime: Date.now() - startTime
    };

  } catch (error: any) {
    console.error("Python Service execution failed:", error);
    return {
      success: false,
      output: '',
      error: `Python Service Error: ${error.message}`,
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

