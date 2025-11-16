"""
============================================
SYNCADS OMNIBRAIN - GRAPHQL ROUTER
============================================
Router FastAPI para GraphQL API

Endpoints:
- POST /graphql - GraphQL queries e mutations
- GET /graphql - GraphiQL playground
- WS /graphql/ws - GraphQL subscriptions

Features:
- Strawberry GraphQL integration
- GraphiQL interactive UI
- WebSocket subscriptions
- CORS configurado
- Error handling

Autor: SyncAds AI Team
Versão: 1.0.0
Data: 2025-01-15
============================================
"""

from fastapi import APIRouter, WebSocket
from strawberry.fastapi import GraphQLRouter as StrawberryGraphQLRouter

from app.graphql_schema import schema

# ============================================
# ROUTER CONFIGURATION
# ============================================

# Criar GraphQL router do Strawberry
graphql_app = StrawberryGraphQLRouter(
    schema,
    graphiql=True,  # Habilitar GraphiQL playground
    allow_queries_via_get=True,  # Permitir queries via GET
)

# Criar FastAPI router
router = APIRouter()

# ============================================
# GRAPHQL ENDPOINTS
# ============================================

# Incluir rotas GraphQL
router.include_router(graphql_app, prefix="")


# ============================================
# HEALTH CHECK
# ============================================


@router.get("/health")
async def graphql_health():
    """Health check do GraphQL endpoint"""
    return {
        "status": "healthy",
        "service": "graphql-api",
        "version": "1.0.0",
        "endpoints": {
            "queries": "/graphql (POST or GET)",
            "playground": "/graphql (GET with browser)",
            "subscriptions": "/graphql/ws (WebSocket)",
        },
    }


# ============================================
# INFO ENDPOINT
# ============================================


@router.get("/schema")
async def graphql_schema_info():
    """Informações sobre o schema GraphQL"""
    return {
        "success": True,
        "schema": {
            "queries": [
                "health",
                "libraryProfiles",
                "libraryProfile",
                "libraryStatistics",
                "searchLibraries",
            ],
            "mutations": ["executeTask", "executeSimple"],
            "subscriptions": ["taskProgress"],
        },
        "documentation": "/graphql (open in browser for GraphiQL)",
        "examples": {
            "query_health": """
query {
  health {
    status
    version
    librariesAvailable
  }
}
            """,
            "query_libraries": """
query {
  libraryProfiles(limit: 5) {
    name
    category
    description
    performanceScore
  }
}
            """,
            "mutation_execute": """
mutation {
  executeTask(input: {
    command: "Resize image.jpg to 800x600"
    taskType: IMAGE_PROCESSING
  }) {
    success
    taskId
    result {
      status
      output
      executionTime
    }
  }
}
            """,
            "subscription_progress": """
subscription {
  taskProgress(taskId: "task-123") {
    taskId
    status
    progress
  }
}
            """,
        },
    }


# ============================================
# EXPORTS
# ============================================

__all__ = ["router"]
