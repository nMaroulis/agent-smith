from sqlalchemy.orm import Session
from models.llms import LLMRemote, LLMLocal
from typing import Optional
# from core.encryption import fernet_encrypt


#####################
## Remote LLMs - API
#####################

def get_remote_llms(db: Session, limit: Optional[int] = None):
    if limit:
        return db.query(LLMRemote).limit(limit).all()
    return db.query(LLMRemote).all()


def get_remote_llm_by_id(db: Session, id: int):
    return db.query(LLMRemote).filter(LLMRemote.id == id).first()


def create_remote_llm(db: Session, provider: str, name: str, api_key: str):
    cred = LLMRemote(provider=provider, name=name)
    cred.api_key = api_key # fernet_encrypt(api_key)
    db.add(cred)
    db.commit()
    db.refresh(cred)
    return cred

def update_remote_llm_by_id(db: Session, id: int, provider: str, name: str, api_key: str):
    llm = db.query(LLMRemote).filter(LLMRemote.id == id).first()
    if not llm:
        return None
    llm.provider = provider
    llm.name = name
    llm.api_key = api_key # fernet_encrypt(api_key)
    db.commit()
    db.refresh(llm)
    return llm


def delete_remote_llm_by_id(db: Session, id: int):
    llm = db.query(LLMRemote).filter(LLMRemote.id == id).first()
    if not llm:
        return None
    db.delete(llm)
    db.commit()
    return llm


###############
## Local LLMs
###############

def get_local_llms(db: Session, limit: Optional[int] = None):
    if limit:
        return db.query(LLMLocal).limit(limit).all()
    return db.query(LLMLocal).all()


def get_local_llm_by_id(db: Session, id: int):
    return db.query(LLMLocal).filter(LLMLocal.id == id).first()


def create_local_llm(db: Session, provider: str, name: str, path: str):
    llm = LLMLocal(provider=provider, name=name, path=path)
    db.add(llm)
    db.commit()
    db.refresh(llm)
    return llm


def update_local_llm_by_id(db: Session, id: int, provider: str, name: str, path: str):
    llm = db.query(LLMLocal).filter(LLMLocal.id == id).first()
    if not llm:
        return None
    llm.provider = provider
    llm.name = name
    llm.path = path
    db.commit()
    db.refresh(llm)
    return llm


def delete_local_llm_by_id(db: Session, id: int):
    llm = db.query(LLMLocal).filter(LLMLocal.id == id).first()
    if not llm:
        return None
    db.delete(llm)
    db.commit()
    return llm