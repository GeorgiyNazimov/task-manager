from fastapi import FastAPI, Response, Request
from fastapi import Depends
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path
from authentication.buisness_logic import (account_create_or_enter,
                                            access_token_validate, 
                                            get_user_page)
from authentication.schemas import UserAccountData
from task.buisness_logic import (synchronize_account_tasks, 
                                 get_user_tasks)
from task.schemas import SynchronizeTaskData
from db_conf import get_db_session
from sqlalchemy.orm import Session
from time import time
import uvicorn
from typing import Annotated

app = FastAPI()

app.mount(
    "/static",
    StaticFiles(directory=Path(__file__).parent.parent.absolute() / "static"),
    name="static"
)

templates = Jinja2Templates(directory=Path(__file__).parent.parent.absolute() / "static"/"templates")


@app.get('/logout')
def logout():
    response = RedirectResponse('/login', status_code=303)
    response.delete_cookie('jwt-token')
    return response

@app.get('/login')
def get_login_page(request: Request, token_data: dict = Depends(access_token_validate)):
    if not isinstance(token_data, RedirectResponse):
        return RedirectResponse('/account', status_code=303)
    return templates.TemplateResponse("login.html", {"request": request})

@app.post('/login')
def post_login_data(session: Annotated[Session, Depends(get_db_session)], user_data: UserAccountData, response: Response):
    token = account_create_or_enter(user_data, session)
    print(token)
    if token == None:
        return False
    else:
        response.set_cookie(key='jwt-token', value=token, expires=time() + 6000)
        return True


@app.get('/account')
def get_account_page(request: Request, token_data: dict = Depends(access_token_validate)):
    if isinstance(token_data, RedirectResponse):
        return token_data
    return get_user_page(request)

@app.get('/account/tasks')
def get_account_tasks(session: Annotated[Session, Depends(get_db_session)], token_data: dict = Depends(access_token_validate)):
    if isinstance(token_data, RedirectResponse):
        return token_data
    return JSONResponse([token_data, get_user_tasks(token_data, session)])

@app.post('/account/synchronize')
def synchronize_account(session: Annotated[Session, Depends(get_db_session)], task_data: SynchronizeTaskData, token_data: dict = Depends(access_token_validate)):
    if isinstance(token_data, RedirectResponse):
        return token_data
    return synchronize_account_tasks(task_data, session, token_data)

if __name__ == '__main__':
    uvicorn.run('main:app', port=8000, reload=True)