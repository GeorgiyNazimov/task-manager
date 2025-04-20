from pydantic import BaseModel


class UserAccountData(BaseModel):
    username: str
    password: str
    is_registration: bool = False
