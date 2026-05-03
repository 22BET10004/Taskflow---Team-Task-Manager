# TaskFlow — Team Task Manager

A full-stack web application for teams to manage projects, assign tasks, and track progress with role-based access control.

## 🚀 Live Demo

**Live URL:** `https://taskflow-team-task-manager-production-2e4d.up.railway.app/dashboard`

## ✨ Features

- **Authentication** — Signup/Login with JWT tokens (7-day expiry)
- **Projects** — Create, edit, delete projects; invite team members by email
- **Tasks** — Create tasks with title, description, status, priority, assignee, and due date
- **Kanban Board** — Drag-free visual board with Todo / In Progress / Done columns
- **List View** — Sortable table view of all project tasks
- **Dashboard** — Personal stats: project count, my tasks, completed tasks, overdue count, upcoming deadlines
- **Role-Based Access** — Admin (full control) vs Member (limited edit)
- **Team Management** — Invite members, change roles, remove members

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios, Vite |
| Backend | Node.js, Express.js |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Deploy | Railway |

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── db/database.js        # SQLite schema + connection
│   ├── middleware/auth.js    # JWT + role middleware
│   ├── routes/
│   │   ├── auth.js           # POST /signup, /login
│   │   ├── projects.js       # CRUD + member management
│   │   ├── tasks.js          # CRUD for tasks
│   │   └── dashboard.js      # Aggregated stats
│   └── server.js             # Express entry point
├── frontend/
│   └── src/
│       ├── context/AuthContext.jsx
│       ├── pages/
│       │   ├── Auth.jsx        # Login + Signup
│       │   ├── Dashboard.jsx
│       │   ├── Projects.jsx
│       │   ├── ProjectDetail.jsx
│       │   └── NewProject.jsx
│       ├── components/
│       │   ├── Layout.jsx      # Sidebar + nav
│       │   └── TaskModal.jsx   # Create/edit task modal
│       ├── api.js              # Axios instance
│       └── App.jsx             # Routes
├── railway.toml
└── package.json
```

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |

### Projects
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/projects` | ✓ | List user's projects |
| POST | `/api/projects` | ✓ | Create project |
| GET | `/api/projects/:id` | ✓ member | Get project |
| PUT | `/api/projects/:id` | ✓ admin | Update project |
| DELETE | `/api/projects/:id` | ✓ owner | Delete project |

### Members
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/projects/:id/members` | ✓ | List members |
| POST | `/api/projects/:id/members` | ✓ admin | Invite by email |
| PUT | `/api/projects/:id/members/:uid` | ✓ admin | Change role |
| DELETE | `/api/projects/:id/members/:uid` | ✓ admin | Remove member |

### Tasks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/projects/:id/tasks` | ✓ | List tasks (filter: status, priority, assigned_to) |
| POST | `/api/projects/:id/tasks` | ✓ | Create task |
| PUT | `/api/projects/:id/tasks/:tid` | ✓ | Update task |
| DELETE | `/api/projects/:id/tasks/:tid` | ✓ | Delete task |

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | ✓ | Stats + recent/upcoming tasks |

## 🏃 Run Locally

```bash
# Clone
git clone https://github.com/22BET10004/Taskflow---Team-Task-Manager
cd taskflow

# Install backend deps
cd backend && npm install

# Install & build frontend
cd ../frontend && npm install && npm run build

# Start (serves frontend + API together)
cd ..
NODE_ENV=production npm start
```

Visit `http://localhost:5000`

**For development (hot reload):**
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend (proxies /api to :5000)
cd frontend && npm run dev
```

## ☁️ Deploy to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Select your repo
4. Set environment variables:
   ```
   NODE_ENV=production
   JWT_SECRET=your_super_secret_key_here
   PORT=5000
   ```
5. Railway auto-detects `railway.toml` and runs build + start
6. Click **Generate Domain** to get your live URL

## 🔐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Set to `production` in Railway |
| `JWT_SECRET` | `taskflow_secret_dev_key_change_in_prod` | **Change this in production!** |
| `DB_PATH` | `./taskflow.db` | SQLite database file path |

## 👥 Role Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create/edit project | ✓ | ✗ |
| Delete project | Owner only | ✗ |
| Invite members | ✓ | ✗ |
| Remove members | ✓ | ✗ |
| Create tasks | ✓ | ✓ |
| Edit any task | ✓ | Own tasks only |
| Delete any task | ✓ | Own tasks only |
| View everything | ✓ | ✓ |

## 📸 Screenshots

<img width="1913" height="901" alt="Screenshot 2026-05-03 151359" src="https://github.com/user-attachments/assets/af2ff53e-0de1-4ef3-bf2f-50aba9558d47" />
<img width="1919" height="911" alt="Screenshot 2026-05-03 153902" src="https://github.com/user-attachments/assets/d62a43cb-63dd-4817-a5a4-15ec922b6eac" />
<img width="1919" height="897" alt="Screenshot 2026-05-03 153948" src="https://github.com/user-attachments/assets/12ee6121-e637-4440-98f0-2531ed574e80" />
<img width="1910" height="904" alt="Screenshot 2026-05-03 154018" src="https://github.com/user-attachments/assets/ab8c5368-0a7e-493b-80b0-cc99f3f0b4f8" />
<img width="1919" height="909" alt="Screenshot 2026-05-03 154046" src="https://github.com/user-attachments/assets/35c46eb1-6731-4ea5-a58a-60d9fec61545" />
<img width="1919" height="909" alt="Screenshot 2026-05-03 154113" src="https://github.com/user-attachments/assets/485c9fc5-3bc1-4a76-a3b1-bf9874ee6181" />
<img width="1919" height="905" alt="Screenshot 2026-05-03 154136" src="https://github.com/user-attachments/assets/1578bf00-e56a-4ced-b65f-c2ec07526ed2" />

---

Built with ❤️ using React + Express + SQLite
