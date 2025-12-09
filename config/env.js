import dotenv from "dotenv";
dotenv.config();

export const env = {
  automationDb: process.env.AUTOMATION_DB_URL ?? "",
  iotDb: process.env.IOT_DB_URL ?? "",
  secret: process.env.SECRET_KEY ?? "",
};

console.log("ENV CHECK:", {
automation: process.env.AUTOMATION_DB_URL,
iot: process.env.IOT_DB_URL
});