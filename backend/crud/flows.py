from sqlalchemy.orm import Session
from models.flows import Flow
from typing import Optional

def create_flow(db: Session, name: str, description: str, graph: dict, state: dict) -> Flow:
    flow = Flow(name=name, description=description, graph=graph, state=state)
    db.add(flow)
    db.commit()
    db.refresh(flow)
    return flow


def get_flow_by_id(db: Session, flow_id: int):
    return db.query(Flow).filter(Flow.id == flow_id).first()


def get_flows(db: Session, limit: Optional[int] = None):
    if limit:
        return db.query(Flow).limit(limit).all()
    return db.query(Flow).all()


def update_flow_by_id(db: Session, flow_id: int, name: str, description: str, graph: dict, state: dict) -> Flow | None:
    flow = db.query(Flow).filter(Flow.id == flow_id).first()
    if not flow:
        return None
    flow.name = name
    flow.description = description
    flow.graph = graph
    flow.state = state
    db.commit()
    db.refresh(flow)
    return flow


def delete_flow_by_id(db: Session, flow_id: int) -> Flow | None:
    flow = db.query(Flow).filter(Flow.id == flow_id).first()
    if not flow:
        return None
    db.delete(flow)
    db.commit()
    return flow
