import { automationDB } from "../../../src/db/automation.js";

export async function getUserGdspData(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const size = Math.max(parseInt(req.query.size) || 10, 1);
    const skip = (page - 1) * size;
    const q = req.query.q?.trim();
    // ===== SORTING =====
    const allowedSortFields = ["id", "kode", "nama", "created_at"];
    const sortBy = allowedSortFields.includes(req.query.sortBy)
      ? req.query.sortBy
      : "id";

    const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";

    const where = {
      is_active: true,
      ...(q && {
        OR: [
          { lokasi: { contains: q, mode: 'insensitive' } },
          { kode: { contains: q, mode: 'insensitive' } },
          { nama_item: { contains: q, mode: 'insensitive' } },
          { user_main: { contains: q, mode: 'insensitive' } },
          { user_request: { contains: q, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      automationDB.master_user.findMany({
        where,
        skip,
        take: size,
        orderBy: { [sortBy]: sortOrder },
      }),
      automationDB.master_user.count({
        where,
      }),
    ]);

    res.json({
      data,
      meta: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
        sortBy,
        sortOrder,
        q
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function updateUserGdspData(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body;

    const exist = await automationDB.master_user.findUnique({
      where: { id: Number(id) },
    });

    if (!exist) {
      return res.status(404).json({ message: "Data not found" });
    }

    const updated = await automationDB.master_user.update({
      where: { id: Number(id) },
      data: payload,
    });

    res.status(201).json({
      message: "Data updated successfully",
      data: updated
    });
  } catch (err) {
    console.error("Error updating Master GDSP data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function softDeleteUserGdsp(req, res) {
  const { mode, ids, q, start_date, end_date } = req.body;

  try {
    let where = { is_active: true };

    // ================= IDS MODE =================
    if (mode === "IDS") {
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "IDs required" });
      }

      where.id = { in: ids.map(Number) };
    }

    // ================= FILTER MODE =================
    if (mode === "FILTER") {
      if (q) {
        where.OR = [
          { kode: { contains: q, mode: "insensitive" } },
          { nama_item: { contains: q, mode: "insensitive" } },
          { lokasi: { contains: q, mode: "insensitive" } },
        ];
      }

      if (start_date || end_date) {
        where.tanggal = {
          ...(start_date && { gte: new Date(start_date) }),
          ...(end_date && { lte: new Date(end_date) }),
        };
      }
    }

    const result = await automationDB.master_user.updateMany({
      where,
      data: {
        is_active: false,
        deleted_at: new Date(),
      },
    });

    res.json({
      message: "Bulk delete success",
      deleted: result.count,
      mode,
    });
  } catch (err) {
    console.error("Bulk delete error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}