# 📝 TaskManager

**TaskManager** is a full-stack task management application built with **FastAPI** for the backend and **Vite + Vue 3** for the frontend. The app supports user authentication, task creation, updating, and deletion through a clean REST API and dynamic web interface.

---

## 🚀 Features

### ✅ Backend (FastAPI)
- User registration and login with JWT authentication
- Task CRUD (Create, Read, Update, Delete) operations
- Role-based access control
- RESTful API design
- Dockerized for easy deployment

### 🎨 Frontend (Vue 3 + Vite)
- Authenticated SPA interface
- Task list, create, edit, delete
- Integrated with backend via HTTP API
- Configured with `nginx` for production use

---

## 📁 Project Structure

```
taskmanager-app/
├── docker-compose.yml
├── taskmanagerback/
│   ├── app/
│   │   ├── api/              # FastAPI routers (users, tasks)
│   │   ├── core/             # Authentication and security logic
│   │   ├── crud/             # Database interaction (SQLAlchemy)
│   │   ├── services/         # Business logic for tasks and users
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic schemas
│   │   └── main.py           # App entry point
│   ├── Dockerfile
│   ├── requirements.txt
├── taskmanagerfront/
│   ├── src/                  # Vue 3 application
│   ├── index.html
│   ├── Dockerfile
│   └── nginx.conf
```

---

## 🐳 Running with Docker

Ensure you have Docker and Docker Compose installed.

```bash
docker-compose up --build
```

Services:
- Backend: [http://localhost:8000](http://localhost:8000)
- Frontend: [http://localhost](http://localhost)

---

## 📦 Backend Installation (Manual)

1. Navigate to `taskmanagerback`:

```bash
cd taskmanagerback
```

2. Create virtual environment and activate:

```bash
python -m venv env
source env/bin/activate  # or .\env\Scripts\activate on Windows
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Run the server:

```bash
uvicorn app.main:app --reload
```

---

## 🧪 API Endpoints

### 🔐 Auth
- `POST /register`
- `POST /login`

### 📋 Tasks
- `GET /tasks/`
- `POST /tasks/`
- `PUT /tasks/{id}`
- `DELETE /tasks/{id}`

### 👤 Users
- `GET /users/me`
- `GET /users/`

(OpenAPI docs at `/docs` when backend is running.)

---

## 🌐 Frontend Setup (Manual)

1. Navigate to `taskmanagerfront`:

```bash
cd taskmanagerfront
```

2. Install dependencies:

```bash
npm install
```

3. Start dev server:

```bash
npm run dev
```

---

## 🔐 Environment Variables

Example backend `.env`:

```
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Frontend `.env` is configured for local development and Docker.

---

## 🧱 Technologies Used

### Backend:
- FastAPI
- SQLAlchemy
- JWT (Python-JOSE)
- Pydantic

### Frontend:
- Vue 3 + Vite
- Pinia
- Vue Router
- Axios

### DevOps:
- Docker
- Docker Compose
- Nginx
