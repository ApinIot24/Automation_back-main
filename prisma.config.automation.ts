import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "prisma/automation/schema.prisma",
    migrations: { 
        path: "prisma/automation/migrations" 
    },
    datasource: { 
        url: process.env.AUTOMATION_DB_URL || env("AUTOMATION_DB_URL") 
    },
});
