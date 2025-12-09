# Prisma CLI Guide (Multi-Database Setup)

This project uses multiple Prisma schemas (automation and iot) with separate configuration files.
Use this guide as a quick reference for generating clients, pulling schemas, running migrations,
and generating SQL migration scripts.

---

## 📦 Generate Prisma Client
Run this after modifying your Prisma schema or after migrations.

# Automation DB
npx prisma generate --config=prisma.config.automation.ts

# IoT DB
npx prisma generate --config=prisma.config.iot.ts

---

## 🗄️ Pull Database Schema
Use this when the database changes and you want Prisma schema updated accordingly.

# Automation DB
npx prisma db pull --config=prisma.config.automation.ts

# IoT DB
npx prisma db pull --config=prisma.config.iot.ts

---

## 🧱 Run Migrations
Use this when you modify the Prisma schema and need to update the database.

# Automation DB migration
npx prisma migrate --config=prisma.config.automation.ts --name <migration_name>

# IoT DB migration
npx prisma migrate --config=prisma.config.iot.ts --name <migration_name>

---

## 📝 Generate SQL Migration Scripts (migrate diff)
Useful when working with raw SQL migrations or initializing new databases.

# Automation DB
npx prisma migrate diff \
  --from-empty \
  --to-schema=prisma/automation/schema.prisma \
  --script > prisma/automation/migrations/0001_init.sql

# IoT DB
npx prisma migrate diff \
  --from-empty \
  --to-schema=prisma/iot/schema.prisma \
  --script > prisma/iot/migrations/0001_init.sql

---

## 📁 Recommended Folder Structure

prisma/
  automation/
    schema.prisma
    migrations/
  iot/
    schema.prisma
    migrations/
prisma.config.automation.ts
prisma.config.iot.ts
docs/
  prisma-cli.md

---

## ✅ Notes
- Always run "prisma generate" after migrations or schema updates.
- "db pull" updates Prisma schema based on the database.
- "migrate" updates the database based on Prisma schema.
- "migrate diff" generates SQL scripts without applying anything.