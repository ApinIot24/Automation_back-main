import { Router } from "express";
import { automationDB } from "../../../src/db/automation.js";

const router = Router();

function parseDateRange(dateFrom, dateTo) {
  // Expect: YYYY-MM-DD
  // Use UTC boundaries to avoid timezone surprises
  const from = new Date(`${dateFrom}T00:00:00.000Z`);
  const to = new Date(`${dateTo}T23:59:59.999Z`);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return null;
  }
  return { from, to };
}

/**
 * GET /api/history/checkweigher_wafer?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&line=l1|l2|l6|l7
 * Source tables: automation.checkweigher_wafer_l{1,2,6,7} (chosen via `line` from FE)
 */
async function handler(req, res) {
  try {
    const { dateFrom, dateTo, line, page, limit } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        message: "Missing required query params: dateFrom, dateTo (YYYY-MM-DD)",
      });
    }

    const range = parseDateRange(dateFrom, dateTo);
    if (!range) {
      return res.status(400).json({
        message: "Invalid date format. Use YYYY-MM-DD for dateFrom/dateTo.",
      });
    }

    // Determine which table to query based on line parameter, default to l2 for backward compatibility
    const normalizedLine = (line || "l1").toString().trim().toLowerCase();
    const tableMap = {
      l1: "checkweigher_wafer_l1",
      "1": "checkweigher_wafer_l1",
      l2: "checkweigher_wafer_l2",
      "2": "checkweigher_wafer_l2",
      l6: "checkweigher_wafer_l6",
      "6": "checkweigher_wafer_l6",
      l7: "checkweigher_wafer_l7",
      "7": "checkweigher_wafer_l7",
    };

    const tableName = tableMap[normalizedLine];
    const model = tableName ? automationDB[tableName] : null;
    if (!model) {
      return res.status(400).json({
        message: "Invalid line parameter. Use l1, l2, l6, or l7.",
      });
    }

    const where = {
      created_at: { gte: range.from, lte: range.to },
    };

    // Check if pagination is requested
    const pageInt = page ? parseInt(page, 10) : null;
    const limitInt = limit ? parseInt(limit, 10) : null;
    const isPaginated = pageInt !== null && limitInt !== null && !Number.isNaN(pageInt) && !Number.isNaN(limitInt);

    let rows = [];
    let totalCount = 0;

    if (isPaginated) {
      // Use transaction to get count and data consistently
      const [count, data] = await automationDB.$transaction([
        model.count({ where }),
        model.findMany({
          where,
          orderBy: { created_at: "desc" },
          skip: pageInt * limitInt, // Assuming page starts from 0
          take: limitInt,
          select: {
            id: true,
            weight: true,
            created_at: true,
          },
        }),
      ]);
      totalCount = count;
      rows = data;
    } else {
      // Full data fetch (for chart or non-paginated requests)
      rows = await model.findMany({
        where,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          weight: true,
          created_at: true,
        },
      });
      totalCount = rows.length;
    }

    // Normalize response for frontend
    const data = rows.map((r) => ({
      id: r.id,
      timestamp: r.created_at,
      weight: r.weight,
      line: normalizedLine,
    }));

    if (isPaginated) {
      return res.json({
        data,
        total: totalCount,
        page: pageInt,
        limit: limitInt,
      });
    }

    return res.json(data);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("history/checkweigher_wafer error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

router.get("/history/checkweigher_wafer", handler);

export default router;