# ReportLab

## Informações Básicas
- **Nome:** reportlab
- **Categoria:** PDF Generation, Document Creation
- **Versão Mínima:** 3.6.0
- **Versão Recomendada:** 4.0.0+
- **Licença:** BSD
- **Documentação:** https://www.reportlab.com/docs/

## Descrição
ReportLab é a biblioteca mais poderosa para geração programática de PDFs em Python. Permite criar documentos complexos com controle total sobre layout, tipografia, gráficos e tabelas. Ideal para relatórios, faturas, certificados e documentos corporativos.

## Casos de Uso Prioritários
1. **Gerar PDF Simples** (confidence: 0.98)
2. **Relatórios com Tabelas** (confidence: 0.95)
3. **Faturas/Invoices** (confidence: 0.95)
4. **Certificados** (confidence: 0.90)
5. **Documentos com Gráficos** (confidence: 0.90)

## Performance
- **Velocidade:** ⭐⭐⭐⭐ (8/10)
- **Qualidade de Output:** ⭐⭐⭐⭐⭐ (10/10)
- **Facilidade de Uso:** ⭐⭐⭐ (7/10)

## Keywords/Triggers
- reportlab
- pdf
- generate pdf
- create pdf
- relatorio
- invoice
- fatura
- certificate

## Templates por Caso de Uso

### Template: Simple PDF
```python
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

c = canvas.Canvas("{output_path}", pagesize=letter)
c.drawString(100, 750, "{text}")
c.save()
```

### Template: PDF with Table
```python
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors

doc = SimpleDocTemplate("{output_path}", pagesize=letter)
data = {table_data}
table = Table(data)
table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
    ('GRID', (0, 0), (-1, -1), 1, colors.black)
]))
doc.build([table])
```

## Score de Seleção
```python
def calculate_reportlab_score(task_keywords: list) -> float:
    base_score = 0.90
    if any(kw in task_keywords for kw in ['pdf', 'relatorio', 'report', 'invoice']):
        base_score += 0.08
    return min(base_score, 0.98)
```
