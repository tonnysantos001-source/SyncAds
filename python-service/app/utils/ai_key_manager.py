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
