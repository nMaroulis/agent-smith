from db.init_db import init_db
from utils.security import generate_fernet_key_file


def startup():
    generate_fernet_key_file()  # generate fernet key if it doesn't exist
    init_db()  # initialize DB if it doesn't exist
