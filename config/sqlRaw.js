import { automationDB } from "../src/db/automation.js";
import { iotDB } from "../src/db/iot.js";

export function rawAutomation(sql) {
  return automationDB.$queryRawUnsafe(sql);
}

export function rawIot(sql) {
    return iotDB.$queryRawUnsafe(sql);
}

export function serializeBigInt(obj) {
  return JSON.parse(
    JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? Number(v) : v))
  );
}

export function parseTimeToISO(date, time) {
  if (!time || typeof time !== "string") return null;

  const normalized = time.replace(".", ":");

  // Validasi format HH:mm
  if (!/^\d{1,2}:\d{2}$/.test(normalized)) return null;

  const iso = `${date}T${normalized}:00`;

  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}