from sqlalchemy import Column, Integer, String, Text, JSON
from db.base import Base

class Flow(Base):
    __tablename__ = 'flows'

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    serialized_graph = Column(JSON)
