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