from models.tools import Tool
from typing import Optional
from sqlalchemy.orm import Session


def get_tools(db: Session, limit: Optional[int] = None):
    if limit:
        return db.query(Tool).limit(limit).all()
    return db.query(Tool).all()


def create_tool(db: Session, name: str, description: str, type: str, config: dict, code: str, is_active: bool):
    tool = Tool(name=name, description=description, type=type, config=config, code=code, is_active=is_active)
    db.add(tool)
    db.commit()
    db.refresh(tool)
    return tool


def get_tool_by_id(db: Session, id: int):
    return db.query(Tool).filter(Tool.id == id).first()


def update_tool_by_id(db: Session, id: int, name: str, description: str, type: str, config: dict, code: str, is_active: bool):
    tool = db.query(Tool).filter(Tool.id == id).first()
    if not tool:
        return None
    tool.name = name
    tool.description = description
    tool.type = type
    tool.config = config
    tool.code = code
    tool.is_active = is_active
    db.commit()
    db.refresh(tool)
    return tool


def delete_tool_by_id(db: Session, id: int):
    tool = db.query(Tool).filter(Tool.id == id).first()
    if not tool:
        return None
    db.delete(tool)
    db.commit()
    return tool