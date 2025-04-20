from fastapi import Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from authentication.schemas import UserAccountData
from sqlalchemy.orm import Session
from sqlalchemy import select
from db_conf import User
from time import time
from uuid import uuid4
from pathlib import Path
import jwt
from config import JWT_ALGORITHM, JWT_SECRET

templates = Jinja2Templates(directory=Path(__file__).parent.parent.parent.absolute() / "static" / "templates")

def account_create_or_enter(user_account_data: UserAccountData, session: Session):
    token = ''
    if user_account_data.is_registration:
        token = registration(user_account_data, session)
    else:
        token = login(user_account_data, session)
    return token

def registration(user_account_data: UserAccountData, session: Session):
    exist = check_if_user_exist(user_account_data, session)
    if exist != None:
        return None
    else:
        new_user = User(
            username=user_account_data.username, password=user_account_data.password
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return get_access_token(new_user)
        
def check_if_user_exist(user_account_data: UserAccountData, session: Session):
    result = session.scalar(
        select(User).where(User.username == user_account_data.username)
    )
    if result:
        return result
    return None

def login(user_account_data: UserAccountData, session: Session):
    current_user = session.scalar(
        select(User).where(
            User.username == user_account_data.username,
            User.password == user_account_data.password,
        )
    )
    if current_user:
        return get_access_token(current_user)
    else:
        return None

def get_access_token(user: User):
    payload = {
                'token-id': str(uuid4()),
                'username': user.username,
                'user-id': user.id,
                'expires': time() + 6000
            }
    return jwt.encode(payload=payload, algorithm=JWT_ALGORITHM, key=JWT_SECRET)

def get_data_from_jwt(token: jwt.PyJWT):
    return jwt.decode(token, algorithms=JWT_ALGORITHM, key=JWT_SECRET)


def access_token_validate(request: Request):
    try:
        token = request.cookies['jwt-token']
        result = get_data_from_jwt(token)
        if result['expires'] < time():
            return RedirectResponse(url='/login', status_code=303)
        return result
    except:
        return RedirectResponse(url='/login', status_code=303)

def get_user_page(request: Request):
    return templates.TemplateResponse('account.html', {"request": request})