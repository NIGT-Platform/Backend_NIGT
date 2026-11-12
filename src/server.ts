import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { ensureDefaultAdmin, ensureDefaultCategories, repairBrokenProductImages, ensureDatabaseSchemaAdditions } from './utils/admin.seed';
import { getCloudinaryStatus } from './utils/cloudinary.util';

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`✅ NIGT Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs available at http://localhost:${PORT}/api/docs`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  const cloudStatus = getCloudinaryStatus();
  console.log(`☁️  Cloudinary: ${cloudStatus.configured ? `Configured (${cloudStatus.cloudName})` : 'NOT CONFIGURED (using local /uploads)'}`);
  await ensureDatabaseSchemaAdditions();
  await ensureDefaultAdmin();
  await ensureDefaultCategories();
  await repairBrokenProductImages();
});
