from fastapi import APIRouter

router = APIRouter(
    prefix="/flow",
    tags=["Flow"],
    responses={404: {"description": "Not found"}},
)


@router.post("/save")
def save_flow():
    return {"Hello": "World"}


@router.post("/new")
def new_flow():
    return {"Hello": "World"}


@router.post("/execute")
def execute_flow():
    return {"Hello": "World"}


@router.post("/delete")
def delete_flow():
    return {"Hello": "World"}


@router.post("/code")
def generate_flow_code():
    return {"Hello": "World"}


@router.post("/test")
def test_flow():
    return {"Hello": "World"}


@router.get("/list")
def list_flows():
    return {"Hello": "World"}


@router.get("/flow/{flow_id}")
def get_flow(flow_id: int):
    return {"Hello": "World"}

