/**
 * FASTAPI MODULE - Biblioteca de Web Framework e API REST
 * Módulo de Prompt System para a biblioteca FastAPI
 */

import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';

export const FastAPIModule: PromptModule = {
  // ==================== IDENTIFICAÇÃO ====================
  id: 'fastapi-009',
  name: 'FastAPI',
  packageName: 'fastapi',
  version: '0.109.0',
  category: ModuleCategory.WEB_FRAMEWORK,
  subcategories: [
    'rest-api',
    'web-framework',
    'async',
    'openapi',
    'swagger',
    'pydantic',
    'validation',
    'authentication',
    'websockets',
    'microservices'
  ],

  // ==================== DESCRIÇÃO ====================
  description: 'Framework web moderno e de alta performance para construir APIs REST com Python 3.7+. Baseado em type hints, oferece validação automática, documentação interativa (Swagger/OpenAPI) e suporte completo a async/await.',
  purpose: 'Criar APIs REST rápidas, robustas e auto-documentadas com validação automática de dados e type safety',
  useCases: [
    'Criar APIs REST com endpoints HTTP',
    'Validação automática de request/response com Pydantic',
    'Documentação interativa Swagger UI e ReDoc',
    'Autenticação e autorização (OAuth2, JWT)',
    'WebSockets para comunicação em tempo real',
    'Background tasks e workers',
    'Dependency injection',
    'CORS e middleware',
    'Upload e download de arquivos',
    'GraphQL integration',
    'Microservices e APIs escaláveis'
  ],

  // ==================== CONFIGURAÇÃO ====================
  complexity: ModuleComplexity.INTERMEDIATE,
  environment: ExecutionEnvironment.PYTHON,
  dependencies: ['pydantic', 'starlette', 'uvicorn'],
  installCommand: 'pip install fastapi uvicorn[standard]',

  // ==================== PROMPT SYSTEM ====================
  promptSystem: {
    systemPrompt: `Você é um especialista em FastAPI, o framework Python para APIs REST.

Ao trabalhar com FastAPI, você SEMPRE deve:
- Usar type hints em todas as funções e parâmetros
- Definir modelos Pydantic para request/response
- Usar async/await quando possível para melhor performance
- Adicionar response_model para validação de saída
- Usar dependency injection para código reutilizável
- Documentar endpoints com docstrings e tags
- Configurar CORS quando necessário

REGRAS DE USO:
1. SEMPRE use type hints (FastAPI depende deles)
2. SEMPRE defina Pydantic models para validação
3. SEMPRE adicione response_model nos endpoints
4. Use async def quando possível (melhor performance)
5. SEMPRE trate erros com HTTPException
6. Configure CORS para APIs públicas
7. Use dependency injection para auth e validação

QUANDO USAR FASTAPI:
✅ Criar APIs REST modernas
✅ Microservices
✅ APIs com validação automática
✅ Documentação automática necessária
✅ Performance crítica (async)
✅ Type safety importante
✅ WebSockets
✅ Background tasks

QUANDO NÃO USAR FASTAPI:
❌ Sites com templates HTML (use Flask/Django)
❌ Aplicações sem API (use Django)
❌ Projetos legados Python 2.7
❌ Apenas scripts simples
❌ GraphQL puro (use Strawberry/Graphene)

ESTRUTURA DE RESPOSTA:
Sempre retorne código FastAPI com:
- Type hints completos
- Pydantic models
- Response models
- Error handling
- Documentação inline`,

    userPromptTemplate: `Tarefa: {task_description}

Entrada:
{input_description}

Parâmetros:
{parameters}

Crie um endpoint FastAPI seguindo as melhores práticas:
1. Defina Pydantic models para request/response
2. Use type hints apropriados
3. Adicione validação automática
4. Implemente error handling
5. Documente o endpoint`,

    examples: [
      {
        input: 'Criar API REST básica com CRUD',
        output: `from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

app = FastAPI(
    title="User API",
    description="API REST para gerenciar usuários",
    version="1.0.0"
)

# Models
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., regex=r"^[\\w\\.-]+@[\\w\\.-]+\\.\\w+$")
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: int
    created_at: datetime
    is_active: bool = True

    class Config:
        from_attributes = True

# In-memory database
users_db: List[UserResponse] = []

# Endpoints
@app.post("/users/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    """Criar novo usuário"""
    # Verificar se username já existe
    if any(u.username == user.username for u in users_db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username já existe"
        )

    new_user = UserResponse(
        id=len(users_db) + 1,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        created_at=datetime.utcnow()
    )
    users_db.append(new_user)
    return new_user

@app.get("/users/", response_model=List[UserResponse])
async def list_users(skip: int = 0, limit: int = 100):
    """Listar todos os usuários"""
    return users_db[skip : skip + limit]

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    """Buscar usuário por ID"""
    user = next((u for u in users_db if u.id == user_id), None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    return user

@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int):
    """Deletar usuário"""
    global users_db
    user = next((u for u in users_db if u.id == user_id), None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    users_db = [u for u in users_db if u.id != user_id]`
      },
      {
        input: 'Implementar autenticação JWT',
        output: `from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta

app = FastAPI()

# Configurações
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None

# Funções auxiliares
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    # Buscar usuário no banco
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# Endpoints
@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login e geração de token JWT"""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Retornar usuário autenticado"""
    return current_user`
      },
      {
        input: 'Upload e download de arquivos',
        output: `from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
from typing import List
import shutil

app = FastAPI()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    """Upload de arquivo único"""
    try:
        file_path = UPLOAD_DIR / file.filename

        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "filename": file.filename,
            "content_type": file.content_type,
            "size": file_path.stat().st_size,
            "path": str(file_path)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await file.close()

@app.post("/upload-multiple/")
async def upload_multiple_files(files: List[UploadFile] = File(...)):
    """Upload de múltiplos arquivos"""
    uploaded_files = []

    for file in files:
        try:
            file_path = UPLOAD_DIR / file.filename
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            uploaded_files.append({
                "filename": file.filename,
                "size": file_path.stat().st_size
            })
        except Exception as e:
            uploaded_files.append({
                "filename": file.filename,
                "error": str(e)
            })
        finally:
            await file.close()

    return {"files": uploaded_files}

@app.get("/download/{filename}")
async def download_file(filename: str):
    """Download de arquivo"""
    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )`
      },
      {
        input: 'Background tasks e workers',
        output: `from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import List
import time

app = FastAPI()

class EmailSchema(BaseModel):
    email: List[EmailStr]
    subject: str
    body: str

def send_email_background(email: str, subject: str, body: str):
    """Simular envio de email (tarefa pesada)"""
    print(f"Enviando email para {email}...")
    time.sleep(5)  # Simular delay
    print(f"Email enviado para {email}")

def process_data_background(data: dict):
    """Processar dados em background"""
    print(f"Processando {len(data)} itens...")
    time.sleep(10)
    print("Processamento concluído!")

@app.post("/send-email/")
async def send_email(email_data: EmailSchema, background_tasks: BackgroundTasks):
    """Enviar emails em background"""
    # Adicionar tarefas em background
    for email in email_data.email:
        background_tasks.add_task(
            send_email_background,
            email,
            email_data.subject,
            email_data.body
        )

    return {
        "message": "Emails sendo enviados em background",
        "emails_count": len(email_data.email)
    }

@app.post("/process/")
async def process_data(
    data: dict,
    background_tasks: BackgroundTasks
):
    """Processar dados em background e retornar imediatamente"""
    background_tasks.add_task(process_data_background, data)

    return {
        "message": "Processamento iniciado em background",
        "status": "processing"
    }`
      },
      {
        input: 'WebSocket para comunicação em tempo real',
        output: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    """WebSocket para chat em tempo real"""
    await manager.connect(websocket)
    try:
        # Notificar outros clientes
        await manager.broadcast(f"Cliente #{client_id} entrou no chat")

        while True:
            # Receber mensagem
            data = await websocket.receive_text()

            # Enviar de volta para o cliente
            await manager.send_personal_message(f"Você disse: {data}", websocket)

            # Broadcast para todos
            await manager.broadcast(f"Cliente #{client_id} disse: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"Cliente #{client_id} saiu do chat")`
      }
    ],

    outputFormat: {
      type: 'object',
      description: 'FastAPI endpoint com validação completa',
      properties: {
        endpoint: { type: 'string', description: 'Rota do endpoint' },
        method: { type: 'string', description: 'Método HTTP (GET, POST, etc)' },
        request_model: { type: 'object', description: 'Modelo Pydantic de entrada' },
        response_model: { type: 'object', description: 'Modelo Pydantic de saída' },
        status_code: { type: 'number', description: 'Código HTTP de sucesso' }
      }
    }
  },

  // ==================== METADATA ====================
  tags: [
    'fastapi',
    'api',
    'rest',
    'web',
    'framework',
    'async',
    'pydantic',
    'swagger',
    'openapi',
    'microservices'
  ],

  keywords: [
    'fastapi',
    'api',
    'rest',
    'endpoint',
    'web',
    'framework',
    'async',
    'pydantic',
    'validation',
    'swagger',
    'openapi',
    'jwt',
    'auth',
    'websocket',
    'microservice'
  ],

  performance: {
    speed: 9,
    memory: 8,
    cpuIntensive: false,
    gpuAccelerated: false,
    scalability: 9
  },

  // ==================== REGRAS DE SCORING ====================
  scoring: {
    baseScore: 0.90,
    rules: [
      {
        condition: 'keywords include ["api", "rest", "endpoint"]',
        adjustment: 0.08,
        description: 'Perfeito para APIs REST'
      },
      {
        condition: 'keywords include ["validation", "pydantic", "schema"]',
        adjustment: 0.05,
        description: 'Validação automática integrada'
      },
      {
        condition: 'keywords include ["async", "performance", "fast"]',
        adjustment: 0.05,
        description: 'Alta performance com async'
      },
      {
        condition: 'keywords include ["documentation", "swagger", "openapi"]',
        adjustment: 0.05,
        description: 'Documentação automática'
      },
      {
        condition: 'keywords include ["websocket", "realtime", "tempo real"]',
        adjustment: 0.05,
        description: 'Suporte nativo a WebSockets'
      },
      {
        condition: 'keywords include ["html", "template", "frontend"]',
        adjustment: -0.40,
        description: 'Não é para sites com templates'
      },
      {
        condition: 'keywords include ["graphql"] AND NOT include ["rest"]',
        adjustment: -0.30,
        description: 'GraphQL melhor com Strawberry/Graphene'
      }
    ]
  },

  // ==================== CONFIGURAÇÕES ADICIONAIS ====================
  config: {
    maxRetries: 3,
    timeout: 30000,
    cacheable: false,
    requiresAuth: false,
    rateLimit: null
  },

  // ==================== ALTERNATIVAS ====================
  alternatives: [
    {
      name: 'Flask',
      when: 'APIs simples, projetos legados, templates HTML',
      reason: 'Flask é mais simples mas menos features'
    },
    {
      name: 'Django REST Framework',
      when: 'Projeto Django existente, admin panel necessário',
      reason: 'DRF é integrado ao Django'
    },
    {
      name: 'Starlette',
      when: 'Máxima simplicidade, sem validação automática',
      reason: 'Starlette é a base do FastAPI mas mais simples'
    }
  ],

  // ==================== DOCUMENTAÇÃO ====================
  documentation: {
    official: 'https://fastapi.tiangolo.com/',
    examples: 'https://fastapi.tiangolo.com/tutorial/',
    apiReference: 'https://fastapi.tiangolo.com/reference/'
  },

  // ==================== TROUBLESHOOTING ====================
  commonIssues: [
    {
      issue: 'Pydantic validation error',
      solution: 'Verificar type hints e modelos Pydantic',
      code: `class UserCreate(BaseModel):
    username: str = Field(..., min_length=3)
    email: EmailStr  # Validação automática de email`
    },
    {
      issue: '422 Unprocessable Entity',
      solution: 'Request não passa na validação Pydantic',
      code: `# Adicionar validação customizada
from pydantic import validator

class User(BaseModel):
    age: int

    @validator('age')
    def age_must_be_positive(cls, v):
        if v < 0:
            raise ValueError('age must be positive')
        return v`
    }
  ],

  // ==================== BEST PRACTICES ====================
  bestPractices: [
    'Use type hints em todas as funções',
    'Defina Pydantic models para request/response',
    'Adicione response_model para validação de saída',
    'Use async def quando possível',
    'Configure CORS para APIs públicas',
    'Use dependency injection para código reutilizável',
    'Documente endpoints com docstrings e tags',
    'Implemente rate limiting para APIs públicas'
  ],

  // ==================== ESTATÍSTICAS ====================
  stats: {
    timesUsed: 0,
    successRate: 0,
    averageExecutionTime: 0,
    lastUsed: null,
    errors: []
  }
};

export default FastAPIModule;
