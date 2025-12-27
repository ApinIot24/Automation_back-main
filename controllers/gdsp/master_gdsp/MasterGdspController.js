import { automationDB } from "../../../src/db/automation.js";

const MONTH_MAP = {
  0: "Januari",
  1: "Februari",
  2: "Maret",
  3: "April",
  4: "Mei",
  5: "Juni",
  6: "Juli",
  7: "Agustus",
  8: "September",
  9: "Oktober",
  10: "November",
  11: "Desember",
};

function initMonthObject() {
  return Object.values(MONTH_MAP).reduce((acc, m) => {
    acc[m] = 0;
    return acc;
  }, {});
}

export async function getMasterGdspData(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const size = Math.max(parseInt(req.query.size) || 10, 1);
    const skip = (page - 1) * size;
    const q = req.query.q?.trim();
    const year = Number(req.query.year) || new Date().getFullYear();

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
          { lokasi: { contains: q, mode: "insensitive" } },
          { kode: { contains: q, mode: "insensitive" } },
          { nama_item: { contains: q, mode: "insensitive" } },
        ],
      }),
    };

    const [masters, total] = await Promise.all([
      automationDB.master_gdsp.findMany({
        where,
        skip,
        take: size,
        orderBy: { [sortBy]: sortOrder },
      }),
      automationDB.master_gdsp.count({where}),
    ]);

    const kodeList = masters.map((m) => m.kode);
    const startDate = new Date(`${year}-01-01T00:00:00`);
    const endDate = new Date(`${year}-12-31T23:59:59`);
    const histories = await automationDB.history_master_gdsp.findMany({
      where: {
        kode: { in: kodeList },
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        kode: true,
        tanggal: true,
        status: true,
        jumlah: true,
      },
    });

    const historyMap = {};

    for (const h of histories) {
      if (!h.tanggal || !h.kode) continue;

      const monthName = MONTH_MAP[new Date(h.tanggal).getMonth()];
      if (!monthName) continue;

      if (!historyMap[h.kode]) {
        historyMap[h.kode] = {
          masuk_bulanan: initMonthObject(),
          keluar_bulanan: initMonthObject(),
        };
      }

      const qty = Number(h.jumlah) || 0;

      if (h.status === "MASUK") {
        historyMap[h.kode].masuk_bulanan[monthName] += qty;
      }

      if (h.status === "KELUAR") {
        historyMap[h.kode].keluar_bulanan[monthName] += qty;
      }
    }

    // 4️⃣ merge ke master (FE READY)
    const result = masters.map((m) => ({
      ...m,
      masuk_bulanan:
        historyMap[m.kode]?.masuk_bulanan ?? initMonthObject(),
      keluar_bulanan:
        historyMap[m.kode]?.keluar_bulanan ?? initMonthObject(),
    }));

    res.json({
      data: result,
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
    console.error("Error fetching Master GDSP data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function updateMasterGdspData(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body;

    const exist = await automationDB.master_gdsp.findUnique({
      where: { id: Number(id) },
    });

    if (!exist) {
      return res.status(404).json({ message: "Data not found" });
    }

    const updated = await automationDB.master_gdsp.update({
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

export async function softDeleteMasterGdsp(req, res) {
  const { mode, ids, search, dateRange } = req.body;

  try {
    if (mode === "IDS") {
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "IDs required" });
      }

      const result = await automationDB.master_gdsp.updateMany({
        where: { id: { in: ids.map(Number) } },
        data: {
          is_active: false,
          deleted_at: new Date(),
        },
      });

      return res.json({ deleted: result.count });
    }

    if (mode === "FILTER") {
      const where = {
        is_active: true,
        ...(search && {
          OR: [
            { kode: { contains: search, mode: "insensitive" } },
            { nama_item: { contains: search, mode: "insensitive" } },
            { lokasi: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(dateRange?.start || dateRange?.end
          ? {
              tanggal: {
                ...(dateRange.start && {
                  gte: new Date(dateRange.start),
                }),
                ...(dateRange.end && {
                  lte: new Date(dateRange.end),
                }),
              },
            }
          : {}),
      };

      const result = await automationDB.master_gdsp.updateMany({
        where,
        data: {
          is_active: false,
          deleted_at: new Date(),
        },
      });

      return res.json({ deleted: result.count });
    }

    res.status(400).json({ message: "Invalid delete mode" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}