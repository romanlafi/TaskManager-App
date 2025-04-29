import enum

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models import TaskStatus


class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[str] = "User"

class UserResponse(BaseModel):
    username: str
    role: str

    class Config:
        orm_mode = True


class TaskCreate(BaseModel):
    title: str
    description: str
    status: Optional[TaskStatus] = TaskStatus.pending
    deadline: Optional[datetime] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    created_at: datetime
    status: TaskStatus
    deadline: Optional[datetime]

    class Config:
        orm_mode = True

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None

class TaskOrderField(str, enum.Enum):
    created_at = "created_at"
    title = "title"
    description = "description"
    deadline = "deadline"
    status = "status"

class Token(BaseModel):
    access_token: str
    token_type: str
