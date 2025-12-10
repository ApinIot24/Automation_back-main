import { Router } from "express";
import { iotDB } from "../../../src/db/iot.js";
const app = Router();

app.get("/gas/:gas_id/history", async (req, res) => {
  const { gas_id, start, end } = req.params;
  const data = await iotDB.gasmeter.findMany({
    where: {
      created_at: { gte: new Date(start), lte: new Date(end) },
      line: gas_id,
    },
  });
  res.json(data);
});

export default app;
