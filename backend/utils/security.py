import os
from cryptography.fernet import Fernet
from pathlib import Path
from dotenv import load_dotenv

root_dir = Path(__file__).resolve().parents[2]
load_dotenv(root_dir / ".env")
key_path = root_dir / os.getenv("FERNET_SECRET_KEY")


def generate_fernet_key_file():
    """Generate a new Fernet key and save it to disk."""
    if not key_path.exists():
        key_path.parent.mkdir(parents=True, exist_ok=True)
        key = Fernet.generate_key()
        with open(key_path, "wb") as key_file:
            key_file.write(key)
        
        print("[AgentSmith Security] ✅ Fernet key generated.")
    else:
        print("[AgentSmith Security] ✅ Fernet key already exists.")
    
    return


def load_fernet_key_from_file() -> Fernet:

    if not key_path.exists():
        raise FileNotFoundError(
            f"[AgentSmith Security] ❌ Fernet key not found at {key_path}. Please add the key path to the .env file."
        )

    with open(key_path, "rb") as key_file:
        return Fernet(key_file.read())
