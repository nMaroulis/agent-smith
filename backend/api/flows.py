from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from sqlalchemy.orm import Session
from schemas.flows import FlowCreate, FlowOut
from crud.flows import create_flow, get_flow_by_id, update_flow_by_id, delete_flow_by_id, get_flows
from db.session import get_db

router = APIRouter(
    prefix="/flows",
    tags=["Flow"],
    responses={404: {"description": "Not found"}},
)


#########################
## Simple Flow Operations
#########################

@router.post("/", description="Add a new flow")
def add_flow(flow: FlowCreate, db: Session = Depends(get_db)):
    return create_flow(db, name=flow.name, description=flow.description, graph=flow.graph, state=flow.state)


@router.get("/", description="List all flows")
def list_flows(limit: Optional[int] = None, db: Session = Depends(get_db)):
    return get_flows(db, limit)


@router.get("/{id}", description="Get a flow by ID")
def get_flow(id: int, db: Session = Depends(get_db)):
    return get_flow_by_id(db, id)


@router.put("/{id}", response_model=FlowOut)
def update_flow(id: int, flow: FlowCreate, db: Session = Depends(get_db)):
    updated = update_flow_by_id(db, id, flow.name, flow.description, flow.graph, flow.state)
    if updated:
        return updated
    raise HTTPException(status_code=404, detail="Flow not found")


@router.delete("/{id}", response_model=FlowOut)
def delete_flow(id: int, db: Session = Depends(get_db)):
    deleted = delete_flow_by_id(db, id)
    if deleted:
        return deleted
    raise HTTPException(status_code=404, detail="Flow not found")

##################
## Code Generation
##################

@router.post("/{id}/execute", description="Execute a flow")
def execute_flow(id: int):
    return {"Hello": "World"}


@router.post("/{id}/code", description="Generate flow code")
def generate_flow_code(id: int):
    return {"Hello": "World"}


@router.post("/{id}/test", description="Test a flow")
def test_flow(id: int):
    return {"Hello": "World"}



