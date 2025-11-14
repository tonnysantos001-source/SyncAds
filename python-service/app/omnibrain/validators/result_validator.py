"""
============================================
SYNCADS OMNIBRAIN - RESULT VALIDATOR
============================================
Validador Inteligente de Resultados de Execução

Responsável por:
- Validar resultados de execução
- Verificar completude
- Validar formato esperado
- Calcular score de qualidade
- Detectar resultados inválidos
- Validar tipos de dados
- Verificar constraints
- Validar tamanho/dimensões
- Detectar corrupção de dados
- Gerar relatório de validação

Autor: SyncAds AI Team
Versão: 1.0.0
============================================
"""

import base64
import logging
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("omnibrain.validator")


# ============================================
# DATA CLASSES
# ============================================


@dataclass
class ValidationResult:
    """Resultado da validação"""

    is_valid: bool
    confidence: float  # 0.0 - 1.0
    quality_score: float  # 0.0 - 1.0
    issues: List[str]
    warnings: List[str]
    metadata: Dict[str, Any]
    reasoning: str


@dataclass
class ValidationRule:
    """Regra de validação"""

    name: str
    validator_func: callable
    weight: float
    required: bool
    error_message: str


# ============================================
# VALIDATORS ESPECÍFICOS
# ============================================


class ImageValidator:
    """Validador para resultados de processamento de imagens"""

    @staticmethod
    def validate(output: Any, params: Dict[str, Any]) -> ValidationResult:
        """Valida resultado de processamento de imagem"""

        issues = []
        warnings = []
        metadata = {}

        # Check if output exists
        if output is None:
            return ValidationResult(
                is_valid=False,
                confidence=0.0,
                quality_score=0.0,
                issues=["Output is None"],
                warnings=[],
                metadata={},
                reasoning="No output produced",
            )

        # Check if it's bytes (image data)
        if not isinstance(output, (bytes, dict)):
            issues.append(f"Invalid output type: {type(output)}")

        # If dict, validate structure
        if isinstance(output, dict):
            if not output.get("success", False):
                issues.append(f"Operation failed: {output.get('error', 'Unknown')}")
                return ValidationResult(
                    is_valid=False,
                    confidence=0.0,
                    quality_score=0.0,
                    issues=issues,
                    warnings=warnings,
                    metadata=output,
                    reasoning="Operation reported failure",
                )

            # Validate expected fields
            if "output" not in output:
                issues.append("Missing 'output' field in result")

            if "width" in output and "height" in output:
                width = output["width"]
                height = output["height"]
                metadata["dimensions"] = f"{width}x{height}"

                # Validate dimensions
                if width <= 0 or height <= 0:
                    issues.append(f"Invalid dimensions: {width}x{height}")

                # Check if dimensions match expected
                expected_width = params.get("width")
                expected_height = params.get("height")

                if expected_width and abs(width - expected_width) > 5:
                    warnings.append(
                        f"Width mismatch: expected {expected_width}, got {width}"
                    )

                if expected_height and abs(height - expected_height) > 5:
                    warnings.append(
                        f"Height mismatch: expected {expected_height}, got {height}"
                    )

            # Validate file size
            if "size_bytes" in output:
                size = output["size_bytes"]
                metadata["size_mb"] = size / (1024 * 1024)

                if size == 0:
                    issues.append("Output size is 0 bytes")
                elif size > 50 * 1024 * 1024:  # 50MB
                    warnings.append(f"Large output size: {size / (1024 * 1024):.2f}MB")

            # Validate format
            if "format" in output:
                format_type = output["format"]
                metadata["format"] = format_type

                valid_formats = ["PNG", "JPEG", "JPG", "WEBP", "GIF"]
                if format_type.upper() not in valid_formats:
                    warnings.append(f"Unusual format: {format_type}")

        # Calculate scores
        quality_score = 1.0 - (len(issues) * 0.2 + len(warnings) * 0.05)
        quality_score = max(0.0, min(1.0, quality_score))

        confidence = 0.9 if len(issues) == 0 else 0.3
        is_valid = len(issues) == 0

        reasoning_parts = []
        if is_valid:
            reasoning_parts.append("Image output validated successfully")
            if metadata.get("dimensions"):
                reasoning_parts.append(f"Dimensions: {metadata['dimensions']}")
        else:
            reasoning_parts.append(f"Validation failed: {len(issues)} issues")

        return ValidationResult(
            is_valid=is_valid,
            confidence=confidence,
            quality_score=quality_score,
            issues=issues,
            warnings=warnings,
            metadata=metadata,
            reasoning=" | ".join(reasoning_parts),
        )


class ScrapingValidator:
    """Validador para resultados de web scraping"""

    @staticmethod
    def validate(output: Any, params: Dict[str, Any]) -> ValidationResult:
        """Valida resultado de scraping"""

        issues = []
        warnings = []
        metadata = {}

        if output is None:
            return ValidationResult(
                is_valid=False,
                confidence=0.0,
                quality_score=0.0,
                issues=["No output produced"],
                warnings=[],
                metadata={},
                reasoning="Scraping returned None",
            )

        if not isinstance(output, dict):
            issues.append(f"Invalid output type: {type(output)}")
            return ValidationResult(
                is_valid=False,
                confidence=0.0,
                quality_score=0.0,
                issues=issues,
                warnings=[],
                metadata={},
                reasoning="Output is not a dictionary",
            )

        # Check success flag
        if not output.get("success", False):
            error_msg = output.get("error", "Unknown error")
            issues.append(f"Scraping failed: {error_msg}")
            return ValidationResult(
                is_valid=False,
                confidence=0.0,
                quality_score=0.0,
                issues=issues,
                warnings=[],
                metadata=output,
                reasoning=f"Scraping reported failure: {error_msg}",
            )

        # Validate URL
        if "url" not in output:
            warnings.append("Missing 'url' field")
        else:
            metadata["url"] = output["url"]

        # Validate content
        content_fields = ["html", "text", "data"]
        has_content = any(field in output for field in content_fields)

        if not has_content:
            issues.append("No content extracted (html, text, or data)")

        # Validate HTML
        if "html" in output:
            html = output["html"]
            if not html or len(html) < 100:
                warnings.append(f"HTML content very short: {len(html)} bytes")
            else:
                metadata["html_size"] = len(html)

            # Check if it looks like actual HTML
            if not re.search(r"<html|<body|<div|<p", html, re.IGNORECASE):
                warnings.append("HTML doesn't contain common tags")

        # Validate text
        if "text" in output:
            text = output["text"]
            if text:
                metadata["text_length"] = len(text)
                if len(text) < 50:
                    warnings.append(f"Extracted text very short: {len(text)} chars")
            else:
                warnings.append("Text field is empty")

        # Validate images
        if params.get("extract_images", False):
            if "images" not in output:
                warnings.append("Image extraction requested but no images returned")
            else:
                images = output["images"]
                metadata["images_count"] = len(images)
                if len(images) == 0:
                    warnings.append("No images found")

        # Validate links
        if params.get("extract_links", False):
            if "links" not in output:
                warnings.append("Link extraction requested but no links returned")
            else:
                links = output["links"]
                metadata["links_count"] = len(links)
                if len(links) == 0:
                    warnings.append("No links found")

        # Calculate scores
        quality_score = 1.0 - (len(issues) * 0.25 + len(warnings) * 0.05)
        quality_score = max(0.0, min(1.0, quality_score))

        confidence = 0.95 if len(issues) == 0 else 0.2
        is_valid = len(issues) == 0

        reasoning_parts = []
        if is_valid:
            reasoning_parts.append("Scraping validated successfully")
            if metadata.get("html_size"):
                reasoning_parts.append(f"HTML: {metadata['html_size']} bytes")
            if metadata.get("text_length"):
                reasoning_parts.append(f"Text: {metadata['text_length']} chars")
        else:
            reasoning_parts.append(f"Validation failed: {', '.join(issues)}")

        return ValidationResult(
            is_valid=is_valid,
            confidence=confidence,
            quality_score=quality_score,
            issues=issues,
            warnings=warnings,
            metadata=metadata,
            reasoning=" | ".join(reasoning_parts),
        )


class PDFValidator:
    """Validador para resultados de geração de PDF"""

    @staticmethod
    def validate(output: Any, params: Dict[str, Any]) -> ValidationResult:
        """Valida resultado de geração de PDF"""

        issues = []
        warnings = []
        metadata = {}

        if output is None:
            return ValidationResult(
                is_valid=False,
                confidence=0.0,
                quality_score=0.0,
                issues=["No PDF output produced"],
                warnings=[],
                metadata={},
                reasoning="PDF generation returned None",
            )

        if isinstance(output, dict):
            if not output.get("success", False):
                error_msg = output.get("error", "Unknown")
                issues.append(f"PDF generation failed: {error_msg}")
                return ValidationResult(
                    is_valid=False,
                    confidence=0.0,
                    quality_score=0.0,
                    issues=issues,
                    warnings=[],
                    metadata=output,
                    reasoning=f"Generation failed: {error_msg}",
                )

            # Validate PDF output
            if "output" not in output and "pdf_base64" not in output:
                issues.append("Missing PDF output data")

            # Validate size
            if "size_bytes" in output:
                size = output["size_bytes"]
                metadata["size_kb"] = size / 1024

                if size < 100:
                    warnings.append(f"PDF very small: {size} bytes")
                elif size > 100 * 1024 * 1024:  # 100MB
                    warnings.append(f"PDF very large: {size / (1024 * 1024):.1f}MB")

            # Validate pages
            if "pages" in output:
                pages = output["pages"]
                metadata["pages"] = pages

                if pages == 0:
                    issues.append("PDF has 0 pages")
                elif pages > 1000:
                    warnings.append(f"PDF has many pages: {pages}")

            # Validate filename
            if "filename" in output:
                metadata["filename"] = output["filename"]

        elif isinstance(output, bytes):
            # Raw PDF bytes
            metadata["size_bytes"] = len(output)

            if len(output) < 100:
                issues.append("PDF data too small")

            # Check PDF magic number
            if not output.startswith(b"%PDF"):
                issues.append("Data doesn't start with PDF header")

        else:
            issues.append(f"Invalid output type: {type(output)}")

        # Calculate scores
        quality_score = 1.0 - (len(issues) * 0.3 + len(warnings) * 0.05)
        quality_score = max(0.0, min(1.0, quality_score))

        confidence = 0.9 if len(issues) == 0 else 0.2
        is_valid = len(issues) == 0

        reasoning_parts = []
        if is_valid:
            reasoning_parts.append("PDF validated successfully")
            if metadata.get("pages"):
                reasoning_parts.append(f"Pages: {metadata['pages']}")
            if metadata.get("size_kb"):
                reasoning_parts.append(f"Size: {metadata['size_kb']:.1f}KB")
        else:
            reasoning_parts.append(f"Validation failed: {', '.join(issues)}")

        return ValidationResult(
            is_valid=is_valid,
            confidence=confidence,
            quality_score=quality_score,
            issues=issues,
            warnings=warnings,
            metadata=metadata,
            reasoning=" | ".join(reasoning_parts),
        )


class DataValidator:
    """Validador genérico para dados estruturados"""

    @staticmethod
    def validate(output: Any, params: Dict[str, Any]) -> ValidationResult:
        """Valida dados estruturados"""

        issues = []
        warnings = []
        metadata = {}

        if output is None:
            return ValidationResult(
                is_valid=False,
                confidence=0.0,
                quality_score=0.0,
                issues=["Output is None"],
                warnings=[],
                metadata={},
                reasoning="No data produced",
            )

        # Validate type
        metadata["output_type"] = type(output).__name__

        if isinstance(output, dict):
            metadata["dict_keys"] = list(output.keys())
            metadata["dict_size"] = len(output)

            if len(output) == 0:
                warnings.append("Output dictionary is empty")

        elif isinstance(output, (list, tuple)):
            metadata["list_length"] = len(output)

            if len(output) == 0:
                warnings.append("Output list is empty")

        elif isinstance(output, str):
            metadata["string_length"] = len(output)

            if len(output) == 0:
                warnings.append("Output string is empty")
            elif len(output) < 10:
                warnings.append(f"Output string very short: {len(output)} chars")

        elif isinstance(output, (int, float)):
            metadata["numeric_value"] = output

        # Calculate scores
        quality_score = 1.0 - (len(issues) * 0.2 + len(warnings) * 0.1)
        quality_score = max(0.0, min(1.0, quality_score))

        confidence = 0.8 if len(issues) == 0 else 0.3
        is_valid = len(issues) == 0

        reasoning = f"Data validated: type={metadata['output_type']}"

        return ValidationResult(
            is_valid=is_valid,
            confidence=confidence,
            quality_score=quality_score,
            issues=issues,
            warnings=warnings,
            metadata=metadata,
            reasoning=reasoning,
        )


# ============================================
# MAIN RESULT VALIDATOR
# ============================================


class ResultValidator:
    """
    Validador Principal de Resultados

    Coordena validadores específicos e aplica regras gerais
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}

        # Validadores especializados
        self.validators = {
            "image_processing": ImageValidator(),
            "web_scraping": ScrapingValidator(),
            "pdf_generation": PDFValidator(),
            "data_analysis": DataValidator(),
            # Default
            "default": DataValidator(),
        }

        # Configurações
        self.min_quality_score = self.config.get("min_quality_score", 0.5)
        self.min_confidence = self.config.get("min_confidence", 0.6)
        self.strict_mode = self.config.get("strict_mode", False)

        logger.info("ResultValidator initialized")

    async def validate(
        self, execution_result: Any, execution_plan: Any
    ) -> ValidationResult:
        """
        Valida resultado de execução

        Args:
            execution_result: ExecutionResult object
            execution_plan: ExecutionPlan object

        Returns:
            ValidationResult
        """

        logger.debug(f"Validating result for task: {execution_plan.task_id}")

        # Get output
        output = execution_result.output

        # Get task type
        task_type = execution_plan.task_type.value

        # Get validation criteria from plan
        criteria = execution_plan.validation_criteria or {}

        # Select appropriate validator
        validator = self.validators.get(task_type, self.validators["default"])

        # Validate
        result = validator.validate(output, criteria)

        # Apply global checks
        result = self._apply_global_checks(result, execution_result)

        # Log result
        if result.is_valid:
            logger.info(
                f"Validation passed (confidence: {result.confidence:.2f}, "
                f"quality: {result.quality_score:.2f})"
            )
        else:
            logger.warning(
                f"Validation failed: {len(result.issues)} issues, "
                f"{len(result.warnings)} warnings"
            )
            for issue in result.issues:
                logger.warning(f"  Issue: {issue}")

        return result

    def _apply_global_checks(
        self, result: ValidationResult, execution_result: Any
    ) -> ValidationResult:
        """Aplica verificações globais"""

        # Check execution status
        if hasattr(execution_result, "status"):
            status = execution_result.status
            if status.value != "success":
                result.issues.append(f"Execution status: {status.value}")
                result.is_valid = False
                result.confidence *= 0.5

        # Check if there was an error
        if hasattr(execution_result, "error") and execution_result.error:
            result.issues.append(f"Execution error: {execution_result.error}")
            result.is_valid = False
            result.confidence = 0.0

        # Check execution time (timeout detection)
        if hasattr(execution_result, "execution_time"):
            exec_time = execution_result.execution_time
            result.metadata["execution_time"] = exec_time

            if exec_time > 300:  # 5 minutes
                result.warnings.append(f"Long execution time: {exec_time:.1f}s")

        # Apply minimum thresholds
        if self.strict_mode:
            if result.quality_score < self.min_quality_score:
                result.is_valid = False
                result.issues.append(
                    f"Quality score below threshold: {result.quality_score:.2f} < {self.min_quality_score}"
                )

            if result.confidence < self.min_confidence:
                result.is_valid = False
                result.issues.append(
                    f"Confidence below threshold: {result.confidence:.2f} < {self.min_confidence}"
                )

        return result

    def validate_sync(
        self, output: Any, task_type: str, params: Dict[str, Any] = None
    ) -> ValidationResult:
        """Validação síncrona direta"""

        params = params or {}
        validator = self.validators.get(task_type, self.validators["default"])
        return validator.validate(output, params)

    def get_validator_for_task(self, task_type: str):
        """Retorna validador específico para tipo de tarefa"""
        return self.validators.get(task_type, self.validators["default"])

    def add_custom_validator(self, task_type: str, validator):
        """Adiciona validador customizado"""
        self.validators[task_type] = validator
        logger.info(f"Added custom validator for: {task_type}")


# ============================================
# FACTORY
# ============================================


def create_result_validator(config: Optional[Dict[str, Any]] = None) -> ResultValidator:
    """Factory para criar ResultValidator"""
    return ResultValidator(config)


# ============================================
# EXAMPLE
# ============================================

if __name__ == "__main__":
    import asyncio

    async def main():
        # Create validator
        validator = create_result_validator(
            {"min_quality_score": 0.6, "min_confidence": 0.7, "strict_mode": True}
        )

        # Test image validation
        print("=" * 60)
        print("Testing IMAGE validation:")
        print("=" * 60)

        image_output = {
            "success": True,
            "output": b"fake_image_data",
            "width": 1920,
            "height": 1080,
            "format": "PNG",
            "size_bytes": 524288,
        }

        result = validator.validate_sync(
            image_output, "image_processing", {"width": 1920, "height": 1080}
        )

        print(f"Valid: {result.is_valid}")
        print(f"Confidence: {result.confidence:.2f}")
        print(f"Quality: {result.quality_score:.2f}")
        print(f"Issues: {result.issues}")
        print(f"Warnings: {result.warnings}")
        print(f"Metadata: {result.metadata}")
        print(f"Reasoning: {result.reasoning}")

        # Test scraping validation
        print("\n" + "=" * 60)
        print("Testing SCRAPING validation:")
        print("=" * 60)

        scraping_output = {
            "success": True,
            "url": "https://example.com",
            "html": "<html><body><h1>Test</h1><p>Content here</p></body></html>",
            "text": "Test Content here",
            "images": ["img1.jpg", "img2.jpg"],
            "links": ["link1", "link2", "link3"],
        }

        result = validator.validate_sync(
            scraping_output,
            "web_scraping",
            {"extract_images": True, "extract_links": True},
        )

        print(f"Valid: {result.is_valid}")
        print(f"Confidence: {result.confidence:.2f}")
        print(f"Quality: {result.quality_score:.2f}")
        print(f"Issues: {result.issues}")
        print(f"Warnings: {result.warnings}")
        print(f"Metadata: {result.metadata}")

    asyncio.run(main())
