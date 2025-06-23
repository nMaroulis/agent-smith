from sqlalchemy import Column, Integer, String, JSON
from models.base import Base

class LLMAPICredential(Base):
    __tablename__ = 'llm_api_credentials'

    id = Column(Integer, primary_key=True)
    provider = Column(String, nullable=False)
    name = Column(String, nullable=False)
    api_key = Column(String, nullable=False)
    parameters = Column(JSON, nullable=True)


class LLMLocalRegistry(Base):
    __tablename__ = 'llm_local_registry'

    id = Column(Integer, primary_key=True)
    provider = Column(String, nullable=False)
    name = Column(String, nullable=False)
    path = Column(String, nullable=False)
    parameters = Column(JSON, nullable=True)


