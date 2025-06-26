from sqlalchemy import Column, Integer, String, Text
from db.base import Base

class Tool(Base):
    __tablename__ = 'tools'

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    code = Column(Text)
