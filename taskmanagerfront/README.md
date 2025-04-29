# 🧠 Task Manager Frontend

Interfaz web del gestor de tareas personal. Esta aplicación permite a los usuarios registrarse, iniciar sesión y gestionar sus tareas de forma visual, cómoda y eficiente. Con un diseño moderno en modo oscuro y transiciones suaves para una experiencia cuidada.

---

## 🚀 Tech Stack

- **React 18**
- **CSS Modules**
- **Vite**
- **SVG Icons personalizados**
- **Custom UI Components** (botones, modales, inputs, toasts)
- Conectado a un backend REST con **FastAPI**

---

## 📦 Instalación

```bash
git clone https://github.com/tuusuario/taskmanagerfront.git
cd taskmanagerfront
npm install
npm run dev
```

Asegúrate de tener corriendo el backend (FastAPI) en `http://127.0.0.1:8000`.

---

## 🧩 Estructura del proyecto

```
src/
│
├── assets/                # Iconos y recursos estáticos
├── components/            # Componentes reutilizables
│   ├── TaskCard/          # Tarjeta individual de tarea
│   ├── FilterPanel/       # Filtros y panel lateral
│   ├── TaskModal/         # Modal para crear/editar tareas
│   ├── ConfirmModal/      # Modal reutilizable de confirmación
│   └── ui/                # Botón, input, select, toast...
│
├── pages/
│   ├── AuthForm/          # Login y registro
│   └── Dashboard/         # Vista principal de tareas
│
├── services/              # Conexión con la API REST
├── config/                # Constantes, endpoints, status codes
└── App.jsx                # Rutas y layout principal
```

---

## ✨ Funcionalidades

- Registro e inicio de sesión con token
- Panel de tareas con búsqueda y filtros
- Crear, editar y eliminar tareas
- Confirmaciones personalizadas (modales)
- Feedback de acciones con toasts animados
- Diseño responsive y consistente

---

## 🔒 Autenticación

El token de acceso (`access_token`) se guarda en `localStorage`. Todas las peticiones protegidas incluyen el token en el header `Authorization`.

---

## 🎨 Estilo visual

- Modo oscuro minimalista
- Animaciones en modales y toasts
- Layout con sidebar flotante
- Iconos SVG personalizados

---

## 📌 TODOs / Mejoras futuras

- Añadir paginación real
- Soporte multiusuario
- Filtro de tareas por rango de fechas
- Soporte multilenguaje