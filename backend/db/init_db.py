import os
from pathlib import Path
from db.session import engine
from db.base import Base

# Import all models so metadata is complete
from models.llms import LLMRemote, LLMLocal
from models.flows import Flow
from models.functions import Function

from dotenv import load_dotenv


# load_dotenv(dotenv_path='paths.env')

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
