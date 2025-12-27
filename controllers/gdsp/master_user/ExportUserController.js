import xlsx from "xlsx";
import { automationDB } from "../../../src/db/automation.js";

function autoFitColumns(rows) {
  if (!rows.length) return [];
  const headers = Object.keys(rows[0]);

  return headers.map((key) => {
    const maxLength = Math.max(
      key.length,
      ...rows.map((r) => String(r[key] ?? "").length)
    );
    return { wch: Math.min(Math.max(maxLength + 2, 10), 40) };
  });
}

export async function exportHistoryUserGdsp(req, res) {
  try {
    const { status, q, startDate, endDate } = req.query;

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
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    const data = await automationDB.history_master_user.findMany({
      where,
      orderBy: [
        { tanggal: "asc" },
        { id: "asc" },
      ],
    });

    const masukRows = data
      .filter((r) => r.status === "MASUK")
      .map((r) => ({
        Tanggal: r.tanggal ? new Date(r.tanggal) : "",
        Kode: r.kode,
        "Nama Item": r.nama_item,
        Jumlah: Number(r.jumlah) || 0,
        Unit: r.unit || "",
        "No PO": r.no_po || "-",
        User: r.user_transaksi || "",
        Vendor: r.vendor || "-",
        Note: r.note || "",
        Plant: r.plant || "-",
        "Stock GDSP": r.stock_gdsp || "-",
      }));

    const keluarRows = data
      .filter((r) => r.status === "KELUAR")
      .map((r) => ({
        Tanggal: r.tanggal ? new Date(r.tanggal) : "",
        Kode: r.kode,
        "Nama Item": r.nama_item,
        Jumlah: Number(r.jumlah) || 0,
        Unit: r.unit || "",
        User: r.user_transaksi || "",
        PJ: r.pj || "-",
        "No DO/SPK": r.no_do_spk || "-",
        STO: r.sto || "-",
        "No PO STO": r.no_po_sto || "-",
        "No GI": r.no_gi || "-",
        Receipent: r.receipent || "-",
        Note: r.note || "",
      }));

    const workbook = xlsx.utils.book_new();

    if (masukRows.length) {
      const wsMasuk = xlsx.utils.json_to_sheet(masukRows, { cellDates: true });
      wsMasuk["!cols"] = autoFitColumns(masukRows);
      wsMasuk["!freeze"] = { xSplit: 0, ySplit: 1 };

      Object.keys(masukRows[0]).forEach((_, c) => {
        const cell = wsMasuk[xlsx.utils.encode_cell({ r: 0, c })];
        if (cell) cell.s = { font: { bold: true } };
      });

      xlsx.utils.book_append_sheet(workbook, wsMasuk, "MASUK");
    }

    if (keluarRows.length) {
      const wsKeluar = xlsx.utils.json_to_sheet(keluarRows, { cellDates: true });
      wsKeluar["!cols"] = autoFitColumns(keluarRows);
      wsKeluar["!freeze"] = { xSplit: 0, ySplit: 1 };

      Object.keys(keluarRows[0]).forEach((_, c) => {
        const cell = wsKeluar[xlsx.utils.encode_cell({ r: 0, c })];
        if (cell) cell.s = { font: { bold: true } };
      });

      xlsx.utils.book_append_sheet(workbook, wsKeluar, "KELUAR");
    }

    const buffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
      cellStyles: true,
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Log_User_GDSP_${Date.now()}.xlsx"`
    );

    res.send(buffer);
  } catch (err) {
    console.error("Export User GDSP failed:", err);
    res.status(500).json({ message: "Failed to export User GDSP" });
  }
}