import importExcelBiscuit from "../../../controllers/importExcelBiscuit.js";

export async function importBiscuit(req, res) {
  try {
    if (!req.file) {
      return res.status(400).send("File is required");
    }

    const filePath = req.file.path;

    await importExcelBiscuit(filePath);

    res.json({ message: "Data berhasil diimpor ke PostgreSQL" });
  } catch (error) {
    res.status(500).send("Gagal mengimpor data: " + error.message);
  }
}

export async function importBiscuitByGroup(req, res) {
  const grup = req.params?.grup || 'unknown';
  
  try {
    if (!req.file) {
      return res.status(400).send("File is required");
    }

    const filePath = req.file.path;

    await importExcelBiscuit(filePath, grup);

    res.status(200).send(`Data untuk grup ${grup} berhasil diimpor ke PostgreSQL.`);
  } catch (error) {
    res.status(500).send(`Gagal mengimpor data untuk grup ${grup}: ` + error.message);
  }
}
