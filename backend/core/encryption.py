from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv

load_dotenv()
FERNET_SECRET_KEY = os.getenv("FERNET_SECRET_KEY").encode()
fernet = Fernet(FERNET_SECRET_KEY)

def fernet_encrypt(value: str) -> str:
    return fernet.encrypt(value.encode()).decode()

def fernet_decrypt(token: str) -> str:
    return fernet.decrypt(token.encode()).decode()
