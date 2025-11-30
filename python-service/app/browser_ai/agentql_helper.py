"""
AgentQL Helper - Wrapper para queries semânticas AgentQL
Facilita o uso de AgentQL para seletores e extração de dados
"""

import logging
from typing import Any, Dict, List, Optional, Union

try:
    import agentql
    from playwright.async_api import Page
except ImportError as e:
    logging.warning(f"AgentQL libraries not installed: {e}")

logger = logging.getLogger(__name__)


class AgentQLHelper:
    """
    Helper para executar queries AgentQL semânticas

    AgentQL permite queries como:
    - "{ search_input search_button }" para encontrar elementos
    - "{ products[] { name price description } }" para extrair dados

    Vantagens:
    - Self-healing: não quebra com mudanças no DOM
    - Cross-site: mesma query funciona em múltiplos sites
    - Semântico: usa linguagem natural, não CSS/XPath
    """

    def __init__(self):
        self.cache = {}
        logger.info("AgentQLHelper initialized")

    async def query_data(
        self, page: Page, query: str, cache_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Extrai dados estruturados da página usando query AgentQL

        Args:
            page: Página Playwright
            query: Query AgentQL (ex: "{ products[] { name price } }")
            cache_key: Chave para cache (opcional)

        Returns:
            Dados extraídos no formato definido pela query

        Exemplo:
            >>> result = await helper.query_data(page, '''
            ...     {
            ...         products[] {
            ...             name
            ...             price(integer)
            ...             description
            ...             availability
            ...         }
            ...     }
            ... ''')
            >>> print(result['products'][0]['name'])
            'Tênis Nike Air Max'
        """

        # Verificar cache
        if cache_key and cache_key in self.cache:
            logger.info(f"Returning cached result for: {cache_key}")
            return self.cache[cache_key]

        try:
            logger.info(f"Executing AgentQL data query: {query[:100]}...")

            # Wrap page com AgentQL
            agentql_page = await agentql.wrap(page)

            # Executar query
            result = await agentql_page.query_data(query)

            # Converter para dict se necessário
            if hasattr(result, "__dict__"):
                result = self._object_to_dict(result)

            # Salvar no cache
            if cache_key:
                self.cache[cache_key] = result

            logger.info(
                f"Query successful, extracted {self._count_items(result)} items"
            )
            return result

        except Exception as e:
            logger.error(f"AgentQL query_data failed: {e}")
            return {"error": str(e), "query": query}

    async def query_elements(
        self, page: Page, query: str, cache_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Encontra elementos na página para interação

        Args:
            page: Página Playwright
            query: Query AgentQL (ex: "{ search_input search_button }")
            cache_key: Chave para cache

        Returns:
            Dicionário com locators Playwright para cada elemento

        Exemplo:
            >>> elements = await helper.query_elements(page, '''
            ...     {
            ...         search_input
            ...         search_button
            ...         results_container
            ...     }
            ... ''')
            >>> await elements['search_input'].fill('tênis')
            >>> await elements['search_button'].click()
        """

        # Verificar cache
        if cache_key and cache_key in self.cache:
            logger.info(f"Returning cached elements for: {cache_key}")
            return self.cache[cache_key]

        try:
            logger.info(f"Executing AgentQL elements query: {query[:100]}...")

            # Wrap page com AgentQL
            agentql_page = await agentql.wrap(page)

            # Executar query
            elements = await agentql_page.query_elements(query)

            # Converter para dict
            if hasattr(elements, "__dict__"):
                elements_dict = self._object_to_dict(elements)
            else:
                elements_dict = elements

            # Salvar no cache
            if cache_key:
                self.cache[cache_key] = elements_dict

            logger.info(f"Found {len(elements_dict)} elements")
            return elements_dict

        except Exception as e:
            logger.error(f"AgentQL query_elements failed: {e}")
            return {"error": str(e), "query": query}

    async def get_by_prompt(self, page: Page, prompt: str) -> Optional[Any]:
        """
        Encontra um único elemento usando prompt em linguagem natural

        Args:
            page: Página Playwright
            prompt: Descrição do elemento (ex: "the blue login button")

        Returns:
            Locator do elemento ou None

        Exemplo:
            >>> button = await helper.get_by_prompt(page, "the submit button at the bottom")
            >>> await button.click()
        """

        try:
            logger.info(f"Getting element by prompt: {prompt}")

            # Wrap page com AgentQL
            agentql_page = await agentql.wrap(page)

            # Executar get_by_prompt
            element = await agentql_page.get_by_prompt(prompt)

            if element:
                logger.info(f"Element found for prompt: {prompt}")
                return element
            else:
                logger.warning(f"No element found for prompt: {prompt}")
                return None

        except Exception as e:
            logger.error(f"get_by_prompt failed: {e}")
            return None

    async def extract_table(
        self, page: Page, table_selector: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Extrai tabela HTML como lista de dicionários

        Args:
            page: Página Playwright
            table_selector: Seletor específico da tabela (opcional)

        Returns:
            Lista de linhas como dicts

        Exemplo:
            >>> rows = await helper.extract_table(page)
            >>> for row in rows:
            ...     print(row['Name'], row['Price'])
        """

        try:
            logger.info("Extracting table data...")

            # Query genérica para tabelas
            query = """
            {
                table {
                    headers[]
                    rows[] {
                        cells[]
                    }
                }
            }
            """

            result = await self.query_data(page, query)

            if "table" in result:
                table = result["table"]
                headers = table.get("headers", [])
                rows = table.get("rows", [])

                # Converter para lista de dicts
                table_data = []
                for row in rows:
                    cells = row.get("cells", [])
                    row_dict = {}
                    for i, cell in enumerate(cells):
                        header = headers[i] if i < len(headers) else f"Column_{i}"
                        row_dict[header] = cell
                    table_data.append(row_dict)

                logger.info(f"Extracted {len(table_data)} rows from table")
                return table_data

            return []

        except Exception as e:
            logger.error(f"Table extraction failed: {e}")
            return []

    async def extract_product_listing(
        self, page: Page, custom_fields: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Extrai listagem de produtos (e-commerce)

        Args:
            page: Página Playwright
            custom_fields: Campos customizados adicionais

        Returns:
            Lista de produtos

        Exemplo:
            >>> products = await helper.extract_product_listing(page)
            >>> for product in products:
            ...     print(f"{product['name']}: R$ {product['price']}")
        """

        try:
            logger.info("Extracting product listing...")

            # Campos base
            fields = [
                "name",
                "price(integer)",
                "description",
                "image_url",
                "availability",
            ]

            # Adicionar campos customizados
            if custom_fields:
                fields.extend(custom_fields)

            # Construir query
            fields_str = "\n                ".join(fields)
            query = f"""
            {{
                products[] {{
                    {fields_str}
                }}
            }}
            """

            result = await self.query_data(page, query)
            products = result.get("products", [])

            logger.info(f"Extracted {len(products)} products")
            return products

        except Exception as e:
            logger.error(f"Product listing extraction failed: {e}")
            return []

    async def extract_search_results(
        self, page: Page, result_type: str = "generic"
    ) -> List[Dict[str, Any]]:
        """
        Extrai resultados de busca (Google, Bing, etc)

        Args:
            page: Página Playwright
            result_type: Tipo de resultado (generic, google, shopping)

        Returns:
            Lista de resultados
        """

        try:
            logger.info(f"Extracting search results (type: {result_type})...")

            queries = {
                "generic": """
                {
                    results[] {
                        title
                        link
                        description
                    }
                }
                """,
                "google": """
                {
                    search_results[] {
                        title
                        url
                        snippet
                        position(integer)
                    }
                }
                """,
                "shopping": """
                {
                    products[] {
                        title
                        price
                        store
                        link
                        image
                    }
                }
                """,
            }

            query = queries.get(result_type, queries["generic"])
            result = await self.query_data(page, query)

            # Extrair lista de resultados
            results = (
                result.get("results", [])
                or result.get("search_results", [])
                or result.get("products", [])
            )

            logger.info(f"Extracted {len(results)} search results")
            return results

        except Exception as e:
            logger.error(f"Search results extraction failed: {e}")
            return []

    async def fill_form_smart(
        self, page: Page, form_data: Dict[str, Any], form_selector: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Preenche formulário usando AgentQL para encontrar campos

        Args:
            page: Página Playwright
            form_data: Dados para preencher
            form_selector: Seletor do formulário (opcional)

        Returns:
            Resultado do preenchimento
        """

        try:
            logger.info("Filling form with AgentQL...")

            # Construir query baseada nos campos de dados
            field_names = list(form_data.keys())
            fields_query = "\n                ".join(field_names)

            query = f"""
            {{
                form {{
                    {fields_query}
                }}
            }}
            """

            # Encontrar elementos do formulário
            elements = await self.query_elements(page, query)

            if "error" in elements:
                return {"success": False, "error": elements["error"]}

            # Preencher cada campo
            filled = []
            errors = []

            form_elements = elements.get("form", {})
            for field_name, value in form_data.items():
                try:
                    if field_name in form_elements:
                        element = form_elements[field_name]
                        await element.fill(str(value))
                        filled.append(field_name)
                        logger.debug(f"Filled field: {field_name}")
                except Exception as e:
                    errors.append({"field": field_name, "error": str(e)})
                    logger.warning(f"Failed to fill {field_name}: {e}")

            return {
                "success": len(filled) > 0,
                "filled_fields": filled,
                "errors": errors,
                "total_fields": len(form_data),
            }

        except Exception as e:
            logger.error(f"Smart form fill failed: {e}")
            return {"success": False, "error": str(e)}

    def clear_cache(self, key: Optional[str] = None):
        """Limpa cache de queries"""
        if key:
            if key in self.cache:
                del self.cache[key]
                logger.info(f"Cleared cache for: {key}")
        else:
            self.cache.clear()
            logger.info("Cleared all cache")

    def _object_to_dict(self, obj: Any) -> Dict[str, Any]:
        """Converte objeto AgentQL para dicionário"""
        if isinstance(obj, dict):
            return obj

        if hasattr(obj, "__dict__"):
            result = {}
            for key, value in obj.__dict__.items():
                if not key.startswith("_"):
                    if isinstance(value, list):
                        result[key] = [self._object_to_dict(item) for item in value]
                    elif hasattr(value, "__dict__"):
                        result[key] = self._object_to_dict(value)
                    else:
                        result[key] = value
            return result

        return obj

    def _count_items(self, data: Any) -> int:
        """Conta número de itens extraídos"""
        if isinstance(data, list):
            return len(data)
        elif isinstance(data, dict):
            # Procurar por listas no dict
            for value in data.values():
                if isinstance(value, list):
                    return len(value)
        return 0

    async def validate_query(self, query: str) -> Dict[str, Any]:
        """
        Valida sintaxe de query AgentQL

        Returns:
            {"valid": bool, "errors": List[str]}
        """
        errors = []

        # Verificações básicas
        if not query.strip():
            errors.append("Query is empty")

        if query.count("{") != query.count("}"):
            errors.append("Mismatched braces")

        # Verificar se tem pelo menos um campo
        if "{" in query and "}" in query:
            content = query[query.find("{") + 1 : query.rfind("}")].strip()
            if not content:
                errors.append("No fields specified in query")

        return {"valid": len(errors) == 0, "errors": errors}

    def generate_query_template(
        self, data_type: Literal["products", "articles", "search", "form", "table"]
    ) -> str:
        """
        Gera template de query para tipo de dados comum

        Args:
            data_type: Tipo de dados a extrair

        Returns:
            Template de query AgentQL
        """

        templates = {
            "products": """
{
    products[] {
        name
        price(integer)
        description
        image_url
        availability
        rating(float)
    }
}
            """,
            "articles": """
{
    articles[] {
        title
        author
        date
        content
        link
        category
    }
}
            """,
            "search": """
{
    search_results[] {
        title
        url
        snippet
        position(integer)
    }
}
            """,
            "form": """
{
    form {
        name_input
        email_input
        message_textarea
        submit_button
    }
}
            """,
            "table": """
{
    table {
        headers[]
        rows[] {
            cells[]
        }
    }
}
            """,
        }

        return templates.get(data_type, "{ /* Add your fields here */ }")


# Helper functions para uso rápido


async def extract_products(page: Page) -> List[Dict[str, Any]]:
    """
    Função helper rápida para extrair produtos

    Exemplo:
    >>> products = await extract_products(page)
    """
    helper = AgentQLHelper()
    return await helper.extract_product_listing(page)


async def extract_table(page: Page) -> List[Dict[str, Any]]:
    """
    Função helper rápida para extrair tabelas

    Exemplo:
    >>> data = await extract_table(page)
    """
    helper = AgentQLHelper()
    return await helper.extract_table(page)


async def fill_form(page: Page, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Função helper rápida para preencher formulários

    Exemplo:
    >>> result = await fill_form(page, {
    ...     'name': 'João Silva',
    ...     'email': 'joao@example.com'
    ... })
    """
    helper = AgentQLHelper()
    return await helper.fill_form_smart(page, data)
