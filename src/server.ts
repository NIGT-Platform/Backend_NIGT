import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { ensureDefaultAdmin } from './utils/admin.seed';

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`✅ NIGT Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs available at http://localhost:${PORT}/api/docs`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  await ensureDefaultAdmin();
});
