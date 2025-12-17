// controllers/pmBiscuit/pmBiscuit.controller.js
import { automationDB } from "../../../src/db/automation.js";
import { rawAutomation as raw } from "../../../config/sqlRaw.js";
import { generateWeeklyDataForTargetYear, getTotalWeeksInYear } from "../../../config/dateUtils.js";

export async function getMachineByName(req, res) {
  try {
    const { machineName, group } = req.body;

    const machines = await automationDB.pm_biscuit.findMany({
      where: {
        machine_name: machineName,
        grup: group
      },
      // orderBy: { id: "asc" }
    });

    res.json(machines);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Error fetching machine data" });
  }
}

export async function getMachineListByGroup(req, res) {
  try {
    const { group } = req.params;
    // const { group } = req.params.group;

    const result = await automationDB.$queryRaw`
      SELECT machine_name, no
      FROM (
        SELECT DISTINCT ON (machine_name) 
          machine_name, 
          no
        FROM automation.pm_biscuit
        WHERE grup = ${group}
        ORDER BY machine_name, no ASC
      ) AS t
      ORDER BY no ASC
    `;

    res.json(result);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Error fetching data" });
  }
}

export async function getQrCodeListByGroup(req, res) {
  try {
    const { group } = req.params;

    const result = await automationDB.$queryRaw`
      SELECT DISTINCT ON (qrcode) machine_name, qrcode
      FROM automation.pm_biscuit
      WHERE grup = ${group}
      ORDER BY qrcode
    `;

    res.json(result);
  } catch (err) {
    console.error("Error fetching QR code data:", err);
    res.status(500).json({ error: err.message });
  }
}

// ====================== GET PM BISCuit WITH WEEKLY DATA ======================
export async function getPmBiscuitWithWeeklyByYear(req, res) {
  try {
    const { group, year } = req.params;
    const yearNum = parseInt(year, 10);

    const start = req.query.start ? parseInt(req.query.start, 10) : null;
    const end = req.query.end ? parseInt(req.query.end, 10) : null;
    const search = req.query.searchTerm ? req.query.searchTerm.toLowerCase() : "";

    let rows = [];

    if (start !== null && end !== null && !isNaN(start) && !isNaN(end)) {
      rows = await automationDB.pm_biscuit.findMany({
        where: {
          grup: group,
          OR: [
            { machine_name: { contains: search, mode: "insensitive" } },
            { kode_barang: { contains: search, mode: "insensitive" } },
            { equipment: { contains: search, mode: "insensitive" } },
            { part_kebutuhan_alat: { contains: search, mode: "insensitive" } },
          ],
        },
        orderBy: { no: "asc" },
        skip: start,
        take: end - start + 1,
      });
    }

    else {
      rows = await automationDB.pm_biscuit.findMany({
        where: { grup: group },
        orderBy: { no: "asc" },
      });
    }

    const totalWeeks = getTotalWeeksInYear(yearNum);
    const modified = rows.map((r) => ({
      ...r,
      week: generateWeeklyDataForTargetYear(
        totalWeeks,
        r.periode,
        r.periode_start,
        yearNum
      ),
    }));

    res.json(modified);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Error fetching data" });
  }
}

// ====================== ADD NEW BISCuit ======================
export async function addPmBiscuit(req, res) {
  try {
    const {
      machine_name,
      equipment,
      kode_barang,
      part_kebutuhan_alat,
      qty,
      periode,
      periode_start,
      grup,
    } = req.body;

    if (
      !machine_name ||
      !equipment ||
      !kode_barang ||
      !part_kebutuhan_alat ||
      !qty ||
      !periode ||
      !periode_start ||
      !grup
    ) {
      return res.status(400).json({ error: "Semua field harus diisi" });
    }

    const existingMachine = await automationDB.pm_biscuit.findFirst({
      where: { grup: String(grup), machine_name },
      orderBy: { no: "desc" },
      select: { no: true },
    });

    let nextNo;

    if (existingMachine) {
      nextNo = existingMachine.no;
    } else {
      const maxNo = await automationDB.pm_biscuit.aggregate({
        where: { grup },
        _max: { no: true },
      });

      nextNo = (maxNo._max.no ?? 0) + 1;
    }

    const created = await automationDB.pm_biscuit.create({
      data: {
        machine_name,
        equipment,
        kode_barang,
        part_kebutuhan_alat,
        qty,
        periode,
        periode_start,
        grup: String(grup),
        no: nextNo,
      },
    });

    if (created.length === 0) {
        return res.status(500).json({ error: "Gagal menambahkan data" });
    }

    res.status(201).json({
      message: "Data berhasil ditambahkan",
      data: created,
      machineNo: nextNo,
    });
  } catch (err) {
    console.error("Error adding PM Biscuit data:", err);
    if (err.code === "23505") {
      // Unique violation
      return res.status(400).json({
        error: "Data dengan kode barang tersebut sudah ada",
      });
    }
    res.status(500).json({ 
        error: "Terjadi kesalahan saat menambahkan data",
        details: err.message, 
    });
  }
}

// ====================== UPDATE FIELD (smart update) ======================
export async function updatePmBiscuitField(req, res) {
  try {
    const { id } = req.params;
    const { field, value } = req.body;

    const allowed = [
      "machine_name",
      "equipment",
      "kode_barang",
      "part_kebutuhan_alat",
      "qty",
      "periode",
      "periode_start",
    ];

    if (!allowed.includes(field)) return res.status(400).json({ error: "Kolom yang diberikan tidak valid atau tidak dapat diperbarui" });

    try {
        if (field === "machine_name") {
            const existing = await automationDB.pm_biscuit.findUnique({
                where: { id: id },
                select: { grup: true, machine_name: true }
            })

            if (!existing) {
                return res.status(404).json({ error: "Data tidak ditemukan" })
            }

            const { grup } = existing;

            const existingMachine = await automationDB.pm_biscuit.findFirst({
                where: { machine_name: value, grup},
                orderBy: { no: "desc" }
            })

            let machineNo

            if (existingMachine) {
                machineNo = existingMachine.no
            } else {
                const lastNumberQuery = await raw(`
                    SELECT COALESCE((SELECT MAX(no) FROM automation.pm_biscuit WHERE grup = ${grup}), 0) + 1 AS last_number
                `);

                machineNo = lastNumberQuery[0].last_number
            }

            const updated = await automationDB.pm_biscuit.update({
                where: { id: Number(id) },
                data: {
                    machine_name: value,
                    no: machineNo
                }
            })

            return res.json({
                message: "Machine name berhasil diperbarui",
                data: updated,
                machineNo: machineNo
            })
        }

        const updated = await automationDB.pm_biscuit.update({
            where: { id: Number(id) },
            data: {
                [field]: value,
            },
        })

        return res.json({
            message: `${field} berhasil diperbarui`,
            data: updated,
        });
    } catch (err) {
        console.error("Error updating pm_biscuit:", err);
        res.status(500).json({ error: "Terjadi kesalahan saat memperbarui data" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
export async function updateMachineList(req, res) {
  try {
    const { group, machines } = req.body;

    // Validasi input
    if (!group || !Array.isArray(machines) || machines.length === 0) {
      return res.status(400).json({
        error: "Invalid input",
        message: "Group dan daftar mesin harus disediakan",
      });
    }

    let updatedCount = 0;

    // Loop mesin satu per satu (sesuai behavior SQL)
    for (const machine of machines) {
      // Validasi tiap machine
      if (!machine.name || !machine.order) {
        console.warn(`Mesin tidak valid: ${JSON.stringify(machine)}`);
        continue;
      }

      // ========== UPDATE NOMOR URUTAN ==========
      await automationDB.pm_biscuit.updateMany({
        where: {
          machine_name: machine.name,
          grup: group
        },
        data: {
          no: machine.order
        }
      });

      // ========== RENAME MESIN (JIKA oldName BERBEDA) ==========
      if (machine.oldName && machine.oldName !== machine.name) {
        await automationDB.pm_biscuit.updateMany({
          where: {
            machine_name: machine.oldName,
            grup: group
          },
          data: {
            machine_name: machine.name
          }
        });
      }

      updatedCount++;
    }

    return res.json({
      message: "Daftar mesin berhasil diperbarui",
      updatedCount,
    });

  } catch (error) {
    console.error("Error updating machine list:", error);
    res.status(500).json({
      error: "Gagal memperbarui daftar mesin",
      details: error.message,
    });
  }
}

export async function deleteAllPmBiscuit(req, res) {
  try {
    const result = await automationDB.pm_biscuit.deleteMany({});

    res.json({
      message: "Semua data telah berhasil dihapus.",
      affectedRows: result.count,
    });
  } catch (err) {
    console.error("Error deleting all data:", err);
    res
      .status(500)
      .json({ error: "Terjadi kesalahan saat menghapus semua data." });
  }
}

// ====================== DELETE BY GROUP ======================
export async function deleteByGroup(req, res) {
  try {
    const { group } = req.params;

    const deletedRows = await automationDB.pm_biscuit.findMany({
      where: { grup: group },
    });

    const result = await automationDB.pm_biscuit.deleteMany({
      where: { grup: group },
    });

    res.json({
      message: "Data deleted successfully",
      deleted: result.count,
      deletedData: deletedRows,
    });

  } catch (err) {
    console.error("Error deleting data by group:", err);
    res.status(500).json({ error: err.message });
  }
}

// ====================== BATCH DELETE ======================
export async function deleteBatch(req, res) {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Invalid or empty IDs array" });
    }
    // Pastikan semua elemen dalam array adalah number
    if (!ids.every((id) => typeof id === "number")) {
      return res.status(400).json({ error: "All IDs must be numbers" });
    }

     const existingRows = await automationDB.pm_biscuit.findMany({
      where: { id: { in: ids } },
    });

    if (existingRows.length === 0) {
      return res.status(404).json({
        message: "No data found with the provided IDs",
        deletedData: [],
        deletedCount: 0,
      });
    }

    const deleteResult = await automationDB.pm_biscuit.deleteMany({
      where: { id: { in: ids } },
    });

    return res.json({
      message: "Data deleted successfully",
      deletedData: existingRows,
      deletedCount: deleteResult.count,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}