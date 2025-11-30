"""
Test script to verify AI keys are loaded from database
"""
import os
from supabase import create_client

# Configurar Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ovskepqggmxlfckxqgbr.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")

def test_load_keys():
    """Test loading AI keys from database"""
    print("🔍 Testing AI Keys from Database...")
    print(f"Supabase URL: {SUPABASE_URL}")
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Query GlobalAiConnection
        response = supabase.table("GlobalAiConnection")\
            .select("provider, is_active, created_at")\
            .execute()
        
        print(f"\n✅ Query successful!")
        print(f"Total rows: {len(response.data)}")
        
        for row in response.data:
            provider = row.get("provider")
            is_active = row.get("is_active")
            has_key = "api_key" in row and row["api_key"] is not None
            
            status = "🟢" if is_active and has_key else "🔴"
            print(f"{status} {provider}: Active={is_active}, HasKey={has_key}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_load_keys()
