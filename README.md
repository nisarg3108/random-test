# ERP System Project

A comprehensive Enterprise Resource Planning (ERP) system built with React frontend and Node.js backend.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Setup Instructions

1. **Clone and Setup**
   ```bash
   # Run the setup script to install all dependencies
   setup.bat
   ```

2. **Database Configuration**
   - Ensure PostgreSQL is running
   - Update `backend/.env` with your database credentials
   - Default connection: `postgresql://postgres:Nisarg%402006@localhost:5432/erp_db`

3. **Start Development Servers**
   ```bash
   # Start both frontend and backend
   start-dev.bat
   ```

## 🏗️ Project Structure

```
ERP-SYSTEM-PROJECT/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── core/           # Core business logic
│   │   ├── modules/        # Feature modules
│   │   ├── config/         # Configuration files
│   │   └── routes/         # API routes
│   ├── prisma/             # Database schema & migrations
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── api/            # API client
│   │   └── store/          # State management
│   └── package.json
├── setup.bat              # Setup script
└── start-dev.bat          # Development server starter
```

## 🔧 Manual Setup (Alternative)

### Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Access URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 📋 Features

- **Multi-tenant Architecture**
- **Role-based Access Control (RBAC)**
- **User Management & Invitations**
- **Department Management**
- **Inventory Management**
- **Workflow Engine**
- **Expense Claims with Approval Workflow**
- **Audit Logging**
- **Dashboard Analytics**

## 🔐 Default Roles

- **USER**: Basic access
- **MANAGER**: Department management
- **ADMIN**: Full system access

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Helmet (Security)
- CORS

### Frontend
- React 19
- Vite
- Tailwind CSS
- Zustand (State Management)
- React Router
- Lucide Icons

## 📝 Environment Variables

Create `backend/.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/erp_db"
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
```

## 🚨 Troubleshooting

1. **Database Connection Issues**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Run `npx prisma migrate reset` to reset database

2. **Port Conflicts**
   - Backend runs on port 5000
   - Frontend runs on port 5173
   - Change ports in respective config files if needed

3. **CORS Issues**
   - Backend is configured for localhost:5173
   - Update CORS settings in `backend/src/app.js` if needed

4. **Expense Claims Not Generating Approval Requests**
   - The approval workflow needs to be initialized (one-time setup)
   - Login as MANAGER or ADMIN
   - Navigate to Finance > Finance Approvals
   - Click "Initialize Workflow" button if shown
   - Or run: `POST /api/approvals/seed-workflows` with your auth token
   - See `EXPENSE_CLAIMS_SETUP.md` for detailed instructions

## 📞 Support

For issues and questions, please check the troubleshooting section above or review the application logs.# test
# random-test
# random-test
