import { automationDB } from "../../../src/db/automation.js";

// Helper function
export async function updateMasterStock({ kode, nama_item, jumlah, status, unit }) {
  const qty = Number(jumlah);
  if (Number.isNaN(qty)) {
    throw new Error("Invalid jumlah");
  }

  let master = await automationDB.master_gdsp.findFirst({
    where: { kode },
  });

  // ✅ JIKA BELUM ADA → CREATE MASTER BARU
  if (!master) {
    const masuk = status === "MASUK" ? qty : 0;
    const keluar = status === "KELUAR" ? qty : 0;

    return await automationDB.master_gdsp.create({
      data: {
        kode,
        nama_item,
        satuan: unit,
        stock_awal: 0,
        masuk,
        keluar,
        sisa_stok: masuk - keluar,
      },
    });
  }

  // ✅ JIKA SUDAH ADA → UPDATE
  let masuk = master.masuk || 0;
  let keluar = master.keluar || 0;

  if (status === "MASUK") masuk += qty;
  if (status === "KELUAR") keluar += qty;

  const sisa_stok = (master.stock_awal || 0) + masuk - keluar;

  return await automationDB.master_gdsp.update({
    where: { id: master.id },
    data: { masuk, keluar, sisa_stok },
  });
}
// async function checkMasterStock(kode) {
//   const master = await automationDB.master_gdsp.findFirst({
//     where: { kode },
//   });
// }

// CRUD main
export async function getHistoryGdsp(req, res) {
  try {
    const page = Math.max(+req.query.page || 1, 1);
    const size = Math.max(+req.query.size || 1000, 1);
    const { status, q, startDate, endDate } = req.query;
    const skip = (page - 1) * size;

    const where = {
      ...(status && status !== "ALL" && { status }),
      ...(q && {
        OR: [
          { kode: { contains: q, mode: "insensitive" } },
          { nama_item: { contains: q, mode: "insensitive" } },
          { user_transaksi: { contains: q, mode: "insensitive" } },
          { no_do_spk: { contains: q, mode: "insensitive" } },
          { no_gi: { contains: q, mode: "insensitive" } },
        ],
      }),
      ...(startDate || endDate
        ? {
            tanggal: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      automationDB.history_master_gdsp.findMany({
        // where: { is_active: true },
        where,
        skip,
        take: size,
        orderBy: [
          { tanggal: "desc" },
          { id: "desc" },
        ],
      }),
      automationDB.history_master_gdsp.count({ where }),
    ]);

    res.status(201).json({
      data,
      meta: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
    });
  } catch (err) {
    console.error("Error fetching History GDSP data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getHistoryGdspById(req, res) {
  try {
    const { id } = req.params;

    const data = await automationDB.history_master_gdsp.findUnique({
      where: { id: Number(id) },
    });

    if (!data || !data.is_active)
      return res.status(404).json({ message: "Data not found" });

    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching History GDSP by ID:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function createHistoryGdsp(req, res) {
  const requestId = Date.now();

  try {
    const payload = req.body;

    // ===================== PARSING =====================
    const parsedJumlah = Number(payload.jumlah);
    const parsedStockUser =
      payload.stock_user !== undefined
        ? Number(payload.stock_user)
        : null;
    const parsedPlant =
      payload.plant !== undefined ? Number(payload.plant) : null;
    const parsednoPo = payload.no_po ? Number(payload.no_po) : null;
    const parsedReceipent = payload.receipent ? Number(payload.receipent) : null;

    if (!["MASUK", "KELUAR"].includes(payload.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (Number.isNaN(parsedJumlah) || Number.isNaN(parsedStockUser) || Number.isNaN(parsedPlant) || Number.isNaN(parsednoPo) || Number.isNaN(parsedReceipent)) {
      return res.status(400).json({ message: "Invalid jumlah" });
    }

    if (!payload.kode || !payload.nama_item) {
      return res
        .status(400)
        .json({ message: "Kode dan Nama Item wajib diisi" });
    }

    const created = await automationDB.history_master_gdsp.create({
      data: {
        ...payload,
        jumlah: parsedJumlah,
        stock_user: parsedStockUser,
        plant: parsedPlant,
        no_po: parsednoPo,
        receipent: parsedReceipent,
        tanggal: new Date(`${payload.tanggal}T00:00:00`),
      },
    });

    await updateMasterStock({
      kode: payload.kode,
      nama_item: payload.nama_item,
      jumlah: parsedJumlah,
      status: payload.status,
      unit: payload.unit,
    });

    res.status(201).json({
      message: "Data created successfully",
      data: created
    });
  } catch (err) {
    console.error(
      `[GDSP][${requestId}] ❌ ERROR CREATE HISTORY`,
      {
        message: err.message,
        stack: err.stack,
      }
    );

    const status =
      err.message?.toLowerCase().includes("not found") ? 404 : 500;

    res.status(status).json({
      error: err.message,
      requestId,
    });
  }
}

// Ini masih belum terpakai di FE
export async function updateHistoryGdsp(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body;

    const existing = await automationDB.history_master_gdsp.findUnique({
      where: { id: Number(id) },
    });

    // if (!existing || !existing.is_active)
    if (!existing)
      return res.status(404).json({ message: "Data not found" });

    // rollback stok lama
    await updateMasterStock({
      kode: existing.kode,
      nama_item: existing.nama_item,
      jumlah: existing.jumlah,
      status: existing.status === "MASUK" ? "KELUAR" : "MASUK",
    });

    const updated = await automationDB.history_master_gdsp.update({
      where: { id: Number(id) },
      data: payload,
    });

    await updateMasterStock({
      kode: updated.kode,
      nama_item: updated.nama_item,
      jumlah: updated.jumlah,
      status: updated.status,
    });

    res.json(updated);
  } catch (err) {
    console.error("Error updating History GDSP:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}