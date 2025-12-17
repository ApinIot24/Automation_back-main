import importExcelUtility from "../../importExcelUtility.js";

export async function importUtility(req, res) {
  try {
    if (!req.file) {
      return res.status(400).send("File is required");
    }

    const filePath = req.file.path;

    await importExcelUtility(filePath);

    res.status(200).send({ message: "Data berhasil diimpor ke PostgreSQL" });
  } catch (error) {
    res.status(500).send("Gagal mengimpor data: " + error.message);
  }
}

export async function importUtilityByGroup(req, res) {
  const grup = req.params?.grup || 'unknown';
  
  try {
    if (!req.file) {
      return res.status(400).send("File is required");
    }

    const filePath = req.file.path;

    await importExcelUtility(filePath, grup);

    res.status(200).send(`Data untuk grup ${grup} berhasil diimpor ke PostgreSQL.`);
  } catch (error) {
    res.status(500).send(`Gagal mengimpor data untuk grup ${grup}: ` + error.message);
  }
}