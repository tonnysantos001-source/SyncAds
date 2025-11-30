"""
AI Key Manager - Busca keys do GlobalAiConnection (Supabase)
Em vez de env vars, usa as keys configuradas no painel admin
"""
import os
from typing import Optional, Dict
from loguru import logger

# Cache de keys em memória (evita query toda vez)
_keys_cache: Dict[str, Optional[str]] = {}
_cache_timestamp = 0

def get_ai_keys_from_supabase(supabase_client) -> Dict[str, Optional[str]]:
    """
    Busca keys do banco de dados GlobalAiConnection
    
    Returns:
        Dict com keys: anthropic, openai, groq
    """
    global _keys_cache, _cache_timestamp
    import time
    
    # Cache por 5 minutos
    if time.time() - _cache_timestamp < 300 and _keys_cache:
        return _keys_cache
    
    try:
        # Buscar da tabela GlobalAiConnection
        response = supabase_client.table("GlobalAiConnection")\
            .select("provider, api_key, is_active")\
            .eq("is_active", True)\
            .execute()
        
        keys = {
            "anthropic": None,
            "openai": None,
            "groq": None
        }
        
        for row in response.data:
            provider = row.get("provider", "").lower()
            api_key = row.get("api_key")
            
            if provider in keys and api_key:
                keys[provider] = api_key
                logger.info(f"✅ Loaded {provider} key from database")
        
        _keys_cache = keys
        _cache_timestamp = time.time()
        
        return keys
        
    except Exception as e:
        logger.error(f"❌ Error loading AI keys from database: {e}")
        # Fallback para env vars
        return {
            "anthropic": os.getenv("ANTHROPIC_API_KEY"),
            "openai": os.getenv("OPENAI_API_KEY"),
            "groq": os.getenv("GROQ_API_KEY"),
        }

def get_anthropic_key(supabase_client) -> Optional[str]:
    """Get Anthropic API key"""
    keys = get_ai_keys_from_supabase(supabase_client)
    return keys.get("anthropic")

def get_openai_key(supabase_client) -> Optional[str]:
    """Get OpenAI API key"""
    keys = get_ai_keys_from_supabase(supabase_client)
    return keys.get("openai")

def get_groq_key(supabase_client) -> Optional[str]:
    """Get Groq API key"""
    keys = get_ai_keys_from_supabase(supabase_client)
    return keys.get("groq")

def clear_cache():
    """Clear keys cache (útil para testes)"""
    global _keys_cache, _cache_timestamp
    _keys_cache = {}
    _cache_timestamp = 0
    logger.info("🔄 AI keys cache cleared")

def get_active_ai_config(supabase_client) -> Optional[Dict]:
    """
    Busca configuração completa da IA ativa global DO SUPABASE
    Retorna provider, apiKey, model, etc.
    """
    if not supabase_client:
        logger.warning("Supabase not configured, using env fallback")
        return {
            "provider": "ANTHROPIC",
            "apiKey": os.getenv("ANTHROPIC_API_KEY", "placeholder"),
            "model": "claude-3-haiku-20240307",
            "maxTokens": 4096,
            "temperature": 0.7,
        }

    try:
        # Buscar da tabela GlobalAiConnection
        response = (
            supabase_client.table("GlobalAiConnection")
            .select("*")
            .eq("isActive", True)
            .order("createdAt", desc=False)
            .limit(1)
            .execute()
        )

        if response.data and len(response.data) > 0:
            ai_config = response.data[0]
            logger.info(
                f"✅ IA Global encontrada: {ai_config['name']} "
                f"({ai_config['provider']} - {ai_config.get('model', 'default')})"
            )

            return {
                "provider": ai_config["provider"],
                "apiKey": ai_config["apiKey"],
                "model": ai_config.get("model", "claude-3-haiku-20240307"),
                "maxTokens": ai_config.get("maxTokens", 4096),
                "temperature": float(ai_config.get("temperature", 0.7)),
                "systemPrompt": ai_config.get("systemPrompt"),
                "name": ai_config.get("name", "Global AI"),
            }

        logger.warning("⚠️ Nenhuma IA Global ativa encontrada no Supabase")
        return None

    except Exception as e:
        logger.error(f"❌ Erro ao buscar IA config do Supabase: {e}")
        return None
