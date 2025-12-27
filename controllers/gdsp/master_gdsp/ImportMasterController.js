import xlsx from "xlsx";
import { promises as fs } from "fs";
import { automationDB } from "../../../src/db/automation.js";
import { updateMasterStock } from "./HistoryCrudMasterController.js";

const MASTER_SHEET_NAME = "Master Data GDSP";
const HISTORY_SHEET_STATUS = {
  "Barang Masuk GDSP": "MASUK",
  "Barang Keluar GDSP": "KELUAR",
};

const MASTER_HEADER_MAP = {
	lokasi: ["lokasi"],
	kode: ["kode", "kode_barang", "kode_item", "kode_material"],
	nama_item: ["nama_item", "nama_barang", "description", "nama_material"],
	stock_awal: ["stock_awal", "stok_awal", "stockawal"],
	masuk: ["masuk", "qty_masuk"],
	keluar: ["keluar", "qty_keluar"],
	sisa_stok: ["sisa_stok", "sisa_stock", "sisa"],
	satuan: ["satuan", "unit", "uom"],
	veso: ["veso"],
	rocem: ["rocem"],
};

const HISTORY_HEADER_MAP = {
	tanggal: ["tanggal", "tgl", "date"],
	kode: ["kode", "kode_barang", "kode_item", "kode_material"],
	nama_item: ["nama_item", "nama_barang", "description", "nama_material"],
	jumlah: ["jumlah", "qty", "quantity"],
	unit: ["unit", "satuan", "uom"],
	user_transaksi: ["user_transaksi", "user", "pic"],
	no_po: ["no_po", "nopo", "no_purchase_order"],
	vendor: ["vendor", "supplier"],
	note: ["note", "notes", "keterangan"],
	plant: ["plant"],
	stock_user: ["stock_user", "stok_user", "stockuser"],
	no_do_spk: ["no_do_spk", "no_do", "do_spk", "No. DO/SPK"],
	sto: ["sto", 'STO ?'],
	no_po_sto: ["no_po_sto", "po_sto", "No. PO STO"],
	no_gi: ["no_gi", "gi", "No. GI"],
	receipent: ["receipent", "recipient", "penerima"],
};

function normalizeKey(key) {
	return key
		?.toString()
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");
}

function normalizeRow(row) {
	return Object.entries(row).reduce((acc, [key, value]) => {
		const normalizedKey = normalizeKey(key);
		if (!normalizedKey) return acc;
		acc[normalizedKey] = value;
		return acc;
	}, {});
}

function extractMappedValues(row, headerMap) {
	const normalized = normalizeRow(row);
	return Object.entries(headerMap).reduce((acc, [target, candidates]) => {
		for (const candidate of candidates) {
			if (normalized[candidate] !== undefined) {
				acc[target] = normalized[candidate];
				break;
			}
		}
		return acc;
	}, {});
}

function parseInteger(value) {
	if (value === null || value === undefined || value === "") return null;
	if (typeof value === "number") {
		return Number.isFinite(value) ? Math.round(value) : null;
	}

	const cleaned = value
		.toString()
		.replace(/[^0-9-]+/g, "")
		.trim();

	if (!cleaned) return null;

	const parsed = Number(cleaned);
	return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function parseDecimal(value) {
	if (value === null || value === undefined || value === "") return null;
	if (typeof value === "number") {
		return Number.isFinite(value) ? Number(value) : null;
	}

	const cleaned = value.toString().replace(/,/g, "").trim();
	if (!cleaned) return null;

	const parsed = Number(cleaned);
	return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeString(value) {
	if (value === null || value === undefined) return null;
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value.toISOString();
	}

	const str = value.toString().trim();
	return str ? str : null;
}

function parseDate(value) {
	if (value === null || value === undefined || value === "") return null;

	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value;
	}

	if (typeof value === "number") {
		const parsed = xlsx.SSF?.parse_date_code?.(value);
		if (parsed) {
			return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
		}
	}

	const str = value.toString().trim();
	if (!str) return null;

	const asDate = new Date(str);
	return Number.isNaN(asDate.getTime()) ? null : asDate;
}

function compactObject(obj) {
	return Object.entries(obj).reduce((acc, [key, value]) => {
		if (value !== null && value !== undefined) {
			acc[key] = value;
		}
		return acc;
	}, {});
}

function resolveSheet(workbook, targetName) {
	const normalizedTarget = targetName.trim().toLowerCase();
	for (const sheetName of workbook.SheetNames) {
		if (sheetName.trim().toLowerCase() === normalizedTarget) {
			return { sheet: workbook.Sheets[sheetName], resolvedName: sheetName };
		}
	}
	return { sheet: null, resolvedName: targetName };
}

async function safeUnlink(filePath) {
	if (!filePath) return;
	try {
		await fs.unlink(filePath);
	} catch (err) {
		if (err.code !== "ENOENT") {
			console.error("Failed to remove uploaded file", err);
		}
	}
}

export async function importMasterGdsp(req, res) {
	if (!req.file) {
		return res.status(400).json({ message: "File is required" });
	}

	const filePath = req.file.path;
	const summary = {
		processed: 0,
		created: 0,
		updated: 0,
		skipped: 0,
		errors: [],
	};

	try {
		const workbook = xlsx.readFile(filePath, { cellDates: true });

		if (!workbook.SheetNames.length) {
			return res.status(400).json({ message: "Workbook has no sheets" });
		}

		const { sheet, resolvedName } = resolveSheet(workbook, MASTER_SHEET_NAME);
		if (!sheet) {
			return res.status(400).json({ message: `Sheet ${MASTER_SHEET_NAME} not found` });
		}

		const rows = xlsx.utils.sheet_to_json(sheet, { defval: null, raw: false, range: 4 });

		rows.forEach((row, index) => {
			row.__excelRow = index + 2;
		});

        console.log("RAW FIRST ROW:", rows[0]);
        console.log("HEADER ROW:", Object.keys(rows[0]));
        console.log("MAPPED:", extractMappedValues(rows[0], MASTER_HEADER_MAP));


		for (const row of rows) {
			const mapped = extractMappedValues(row, MASTER_HEADER_MAP);
			const kode = sanitizeString(mapped.kode);
			const namaItem = sanitizeString(mapped.nama_item);

			if (!kode || !namaItem) {
				summary.skipped += 1;
				if (summary.errors.length < 25) {
					summary.errors.push({
						sheet: resolvedName,
						row: row.__excelRow,
						reason: "Missing kode or nama item",
					});
				}
				continue;
			}

			const record = compactObject({
				lokasi: sanitizeString(mapped.lokasi),
				kode,
				nama_item: namaItem,
				stock_awal: parseInteger(mapped.stock_awal),
				masuk: parseInteger(mapped.masuk),
				keluar: parseInteger(mapped.keluar),
				sisa_stok: parseInteger(mapped.sisa_stok),
				satuan: sanitizeString(mapped.satuan),
				veso: sanitizeString(mapped.veso),
				rocem: sanitizeString(mapped.rocem),
				updated_at: new Date(),
			});

			try {
				const existing = await automationDB.master_gdsp.findFirst({
					where: { kode },
				});

				if (existing) {
					await automationDB.master_gdsp.update({
						where: { id: existing.id },
						data: record,
					});
					summary.updated += 1;
				} else {
					await automationDB.master_gdsp.create({ data: record });
					summary.created += 1;
				}

				summary.processed += 1;
			} catch (err) {
				summary.skipped += 1;
				if (summary.errors.length < 25) {
					summary.errors.push({
						sheet: resolvedName,
						row: row.__excelRow,
						reason: err.message,
					});
				}
			}
		}

		return res.status(200).json({
			message: "Master GDSP import completed",
			summary,
		});
	} catch (err) {
		console.error("Failed to import Master GDSP", err);
		return res.status(500).json({
			message: "Failed to import Master GDSP",
			error: err.message,
		});
	} finally {
		await safeUnlink(filePath);
	}
}

export async function importHistoryGdsp(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "File is required" });
  }

  const filePath = req.file.path;

  const summary = {
    processed: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const workbook = xlsx.readFile(filePath, { cellDates: true });

    for (const sheetName of workbook.SheetNames) {
		console.log("SHEET FOUND:", `"${sheetName}"`);
		console.log("STATUS MAP:", HISTORY_SHEET_STATUS[sheetName]);

		const normalizedSheetName = sheetName.trim();
		const status = HISTORY_SHEET_STATUS[normalizedSheetName];
      if (!status) continue; // skip sheet lain

      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const START_ROW = 5; // data mulai row ke-6

      const rows = xlsx.utils.sheet_to_json(sheet, {
        defval: null,
        raw: false,
        range: START_ROW,
      });

	  console.log(`ROWS IN ${sheetName}:`, rows.length);

      rows.forEach((row, index) => {
        row.__excelRow = index + START_ROW + 1;
      });

      for (const row of rows) {
        const mapped = extractMappedValues(row, HISTORY_HEADER_MAP);
		if (summary.processed < 5) {
		console.log("RAW ROW:", row);
		console.log("MAPPED:", mapped);
		}

        const isEmptyRow =
			!mapped.kode &&
			mapped.jumlah == null;

        if (isEmptyRow) {
          summary.skipped += 1;
          continue;
        }

        summary.processed += 1;

        const kode = sanitizeString(mapped.kode);
        const namaItem = sanitizeString(mapped.nama_item);
        const jumlah = parseDecimal(mapped.jumlah);
        const unit = sanitizeString(mapped.unit);
        const tanggal = parseDate(mapped.tanggal);

        if (!kode || jumlah === null) {
          summary.skipped += 1;
          if (summary.errors.length < 25) {
            summary.errors.push({
              sheet: sheetName,
              row: row.__excelRow,
              reason: "Missing mandatory fields",
            });
          }
          continue;
        }

        const baseData = {
          tanggal,
          kode,
          nama_item: namaItem,
          jumlah,
          unit,
          satuan: unit,
          status, // ⬅️ FINAL SOURCE OF TRUTH
          note: sanitizeString(mapped.note),
        };

        if (status === "MASUK") {
          Object.assign(
            baseData,
            compactObject({
              no_po: parseInteger(mapped.no_po),
              vendor: sanitizeString(mapped.vendor),
              plant: parseInteger(mapped.plant),
              stock_user: parseInteger(mapped.stock_user),
            })
          );
        } else {
          Object.assign(
            baseData,
            compactObject({
              user_transaksi: sanitizeString(mapped.user_transaksi),
              no_do_spk: sanitizeString(mapped.no_do_spk),
              sto: sanitizeString(mapped.sto),
              no_po_sto: sanitizeString(mapped.no_po_sto),
              no_gi: sanitizeString(mapped.no_gi),
              receipent: parseInteger(mapped.receipent),
            })
          );
        }

        try {
          await automationDB.history_master_gdsp.create({
            data: compactObject(baseData),
          });
          summary.inserted += 1;
        } catch (err) {
          summary.skipped += 1;
          if (summary.errors.length < 25) {
            summary.errors.push({
              sheet: sheetName,
              row: row.__excelRow,
              reason: err.message,
            });
          }
        }
      }
    }

    return res.status(200).json({
      message: "History GDSP import completed",
      summary,
    });
  } catch (err) {
    console.error("Failed to import History GDSP", err);
    return res.status(500).json({
      message: "Failed to import History GDSP",
      error: err.message,
    });
  } finally {
    await safeUnlink(filePath);
  }
}