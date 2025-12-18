import { iotDB } from "../../../src/db/iot.js";

export const getGasMeterHistory = async (req, res) => {
  try {
    const { gas_id } = req.params;
    const { start, end, limit } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        error:
          "Missing required query parameters: start and end (format: YYYY-MM-DD)",
      });
    }

    const startDate = new Date(`${start}T00:00:00.000Z`);
    const endDate = new Date(`${end}T23:59:59.999Z`);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: "Invalid date format. Use YYYY-MM-DD format",
      });
    }

    // Guardrail: prevent accidentally pulling millions of rows and timing out
    const take = Math.min(Math.max(parseInt(limit ?? "10000", 10) || 10000, 1), 50000);

    const data = await iotDB.gasmeter.findMany({
      where: {
        created_at: { gte: startDate, lte: endDate },
        line: String(gas_id),
      },
      orderBy: { created_at: "asc" },
      take,
      select: {
        id: true,
        line: true,
        value1: true,
        value2: true,
        value3: true,
        value4: true,
        created_at: true,
      },
    });

    res.status(200).json(data);
  } catch (e) {
    // Prisma timeout / connection issues: don't crash nodemon process
    res.status(500).json({ error: e.message });
  }
}