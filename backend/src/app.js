import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dbTestRoutes from './routes/db-test.routes.js';
import healthRoutes from './routes/health.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import realtimeRoutes from './routes/realtime.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import protectedRoutes from './routes/protected.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './users/user.routes.js';
import inviteRoutes from './invites/invite.routes.js';
import authRoutes from './core/auth/auth.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import departmentRoutes from './core/department/department.routes.js';
import auditRoutes from './core/audit/audit.routes.js';
import systemOptionsRoutes from './core/system/systemOptions.routes.js';
import rbacRoutes from './core/rbac/rbac.routes.js';

const app = express();

/* Global Middlewares */
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://your-frontend-domain.vercel.app']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));


/* Routes */
app.get('/', (req, res) => {
  res.json({ message: 'ERP System Backend API is running!', version: '1.0.0' });
});
app.use('/api/health', healthRoutes);
app.use('/api/db-test', dbTestRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/realtime', realtimeRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/system-options', systemOptionsRoutes);
app.use('/api', rbacRoutes);




/* Error Handler */
app.use(errorHandler);

export default app;
