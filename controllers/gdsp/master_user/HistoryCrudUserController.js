import { automationDB } from "../../../src/db/automation.js";

async function updateMasterStock({ kode, nama_item, jumlah, status, unit, user_main = null, user_request = null }) {
  const qty = Number(jumlah);
  if (Number.isNaN(qty)) {
    throw new Error("Invalid jumlah");
  }

  let master = await automationDB.master_user.findFirst({
    where: { kode },
  });

  if (!master) {
    const masuk = status === "MASUK" ? qty : 0;
    const keluar = status === "KELUAR" ? qty : 0;

    return await automationDB.master_user.create({
      data: {
        kode,
        nama_item,
        satuan: unit,
        stock_awal: 0,
        masuk,
        keluar,
        sisa_stok: masuk - keluar,
        user_main,
        user_request
      },
    });
  }

  // ✅ JIKA SUDAH ADA → UPDATE
  let masuk = master.masuk || 0;
  let keluar = master.keluar || 0;

  if (status === "MASUK") masuk += qty;
  if (status === "KELUAR") keluar += qty;

  const sisa_stok = (master.stock_awal || 0) + masuk - keluar;

  let nextUserRequest = master.user_request || "";

  if (status === "KELUAR" && user_request) {
    nextUserRequest = appendUniqueUser(nextUserRequest, user_request);
  }
  return await automationDB.master_user.update({
    where: { id: master.id },
    data: { 
      masuk, 
      keluar, 
      sisa_stok,
      ...(user_main && { user_main }),
      user_request: nextUserRequest,
    },
  });
}
function appendUniqueUser(str, user) {
  if (!user) return str;

  const sep = "|";
  const set = new Set((str || "").split(sep).filter(Boolean));
  set.add(user.trim());

  return Array.from(set).join(sep);
}

export async function getHistoryUserGdsp(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const size = Math.max(parseInt(req.query.size) || 10, 1);
    const skip = (page - 1) * size;
    const { q, status, startDate, endDate } = req.query;

    const where = {
      ...(status && { status }),

      ...(q && {
        OR: [
          { kode: { contains: q, mode: "insensitive" } },
          { nama_item: { contains: q, mode: "insensitive" } },
          { user_transaksi: { contains: q, mode: "insensitive" } },
          { no_do_spk: { contains: q, mode: "insensitive" } },
          { no_gi: { contains: q, mode: "insensitive" } },
        ],
      }),

      ...(startDate &&
        endDate && {
          tanggal: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    const [data, total] = await Promise.all([
      automationDB.history_master_user.findMany({
        where,
        skip,
        take: size,
        orderBy: { id: "desc" },
      }),
      automationDB.history_master_user.count({where})
    ])

    res.status(201).json({
      data,
      meta: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size)
      }
    })
  } catch (err) {
    console.error("Error fetching History User GDSP data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getHistoryUserGdspById(req, res) {
  try {
    const { id } = req.params

    const data = await automationDB.history_master_user.findUnique({
      where: { id: Number(id) }
    })

    if (!data || !data.is_active) return res.status(404).json({ message: "Data not found" })
    
    res.status(200).json(data)
  } catch (err) {
    console.error("Error fetching History User GDSP by ID:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function createHistoryUserGdsp(req, res) {
  const requestId = Date.now()

  try {
    const payload = req.body

    const parsedJumlah = Number(payload.jumlah)
    const parsedStockGdsp = payload.stock_gdsp !== undefined ? Number(payload.stock_gdsp) : null
    const parsedPlant = payload.plant !== undefined ? Number(payload.plant) : null
    const parsedNoPo = payload.no_po !== undefined ? Number(payload.no_po) : null

    if (!["MASUK", "KELUAR"].includes(payload.status)) {
      return res.status(400).json({ message: "Invalid status value" })
    }

    if (Number.isNaN(parsedJumlah) || Number.isNaN(parsedStockGdsp) || Number.isNaN(parsedPlant)) {
      return res.status(400).json({ message: "Invalid jumlah value" })
    }

    if (!payload.kode || !payload.nama_item || !payload.unit) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const created = await automationDB.history_master_user.create({
      data: {
        ...payload,
        jumlah: parsedJumlah,
        stock_gdsp: parsedStockGdsp,
        plant: parsedPlant,
        no_po: parsedNoPo,
        tanggal: new Date(`${payload.tanggal}T00:00:00`),
      }
    })

    await updateMasterStock({
      kode: payload.kode,
      nama_item: payload.nama_item,
      jumlah: parsedJumlah,
      status: payload.status,
      user_main: payload.status === "MASUK" ? payload.user_transaksi : null,
      user_request: payload.status === "KELUAR" ? payload.user_transaksi : null,
      unit: payload.unit
    })

    res.status(201).json({
      message: "Data created successfully",
      data: created
    })
  } catch (err) {
    console.error(`Error creating History User GDSP [Request ID: ${requestId}]:`, err)
    res.status(500).json({ error: "Internal Server Error" })
  }
}

export async function updateHistoryUserGdsp(req, res) {
  try {
    const { id } = req.params
    const payload = req.body

    const existing = await automationDB.history_master_user.findUnique({
      where: { id: Number(id) }
    })

    if (!existing) {
      return res.status(404).json({ message: "Data not found" })
    }

    await updateMasterStock({
      kode: existing.kode,
      nama_item: existing.nama_item,
      jumlah: existing.jumlah,
      status: existing.status === "MASUK" ? "KELUAR" : "MASUK",
    })

    const updated = await automationDB.history_master_user.update({
      where: { id: Number(id) },
      data: payload
    })

    await updateMasterStock({
      kode: updated.kode,
      nama_item: updated.nama_item,
      jumlah: updated.jumlah,
      status: updated.status,
    })

    res.status(201).json({
      message: "Data updated successfully",
      data: updated
    })
  } catch (err) {
    console.error("Error updating History User GDSP:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}