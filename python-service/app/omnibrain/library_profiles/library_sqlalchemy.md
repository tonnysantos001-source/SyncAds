# SQLAlchemy

## Informações Básicas

- **Nome:** sqlalchemy
- **Categoria:** Database, ORM, SQL
- **Versão Mínima:** 1.4.0
- **Versão Recomendada:** 2.0.0+
- **Licença:** MIT
- **Documentação:** https://docs.sqlalchemy.org/

## Descrição

SQLAlchemy é o ORM (Object-Relational Mapping) mais popular e poderoso do Python. Oferece um kit completo de ferramentas para trabalhar com bancos de dados SQL, desde o Core SQL expression language até o ORM completo. Suporta PostgreSQL, MySQL, SQLite, Oracle, MS SQL Server e outros através de dialetos. Ideal para qualquer aplicação que precise persistir dados em banco relacional.

## Casos de Uso Prioritários

1. **CRUD Operations** (confidence: 0.98)
2. **ORM Queries** (confidence: 0.95)
3. **Database Migrations** (confidence: 0.90)
4. **Complex Joins & Relationships** (confidence: 0.95)
5. **Bulk Operations** (confidence: 0.90)
6. **Transaction Management** (confidence: 0.95)
7. **Schema Creation** (confidence: 0.92)
8. **Raw SQL Execution** (confidence: 0.88)

## Prós

- ✅ ORM mais maduro e robusto do Python
- ✅ Suporta múltiplos bancos de dados
- ✅ Core SQL + ORM de alto nível
- ✅ Query builder poderoso
- ✅ Migrations com Alembic
- ✅ Connection pooling automático
- ✅ Transaction management sofisticado
- ✅ Lazy loading e eager loading
- ✅ Relacionamentos complexos (1-N, N-N)
- ✅ Documentação excelente
- ✅ Type hints support (2.0+)
- ✅ Async support completo

## Contras

- ⚠️ Curva de aprendizado moderada
- ⚠️ Verboso comparado a ORMs simples
- ⚠️ Performance overhead do ORM
- ⚠️ Pode ser overkill para queries simples
- ⚠️ Migrations requerem Alembic separado

## Performance

- **Velocidade:** ⭐⭐⭐⭐ (8/10)
- **Uso de Memória:** ⭐⭐⭐⭐ (8/10)
- **Qualidade de Output:** ⭐⭐⭐⭐⭐ (10/10)
- **Facilidade de Uso:** ⭐⭐⭐⭐ (8/10)

## Instalação

```bash
pip install sqlalchemy
# Para async support
pip install sqlalchemy[asyncio]
# Para PostgreSQL
pip install psycopg2-binary
# Para MySQL
pip install mysqlclient
```

## Keywords/Triggers

- sqlalchemy
- orm
- database
- sql
- postgres
- mysql
- sqlite
- crud
- query
- models
- tables
- relationships
- migrations
- session
- transaction

## Exemplos de Código

### Básico: CRUD com ORM

```python
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Setup
Base = declarative_base()
engine = create_engine('sqlite:///database.db')

# Model
class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50))
    email = Column(String(100), unique=True)

# Create tables
Base.metadata.create_all(engine)

# Session
Session = sessionmaker(bind=engine)
session = Session()

def crud_operations():
    """CRUD básico com SQLAlchemy"""
    # CREATE
    new_user = User(name="John Doe", email="john@example.com")
    session.add(new_user)
    session.commit()
    
    # READ
    user = session.query(User).filter_by(email="john@example.com").first()
    all_users = session.query(User).all()
    
    # UPDATE
    user.name = "John Updated"
    session.commit()
    
    # DELETE
    session.delete(user)
    session.commit()
    
    return {
        'success': True,
        'operations': ['create', 'read', 'update', 'delete']
    }
```

### Intermediário: Relationships e Joins

```python
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime

Base = declarative_base()

class Author(Base):
    __tablename__ = 'authors'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    email = Column(String(100))
    
    # Relationship
    books = relationship("Book", back_populates="author")

class Book(Base):
    __tablename__ = 'books'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(200))
    author_id = Column(Integer, ForeignKey('authors.id'))
    published_date = Column(DateTime, default=datetime.now)
    
    # Relationship
    author = relationship("Author", back_populates="books")

def query_with_relationships():
    """Queries com joins e relationships"""
    engine = create_engine('sqlite:///books.db')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Create author and books
    author = Author(name="J.K. Rowling", email="jk@example.com")
    book1 = Book(title="Harry Potter 1", author=author)
    book2 = Book(title="Harry Potter 2", author=author)
    
    session.add(author)
    session.commit()
    
    # Query with join (lazy loading)
    author = session.query(Author).filter_by(name="J.K. Rowling").first()
    books = author.books  # Automatic join
    
    # Eager loading (mais eficiente)
    from sqlalchemy.orm import joinedload
    author = session.query(Author).options(
        joinedload(Author.books)
    ).filter_by(name="J.K. Rowling").first()
    
    return {
        'author': author.name,
        'books': [book.title for book in author.books],
        'book_count': len(author.books)
    }
```

### Avançado: Bulk Operations e Transactions

```python
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager

Base = declarative_base()

class Product(Base):
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    price = Column(Float)
    stock = Column(Integer)

@contextmanager
def session_scope(Session):
    """Context manager para transactions"""
    session = Session()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

def bulk_operations():
    """Operações em lote com transactions"""
    engine = create_engine('sqlite:///products.db')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    
    # Bulk insert (mais rápido que add individual)
    products_data = [
        {'name': f'Product {i}', 'price': 10.0 + i, 'stock': 100}
        for i in range(1000)
    ]
    
    with session_scope(Session) as session:
        # Método 1: bulk_insert_mappings (mais rápido)
        session.bulk_insert_mappings(Product, products_data)
        
    # Bulk update
    with session_scope(Session) as session:
        # Update múltiplos registros
        session.query(Product).filter(
            Product.price < 50
        ).update({'stock': Product.stock + 10})
    
    # Complex query with aggregation
    with session_scope(Session) as session:
        from sqlalchemy import func
        
        stats = session.query(
            func.count(Product.id).label('total'),
            func.avg(Product.price).label('avg_price'),
            func.sum(Product.stock).label('total_stock')
        ).first()
        
        return {
            'total_products': stats.total,
            'average_price': float(stats.avg_price),
            'total_stock': stats.total_stock
        }
```

### Expert: Async SQLAlchemy 2.0

```python
from sqlalchemy import Column, Integer, String, select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import asyncio

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True)
    email = Column(String(100))

async def async_database_operations():
    """SQLAlchemy 2.0 async operations"""
    # Async engine
    engine = create_async_engine(
        'sqlite+aiosqlite:///async_database.db',
        echo=True
    )
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Async session factory
    AsyncSessionLocal = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    # Create
    async with AsyncSessionLocal() as session:
        new_user = User(username="async_user", email="async@example.com")
        session.add(new_user)
        await session.commit()
    
    # Read with new 2.0 syntax
    async with AsyncSessionLocal() as session:
        # New select() syntax
        stmt = select(User).where(User.username == "async_user")
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if user:
            return {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
    
    return None

# Run async
# result = asyncio.run(async_database_operations())
```

### Expert: Raw SQL e Core Expression

```python
from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData, select, text

def raw_sql_operations():
    """Core SQL e raw queries"""
    engine = create_engine('sqlite:///core.db')
    metadata = MetaData()
    
    # Define table usando Core
    users = Table('users', metadata,
        Column('id', Integer, primary_key=True),
        Column('name', String(50)),
        Column('age', Integer)
    )
    
    metadata.create_all(engine)
    
    with engine.connect() as conn:
        # Insert usando Core
        stmt = users.insert().values(name='Alice', age=30)
        conn.execute(stmt)
        
        # Select usando Core
        stmt = select(users).where(users.c.age > 25)
        result = conn.execute(stmt)
        rows = result.fetchall()
        
        # Raw SQL com text()
        stmt = text("SELECT * FROM users WHERE name LIKE :pattern")
        result = conn.execute(stmt, {"pattern": "A%"})
        
        # Transaction manual
        trans = conn.begin()
        try:
            conn.execute(users.insert().values(name='Bob', age=25))
            conn.execute(users.insert().values(name='Charlie', age=35))
            trans.commit()
        except:
            trans.rollback()
            raise
        
        conn.commit()
    
    return {
        'success': True,
        'rows_found': len(rows)
    }
```

## Templates por Caso de Uso

### Template: Basic CRUD

```python
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()
engine = create_engine('{database_url}')

class {ModelName}(Base):
    __tablename__ = '{table_name}'
    id = Column(Integer, primary_key=True)
    # Add columns here

Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

# Create
obj = {ModelName}(...)
session.add(obj)
session.commit()

# Read
obj = session.query({ModelName}).filter_by(id=1).first()

# Update
obj.field = new_value
session.commit()

# Delete
session.delete(obj)
session.commit()
```

### Template: Relationships

```python
class Parent(Base):
    __tablename__ = 'parent'
    id = Column(Integer, primary_key=True)
    children = relationship("Child", back_populates="parent")

class Child(Base):
    __tablename__ = 'child'
    id = Column(Integer, primary_key=True)
    parent_id = Column(Integer, ForeignKey('parent.id'))
    parent = relationship("Parent", back_populates="children")
```

### Template: Async 2.0

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select

engine = create_async_engine('{async_database_url}')

async with AsyncSession(engine) as session:
    stmt = select(Model).where(Model.field == value)
    result = await session.execute(stmt)
    obj = result.scalar_one_or_none()
```

## Alternativas e Quando Usar

| Biblioteca | Quando Usar em Vez de SQLAlchemy |
|------------|-----------------------------------|
| Django ORM | Já usa Django framework |
| Peewee | Projetos pequenos, API simples |
| Tortoise ORM | Async-first, inspirado em Django ORM |
| SQLModel | FastAPI + Pydantic + SQLAlchemy simplificado |
| Raw SQL | Performance crítica, queries muito específicas |
| Databases | Async queries simples sem ORM |

## Requisitos do Sistema

- Python 3.7+
- Driver de banco de dados (psycopg2, mysqlclient, etc)
- ~10MB de espaço

## Dependências

```
greenlet>=1.0
# Para async
aiosqlite  # SQLite async
asyncpg    # PostgreSQL async
aiomysql   # MySQL async
```

## Notas de Compatibilidade

- ✅ Windows, Linux, macOS
- ✅ Python 3.7-3.12
- ✅ PostgreSQL, MySQL, SQLite, Oracle, MS SQL
- ✅ Async support em 1.4+ (completo em 2.0+)
- ⚠️ Cada banco precisa seu driver específico

## Troubleshooting Comum

### Problema: "No module named 'psycopg2'"

**Solução:**
```bash
pip install psycopg2-binary
```

### Problema: "DetachedInstanceError"

**Solução:**
```python
# Usar expire_on_commit=False
Session = sessionmaker(bind=engine, expire_on_commit=False)
# Ou fazer query na mesma sessão
```

### Problema: N+1 Query Problem

**Solução:**
```python
# Usar eager loading
from sqlalchemy.orm import joinedload
users = session.query(User).options(
    joinedload(User.posts)
).all()
```

### Problema: "Table already exists"

**Solução:**
```python
# Usar checkfirst=True
Base.metadata.create_all(engine, checkfirst=True)
# Ou usar Alembic para migrations
```

## Score de Seleção

```python
def calculate_sqlalchemy_score(task_keywords: list) -> float:
    base_score = 0.75
    
    # Boost para operações de banco de dados
    if any(k in task_keywords for k in ['database', 'sql', 'crud', 'query', 'orm']):
        base_score += 0.20
    
    # Boost para relacionamentos complexos
    if any(k in task_keywords for k in ['relationships', 'joins', 'foreign key']):
        base_score += 0.10
    
    # Penalty se for NoSQL
    if any(k in task_keywords for k in ['mongodb', 'nosql', 'document']):
        base_score -= 0.50
    
    return min(base_score, 0.95)
```

## Database URLs

```python
# SQLite
'sqlite:///database.db'
'sqlite:////absolute/path/to/database.db'

# PostgreSQL
'postgresql://user:password@localhost/dbname'
'postgresql+psycopg2://user:password@localhost/dbname'

# MySQL
'mysql://user:password@localhost/dbname'
'mysql+mysqldb://user:password@localhost/dbname'

# MS SQL Server
'mssql+pyodbc://user:password@localhost/dbname?driver=ODBC+Driver+17+for+SQL+Server'

# Oracle
'oracle://user:password@localhost:1521/dbname'
```

## Best Practices

### 1. Sempre usar context manager ou try-finally

```python
session = Session()
try:
    # operações
    session.commit()
except:
    session.rollback()
    raise
finally:
    session.close()
```

### 2. Usar connection pooling

```python
engine = create_engine(
    'postgresql://...',
    pool_size=10,
    max_overflow=20
)
```

### 3. Eager loading para evitar N+1

```python
from sqlalchemy.orm import joinedload, subqueryload
query.options(joinedload(Model.relationship))
```

### 4. Usar índices para performance

```python
class User(Base):
    __tablename__ = 'users'
    email = Column(String, index=True)  # Index
```

## Última Atualização

2025-01-15