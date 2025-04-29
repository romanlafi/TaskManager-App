from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session
from .. import models, schemas
from ..models import Task, TaskStatus
from ..schemas import TaskCreate


def create_task(db: Session, task: schemas.TaskCreate, user_id: int):
    db_task = Task(
        title=task.title,
        description=task.description,
        owner_id=user_id,
        status=task.status,
        deadline=task.deadline
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def get_tasks(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 10,
    search: str = None,
    order_by: str = "created_at",
    status: Optional[TaskStatus] = None,
    before_deadline: Optional[datetime] = None
) -> List[Task]:

    query = db.query(Task).filter(Task.owner_id == user_id)

    if search:
        query = query.filter(models.Task.title.ilike(f"%{search}%"))

    if status:
        query = query.filter(Task.status == status)

    if before_deadline:
        query = query.filter(Task.deadline != None).filter(Task.deadline <= before_deadline)

    if order_by in Task.__table__.columns.keys():
        query = query.order_by(getattr(Task, order_by).asc())

    return query.offset(skip).limit(limit).all()

def get_task_by_id(db: Session, task_id: int, user_id: int):
    return db.query(Task).filter(Task.id == task_id, Task.owner_id == user_id).first()

def update_task(db: Session, task_id: int, task_data: TaskCreate, user_id: int):
    task = get_task_by_id(db, task_id, user_id)
    if task:
        task.title = task_data.title
        task.description = task_data.description
        task.status = task_data.status
        task.deadline = task_data.deadline
        db.commit()
        db.refresh(task)
        return task
    return None

def update_task_partial(db: Session, task_id: int, task_data: dict, user_id: int):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == user_id).first()
    if not task:
        return None

    for key, value in task_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task

def delete_task(db: Session, task_id: int, user_id: int):
    task = get_task_by_id(db, task_id, user_id)
    if task:
        db.delete(task)
        db.commit()
        return True
    return False