// Pague-X: GET /v1/transactions (Basic Auth: publicKey:secretKey)
const paguexAdapter: Adapter = {
  slug: "paguex",
  async verify(credentials, signal) {
    console.log('[PagueX] Iniciando verificação...');
    
    const publicKey = credentials?.publicKey || credentials?.PUBLIC_KEY;
    const secretKey = credentials?.secretKey || credentials?.SECRET_KEY;
    
    console.log('[PagueX] PublicKey presente:', !!publicKey);
    console.log('[PagueX] SecretKey presente:', !!secretKey);
    
    if (!publicKey || !secretKey) {
      return {
        ok: false,
        httpStatus: 400,
        message:
          "Credenciais Pague-X inválidas: publicKey e/ou secretKey ausentes",
      };
    }

    // Gerar Basic Auth: base64(publicKey:secretKey)
    const authString = btoa(`${publicKey}:${secretKey}`);
    console.log('[PagueX] Auth gerado (primeiros chars):', authString.slice(0, 10) + '...');

    // Endpoint de verificação leve (lista transações com limit=1)
    let res: Response | null = null;
    try {
      console.log('[PagueX] Fazendo requisição para API...');
      res = await fetch(
        "https://api.inpagamentos.com/v1/transactions?limit=1",
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${authString}`,
            "Content-Type": "application/json",
          },
          signal,
        },
      );
      console.log('[PagueX] Resposta recebida. Status:', res.status);
    } catch (e: any) {
      console.error('[PagueX] Erro na requisição:', e.message);
      if (e?.name === "AbortError") {
        return { ok: false, httpStatus: 408, message: "Pague-X: timeout (5s)" };
      }
      return {
        ok: false,
        httpStatus: 500,
        message: `Pague-X: erro de conexão - ${e.message}`,
      };
    }

    if (!res) {
      console.error('[PagueX] Resposta vazia');
      return {
        ok: false,
        httpStatus: 500,
        message: "Pague-X: resposta vazia",
      };
    }

    const httpStatus = res.status;
    
    // Sucesso (200-299)
    if (res.ok) {
      console.log('[PagueX] ✅ Credenciais válidas!');
      const data = await res.json().catch(() => ({}));
      const capabilities = {
        credit_card: true,
        pix: true,
        boleto: true,
        wallet: false,
      };
      return {
        ok: true,
        httpStatus,
        message: `Credenciais Pague-X verificadas com sucesso`,
        capabilities,
        metadata: {
          api_version: "v1",
          provider: "inpagamentos.com",
        },
      };
    }

    // Erro HTTP
    const text = await res.text().catch(() => "");
    console.error('[PagueX] ❌ Erro HTTP', httpStatus, ':', text.slice(0, 200));
    
    // Mensagens específicas por código de erro
    let message = `Pague-X: erro ${httpStatus}`;
    if (httpStatus === 401) {
      message = "Pague-X: credenciais inválidas (401 Unauthorized)";
    } else if (httpStatus === 403) {
      message = "Pague-X: acesso negado (403 Forbidden)";
    } else if (httpStatus === 404) {
      message = "Pague-X: endpoint não encontrado (404)";
    } else if (httpStatus === 429) {
      message = "Pague-X: limite de requisições excedido (429)";
    } else if (httpStatus >= 500) {
      message = "Pague-X: erro no servidor (5xx)";
    }
    
    return {
      ok: false,
      httpStatus,
      message,
      metadata: { response_excerpt: text.slice(0, 200) },
    };
  },
};
