import { env } from "../../config/env.js";
import { PrismaClient } from "../generated/automation/prisma/index.js"

import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis;

// adapter Postgres (Prisma Data Proxy / Accelerate style)
const adapter = new PrismaPg({
  connectionString: env.automationDb,
});

export const automationDB =
  globalForPrisma.automationDB ??
  new PrismaClient({
    adapter
  });

// simpan instance ke global supaya tidak recreate saat hot reload / nodemon
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.automationDB = automationDB;
}