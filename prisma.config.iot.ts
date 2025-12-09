import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "prisma/iot/schema.prisma",
    migrations: { 
        path: "prisma/iot/migrations" 
    },
    datasource: { 
        url: process.env.IOT_DB_URL || env("IOT_DB_URL") 
    },
});
