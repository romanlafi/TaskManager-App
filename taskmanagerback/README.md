# 🧠 Task Manager API

A powerful RESTful API for managing users and their personal tasks, built with **FastAPI**, **PostgreSQL**, and **SQLAlchemy**.

---

## 🚀 Features

- **JWT authentication**
- **User management** (registration, login)
- **User roles** (`User`, `Admin`)
- **Full task CRUD**
- **Advanced filtering** on task listing:
  - Pagination (`skip`, `limit`)
  - Search by title (`search`)
  - Sorting by field (`order_by`)
  - Filter by `status`
  - Filter by `deadline`
- **Partial task updates** (`PATCH`)
- **User-based access control**
- **Request logging middleware**
- **CORS setup for frontend**
- **Swagger UI available at `/docs`**

---

## 📦 Installation

```bash
git clone https://github.com/yourusername/taskmanagerback.git
cd taskmanagerback
python -m venv env
env\Scripts\activate  # On Windows
pip install -r requirements.txt
```

> Ensure PostgreSQL is running or update `config.py` to use SQLite instead.

---

## ⚙️ Environment Variables (optional)

If using a `.env` file, define the following:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager
SECRET_KEY=your_secret_key
ALGORITHM=HS256
```

---

## ▶️ Run the server

```bash
uvicorn app.main:app --reload
```

---

## 🔐 Authentication

- Login: `POST /users/token`
- Register: `POST /users/`
- Use token in Swagger with the "Authorize" button

---

## 📚 Main Endpoints

### 🔹 Users
- `POST /users/`: Register new user
- `POST /users/token`: Login (returns JWT)

### 🔹 Tasks
- `GET /tasks/`: List user's tasks
  - Supports: pagination, search, ordering, filtering
- `GET /tasks/{id}`: Get task by ID
- `POST /tasks/`: Create new task
- `PUT /tasks/{id}`: Full task update
- `PATCH /tasks/{id}`: Partial update (e.g., status, deadline)
- `DELETE /tasks/{id}`: Delete task

---

## 🧪 Testing (upcoming)

> `pytest` is recommended for unit and integration tests.

---

## 📌 Upcoming Improvements

- Soft delete support
- Task change history
- Export tasks to CSV or JSON
- `/tasks/summary` endpoint
- Enhanced OpenAPI docs

---

## 👨‍💻 Author

Developed by Román with ❤️ and FastAPI.