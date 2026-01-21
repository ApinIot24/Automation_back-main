import importExcelChoki from "../../importExcelChoki.js";

export async function importChoki(req, res) {
  try {
    if (!req.file) {
      return res.status(400).send("File is required");
    }

    const filePath = req.file.path;

    await importExcelChoki(filePath);

    res.status(200).send({ message: "Data berhasil diimpor ke PostgreSQL" });
  } catch (error) {
    res.status(500).send("Gagal mengimpor data: " + error.message);
  }
}

export async function importChokiByGroup(req, res) {
  const grup = req.params?.grup || 'unknown';
  
  try {
    if (!req.file) {
      return res.status(400).send("File is required");
    }

    const filePath = req.file.path;

    await importExcelChoki(filePath, grup);

    res.status(200).send(`Data untuk grup ${grup} berhasil diimpor ke PostgreSQL.`);
  } catch (error) {
    res.status(500).send(`Gagal mengimpor data untuk grup ${grup}: ` + error.message);
  }
}
