"""
============================================
SYNCADS PYTHON MICROSERVICE - PDF ROUTER
============================================
Router para geração e manipulação de PDFs
============================================
"""

import base64
import io
import os
import tempfile
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel, Field
from PyPDF2 import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from weasyprint import HTML

router = APIRouter()


# ==========================================
# MODELS
# ==========================================


class PDFGenerateRequest(BaseModel):
    """Request para gerar PDF"""

    title: str = Field(..., description="Título do documento")
    content: str = Field(..., description="Conteúdo em texto/HTML")
    format: str = Field("A4", description="Formato: A4, letter")
    include_header: bool = Field(True, description="Incluir cabeçalho")
    include_footer: bool = Field(True, description="Incluir rodapé")
    author: Optional[str] = Field(None, description="Autor do documento")
    template: Optional[str] = Field("default", description="Template a usar")


class PDFFromHTMLRequest(BaseModel):
    """Request para converter HTML em PDF"""

    html: str = Field(..., description="HTML a converter")
    css: Optional[str] = Field(None, description="CSS customizado")
    page_size: str = Field("A4", description="Tamanho da página")


class PDFReportRequest(BaseModel):
    """Request para gerar relatório PDF"""

    campaign_id: Optional[str] = None
    title: str
    data: Dict[str, Any]
    charts: Optional[List[Dict[str, Any]]] = None
    tables: Optional[List[Dict[str, Any]]] = None


class PDFMergeRequest(BaseModel):
    """Request para mesclar PDFs"""

    pdf_urls: List[str] = Field(..., description="URLs dos PDFs para mesclar")


class PDFResponse(BaseModel):
    """Response de PDF"""

    success: bool
    pdf_base64: Optional[str] = None
    filename: str
    size_bytes: Optional[int] = None
    pages: Optional[int] = None
    error: Optional[str] = None


# ==========================================
# ENDPOINTS
# ==========================================


@router.post("/generate", response_model=PDFResponse)
async def generate_pdf(request: PDFGenerateRequest):
    """
    Gera PDF a partir de texto/HTML
    """
    try:
        logger.info(f"📄 Gerando PDF: {request.title}")

        # Criar PDF com ReportLab
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4 if request.format == "A4" else letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18,
        )

        # Estilos
        styles = getSampleStyleSheet()
        story = []

        # Título
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=24,
            textColor=colors.HexColor("#1a1a1a"),
            spaceAfter=30,
            alignment=1,  # Center
        )
        story.append(Paragraph(request.title, title_style))
        story.append(Spacer(1, 0.2 * inch))

        # Conteúdo
        content_style = styles["BodyText"]
        paragraphs = request.content.split("\n")
        for para in paragraphs:
            if para.strip():
                story.append(Paragraph(para, content_style))
                story.append(Spacer(1, 0.1 * inch))

        # Rodapé
        if request.include_footer:
            footer_style = ParagraphStyle(
                "Footer",
                parent=styles["Normal"],
                fontSize=8,
                textColor=colors.grey,
                alignment=1,
            )
            story.append(Spacer(1, 0.5 * inch))
            footer_text = f"Gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')}"
            if request.author:
                footer_text += f" | Autor: {request.author}"
            story.append(Paragraph(footer_text, footer_style))

        # Build PDF
        doc.build(story)

        # Converter para base64
        pdf_bytes = buffer.getvalue()
        pdf_base64 = base64.b64encode(pdf_bytes).decode()

        return PDFResponse(
            success=True,
            pdf_base64=pdf_base64,
            filename=f"{request.title.replace(' ', '_')}.pdf",
            size_bytes=len(pdf_bytes),
        )

    except Exception as e:
        logger.error(f"❌ Erro ao gerar PDF: {str(e)}")
        return PDFResponse(success=False, filename="error.pdf", error=str(e))


@router.post("/from-html", response_model=PDFResponse)
async def pdf_from_html(request: PDFFromHTMLRequest):
    """
    Converte HTML para PDF usando WeasyPrint
    """
    try:
        logger.info("📄 Convertendo HTML para PDF")

        # Adicionar CSS base se não fornecido
        if not request.css:
            request.css = """
            body {
                font-family: Arial, sans-serif;
                margin: 40px;
            }
            h1 { color: #333; }
            """

        # HTML completo
        full_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>{request.css}</style>
        </head>
        <body>
            {request.html}
        </body>
        </html>
        """

        # Gerar PDF
        pdf_bytes = HTML(string=full_html).write_pdf()

        # Converter para base64
        pdf_base64 = base64.b64encode(pdf_bytes).decode()

        return PDFResponse(
            success=True,
            pdf_base64=pdf_base64,
            filename="document.pdf",
            size_bytes=len(pdf_bytes),
        )

    except Exception as e:
        logger.error(f"❌ Erro ao converter HTML: {str(e)}")
        return PDFResponse(success=False, filename="error.pdf", error=str(e))


@router.post("/report", response_model=PDFResponse)
async def generate_report(request: PDFReportRequest):
    """
    Gera relatório PDF com dados, tabelas e gráficos
    """
    try:
        logger.info(f"📊 Gerando relatório: {request.title}")

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        # Título do relatório
        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Heading1"],
            fontSize=20,
            textColor=colors.HexColor("#2563eb"),
            spaceAfter=20,
        )
        story.append(Paragraph(request.title, title_style))
        story.append(Spacer(1, 0.3 * inch))

        # Dados principais
        if request.data:
            for key, value in request.data.items():
                story.append(Paragraph(f"<b>{key}:</b> {value}", styles["Normal"]))
                story.append(Spacer(1, 0.1 * inch))

        # Tabelas
        if request.tables:
            for table_data in request.tables:
                story.append(Spacer(1, 0.2 * inch))
                story.append(
                    Paragraph(table_data.get("title", "Tabela"), styles["Heading2"])
                )
                story.append(Spacer(1, 0.1 * inch))

                # Criar tabela
                data = table_data.get("data", [])
                if data:
                    t = Table(data)
                    t.setStyle(
                        TableStyle(
                            [
                                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                                ("FONTSIZE", (0, 0), (-1, 0), 12),
                                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                                ("GRID", (0, 0), (-1, -1), 1, colors.black),
                            ]
                        )
                    )
                    story.append(t)

        # Build PDF
        doc.build(story)

        pdf_bytes = buffer.getvalue()
        pdf_base64 = base64.b64encode(pdf_bytes).decode()

        return PDFResponse(
            success=True,
            pdf_base64=pdf_base64,
            filename=f"report_{request.title.replace(' ', '_')}.pdf",
            size_bytes=len(pdf_bytes),
        )

    except Exception as e:
        logger.error(f"❌ Erro ao gerar relatório: {str(e)}")
        return PDFResponse(success=False, filename="error.pdf", error=str(e))


@router.post("/merge", response_model=PDFResponse)
async def merge_pdfs(request: PDFMergeRequest):
    """
    Mescla múltiplos PDFs em um único arquivo
    """
    try:
        logger.info(f"📑 Mesclando {len(request.pdf_urls)} PDFs")

        merger = PdfWriter()

        # Baixar e adicionar cada PDF
        import httpx

        async with httpx.AsyncClient() as client:
            for url in request.pdf_urls:
                response = await client.get(url)
                pdf_reader = PdfReader(io.BytesIO(response.content))
                for page in pdf_reader.pages:
                    merger.add_page(page)

        # Escrever PDF mesclado
        output_buffer = io.BytesIO()
        merger.write(output_buffer)
        output_buffer.seek(0)

        pdf_bytes = output_buffer.getvalue()
        pdf_base64 = base64.b64encode(pdf_bytes).decode()

        return PDFResponse(
            success=True,
            pdf_base64=pdf_base64,
            filename="merged.pdf",
            size_bytes=len(pdf_bytes),
            pages=len(merger.pages),
        )

    except Exception as e:
        logger.error(f"❌ Erro ao mesclar PDFs: {str(e)}")
        return PDFResponse(success=False, filename="error.pdf", error=str(e))


@router.get("/test")
async def test_pdf():
    """Teste do router de PDF"""
    return {
        "status": "ok",
        "message": "PDF router funcionando!",
        "endpoints": [
            "/generate",
            "/from-html",
            "/report",
            "/merge",
        ],
    }
