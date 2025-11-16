# ============================================
# SYNCADS EXTENSION - BACKEND ENDPOINTS
# Router para comunicação com extensão Chrome
# ============================================

import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from supabase import Client, create_client

router = APIRouter(prefix="/api/extension", tags=["extension"])


# ============================================
# SUPABASE CLIENT
# ============================================
def get_supabase() -> Client:
    """Obter cliente Supabase"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise HTTPException(status_code=500, detail="Supabase não configurado")

    return create_client(url, key)


# ============================================
# MODELS
# ============================================
class DeviceRegister(BaseModel):
    deviceId: str
    userId: str
    browser: Optional[Dict[str, Any]] = None
    version: Optional[str] = "1.0.0"
    timestamp: Optional[int] = None


class CommandResult(BaseModel):
    deviceId: str
    commandId: str
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None
    timestamp: Optional[int] = None


class ExtensionLog(BaseModel):
    deviceId: str
    userId: str
    level: str = "info"
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: Optional[int] = None


class CommandCreate(BaseModel):
    userId: str
    deviceId: str
    type: str
    data: Dict[str, Any]
    priority: Optional[int] = 5


# ============================================
# ENDPOINTS
# ============================================


@router.get("/health")
async def health_check():
    """Health check do serviço de extensão"""
    return {
        "status": "ok",
        "service": "extension",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/register")
async def register_device(device: DeviceRegister):
    """
    Registrar ou atualizar dispositivo de extensão
    """
    try:
        supabase = get_supabase()

        # Verificar se dispositivo já existe
        existing = (
            supabase.table("extension_devices")
            .select("*")
            .eq("device_id", device.deviceId)
            .execute()
        )

        device_data = {
            "device_id": device.deviceId,
            "user_id": device.userId,
            "browser_info": device.browser or {},
            "version": device.version,
            "status": "active",
            "last_seen": datetime.utcnow().isoformat(),
        }

        if existing.data and len(existing.data) > 0:
            # Atualizar existente
            result = (
                supabase.table("extension_devices")
                .update(device_data)
                .eq("device_id", device.deviceId)
                .execute()
            )
        else:
            # Criar novo
            result = supabase.table("extension_devices").insert(device_data).execute()

        return {
            "success": True,
            "deviceId": device.deviceId,
            "message": "Dispositivo registrado com sucesso",
        }

    except Exception as e:
        print(f"❌ Erro ao registrar dispositivo: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/commands/{device_id}")
async def get_commands(device_id: str, limit: int = 10):
    """
    Buscar comandos pendentes para um dispositivo
    """
    try:
        supabase = get_supabase()

        # Buscar comandos pendentes
        result = (
            supabase.table("extension_commands")
            .select("*")
            .eq("device_id", device_id)
            .eq("status", "pending")
            .order("priority", desc=True)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )

        commands = result.data or []

        # Atualizar status para "processing"
        if commands:
            command_ids = [cmd["id"] for cmd in commands]
            supabase.table("extension_commands").update(
                {"status": "processing", "started_at": datetime.utcnow().isoformat()}
            ).in_("id", command_ids).execute()

        return {"success": True, "commands": commands, "count": len(commands)}

    except Exception as e:
        print(f"❌ Erro ao buscar comandos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/result")
async def submit_result(result: CommandResult):
    """
    Enviar resultado de execução de comando
    """
    try:
        supabase = get_supabase()

        # Atualizar comando com resultado
        update_data = {
            "status": "completed" if result.success else "failed",
            "result": result.result,
            "error": result.error,
            "completed_at": datetime.utcnow().isoformat(),
        }

        supabase.table("extension_commands").update(update_data).eq(
            "id", result.commandId
        ).execute()

        return {"success": True, "message": "Resultado registrado com sucesso"}

    except Exception as e:
        print(f"❌ Erro ao registrar resultado: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/log")
async def submit_log(log: ExtensionLog):
    """
    Enviar log da extensão
    """
    try:
        supabase = get_supabase()

        log_data = {
            "device_id": log.deviceId,
            "user_id": log.userId,
            "level": log.level,
            "message": log.message,
            "data": log.data or {},
            "timestamp": datetime.utcnow().isoformat(),
        }

        supabase.table("extension_logs").insert(log_data).execute()

        return {"success": True, "message": "Log registrado"}

    except Exception as e:
        print(f"❌ Erro ao registrar log: {e}")
        # Não falhar por erro de log
        return {"success": False, "error": str(e)}


@router.post("/command")
async def create_command(command: CommandCreate):
    """
    Criar novo comando para extensão (usado pela IA)
    """
    try:
        supabase = get_supabase()

        command_data = {
            "user_id": command.userId,
            "device_id": command.deviceId,
            "type": command.type,
            "data": command.data,
            "priority": command.priority,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
        }

        result = supabase.table("extension_commands").insert(command_data).execute()

        return {
            "success": True,
            "commandId": result.data[0]["id"] if result.data else None,
            "message": "Comando criado com sucesso",
        }

    except Exception as e:
        print(f"❌ Erro ao criar comando: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/devices/{user_id}")
async def get_user_devices(user_id: str):
    """
    Listar dispositivos de um usuário
    """
    try:
        supabase = get_supabase()

        result = (
            supabase.table("extension_devices")
            .select("*")
            .eq("user_id", user_id)
            .order("last_seen", desc=True)
            .execute()
        )

        devices = result.data or []

        return {"success": True, "devices": devices, "count": len(devices)}

    except Exception as e:
        print(f"❌ Erro ao listar dispositivos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/device/{device_id}")
async def delete_device(device_id: str):
    """
    Remover dispositivo
    """
    try:
        supabase = get_supabase()

        supabase.table("extension_devices").delete().eq(
            "device_id", device_id
        ).execute()

        return {"success": True, "message": "Dispositivo removido"}

    except Exception as e:
        print(f"❌ Erro ao remover dispositivo: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/{device_id}")
async def get_device_stats(device_id: str):
    """
    Obter estatísticas de um dispositivo
    """
    try:
        supabase = get_supabase()

        # Contar comandos por status
        commands = (
            supabase.table("extension_commands")
            .select("status")
            .eq("device_id", device_id)
            .execute()
        )

        stats = {
            "total": len(commands.data) if commands.data else 0,
            "pending": 0,
            "processing": 0,
            "completed": 0,
            "failed": 0,
        }

        if commands.data:
            for cmd in commands.data:
                status = cmd.get("status", "pending")
                if status in stats:
                    stats[status] += 1

        return {"success": True, "stats": stats}

    except Exception as e:
        print(f"❌ Erro ao obter estatísticas: {e}")
        raise HTTPException(status_code=500, detail=str(e))
