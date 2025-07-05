from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv
from pathlib import Path


root_dir = Path(__file__).resolve().parents[2]
load_dotenv(root_dir / ".env")
FERNET_SECRET_KEY_PATH = os.getenv("FERNET_SECRET_KEY")
# Make the path absolute by joining with the project root if it's not already absolute
key_path = Path(FERNET_SECRET_KEY_PATH)
if not key_path.is_absolute():
    key_path = root_dir / key_path
FERNET_SECRET_KEY = key_path.read_bytes()

fernet = Fernet(FERNET_SECRET_KEY)

def fernet_encrypt(value: str) -> str:
    return fernet.encrypt(value.encode()).decode()

def fernet_decrypt(token: str) -> str:
    return fernet.decrypt(token.encode()).decode()
