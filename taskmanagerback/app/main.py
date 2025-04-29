from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import engine, Base
from .api import users, tasks

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware, #type: ignore
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(users.router)
app.include_router(tasks.router)