"""
============================================
SYNCADS PYTHON MICROSERVICE - ROUTERS INIT
============================================
Exporta todos os routers disponíveis
============================================
"""

from .images import router as images_router
from .pdf import router as pdf_router
from .scraping import router as scraping_router

# Import routers adicionais (serão criados)
try:
    from .shopify import router as shopify_router
except ImportError:
    shopify_router = None

try:
    from .ml import router as ml_router
except ImportError:
    ml_router = None

try:
    from .nlp import router as nlp_router
except ImportError:
    nlp_router = None

try:
    from .data_analysis import router as data_analysis_router
except ImportError:
    data_analysis_router = None

try:
    from .python_executor import router as python_executor_router
except ImportError:
    python_executor_router = None

try:
    from .automation import router as automation_router
except ImportError:
    automation_router = None

__all__ = [
    "scraping_router",
    "images_router",
    "pdf_router",
    "shopify_router",
    "ml_router",
    "nlp_router",
    "data_analysis_router",
    "python_executor_router",
    "automation_router",
]
