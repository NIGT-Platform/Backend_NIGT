import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import YAML from 'yaml';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';

import { errorMiddleware } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();

// ─── Security Middlewares ─────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// ─── Body Parsers ─────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Swagger API Docs ─────────────────────────────────
const swaggerFile = fs.readFileSync(path.join(__dirname, '../openapi.yaml'), 'utf8');
const swaggerDoc = YAML.parse(swaggerFile);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// ─── Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// ─── Health Check ─────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error Handler (must be last) ─────────────────────
app.use(errorMiddleware);

export default app;
