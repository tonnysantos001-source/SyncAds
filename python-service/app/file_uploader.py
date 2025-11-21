"""
Utilitário para upload de arquivos para Supabase Storage
e geração de links temporários de download
"""

import os
from typing import Optional
from datetime import timedelta
import httpx
from loguru import logger


class FileUploader:
    """Upload de arquivos para Supabase Storage"""

    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase_url = supabase_url.rstrip("/")
        self.supabase_key = supabase_key
        self.storage_url = f"{self.supabase_url}/storage/v1"
        self.bucket = "ai-generated-files"  # Nome do bucket

    async def upload_file(
        self, file_path: str, file_name: str, user_id: str = "anonymous"
    ) -> Optional[str]:
        """
        Faz upload de arquivo para Supabase Storage
        
        Args:
            file_path: Caminho local do arquivo
            file_name: Nome do arquivo no storage
            user_id: ID do usuário (para organizar por pasta)
            
        Returns:
            URL pública do arquivo ou None se falhar
        """
        try:
            # Ler arquivo
            with open(file_path, "rb") as f:
                file_content = f.read()

            # Path no storage: user_id/timestamp_filename
            timestamp = int(os.path.getmtime(file_path))
            storage_path = f"{user_id}/{timestamp}_{file_name}"

            # Headers para upload
            headers = {
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {self.supabase_key}",
            }

            # Fazer upload
            upload_url = f"{self.storage_url}/object/{self.bucket}/{storage_path}"

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    upload_url, content=file_content, headers=headers
                )

                if response.status_code in [200, 201]:
                    logger.info(f"✅ Arquivo enviado: {storage_path}")

                    # Gerar URL pública assinada (válida por 24h)
                    signed_url = await self.create_signed_url(storage_path, 86400)
                    return signed_url
                else:
                    logger.error(
                        f"❌ Erro no upload: {response.status_code} - {response.text}"
                    )
                    return None

        except Exception as e:
            logger.error(f"❌ Erro ao fazer upload: {e}")
            return None

    async def create_signed_url(self, file_path: str, expires_in: int = 86400) -> str:
        """
        Cria URL assinada temporária para download
        
        Args:
            file_path: Path do arquivo no storage
            expires_in: Tempo de validade em segundos (padrão: 24h)
            
        Returns:
            URL assinada
        """
        try:
            headers = {
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {self.supabase_key}",
                "Content-Type": "application/json",
            }

            # Endpoint para criar signed URL
            signed_url_endpoint = (
                f"{self.storage_url}/object/sign/{self.bucket}/{file_path}"
            )

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    signed_url_endpoint,
                    json={"expiresIn": expires_in},
                    headers=headers,
                )

                if response.status_code == 200:
                    data = response.json()
                    signed_path = data.get("signedURL")
                    
                    # URL completa
                    full_url = f"{self.storage_url}/object/sign/{self.bucket}/{signed_path}"
                    logger.info(f"✅ URL assinada criada (válida por {expires_in}s)")
                    return full_url
                else:
                    logger.error(
                        f"❌ Erro ao criar URL: {response.status_code} - {response.text}"
                    )
                    # Fallback: URL pública (se bucket for público)
                    return f"{self.storage_url}/object/public/{self.bucket}/{file_path}"

        except Exception as e:
            logger.error(f"❌ Erro ao criar signed URL: {e}")
            # Fallback
            return f"{self.storage_url}/object/public/{self.bucket}/{file_path}"


# Função helpers para uso nas ferramentas de IA
async def upload_and_get_link(
    file_path: str, file_name: str, user_id: str = "anonymous"
) -> str:
    """
    Upload de arquivo e retorno de link clicável
    
    Retorna:
        String formatada para markdown com link clicável
    """
    from app.main import SUPABASE_URL, SUPABASE_KEY

    if not SUPABASE_URL or not SUPABASE_KEY:
        return "❌ Configuração de storage não disponível"

    uploader = FileUploader(SUPABASE_URL, SUPABASE_KEY)
    url = await uploader.upload_file(file_path, file_name, user_id)

    if url:
        return f"✅ Arquivo enviado com sucesso!\n\n📥 **[Clique aqui para fazer download]({url})**\n\nLink: `{url}`\n\n⏰ Válido por 24 horas"
    else:
        return "❌ Erro ao fazer upload do arquivo"
