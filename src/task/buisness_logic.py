from sqlalchemy.orm import Session
from sqlalchemy import select, insert, update, delete
from fastapi.encoders import jsonable_encoder
from .schemas import SynchronizeTaskData
from db_conf import Task

def get_user_tasks(token_data: dict, session: Session):
    tasks = session.scalars(select(Task).where(Task.user_id == token_data['user-id'])).all()
    return jsonable_encoder(tasks)

def synchronize_account_tasks(task_data: SynchronizeTaskData, session: Session, token_data):
    print(task_data.changed_tasks)
    print(task_data.deleted_tasks)
    print(task_data.created_tasks)
    if task_data.deleted_tasks:
        session.execute(delete(Task).where(Task.id.in_(task_data.deleted_tasks)))
    if task_data.changed_tasks:
        session.execute(update(Task), task_data.changed_tasks)
    created_tasks_new_id = []
    if task_data.created_tasks:
        created_tasks_new_id = session.scalars(insert(Task).returning(Task.id), task_data.created_tasks).all()
    session.commit()
    print(created_tasks_new_id)
    return created_tasks_new_id
