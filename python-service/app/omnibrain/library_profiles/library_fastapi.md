# FastAPI

## Informações Básicas

- **Nome:** fastapi
- **Categoria:** Web Framework, API Development, REST API
- **Versão Mínima:** 0.95.0
- **Versão Recomendada:** 0.109.0+
- **Licença:** MIT
- **Documentação:** https://fastapi.tiangolo.com/

## Descrição

FastAPI é um framework web moderno e de alta performance para construção de APIs com Python 3.7+. Baseado em type hints do Python, oferece validação automática de dados, geração automática de documentação interativa (Swagger/OpenAPI), suporte async nativo, e é um dos frameworks Python mais rápidos disponíveis, comparável a Node.js e Go.

## Casos de Uso Prioritários

1. **Criação de REST APIs** (confidence: 0.98)
2. **APIs com Validação Automática** (confidence: 0.95)
3. **Microservices** (confidence: 0.95)
4. **APIs Assíncronas** (confidence: 0.95)
5. **Backend para SPAs** (confidence: 0.93)
6. **APIs com Documentação Auto-gerada** (confidence: 0.98)
7. **WebSocket APIs** (confidence: 0.90)
8. **GraphQL APIs** (confidence: 0.85)
9. **Background Tasks** (confidence: 0.90)
10. **OAuth2/JWT Authentication** (confidence: 0.92)

## Prós

- ✅ Extremamente rápido (performance comparável a Node.js/Go)
- ✅ Type hints nativos com validação automática (Pydantic)
- ✅ Documentação interativa automática (Swagger UI + ReDoc)
- ✅ Async/await nativo com suporte total
- ✅ Fácil de aprender e usar
- ✅ Code completion e type checking excelentes
- ✅ Dependency injection poderoso
- ✅ Testes automatizados simples
- ✅ WebSocket support nativo
- ✅ Comunidade ativa e crescente
- ✅ Compatível com Starlette e Pydantic

## Contras

- ⚠️ Relativamente novo (menos maduro que Flask/Django)
- ⚠️ Menos plugins que Flask/Django
- ⚠️ Curva de aprendizado para async (para iniciantes)
- ⚠️ Type hints obrigatórios para aproveitar melhor
- ⚠️ Menos templates/exemplos que frameworks mais antigos

## Performance

- **Velocidade:** ⭐⭐⭐⭐⭐ (10/10)
- **Uso de Memória:** ⭐⭐⭐⭐ (8.5/10)
- **Qualidade de Output:** ⭐⭐⭐⭐⭐ (10/10)
- **Facilidade de Uso:** ⭐⭐⭐⭐⭐ (9.5/10)

## Instalação

```bash
pip install fastapi
pip install "uvicorn[standard]"
```

## Keywords/Triggers

- fastapi
- rest api
- api
- web api
- microservice
- web framework
- async api
- api documentation
- swagger
- openapi
- pydantic
- type hints
- validation
- web service

## Exemplos de Código

### Básico: Hello World API

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}

# Run: uvicorn main:app --reload
```

### Intermediário: API com Validação Pydantic

```python
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional

app = FastAPI()

class Item(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    price: float = Field(..., gt=0)
    tax: Optional[float] = Field(None, ge=0)

@app.post("/items/")
async def create_item(item: Item):
    """Cria um novo item com validação automática"""
    item_dict = item.dict()
    if item.tax:
        price_with_tax = item.price + item.tax
        item_dict.update({"price_with_tax": price_with_tax})
    
    return {
        "success": True,
        "item": item_dict
    }

@app.get("/items/{item_id}")
async def read_item(item_id: int):
    """Busca item por ID"""
    return {
        "item_id": item_id,
        "name": f"Item {item_id}"
    }
```

### Avançado: CRUD Completo com Database

```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import List

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class ItemDB(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Integer)

Base.metadata.create_all(bind=engine)

# Pydantic schemas
class ItemCreate(BaseModel):
    name: str
    description: str
    price: float

class ItemResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float

    class Config:
        orm_mode = True

# FastAPI app
app = FastAPI()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Endpoints
@app.post("/items/", response_model=ItemResponse)
async def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    """Cria novo item no banco"""
    db_item = ItemDB(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/items/", response_model=List[ItemResponse])
async def read_items(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """Lista todos os items"""
    items = db.query(ItemDB).offset(skip).limit(limit).all()
    return items

@app.get("/items/{item_id}", response_model=ItemResponse)
async def read_item(item_id: int, db: Session = Depends(get_db)):
    """Busca item específico"""
    item = db.query(ItemDB).filter(ItemDB.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@app.put("/items/{item_id}", response_model=ItemResponse)
async def update_item(item_id: int, item: ItemCreate, db: Session = Depends(get_db)):
    """Atualiza item"""
    db_item = db.query(ItemDB).filter(ItemDB.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    
    for key, value in item.dict().items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/items/{item_id}")
async def delete_item(item_id: int, db: Session = Depends(get_db)):
    """Deleta item"""
    db_item = db.query(ItemDB).filter(ItemDB.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(db_item)
    db.commit()
    return {"success": True, "deleted_id": item_id}
```

### Expert: API com Auth, Background Tasks, WebSocket

```python
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, WebSocket
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
import jwt
from datetime import datetime, timedelta

app = FastAPI()

# Auth
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class User(BaseModel):
    username: str
    email: Optional[str] = None

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return User(username=username)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth endpoints
@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint"""
    # Validação simplificada (use banco real)
    if form_data.username == "admin" and form_data.password == "admin":
        access_token = create_access_token(data={"sub": form_data.username})
        return {"access_token": access_token, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user"""
    return current_user

# Background tasks
def write_log(message: str):
    """Background task example"""
    with open("log.txt", "a") as log:
        log.write(f"{datetime.now()}: {message}\n")

@app.post("/send-notification/")
async def send_notification(email: str, background_tasks: BackgroundTasks):
    """Endpoint com background task"""
    background_tasks.add_task(write_log, f"Notification sent to {email}")
    return {"message": "Notification will be sent"}

# WebSocket
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except:
        pass
```

## Templates por Caso de Uso

### Template: Basic API

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.get("/{endpoint}")
def read_endpoint(endpoint: str):
    return {"endpoint": endpoint}
```

### Template: API with Validation

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

@app.post("/items/")
async def create_item(item: Item):
    return {"item": item.dict()}
```

### Template: API with Database

```python
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/items/")
def read_items(db: Session = Depends(get_db)):
    return db.query(ItemModel).all()
```

## Alternativas e Quando Usar

| Framework | Quando Usar em Vez de FastAPI |
|-----------|-------------------------------|
| Flask | Projeto simples, não precisa validação automática, muitos plugins necessários |
| Django | Full-stack app, admin panel necessário, ORM Django preferido |
| Starlette | Precisa apenas das funcionalidades básicas sem validação |
| Sanic | Projeto legado já usando Sanic |
| Tornado | WebSocket intensivo, long-polling |

## Requisitos do Sistema

- Python 3.7+
- pip
- ~50MB de espaço em disco
- Uvicorn ou Hypercorn para ASGI

## Dependências

```
pydantic>=1.10.0
starlette>=0.27.0
typing-extensions>=4.5.0
```

## Notas de Compatibilidade

- ✅ Windows, Linux, macOS
- ✅ Python 3.7-3.12
- ✅ Async/await nativo
- ✅ Type hints obrigatórios para validação
- ✅ ASGI servers (Uvicorn, Hypercorn, Daphne)
- ⚠️ Não é WSGI (use adaptadores se necessário)

## Troubleshooting Comum

### Problema: "ImportError: cannot import name 'FastAPI'"

**Solução:** Instalar fastapi
```bash
pip install fastapi
```

### Problema: "uvicorn: command not found"

**Solução:** Instalar uvicorn
```bash
pip install "uvicorn[standard]"
```

### Problema: Validação não funciona

**Solução:** Adicionar type hints
```python
# Errado
@app.post("/items/")
def create_item(name, price):
    return {"name": name, "price": price}

# Correto
@app.post("/items/")
def create_item(name: str, price: float):
    return {"name": name, "price": price}
```

### Problema: CORS errors no frontend

**Solução:** Adicionar CORS middleware
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Score de Seleção

```python
def calculate_fastapi_score(task_keywords: list) -> float:
    base_score = 0.80
    
    # Boost para APIs REST
    if any(k in task_keywords for k in ['api', 'rest', 'endpoint', 'microservice']):
        base_score += 0.15
    
    # Boost para validação automática
    if any(k in task_keywords for k in ['validation', 'type', 'schema']):
        base_score += 0.10
    
    # Boost para async
    if 'async' in task_keywords or 'concurrent' in task_keywords:
        base_score += 0.10
    
    # Penalty para frontend rendering
    if any(k in task_keywords for k in ['template', 'html', 'frontend']):
        base_score -= 0.30
    
    return min(base_score, 0.98)
```

## Best Practices

### 1. Sempre use Type Hints
```python
@app.get("/items/{item_id}")
async def read_item(item_id: int, q: Optional[str] = None):
    return {"item_id": item_id, "q": q}
```

### 2. Use Pydantic Models para Validação
```python
class Item(BaseModel):
    name: str
    price: float
    
@app.post("/items/")
async def create_item(item: Item):
    return item
```

### 3. Dependency Injection para Recursos
```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/items/")
def read_items(db: Session = Depends(get_db)):
    return db.query(Item).all()
```

### 4. Use response_model para Output
```python
@app.get("/items/", response_model=List[ItemResponse])
async def read_items():
    return items
```

## Integração com Outras Bibliotecas

### SQLAlchemy
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine("postgresql://user:pass@localhost/db")
SessionLocal = sessionmaker(bind=engine)
```

### Redis
```python
from redis import Redis
redis = Redis(host='localhost', port=6379)

@app.get("/cache/{key}")
async def get_cache(key: str):
    return redis.get(key)
```

### Celery
```python
from celery import Celery

celery = Celery('tasks', broker='redis://localhost:6379')

@app.post("/task/")
async def create_task(task_data: dict):
    task = celery.send_task('tasks.process', args=[task_data])
    return {"task_id": task.id}
```

## Testing

```python
from fastapi.testclient import TestClient

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}
```

## Última Atualização

2025-01-15