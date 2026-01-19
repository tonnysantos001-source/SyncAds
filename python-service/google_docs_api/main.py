"""
Google Docs API Service - FastAPI endpoint for SyncAds Extension

This service provides a RESTful API to insert content into Google Docs
using the official Google Docs API.
IT NOW SUPPORTS HTML PARSING for rich text and images!
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
from bs4 import BeautifulSoup  # Requires beautifulsoup4

from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.exceptions import RefreshError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SyncAds Google Docs API",
    description="Service to insert HTML content into Google Docs via official API",
    version="2.0.0"
)

# CORS - Allow extension to make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class InsertRequest(BaseModel):
    """Request model for content insertion"""
    doc_id: str
    content: str  # HTML Content
    auth_token: str
    position: Optional[int] = 1


class InsertResponse(BaseModel):
    """Response model for content insertion"""
    success: bool
    message: str
    doc_url: Optional[str] = None


@app.get("/")
async def root():
    return {"status": "online", "service": "SyncAds Google Docs API v2", "features": ["html", "images"]}


def build_requests_from_html(html_content: str, start_index: int) -> List[Dict[str, Any]]:
    """
    Parses HTML and generates Google Docs API requests.
    Supports: h1-h6, p, ul/li, img, b, i/em, strong
    """
    # Fix unclosed tags or malformed HTML
    soup = BeautifulSoup(html_content, 'html.parser')
    requests = []
    current_index = start_index

    # Helper to insert text with styles
    def insert_text(text: str, style: str = None, bold: bool = False, italic: bool = False):
        nonlocal current_index
        if not text:
            return

        # 1. Insert Text
        requests.append({
            'insertText': {
                'location': {'index': current_index},
                'text': text
            }
        })

        end_index = current_index + len(text)

        # 2. Apply Paragraph Style (if heading)
        if style:
            requests.append({
                'updateParagraphStyle': {
                    'range': {
                        'startIndex': current_index,
                        'endIndex': end_index
                    },
                    'paragraphStyle': {
                        'namedStyleType': style
                    },
                    'fields': 'namedStyleType'
                }
            })

        # 3. Apply Text Style (Bold/Italic)
        if bold or italic:
            text_style = {}
            if bold:
                text_style['bold'] = True
            if italic:
                text_style['italic'] = True
            
            requests.append({
                'updateTextStyle': {
                    'range': {
                        'startIndex': current_index,
                        'endIndex': end_index
                    },
                    'textStyle': text_style,
                    'fields': 'bold,italic'
                }
            })

        current_index += len(text)

    # Iterar sobre elementos de nível superior
    # Using contents (direct children) to preserve order
    for element in soup.contents:
        if not element.name:
            # Texto solto (NavigableString)
            text = str(element).strip()
            if text:
                insert_text(text + "\n")
            continue

        tag_name = element.name.lower()

        if tag_name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            # Headings
            style_map = {
                'h1': 'HEADING_1', 'h2': 'HEADING_2', 'h3': 'HEADING_3',
                'h4': 'HEADING_4', 'h5': 'HEADING_5', 'h6': 'HEADING_6'
            }
            text = element.get_text().strip() + "\n"
            insert_text(text, style=style_map.get(tag_name))

        elif tag_name == 'p':
            # Paragraph
            # TODO: Recursively process bold/italic inside p
            # For now, just extract text
            text = element.get_text().strip() + "\n" 
            insert_text(text)

        elif tag_name == 'ul':
            # List
            for li in element.find_all('li'):
                text = li.get_text().strip() + "\n"
                
                # Check for bullet preset support. 
                # Note: createParagraphBullets applies to the range.
                
                # 1. Insert Text first
                requests.append({
                     'insertText': {
                        'location': {'index': current_index},
                        'text': text
                    }
                })
                
                end_index = current_index + len(text)
                
                # 2. Create Bullet
                requests.append({
                    'createParagraphBullets': {
                        'range': {
                            'startIndex': current_index,
                            'endIndex': end_index
                        },
                        'bulletPreset': 'BULLET_DISC_CIRCLE_SQUARE'
                    }
                })
                current_index += len(text)

        elif tag_name == 'img':
            # Image
            src = element.get('src')
            if src and src.startswith('http'):
                # Handle size optional or default
                requests.append({
                    'insertInlineImage': {
                        'location': {'index': current_index},
                        'uri': src,
                        'objectSize': {
                            'height': {'magnitude': 300, 'unit': 'PT'},
                            'width': {'magnitude': 400, 'unit': 'PT'}
                        }
                    }
                })
                current_index += 1 # Images take 1 char space
            else:
                 logger.warning("Skipping image with invalid src")

    return requests


@app.post("/insert-content", response_model=InsertResponse)
async def insert_content(request: InsertRequest):
    try:
        logger.info(f"Inserting content into doc {request.doc_id}")
        
        creds = Credentials(token=request.auth_token)
        service = build('docs', 'v1', credentials=creds)
        
        # 1. GENERATE REQUESTS FROM HTML
        try:
            logger.info("Parsing HTML content...")
            requests_payload = build_requests_from_html(request.content, request.position)
        except Exception as e:
            logger.error(f"HTML Parsing failed: {e}. Fallback to plain text.")
            requests_payload = [
                {'insertText': {'location': {'index': request.position}, 'text': request.content}}
            ]

        if not requests_payload:
             # Just return success if nothing to insert
            return InsertResponse(
                success=True, 
                message="No content to insert", 
                doc_url=f"https://docs.google.com/document/d/{request.doc_id}/edit"
            )

        # 2. EXECUTE BATCH UPDATE
        logger.info(f"Generated {len(requests_payload)} requests. Executing batchUpdate...")
        service.documents().batchUpdate(
            documentId=request.doc_id,
            body={'requests': requests_payload}
        ).execute()
        
        doc_url = f"https://docs.google.com/document/d/{request.doc_id}/edit"
        logger.info(f"✅ HTML Content inserted successfully!")
        
        return InsertResponse(
            success=True,
            message=f"HTML inserted ({len(requests_payload)} ops)",
            doc_url=doc_url
        )
        
    except RefreshError:
        raise HTTPException(status_code=401, detail="Auth token expired")
    except Exception as e:
        logger.error(f"❌ Failed: {str(e)}")
        if "404" in str(e): raise HTTPException(status_code=404, detail="Doc not found")
        if "403" in str(e): raise HTTPException(status_code=403, detail="Permission denied")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "google-docs-api-html-v2"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
