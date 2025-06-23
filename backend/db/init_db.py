from pathlib import Path
from db.session import engine
from db.base import Base
from models.llms import LLMRemote, LLMLocal
from models.flows import Flow
from models.functions import Function
from db.utils import get_absolute_db_path

DB_PATH = get_absolute_db_path(keep_url=False)

def init_db():
    if not Path(DB_PATH).exists():
        print(f"[AgentSmith DB] Creating database at {DB_PATH}")
        Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
        Base.metadata.create_all(bind=engine)
        print("[AgentSmith DB] ✅ Database and tables created.")
    else:
        print("[AgentSmith DB] ✅ Database already exists, skipping creation.")


# in case the file is ran directly
if __name__ == "__main__":
    init_db()
