from sqlalchemy.orm import Session

from app.schemas import UserCreate
from ..core.auth import create_access_token
from ..core.security import verify_password
from ..crud import user as crud_user
from ..exceptions import UserConflictError, InvalidCredentialsError


def create_user(db: Session, user: UserCreate):
    existing_user = crud_user.get_user(db, username=user.username)
    if existing_user:
        raise UserConflictError()
    return crud_user.create_user(db, user)

def authenticate_user(db: Session, username: str, password: str):
    user = crud_user.get_user(db, username=username)
    if not user or not verify_password(password, user.hashed_password):
        raise InvalidCredentialsError()
    return generate_token(user)

def generate_token(user):
    return {
        "access_token": create_access_token(data={"sub": user.username}),
        "token_type": "bearer"
    }