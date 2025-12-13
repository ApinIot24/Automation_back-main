import importExcelAstor from "../../importExcelAstor.js";

export async function importAstor(req, res) {
  try {
    const filePath = req.file.path;

    await importExcelAstor(filePath);

    res.status(200).send({ message: "Data berhasil diimpor ke PostgreSQL" });
  } catch (error) {
    res.status(500).send("Gagal mengimpor data: " + error.message);
  }
}

export async function importAstorByGroup(req, res) {
  try {
    const filePath = req.file.path;
    const grup = req.params.grup;

    await importExcelAstor(filePath, grup);

    res.status(200).send(`Data untuk grup ${grup} berhasil diimpor ke PostgreSQL.`);
    } catch (error) {
        res.status(500).send(`Gagal mengimpor data untuk grup ${grup}: ` + error.message);
    }
}