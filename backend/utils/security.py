import os
from cryptography.fernet import Fernet
from pathlib import Path

def load_fernet_key_from_file() -> Fernet:
    key_path = os.getenv("FERNET_SECRET_KEY")
    if not key_path:
        raise ValueError("FERNET_SECRET_KEY is not set in .env")

    key_file = Path(key_path)
    if not key_file.exists():
        raise FileNotFoundError(f"Fernet key file not found: {key_path}")

    key = key_file.read_text().strip()
    return Fernet(key)
