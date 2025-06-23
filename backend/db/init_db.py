import os
from pathlib import Path
from backend.db.session import engine
from backend.db.base import Base

# Import all models so metadata is complete
from backend.models.llm_credentials import LLMCredential
from backend.models.flows import Flow
from backend.models.functions import Function

DB_PATH = Path(os.getenv("DATABASE_URL", "sqlite:///./storage/dev.db").replace("sqlite:///", ""))

def init_db():
    if not DB_PATH.exists():
        print(f"[AgentSmith DB] Creating database at {DB_PATH}")
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        Base.metadata.create_all(bind=engine)
        print("[AgentSmith DB] ✅ Database and tables created.")
    else:
        print("[AgentSmith DB] ✅ Database already exists, skipping creation.")


# in case the file is ran directly
if __name__ == "__main__":
    init_db()
