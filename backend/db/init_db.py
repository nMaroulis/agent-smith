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

# DB_PATH = Path(os.getenv("DATABASE_URL", "sqlite:///./storage/dev.db").replace("sqlite:///", ""))

load_dotenv(Path(__file__).resolve().parents[2] / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")


def init_db():
    if not Path(DATABASE_URL.replace("sqlite:///", "")).exists():
        print(f"[AgentSmith DB] Creating database at {DATABASE_URL}")
        Path(DATABASE_URL.replace("sqlite:///", "")).parent.mkdir(parents=True, exist_ok=True)
        Base.metadata.create_all(bind=engine)
        print("[AgentSmith DB] ✅ Database and tables created.")
    else:
        print("[AgentSmith DB] ✅ Database already exists, skipping creation.")


# in case the file is ran directly
if __name__ == "__main__":
    init_db()
