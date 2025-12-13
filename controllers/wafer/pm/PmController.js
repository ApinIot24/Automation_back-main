import { automationDB } from "../../../src/db/automation.js"
import importExcelWafer from "../../importExcelWafer.js";

export const AddWafer = async (req, res) => {
  try {
    const {
      machine_name,
      equipment,
      kode_barang,
      part_kebutuhan_alat,
      qty,
      periode,
      periode_start,
      grup
    } = req.body;

    if (!machine_name || !equipment || !kode_barang || !part_kebutuhan_alat ||
        !qty || !periode || !periode_start || !grup) {
      return res.status(400).json({ error: "All fields required" });
    }

    // ==== CEK MACHINE SUDAH ADA DI GROUP ====
    const existing = await automationDB.$queryRaw`
      SELECT no FROM automation.pm_wafer
      WHERE machine_name=${machine_name} AND grup=${grup}
      ORDER BY no DESC LIMIT 1
    `

    let no;
    if (existing.length > 0) {
      no = existing[0].no;
    } else {
      const last = await automationDB.$queryRaw`
        SELECT COALESCE(MAX(no),0)+1 AS no
        FROM automation.pm_wafer 
        WHERE grup=${grup}
      `
      no = last[0].no;
    }

    const inserted = await automationDB.$queryRaw`
      INSERT INTO automation.pm_wafer
      (machine_name, equipment, kode_barang, part_kebutuhan_alat, qty,
       periode, periode_start, grup, no)
      VALUES (
        ${machine_name}, ${equipment}, ${kode_barang},
        ${part_kebutuhan_alat}, ${qty}, ${periode},
        ${periode_start}, ${grup}, ${no}
      )
      RETURNING *
    `

    res.json({
      message: "Inserted",
      data: inserted[0],
      machineNo: no
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const UpdateMachineListOrder = async (req, res) => {
  try {
    const { group, machines } = req.body;

    if (!group || !Array.isArray(machines) || machines.length === 0) {
      return res.status(400).json({
        error: "Invalid input",
        message: "Group dan daftar mesin harus disediakan"
      });
    }

    for (const machine of machines) {
      if (!machine.name || !machine.order) continue;

      // update nomor urut
      await automationDB.$queryRaw`
        UPDATE automation.pm_wafer
        SET no=${machine.order}
        WHERE machine_name=${machine.name} AND grup=${group}
      `;

      // rename jika ada oldName
      if (machine.oldName && machine.oldName !== machine.name) {
        await automationDB.$queryRaw`
          UPDATE automation.pm_wafer
          SET machine_name=${machine.name}
          WHERE machine_name=${machine.oldName} AND grup=${group}
        `;
      }
    }

    res.json({
      message: "Daftar mesin berhasil diperbarui",
      updatedCount: machines.length
    });

  } catch (e) {
    console.error("UpdateMachineListOrder error:", e);
    res.status(500).json({ error: e.message });
  }
};

export const UpdateWaferField = async (req, res) => {
  try {
    const { id } = req.params;
    const { field, value } = req.body;

    const allowed = [
      "machine_name", "equipment", "kode_barang",
      "part_kebutuhan_alat", "qty", "periode", "periode_start"
    ];

    if (!allowed.includes(field)) {
      return res.status(400).json({ error: "Invalid field" });
    }

    // ==== CASE KHUSUS: UPDATE MACHINE NAME ====
    if (field === "machine_name") {
      const existing = await automationDB.$queryRaw`
        SELECT grup FROM automation.pm_wafer WHERE id=${id}
      `

      if (existing.length === 0) {
        return res.status(404).json({ error: "Not found" });
      }

      const grup = existing[0].grup;

      // cek apakah machine_name baru sudah punya nomor
      const check = await automationDB.$queryRaw`
        SELECT no FROM automation.pm_wafer
        WHERE machine_name=${value} AND grup=${grup}
        ORDER BY no DESC LIMIT 1
      `

      let no;
      if (check.length > 0) {
        no = check[0].no;
      } else {
        const last = await automationDB.$queryRaw`
          SELECT COALESCE(MAX(no),0)+1 AS no
          FROM automation.pm_wafer WHERE grup=${grup}
        `
        no = last[0].no;
      }

      const updated = await automationDB.$queryRaw`
        UPDATE automation.pm_wafer
        SET ${automationDB.raw(field)} = ${value}
        WHERE id=${id}
        RETURNING * 
     `

      return res.json({
        message: "Updated",
        data: updated[0],
        machineNo: no
      });
    }

    // ==== UPDATE FIELD NORMAL ====
    const updated = await automationDB.$queryRaw`
      UPDATE automation.pm_wafer
      SET ${automationDB.raw(field)} = ${value}
      WHERE id=${id}
      RETURNING *
    `

    res.json({
      message: `${field} updated`,
      data: updated[0]
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const DeleteWaferByGroup = async (req, res) => {
  try {
    const group = req.params.group;
    const result = await automationDB.$queryRaw`
      DELETE FROM automation.pm_wafer
      WHERE grup = ${group}
      RETURNING *
    `;
    const data = await automationDB.pm_wafer.delete({
        where: { grup: group }
    })

    res.json({
      message: "Deleted",
      deletedData: result
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const DeleteWaferBatch = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Invalid ids" });
    }
    if (!ids.every((id) => typeof id === "number")) {
      return res.status(400).json({ error: "All IDs must be numbers" });
    }

    const result = await automationDB.$queryRaw`
        DELETE FROM automation.pm_wafer
        WHERE id = ANY(${ids}::int[])
        RETURNING *
        `;
    if (result.length === 0) {
         return res.status(404).json({
            message: "No data found with the provided IDs",
            deletedData: [],
            deletedCount: 0,
        });
    }
    res.json({
      message: "Deleted",
      deletedData: result,
      deletedCount: result.length
    });

  } catch (e) {
    console.error("Error deleting data:", e);
    res.status(500).json({
      error: "Error deleting data",
      details: e.message,
    });
  }
};

export const DeleteWaferAll = async (req, res) => {
  try {
    const rows = await automationDB.$queryRawUnsafe(`
      DELETE FROM automation.pm_wafer
    `);

    res.json({
      message: "Semua data telah berhasil dihapus.",
      affectedRows: rows.rowCount ?? 0
    });

  } catch (e) {
    console.error("Error deleting all data:", e);
    res.status(500).json({ error: "Terjadi kesalahan saat menghapus semua data." });
  }
};

export const ImportWafer = async (req, res) => {
    try {
        const filePath = req.file.path

        await importExcelWafer(filePath)

        res.status(200).send("Data berhasil diimpor ke PostgreSQL.");
    } catch (e) {
        res.status(500).send("Gagal mengimpor data: " + e.message);
    }
}

export const ImportWaferByGroup = async (req, res) => {
  try {
    const filePath = req.file.path;
    const grup = req.params.grup;

    await importExcelWafer(filePath, grup);

    res.status(200)
      .send(`Data untuk grup ${grup} berhasil diimpor ke PostgreSQL.`)

  } catch (error) {
    res
      .status(500)
      .send(`Gagal mengimpor data untuk grup ${grup}: ` + error.message);
  }
};