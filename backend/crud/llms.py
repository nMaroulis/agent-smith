from sqlalchemy.orm import Session
from models.llms import LLMRemote, LLMLocal
from typing import Optional
from core.encryption import fernet_encrypt, fernet_decrypt


#####################
## Remote LLMs - API
#####################

def get_remote_llms(db: Session, limit: Optional[int] = None):
    if limit:
        return db.query(LLMRemote).limit(limit).all()
    return db.query(LLMRemote).all()


def get_remote_llm_by_alias(db: Session, alias: str):
    print(alias)
    return db.query(LLMRemote).filter(LLMRemote.alias == alias).first()


def create_remote_llm(db: Session, alias: str, provider: str, api_key: str):
    cred = LLMRemote(alias=alias, provider=provider)
    cred.api_key = fernet_encrypt(api_key)
    db.add(cred)
    db.commit()
    db.refresh(cred)
    return cred

def update_remote_llm_by_alias(db: Session, old_alias: str, new_alias: str, api_key: str):
    llm = db.query(LLMRemote).filter(LLMRemote.alias == old_alias).first()
    if not llm:
        return None
    llm.alias = new_alias
    llm.api_key = fernet_encrypt(api_key)
    db.commit()
    db.refresh(llm)
    return llm


def delete_remote_llm_by_alias(db: Session, alias: str):
    llm = db.query(LLMRemote).filter(LLMRemote.alias == alias).first()
    if not llm:
        return None
    db.delete(llm)
    db.commit()
    return llm


def get_api_key_by_alias(db: Session, alias: str) -> Optional[str]:
    llm = db.query(LLMRemote).filter_by(alias=alias).first()
    if not llm:
        return None
    return fernet_decrypt(llm.api_key)

###############
## Local LLMs
###############

def get_local_llms(db: Session, limit: Optional[int] = None):
    if limit:
        return db.query(LLMLocal).limit(limit).all()
    return db.query(LLMLocal).all()


def get_local_llm_by_alias(db: Session, alias: str):
    return db.query(LLMLocal).filter(LLMLocal.alias == alias).first()


def create_local_llm(db: Session, alias: str, provider: str, path: str):
    llm = LLMLocal(alias=alias, provider=provider, path=path)
    db.add(llm)
    db.commit()
    db.refresh(llm)
    return llm


def update_local_llm_by_alias(db: Session, alias: str, provider: str, path: str):
    llm = db.query(LLMLocal).filter(LLMLocal.alias == alias).first()
    if not llm:
        return None
    llm.provider = provider
    llm.path = path
    db.commit()
    db.refresh(llm)
    return llm


def delete_local_llm_by_alias(db: Session, alias: str):
    llm = db.query(LLMLocal).filter(LLMLocal.alias == alias).first()
    if not llm:
        return None
    db.delete(llm)
    db.commit()
    return llm