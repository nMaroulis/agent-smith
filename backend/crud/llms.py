from sqlalchemy.orm import Session
from models.llms import LLMAPICredential
from core.encryption import fernet_encrypt, fernet_decrypt


###############
## API
###############

def create_llm_credential(db: Session, provider: str, name: str, api_key: str):
    cred = LLMAPICredential(provider=provider, name=name)
    cred.set_api_key(api_key)
    db.add(cred)
    db.commit()
    db.refresh(cred)
    return cred


def get_llm_credentials(db: Session):
    return db.query(LLMAPICredential).all()


def update_llm_credential(db: Session, cred_id: int, provider: str, name: str, api_key: str):
    cred = db.query(LLMAPICredential).filter(LLMAPICredential.id == cred_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="LLM Credential not found")
    cred.provider = provider
    cred.name = name
    cred.set_api_key(api_key)
    db.commit()
    db.refresh(cred)
    return cred


def delete_llm_credential(db: Session, cred_id: int):
    cred = db.query(LLMAPICredential).filter(LLMAPICredential.id == cred_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="LLM Credential not found")
    db.delete(cred)
    db.commit()
    return cred

