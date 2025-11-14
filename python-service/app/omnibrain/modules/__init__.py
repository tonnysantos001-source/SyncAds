"""
============================================
SYNCADS OMNIBRAIN - MODULES PACKAGE
============================================
Módulos Especiais do Omnibrain

Este pacote contém módulos especializados para tarefas específicas:

- Shopify: Geração de temas e clonagem de lojas Shopify
- Cloning: Clonagem universal de lojas e-commerce
- Marketing: Automação de marketing e geração de conteúdo
- Ecommerce: Operações e-commerce multi-plataforma
- Automation: RPA e automação de workflows

Autor: SyncAds AI Team
Versão: 1.0.0
Data: 2025-01-15
============================================
"""

# ============================================
# IMPORTS
# ============================================

# Shopify Module
# Automation Module
from .automation_module import (
    Action,
    ActionType,
    AutomationModule,
    AutomationResult,
    ExecutionStatus,
    RPABot,
    Schedule,
    ScheduleType,
    TaskScheduler,
    Trigger,
    TriggerType,
    Workflow,
    WorkflowEngine,
    WorkflowExecution,
    WorkflowStatus,
    WorkflowStep,
    create_automation_module,
)

# Cloning Module
from .cloning_module import (
    CloneConfig,
    CloneDepth,
    ClonedStore,
    CloneResult,
    CloningModule,
    Collection,
    ContentType,
    DesignAnalysis,
    MigrationEngine,
    Page,
    PlatformDetector,
    StoreCloner,
    create_cloning_module,
)
from .cloning_module import (
    PlatformType as CloningPlatformType,
)
from .cloning_module import (
    Product as ClonedProduct,
)

# Ecommerce Module
from .ecommerce_module import (
    BulkOperation,
    EcommerceModule,
    EcommerceResult,
    InventoryManager,
    InventoryUpdate,
    OperationType,
    Order,
    OrderManager,
    OrderStatus,
    PriceRule,
    PricingEngine,
    PricingStrategy,
    ProductManager,
    ProductStatus,
    SyncEngine,
    SyncResult,
    create_ecommerce_module,
)
from .ecommerce_module import (
    PlatformType as EcommercePlatformType,
)
from .ecommerce_module import (
    Product as EcommerceProduct,
)

# Marketing Module
from .marketing_module import (
    AudienceSegment,
    CampaignObjective,
    CopyGenerator,
    EmailCampaign,
    FunnelBuilder,
    FunnelStage,
    GeneratedContent,
    LandingPage,
    LandingPageBuilder,
    MarketingBrief,
    MarketingFunnel,
    MarketingModule,
    MarketingResult,
    Platform,
    ToneOfVoice,
    create_marketing_module,
)
from .marketing_module import (
    ContentType as MarketingContentType,
)
from .shopify_module import (
    SectionType,
    ShopifyModule,
    ShopifyProduct,
    ShopifyStore,
    ShopifyStoreCloner,
    ShopifyThemeConfig,
    ShopifyThemeGenerator,
    StoreCategory,
    ThemeGenerationResult,
    ThemeVersion,
    create_shopify_module,
)

# ============================================
# VERSION
# ============================================

__version__ = "1.0.0"
__author__ = "SyncAds AI Team"
__date__ = "2025-01-15"

# ============================================
# PUBLIC API
# ============================================

__all__ = [
    # Shopify
    "ShopifyModule",
    "ShopifyThemeGenerator",
    "ShopifyStoreCloner",
    "ShopifyThemeConfig",
    "ThemeGenerationResult",
    "ShopifyStore",
    "ShopifyProduct",
    "ThemeVersion",
    "SectionType",
    "StoreCategory",
    "create_shopify_module",
    # Cloning
    "CloningModule",
    "StoreCloner",
    "ClonedStore",
    "CloneConfig",
    "CloneResult",
    "PlatformDetector",
    "MigrationEngine",
    "CloningPlatformType",
    "ContentType",
    "CloneDepth",
    "ClonedProduct",
    "Collection",
    "Page",
    "DesignAnalysis",
    "create_cloning_module",
    # Marketing
    "MarketingModule",
    "CopyGenerator",
    "LandingPageBuilder",
    "FunnelBuilder",
    "MarketingBrief",
    "GeneratedContent",
    "LandingPage",
    "EmailCampaign",
    "MarketingFunnel",
    "FunnelStage",
    "MarketingResult",
    "MarketingContentType",
    "Platform",
    "CampaignObjective",
    "ToneOfVoice",
    "AudienceSegment",
    "create_marketing_module",
    # Ecommerce
    "EcommerceModule",
    "ProductManager",
    "OrderManager",
    "InventoryManager",
    "PricingEngine",
    "SyncEngine",
    "EcommerceProduct",
    "Order",
    "InventoryUpdate",
    "PriceRule",
    "BulkOperation",
    "SyncResult",
    "EcommerceResult",
    "EcommercePlatformType",
    "OrderStatus",
    "ProductStatus",
    "PricingStrategy",
    "OperationType",
    "create_ecommerce_module",
    # Automation
    "AutomationModule",
    "WorkflowEngine",
    "TaskScheduler",
    "RPABot",
    "Workflow",
    "WorkflowExecution",
    "Trigger",
    "Action",
    "WorkflowStep",
    "Schedule",
    "AutomationResult",
    "TriggerType",
    "ActionType",
    "WorkflowStatus",
    "ExecutionStatus",
    "ScheduleType",
    "create_automation_module",
]

# ============================================
# UTILITIES
# ============================================


def get_available_modules():
    """Retorna lista de módulos disponíveis"""
    return {
        "shopify": {
            "name": "Shopify Module",
            "description": "Geração de temas Shopify 2.0 e clonagem de lojas",
            "factory": create_shopify_module,
            "version": "1.0.0",
        },
        "cloning": {
            "name": "Cloning Module",
            "description": "Clonagem universal de lojas e-commerce",
            "factory": create_cloning_module,
            "version": "1.0.0",
        },
        "marketing": {
            "name": "Marketing Module",
            "description": "Automação de marketing e geração de conteúdo",
            "factory": create_marketing_module,
            "version": "1.0.0",
        },
        "ecommerce": {
            "name": "E-commerce Module",
            "description": "Operações e-commerce multi-plataforma",
            "factory": create_ecommerce_module,
            "version": "1.0.0",
        },
        "automation": {
            "name": "Automation Module",
            "description": "RPA e automação de workflows",
            "factory": create_automation_module,
            "version": "1.0.0",
        },
    }


def create_all_modules():
    """Cria instâncias de todos os módulos"""
    return {
        "shopify": create_shopify_module(),
        "cloning": create_cloning_module(),
        "marketing": create_marketing_module(),
        "ecommerce": create_ecommerce_module(),
        "automation": create_automation_module(),
    }


def get_module_info(module_name: str):
    """Retorna informações sobre um módulo específico"""
    modules = get_available_modules()
    return modules.get(module_name)


# ============================================
# MODULE DOCUMENTATION
# ============================================

MODULES_DOCUMENTATION = """
# Omnibrain Modules

## 1. Shopify Module
Geração de temas Shopify 2.0 e clonagem de lojas Shopify.

**Funcionalidades:**
- Geração de temas completos (layouts, sections, templates, assets)
- Clonagem de lojas existentes
- Análise de design
- Empacotamento ZIP

**Uso:**
```python
from omnibrain.modules import create_shopify_module, ShopifyThemeConfig

module = create_shopify_module()
config = ShopifyThemeConfig(name="My Theme", primary_color="#ff6b6b")
result = await module.generate_theme(config)
```

---

## 2. Cloning Module
Clonagem universal de lojas e-commerce (Shopify, WooCommerce, VTEX, etc).

**Funcionalidades:**
- Detecção automática de plataforma
- Extração de produtos, coleções, páginas
- Análise de design e layout
- Migração entre plataformas

**Uso:**
```python
from omnibrain.modules import create_cloning_module, CloneDepth

module = create_cloning_module()
result = await module.clone_store("https://example.com", depth=CloneDepth.DEEP)
```

---

## 3. Marketing Module
Automação de marketing e geração de conteúdo.

**Funcionalidades:**
- Geração de copy para anúncios
- Criação de landing pages
- Email marketing automation
- Criação de funis de vendas
- Geração de criativos

**Uso:**
```python
from omnibrain.modules import create_marketing_module, MarketingBrief

module = create_marketing_module()
brief = MarketingBrief(
    product_name="My Product",
    product_description="Amazing product",
    objective=CampaignObjective.CONVERSION
)
result = await module.generate_ad_copy(brief)
```

---

## 4. E-commerce Module
Operações e-commerce multi-plataforma.

**Funcionalidades:**
- Gerenciamento de produtos
- Processamento de pedidos
- Controle de inventário
- Gestão de preços e promoções
- Sincronização multi-plataforma

**Uso:**
```python
from omnibrain.modules import create_ecommerce_module, EcommerceProduct

module = create_ecommerce_module()
product = EcommerceProduct(
    id="prod_123",
    name="Product Name",
    price=99.90
)
result = await module.create_product(product, PlatformType.SHOPIFY)
```

---

## 5. Automation Module
RPA e automação de workflows.

**Funcionalidades:**
- Criação de workflows personalizados
- Agendamento de tarefas
- Triggers e actions
- Web automation
- File automation

**Uso:**
```python
from omnibrain.modules import create_automation_module, Trigger, Action

module = create_automation_module()
trigger = Trigger(id="trigger_1", name="Manual", type=TriggerType.MANUAL)
actions = [Action(id="action_1", name="API Call", type=ActionType.API_REQUEST)]
workflow = await module.create_workflow("My Workflow", "Description", trigger, actions)
```
"""


def print_documentation():
    """Imprime documentação dos módulos"""
    print(MODULES_DOCUMENTATION)
