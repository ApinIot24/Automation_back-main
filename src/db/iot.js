import { env } from "../../config/env.js";
import { PrismaClient } from "../generated/iot/prisma/index.js"

import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis;

// adapter Postgres (Prisma Data Proxy / Accelerate style)
const adapter = new PrismaPg({
  connectionString: env.iotDb,
});

export const iotDB =
  globalForPrisma.iotDB ??
  new PrismaClient({
    adapter
  });

// simpan instance ke global supaya tidak recreate saat hot reload / nodemon
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.iotDB = iotDB;
}