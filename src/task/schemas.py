from pydantic import BaseModel

class SynchronizeTaskData(BaseModel):
    changed_tasks: list
    deleted_tasks: list
    created_tasks: list