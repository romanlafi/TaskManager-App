from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from ..crud import task as crud_task
from ..crud import user as crud_user
from ..exceptions import TaskNotFoundError, UserNotFoundError
from ..models import TaskStatus
from ..schemas import TaskCreate, TaskOrderField


def create_task(db: Session, task: TaskCreate, user_username: str):
    user = crud_user.get_user(db, user_username)
    if not user:
        raise UserNotFoundError()
    return crud_task.create_task(db, task, user.id)

def get_tasks_by_user(
        db: Session,
        user_username: str,
        skip: int,
        limit: int,
        search: Optional[str] = None,
        order_by: Optional[str] = TaskOrderField.created_at,
        status: Optional[TaskStatus] = None,
        before_deadline: Optional[datetime] = None
):
    user = crud_user.get_user(db, user_username)
    if not user:
        raise UserNotFoundError()

    return crud_task.get_tasks(
        db,
        user.id,
        skip,
        limit,
        search,
        order_by,
        status,
        before_deadline
    )

def get_task_by_id(db: Session, task_id: int, user_id: int):
    task = crud_task.get_task_by_id(db, task_id, user_id)
    if not task:
        raise TaskNotFoundError()
    return task

def update_task_by_id(db: Session, task_id: int, task_data: TaskCreate, user_id: int):
    task = crud_task.update_task(db, task_id, task_data, user_id)
    if task is None:
        raise TaskNotFoundError()
    return task

def update_task_partial(db: Session, task_id: int, user_id: int, task_data: dict):
    task = crud_task.update_task_partial(db, task_id, task_data, user_id)
    if task is None:
        raise TaskNotFoundError()
    return task


def delete_task_by_id(db: Session, task_id: int, user_id: int):
    success = crud_task.delete_task(db, task_id, user_id)
    if not success:
        raise TaskNotFoundError()
    return {"detail": "Task successfully deleted"}