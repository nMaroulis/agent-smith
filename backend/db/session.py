from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.utils import get_absolute_db_path

DATABASE_URL = get_absolute_db_path(keep_url=True)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
