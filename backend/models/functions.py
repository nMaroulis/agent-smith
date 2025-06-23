from sqlalchemy import Column, Integer, String, Text
from models.base import Base

class Function(Base):
    __tablename__ = 'functions'

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    code = Column(Text)
