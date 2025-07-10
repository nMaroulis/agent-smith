from sqlalchemy import Column, Integer, String, JSON
from db.base import Base


class LLMRemote(Base):
    __tablename__ = 'llm_remote'

    id = Column(Integer, primary_key=True)
    alias = Column(String, nullable=False, unique=True)
    provider = Column(String, nullable=False)
    api_key = Column(String, nullable=False)
    parameters = Column(JSON, nullable=True)
    base_url = Column(String, nullable=True)


class LLMLocal(Base):
    __tablename__ = 'llm_local'

    id = Column(Integer, primary_key=True)
    alias = Column(String, nullable=False, unique=True)
    provider = Column(String, nullable=False)
    path = Column(String, nullable=False)
    parameters = Column(JSON, nullable=True)


