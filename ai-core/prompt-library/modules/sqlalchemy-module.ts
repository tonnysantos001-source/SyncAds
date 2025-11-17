/**
 * SQLALCHEMY MODULE - Biblioteca de ORM e Database
 * Módulo de Prompt System para a biblioteca SQLAlchemy
 */

import { PromptModule, ModuleCategory, ModuleComplexity, ExecutionEnvironment } from '../registry';

export const SQLAlchemyModule: PromptModule = {
  // ==================== IDENTIFICAÇÃO ====================
  id: 'sqlalchemy-008',
  name: 'SQLAlchemy',
  packageName: 'sqlalchemy',
  version: '2.0.0',
  category: ModuleCategory.DATABASE,
  subcategories: [
    'orm',
    'database',
    'sql',
    'query-builder',
    'migrations',
    'models',
    'relationships',
    'postgresql',
    'mysql',
    'sqlite'
  ],

  // ==================== DESCRIÇÃO ====================
  description: 'ORM (Object-Relational Mapping) e toolkit SQL mais popular para Python. Oferece abstração completa de banco de dados com suporte a múltiplos backends, query builder poderoso e sistema de migrations.',
  purpose: 'Interagir com bancos de dados relacionais usando Python de forma orientada a objetos, executar queries complexas e gerenciar schemas',
  useCases: [
    'Criar e gerenciar modelos de banco de dados (ORM)',
    'Executar queries SQL complexas',
    'Relacionamentos entre tabelas (1:1, 1:N, N:N)',
    'Migrations e versionamento de schema',
    'Suporte a PostgreSQL, MySQL, SQLite, Oracle',
    'Transações e rollback',
    'Connection pooling',
    'Query builder type-safe',
    'Eager/Lazy loading de relacionamentos',
    'Raw SQL quando necessário'
  ],

  // ==================== CONFIGURAÇÃO ====================
  complexity: ModuleComplexity.ADVANCED,
  environment: ExecutionEnvironment.PYTHON,
  dependencies: ['greenlet', 'typing-extensions'],
  installCommand: 'pip install sqlalchemy',

  // ==================== PROMPT SYSTEM ====================
  promptSystem: {
    systemPrompt: `Você é um especialista em SQLAlchemy, o ORM Python para bancos de dados relacionais.

Ao trabalhar com SQLAlchemy, você SEMPRE deve:
- Usar SQLAlchemy 2.0 style (declarative base com mapped_column)
- Criar session factory com proper scope
- Fazer commit explícito de transações
- Usar context manager para sessions (with statement)
- Definir relacionamentos com lazy loading adequado
- Adicionar indexes em colunas de busca frequente
- Usar type hints nas definições de modelos

REGRAS DE USO:
1. SEMPRE use context manager para sessions
2. SEMPRE faça commit explícito ou rollback em caso de erro
3. SEMPRE defina __repr__ nos modelos para debugging
4. NUNCA deixe sessões abertas sem close
5. SEMPRE use eager loading para evitar N+1 queries
6. Use engine.dispose() ao finalizar aplicação
7. Configure connection pool adequadamente

QUANDO USAR SQLALCHEMY:
✅ Aplicações com banco de dados relacional
✅ Modelos complexos com relacionamentos
✅ Queries SQL complexas com type safety
✅ Migrations de schema
✅ Múltiplos backends de database
✅ Transações complexas
✅ Connection pooling

QUANDO NÃO USAR SQLALCHEMY:
❌ Bancos NoSQL (use pymongo, redis-py)
❌ Queries extremamente simples (use sqlite3 direto)
❌ Apenas raw SQL sem ORM (use psycopg2, pymysql)
❌ GraphQL APIs (use Strawberry, Graphene)
❌ Performance crítica com milhões de inserções (use bulk inserts)

ESTRUTURA DE RESPOSTA:
Sempre retorne um dicionário com:
- success: boolean
- data: dados retornados (lista de objetos ou dicts)
- rows_affected: número de linhas afetadas
- query: query executada (se debug)
- error: mensagem de erro (se houver)`,

    userPromptTemplate: `Tarefa: {task_description}

Entrada:
{input_description}

Parâmetros:
{parameters}

Use SQLAlchemy seguindo as melhores práticas:
1. Configure engine e session
2. Defina modelos se necessário
3. Execute a operação (query, insert, update, delete)
4. Commit/rollback adequadamente
5. Retorne dados estruturados`,

    examples: [
      {
        input: 'Criar modelo de usuário com relacionamentos',
        output: `from sqlalchemy import create_engine, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, Session
from datetime import datetime
from typing import List, Optional

# Base declarativa
class Base(DeclarativeBase):
    pass

# Modelo User
class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relacionamento 1:N
    posts: Mapped[List["Post"]] = relationship(back_populates="author", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"

# Modelo Post
class Post(Base):
    __tablename__ = 'posts'

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str]
    author_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relacionamento N:1
    author: Mapped["User"] = relationship(back_populates="posts")

    def __repr__(self):
        return f"<Post(id={self.id}, title='{self.title}')>"

# Setup
engine = create_engine('sqlite:///app.db', echo=True)
Base.metadata.create_all(engine)`
      },
      {
        input: 'Executar queries com filtros e joins',
        output: `from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, joinedload
from typing import Dict, Any, List

def query_users_with_posts(min_posts: int = 0) -> Dict[str, Any]:
    """Query usuários com seus posts usando joins"""
    engine = create_engine('sqlite:///app.db')

    try:
        with Session(engine) as session:
            # Query com join e eager loading
            stmt = (
                select(User)
                .join(User.posts)
                .options(joinedload(User.posts))
                .where(User.posts.any())
                .group_by(User.id)
                .having(func.count(Post.id) >= min_posts)
            )

            users = session.execute(stmt).unique().scalars().all()

            # Converter para dicts
            result = []
            for user in users:
                result.append({
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "posts_count": len(user.posts),
                    "posts": [
                        {
                            "id": post.id,
                            "title": post.title,
                            "created_at": post.created_at.isoformat()
                        }
                        for post in user.posts
                    ]
                })

            return {
                "success": True,
                "users_found": len(result),
                "data": result
            }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        engine.dispose()`
      },
      {
        input: 'Inserir dados com transação',
        output: `from sqlalchemy import create_engine
from sqlalchemy.orm import Session

def create_user_with_posts(username: str, email: str, posts_data: List[Dict]) -> Dict[str, Any]:
    """Cria usuário e posts em uma transação"""
    engine = create_engine('sqlite:///app.db')

    try:
        with Session(engine) as session:
            # Criar usuário
            new_user = User(
                username=username,
                email=email
            )
            session.add(new_user)
            session.flush()  # Flush para obter ID

            # Criar posts
            for post_data in posts_data:
                new_post = Post(
                    title=post_data['title'],
                    content=post_data['content'],
                    author_id=new_user.id
                )
                session.add(new_post)

            # Commit transação
            session.commit()

            return {
                "success": True,
                "user_id": new_user.id,
                "username": new_user.username,
                "posts_created": len(posts_data)
            }
    except Exception as e:
        session.rollback()
        return {"success": False, "error": str(e)}
    finally:
        engine.dispose()`
      },
      {
        input: 'Update e Delete com condições',
        output: `from sqlalchemy import create_engine, update, delete
from sqlalchemy.orm import Session

def update_and_delete_posts(user_id: int, archive_old: bool = True) -> Dict[str, Any]:
    """Atualiza e deleta posts com condições"""
    engine = create_engine('sqlite:///app.db')

    try:
        with Session(engine) as session:
            # Update: marcar posts antigos como arquivados
            if archive_old:
                cutoff_date = datetime.utcnow() - timedelta(days=365)
                stmt_update = (
                    update(Post)
                    .where(Post.created_at < cutoff_date)
                    .where(Post.author_id == user_id)
                    .values(archived=True)
                )
                result_update = session.execute(stmt_update)
                updated_count = result_update.rowcount
            else:
                updated_count = 0

            # Delete: remover posts sem conteúdo
            stmt_delete = (
                delete(Post)
                .where(Post.content == "")
                .where(Post.author_id == user_id)
            )
            result_delete = session.execute(stmt_delete)
            deleted_count = result_delete.rowcount

            session.commit()

            return {
                "success": True,
                "posts_updated": updated_count,
                "posts_deleted": deleted_count
            }
    except Exception as e:
        session.rollback()
        return {"success": False, "error": str(e)}
    finally:
        engine.dispose()`
      },
      {
        input: 'Raw SQL para queries complexas',
        output: `from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

def execute_raw_sql(query: str, params: Dict = None) -> Dict[str, Any]:
    """Executa raw SQL quando necessário"""
    engine = create_engine('sqlite:///app.db')

    try:
        with Session(engine) as session:
            # Executar raw SQL com parâmetros
            stmt = text(query)
            result = session.execute(stmt, params or {})

            # Buscar resultados
            if result.returns_rows:
                rows = result.fetchall()
                columns = result.keys()

                # Converter para lista de dicts
                data = [dict(zip(columns, row)) for row in rows]

                return {
                    "success": True,
                    "rows_found": len(data),
                    "data": data
                }
            else:
                # DML (INSERT, UPDATE, DELETE)
                session.commit()
                return {
                    "success": True,
                    "rows_affected": result.rowcount
                }
    except Exception as e:
        session.rollback()
        return {"success": False, "error": str(e)}
    finally:
        engine.dispose()`
      }
    ],

    outputFormat: {
      type: 'object',
      required: ['success'],
      properties: {
        success: { type: 'boolean', description: 'Indica se a operação foi bem-sucedida' },
        data: { type: 'array', description: 'Dados retornados (lista de objetos)' },
        rows_affected: { type: 'number', description: 'Número de linhas afetadas' },
        rows_found: { type: 'number', description: 'Número de linhas encontradas' },
        error: { type: 'string', description: 'Mensagem de erro se success=false' }
      }
    }
  },

  // ==================== METADATA ====================
  tags: [
    'sqlalchemy',
    'orm',
    'database',
    'sql',
    'postgresql',
    'mysql',
    'sqlite',
    'query',
    'models',
    'migrations'
  ],

  keywords: [
    'sqlalchemy',
    'orm',
    'database',
    'banco de dados',
    'sql',
    'query',
    'model',
    'modelo',
    'table',
    'tabela',
    'postgresql',
    'mysql',
    'sqlite',
    'relationship',
    'relacionamento',
    'migration'
  ],

  performance: {
    speed: 7,
    memory: 8,
    cpuIntensive: false,
    gpuAccelerated: false,
    scalability: 8
  },

  // ==================== REGRAS DE SCORING ====================
  scoring: {
    baseScore: 0.85,
    rules: [
      {
        condition: 'keywords include ["orm", "model", "modelo", "relationship"]',
        adjustment: 0.10,
        description: 'Perfeito para ORM'
      },
      {
        condition: 'keywords include ["database", "banco", "sql", "query"]',
        adjustment: 0.08,
        description: 'Ideal para operações de database'
      },
      {
        condition: 'keywords include ["postgresql", "mysql", "sqlite"]',
        adjustment: 0.07,
        description: 'Suporta múltiplos backends'
      },
      {
        condition: 'keywords include ["migration", "schema", "create table"]',
        adjustment: 0.05,
        description: 'Bom para migrations'
      },
      {
        condition: 'keywords include ["nosql", "mongodb", "redis"]',
        adjustment: -0.60,
        description: 'Não é para bancos NoSQL'
      },
      {
        condition: 'keywords include ["simple", "single query"] AND NOT include ["relationship", "join"]',
        adjustment: -0.20,
        description: 'Queries muito simples não precisam de ORM'
      }
    ]
  },

  // ==================== CONFIGURAÇÕES ADICIONAIS ====================
  config: {
    maxRetries: 2,
    timeout: 30000,
    cacheable: false,
    requiresAuth: false,
    rateLimit: null
  },

  // ==================== ALTERNATIVAS ====================
  alternatives: [
    {
      name: 'Django ORM',
      when: 'Projeto Django, ORM mais simples',
      reason: 'Django ORM é integrado e mais simples'
    },
    {
      name: 'Peewee',
      when: 'ORM mais leve e simples',
      reason: 'Peewee é mais leve mas menos poderoso'
    },
    {
      name: 'psycopg2/pymysql',
      when: 'Apenas raw SQL, sem ORM',
      reason: 'Drivers nativos são mais diretos'
    },
    {
      name: 'Tortoise ORM',
      when: 'ORM assíncrono',
      reason: 'Tortoise é async-first'
    }
  ],

  // ==================== DOCUMENTAÇÃO ====================
  documentation: {
    official: 'https://docs.sqlalchemy.org/',
    examples: 'https://docs.sqlalchemy.org/en/20/tutorial/',
    apiReference: 'https://docs.sqlalchemy.org/en/20/orm/'
  },

  // ==================== TROUBLESHOOTING ====================
  commonIssues: [
    {
      issue: 'DetachedInstanceError',
      solution: 'Usar eager loading ou acessar relacionamentos dentro da sessão',
      code: `# Use joinedload para eager loading
stmt = select(User).options(joinedload(User.posts))
users = session.execute(stmt).scalars().all()`
    },
    {
      issue: 'N+1 Query Problem',
      solution: 'Usar eager loading com joinedload ou selectinload',
      code: `# Evitar N+1
stmt = select(User).options(selectinload(User.posts))
users = session.execute(stmt).scalars().all()`
    },
    {
      issue: 'Session closed error',
      solution: 'Usar context manager ou não fechar sessão prematuramente',
      code: `with Session(engine) as session:
    # Fazer operações aqui
    session.commit()  # Commit antes de sair do context`
    }
  ],

  // ==================== BEST PRACTICES ====================
  bestPractices: [
    'Use SQLAlchemy 2.0 style com mapped_column',
    'Sempre use context manager para sessions',
    'Faça commit explícito ou rollback em caso de erro',
    'Use eager loading para evitar N+1 queries',
    'Defina indexes em colunas de busca frequente',
    'Configure connection pool adequadamente',
    'Use type hints nas definições de modelos',
    'Defina __repr__ nos modelos para debugging'
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

export default SQLAlchemyModule;
