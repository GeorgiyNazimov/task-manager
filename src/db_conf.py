from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import config as c
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, ForeignKey
from typing import List


def get_db_url():
    return f"postgresql://{c.DB_USER}:{c.DB_PASS}@{c.DB_HOST}:{c.DB_PORT}/{c.DB_NAME}"

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "user_account"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(30))
    password: Mapped[str]
    tasks: Mapped[List["Task"]] = relationship(
        back_populates="user", cascade="delete-orphan"
    )
    
    def __repr__(self):
        return f'User(id={self.id}, username={self.username}, password={self.password}, tasks=[{self.tasks}])'

class Task(Base):
    __tablename__ = "task"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_name: Mapped[str]
    text: Mapped[str] = mapped_column(Text)
    user_id: Mapped[int] = mapped_column(ForeignKey('user_account.id'))
    user: Mapped["User"] = relationship(back_populates="tasks")

    def __repr__(self):
        return f'Task(id={self.id}, task_name={self.task_name}, text={self.text}, user_id={self.user_id})\n'
    
    

engine = create_engine(get_db_url(), echo=True)
Session = sessionmaker(engine)
#Base.metadata.create_all(engine)

def get_db_session():
    with Session() as session:
        yield session
