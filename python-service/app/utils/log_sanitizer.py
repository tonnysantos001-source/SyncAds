"""
============================================
LOG SANITIZER - Security & Privacy
============================================

Sanitiza logs para prevenir exposição de secrets, tokens,
senhas e informações sensíveis.

Recursos:
- Remove API keys, tokens, passwords
- Redação de CPF, email, telefone
- Preserva formato para debugging
- Integração com Loguru
============================================
"""

import re
from typing import Any, Dict, List, Union

# ==========================================
# PATTERNS DE DADOS SENSÍVEIS
# ==========================================

# Secrets e credenciais
SECRET_PATTERNS = [
    # API Keys
    (r"api[_-]?key['\"]?\s*[:=]\s*['\"]?([a-zA-Z0-9_\-]{20,})", "[API_KEY_REDACTED]"),
    (r"apikey['\"]?\s*[:=]\s*['\"]?([a-zA-Z0-9_\-]{20,})", "[API_KEY_REDACTED]"),
    # Tokens
    (r"token['\"]?\s*[:=]\s*['\"]?([a-zA-Z0-9_\-\.]{20,})", "[TOKEN_REDACTED]"),
    (
        r"access[_-]?token['\"]?\s*[:=]\s*['\"]?([a-zA-Z0-9_\-\.]{20,})",
        "[TOKEN_REDACTED]",
    ),
    (r"bearer\s+([a-zA-Z0-9_\-\.]{20,})", "bearer [TOKEN_REDACTED]"),
    # Passwords
    (r"password['\"]?\s*[:=]\s*['\"]?([^\s'\"]+)", "[PASSWORD_REDACTED]"),
    (r"passwd['\"]?\s*[:=]\s*['\"]?([^\s'\"]+)", "[PASSWORD_REDACTED]"),
    (r"pwd['\"]?\s*[:=]\s*['\"]?([^\s'\"]+)", "[PASSWORD_REDACTED]"),
    # Secrets
    (r"secret['\"]?\s*[:=]\s*['\"]?([a-zA-Z0-9_\-]{20,})", "[SECRET_REDACTED]"),
    (
        r"client[_-]?secret['\"]?\s*[:=]\s*['\"]?([a-zA-Z0-9_\-]{20,})",
        "[SECRET_REDACTED]",
    ),
    # Private keys
    (r"private[_-]?key['\"]?\s*[:=]\s*['\"]?([^\s'\"]+)", "[PRIVATE_KEY_REDACTED]"),
    (
        r"-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----.*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----",
        "[PRIVATE_KEY_REDACTED]",
    ),
    # AWS
    (
        r"aws[_-]?access[_-]?key[_-]?id['\"]?\s*[:=]\s*['\"]?([A-Z0-9]{20})",
        "[AWS_KEY_REDACTED]",
    ),
    (
        r"aws[_-]?secret[_-]?access[_-]?key['\"]?\s*[:=]\s*['\"]?([a-zA-Z0-9/+=]{40})",
        "[AWS_SECRET_REDACTED]",
    ),
    # Stripe
    (r"sk_live_[a-zA-Z0-9]{24,}", "[STRIPE_SECRET_REDACTED]"),
    (r"pk_live_[a-zA-Z0-9]{24,}", "[STRIPE_PUBLIC_REDACTED]"),
    # Database URLs
    (r"postgresql://[^:]+:([^@]+)@", "postgresql://user:[PASSWORD_REDACTED]@"),
    (r"mysql://[^:]+:([^@]+)@", "mysql://user:[PASSWORD_REDACTED]@"),
    (r"mongodb://[^:]+:([^@]+)@", "mongodb://user:[PASSWORD_REDACTED]@"),
    # Generic auth headers
    (r"authorization['\"]?\s*:\s*['\"]?([^\s'\"]+)", "authorization: [AUTH_REDACTED]"),
]

# PII (Personally Identifiable Information)
PII_PATTERNS = [
    # CPF (formato: 123.456.789-00)
    (r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b", "[CPF_REDACTED]"),
    # CPF (formato sem pontuação: 12345678900)
    (r"\b\d{11}\b", "[CPF_REDACTED]"),
    # CNPJ (formato: 12.345.678/0001-00)
    (r"\b\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}\b", "[CNPJ_REDACTED]"),
    # Email (parcial - mantém domínio para debug)
    (r"([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})", r"[EMAIL_REDACTED]@\2"),
    # Telefone brasileiro
    (r"\+?55\s*\(?\d{2}\)?\s*\d{4,5}-?\d{4}", "[PHONE_REDACTED]"),
    # Cartão de crédito
    (r"\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b", "[CARD_REDACTED]"),
    # CVV
    (r"cvv['\"]?\s*[:=]\s*['\"]?\d{3,4}", "cvv: [CVV_REDACTED]"),
]

# Headers comuns que contêm secrets
SENSITIVE_HEADERS = [
    "authorization",
    "x-api-key",
    "api-key",
    "apikey",
    "x-auth-token",
    "x-access-token",
    "cookie",
    "set-cookie",
]


# ==========================================
# FUNÇÕES DE SANITIZAÇÃO
# ==========================================


def sanitize_string(text: str, include_pii: bool = False) -> str:
    """
    Sanitiza uma string removendo secrets e opcionalmente PII

    Args:
        text: Texto a ser sanitizado
        include_pii: Se True, também remove PII (CPF, email, etc)

    Returns:
        Texto sanitizado
    """
    if not isinstance(text, str):
        return text

    sanitized = text

    # Remove secrets
    for pattern, replacement in SECRET_PATTERNS:
        sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)

    # Remove PII se solicitado
    if include_pii:
        for pattern, replacement in PII_PATTERNS:
            sanitized = re.sub(pattern, replacement, sanitized)

    return sanitized


def sanitize_dict(data: Dict[str, Any], include_pii: bool = False) -> Dict[str, Any]:
    """
    Sanitiza um dicionário recursivamente

    Args:
        data: Dicionário a ser sanitizado
        include_pii: Se True, também remove PII

    Returns:
        Dicionário sanitizado
    """
    if not isinstance(data, dict):
        return data

    sanitized = {}

    for key, value in data.items():
        # Checa se a chave indica dado sensível
        key_lower = key.lower()

        # Headers sensíveis
        if key_lower in SENSITIVE_HEADERS:
            sanitized[key] = "[REDACTED]"
            continue

        # Chaves com secrets
        if any(
            pattern in key_lower
            for pattern in ["password", "secret", "token", "key", "auth", "credential"]
        ):
            sanitized[key] = "[REDACTED]"
            continue

        # PII keys
        if include_pii and any(
            pattern in key_lower
            for pattern in ["cpf", "cnpj", "ssn", "credit_card", "cvv"]
        ):
            sanitized[key] = "[REDACTED]"
            continue

        # Processa valor recursivamente
        if isinstance(value, dict):
            sanitized[key] = sanitize_dict(value, include_pii)
        elif isinstance(value, list):
            sanitized[key] = sanitize_list(value, include_pii)
        elif isinstance(value, str):
            sanitized[key] = sanitize_string(value, include_pii)
        else:
            sanitized[key] = value

    return sanitized


def sanitize_list(data: List[Any], include_pii: bool = False) -> List[Any]:
    """
    Sanitiza uma lista recursivamente

    Args:
        data: Lista a ser sanitizada
        include_pii: Se True, também remove PII

    Returns:
        Lista sanitizada
    """
    if not isinstance(data, list):
        return data

    sanitized = []

    for item in data:
        if isinstance(item, dict):
            sanitized.append(sanitize_dict(item, include_pii))
        elif isinstance(item, list):
            sanitized.append(sanitize_list(item, include_pii))
        elif isinstance(item, str):
            sanitized.append(sanitize_string(item, include_pii))
        else:
            sanitized.append(item)

    return sanitized


def sanitize(data: Any, include_pii: bool = False) -> Any:
    """
    Sanitiza qualquer tipo de dado

    Args:
        data: Dados a serem sanitizados (str, dict, list, etc)
        include_pii: Se True, também remove PII

    Returns:
        Dados sanitizados
    """
    if isinstance(data, str):
        return sanitize_string(data, include_pii)
    elif isinstance(data, dict):
        return sanitize_dict(data, include_pii)
    elif isinstance(data, list):
        return sanitize_list(data, include_pii)
    else:
        return data


# ==========================================
# INTEGRAÇÃO COM LOGURU
# ==========================================


def sanitize_log_record(record: Dict[str, Any]) -> str:
    """
    Sanitiza um log record do Loguru

    Args:
        record: Record do Loguru

    Returns:
        Mensagem sanitizada
    """
    # Sanitiza a mensagem
    message = record.get("message", "")
    sanitized_message = sanitize_string(message, include_pii=False)

    # Sanitiza extras se existirem
    if "extra" in record and isinstance(record["extra"], dict):
        sanitized_extra = sanitize_dict(record["extra"], include_pii=False)
        return f"{sanitized_message} | {sanitized_extra}"

    return sanitized_message


def create_loguru_filter(include_pii: bool = False):
    """
    Cria um filtro para Loguru que sanitiza automaticamente

    Usage:
        from loguru import logger
        logger.add(
            sys.stderr,
            filter=create_loguru_filter(include_pii=False)
        )

    Args:
        include_pii: Se True, também remove PII

    Returns:
        Função de filtro para Loguru
    """

    def sanitize_filter(record):
        # Sanitiza a mensagem
        record["message"] = sanitize_string(record["message"], include_pii)

        # Sanitiza extras
        if "extra" in record:
            record["extra"] = sanitize_dict(record["extra"], include_pii)

        return True

    return sanitize_filter


# ==========================================
# TESTES E EXEMPLOS
# ==========================================


def test_sanitizer():
    """Testa o sanitizador com dados de exemplo"""

    # Teste 1: API Keys
    text1 = "Using api_key='sk_live_123456789abcdefghijklmnop' for Stripe"
    print(f"Original: {text1}")
    print(f"Sanitized: {sanitize_string(text1)}\n")

    # Teste 2: Tokens
    text2 = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0"
    print(f"Original: {text2}")
    print(f"Sanitized: {sanitize_string(text2)}\n")

    # Teste 3: Passwords
    text3 = "Login with password=MySecretP@ss123"
    print(f"Original: {text3}")
    print(f"Sanitized: {sanitize_string(text3)}\n")

    # Teste 4: Dicionário com secrets
    data = {
        "user": "john@example.com",
        "api_key": "sk_test_123456789",
        "password": "secret123",
        "metadata": {"token": "Bearer abc123def456", "public_data": "visible"},
    }
    print(f"Original: {data}")
    print(f"Sanitized: {sanitize_dict(data)}\n")

    # Teste 5: PII
    text5 = "CPF: 123.456.789-00 e email: user@example.com"
    print(f"Original: {text5}")
    print(f"Sanitized (without PII): {sanitize_string(text5, include_pii=False)}")
    print(f"Sanitized (with PII): {sanitize_string(text5, include_pii=True)}\n")


if __name__ == "__main__":
    test_sanitizer()
