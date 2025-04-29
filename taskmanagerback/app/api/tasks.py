from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import SessionLocal
from app.core.auth import get_current_user
from app.models import User, TaskStatus
from ..schemas import TaskResponse, TaskCreate, TaskUpdate, TaskOrderField
from ..services import task_service as task_service

router = APIRouter(prefix="/tasks", tags=["Tasks"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=TaskResponse)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return task_service.create_task(db, task, current_user.username)

@router.get("/", response_model=List[TaskResponse])
def get_tasks(
    skip: int = 0,
    limit: int = 10,
    search: str = None,
    order_by: TaskOrderField = TaskOrderField.created_at,
    status: Optional[TaskStatus] = None,
    before_deadline: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return task_service.get_tasks_by_user(
        db,
        current_user.username,
        skip=skip,
        limit=limit,
        search=search,
        order_by=order_by,
        status=status,
        before_deadline=before_deadline
    )

@router.get("/{task_id}", response_model=TaskResponse)
def get_task_by_id(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return task_service.get_task_by_id(db, task_id, current_user.id)

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return task_service.update_task_by_id(db, task_id, task_data, current_user.id)

@router.patch("/{task_id}", response_model=TaskResponse)
def update_task_partial(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return task_service.update_task_partial(db, task_id, current_user.id, task_data.dict(exclude_unset=True))

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return task_service.delete_task_by_id(db, task_id, current_user.id)