import { automationDB } from "../src/db/automation.js";

function calculateCurrentWeek() {
  const now = new Date();
  const firstMonday = new Date(
    now.getFullYear(),
    0,
    1 + ((1 - new Date(now.getFullYear(), 0, 1).getDay()) % 7)
  );
  return Math.ceil((now - firstMonday) / (1000 * 60 * 60 * 24 * 7));
}

export const getChecklistByLineWeek = async (req, res) => {
  try {
    const { line, currentweek } = req.params;
    const stringLine = String(line);

    let data = await automationDB.checklist_pm_biscuit.findMany({
      where: {
        week: Number(currentweek),
        grup: stringLine,
      },
    });

    if (data.length === 0) {
      data = await automationDB.checklist_pm_wafer.findMany({
        where: {
          week: Number(currentweek),
          grup: stringLine,
        },
      });
    }

    res.json({ data });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getChecklistByQRCode = async (req, res) => {
  const { scannedData } = req.query;
  const currentWeek = calculateCurrentWeek();

  try {
    if (!scannedData) {
      return res.status(400).json({
        error: "Scanned data is required",
      });
    }

    console.log(`Searching checklist for QR: ${scannedData}, Week: ${currentWeek}`);

    let data = await automationDB.checklist_pm_biscuit.findMany({
      where: {
        qrcode: scannedData,
        week: currentWeek,
      },
    });

    if (data.length === 0) {
      data = await automationDB.checklist_pm_wafer.findMany({
        where: {
          qrcode: scannedData,
          week: currentWeek,
        },
      });
    }

    if (data.length === 0) {
      data = await automationDB.checklist_pm_astor.findMany({
        where: {
          qrcode: scannedData,
          week: currentWeek,
        },
      });
    }

    if (data.length === 0) {
      data = await automationDB.checklist_pm_utility.findMany({
        where: {
          qrcode: scannedData,
          week: currentWeek,
        },
      });
    }

    if (data.length === 0) {
      console.log(`Checklist not found for QR: ${scannedData} in week ${currentWeek}`);
      return res.status(404).json({
        message: "Checklist not found this week",
        scannedData,
        currentWeek,
      });
    }

    res.status(200).json({
      message: "QR Code found",
      data,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({
      error: "Error fetching data",
      details: error.message,
    });
  }
};

export const updateChecklist = async (req, res) => {
  try {
    const {
      id,
      c_i,
      l,
      r,
      keterangan,
      tanggal,
      status_checklist,
    } = req.body;

    // Validate that id is provided
    if (!id) {
      return res.status(400).json({
        error: "ID is required",
      });
    }

    // ID is a UUID string, not a number
    const itemId = String(id);

    // cek biscuit
    const biscuit = await automationDB.checklist_pm_biscuit.findUnique({
      where: { id: itemId },
    });

    if (biscuit) {
      await automationDB.checklist_pm_biscuit.update({
        where: { id: itemId },
        data: {
          c_i,
          l,
          r,
          keterangan,
          tanggal,
          status_checklist,
        },
      });

      return res.status(200).json({
        message: "Item updated successfully",
        id: itemId,
        table: "automation.checklist_pm_biscuit",
      });
    }

    // cek wafer
    const wafer = await automationDB.checklist_pm_wafer.findUnique({
      where: { id: itemId },
    });

    if (!wafer) {
      return res.status(404).json({
        error: "Item not found in both tables",
      });
    }

    await automationDB.checklist_pm_wafer.update({
      where: { id: itemId },
      data: {
        c_i,
        l,
        r,
        keterangan,
        tanggal,
        status_checklist,
      },
    });

    res.status(200).json({
      message: "Item updated successfully",
      id: itemId,
      table: "automation.checklist_pm_wafer",
    });
  } catch (error) {
    console.error("Error updating checklist:", error);
    res.status(500).json({
      error: "Error updating checklist",
      details: error.message,
    });
  }
};