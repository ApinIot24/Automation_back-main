import xlsx from "xlsx";
import { promises as fs } from "fs";
import { automationDB } from "../../../src/db/automation.js";

const MASTER_SHEET_CANDIDATES = [
	"Master Data User GDSP",
	"Master Data User",
	"Master User GDSP",
	"Master User",
];

const HISTORY_SHEET_MAP = {
	MASUK: ["Barang Masuk User GDSP", "Barang Masuk User"],
	KELUAR: ["Barang Keluar User GDSP", "Barang Keluar User"],
};

const MASTER_HEADER_MAP = {
	lokasi: ["lok", "lokasi"],
	kode: ["kode", "kode_barang", "kode_item"],
	nama_item: ["nama_item", "nama_barang", "description"],
	stock_awal: ["stock_awal", "stok_awal"],
	masuk: ["masuk", "qty_masuk"],
	keluar: ["keluar", "qty_keluar"],
	sisa_stok: ["sisa_stok", "sisa_stock", "sisa"],
	satuan: ["satuan", "unit", "uom"],
	asset: ["asset", "aset"],
	user_main: ["user", "user_main"],
	user_request: ["userrr", "userrrr", "user_request", "user_req"],
};

const HISTORY_HEADER_MAP = {
	status: ["status", "tipe"],
	tanggal: ["tanggal", "tgl", "date"],
	bulan: ["bulan"],
	kode: ["kode", "kode_barang", "kode_item"],
	nama_item: ["nama_item", "nama_barang", "description"],
	jumlah: ["jumlah", "qty", "quantity"],
	unit: ["unit", "satuan", "uom"],
	no_po: ["no_po", "nopo", "no_purchase_order"],
	user_transaksi: ["user", "user_transaksi", "pic"],
	vendor: ["vendor", "supplier"],
	note: ["note", "notes", "keterangan"],
	plant: ["plant"],
	stock_gdsp: ["stock_gdsp", "stockgdsp", "stock_gdsp_user"],
	pj: ["pj", "penanggung_jawab"],
	no_do_spk: ["no_do_spk", "no_do", "do_spk"],
	sto: ["sto"],
	no_po_sto: ["no_po_sto", "po_sto"],
	no_gi: ["no_gi", "gi"],
	receipent: ["receipent", "recipient", "penerima"],
};

const MASTER_RANGE = 5;
const HISTORY_RANGE = 6;

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
		return Number.isFinite(value) ? Math.trunc(value) : null;
	}

	const cleaned = value
		.toString()
		.replace(/[^0-9-]+/g, "")
		.trim();

	if (!cleaned) return null;

	const parsed = Number(cleaned);
	return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
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

function parseBoolean(value) {
	if (value === null || value === undefined || value === "") return null;
	if (typeof value === "boolean") return value;

	const normalized = value.toString().trim().toLowerCase();
	if (!normalized) return null;
	if (["y", "yes", "true", "1"].includes(normalized)) return true;
	if (["n", "no", "false", "0"].includes(normalized)) return false;
	return null;
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

function resolveSheet(workbook, candidates) {
	for (const candidate of candidates) {
		const normalizedTarget = candidate.trim().toLowerCase();
		for (const sheetName of workbook.SheetNames) {
			if (sheetName.trim().toLowerCase() === normalizedTarget) {
				return { sheet: workbook.Sheets[sheetName], resolvedName: sheetName };
			}
		}
	}
	return { sheet: null, resolvedName: candidates[0] };
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

function appendUniqueUser(existing, next) {
	if (!next) return existing || null;
	const separator = "|";
	const set = new Set((existing || "")
		.split(separator)
		.map((item) => item.trim())
		.filter(Boolean));
	set.add(next.trim());
	return Array.from(set).join(separator);
}

// async function updateMasterUserStock({
// 	kode,
// 	nama_item,
// 	jumlah,
// 	status,
// 	unit,
// 	userMain = null,
// 	userRequest = null,
// }) {
// 	const qty = Number(jumlah);
// 	if (!Number.isFinite(qty)) {
// 		throw new Error("Invalid jumlah");
// 	}

// 	const existing = await automationDB.master_user.findFirst({ where: { kode } });

// 	if (!existing) {
// 		const masuk = status === "MASUK" ? qty : 0;
// 		const keluar = status === "KELUAR" ? qty : 0;
// 		return automationDB.master_user.create({
// 			data: {
// 				kode,
// 				nama_item,
// 				satuan: unit,
// 				stock_awal: 0,
// 				masuk,
// 				keluar,
// 				sisa_stok: masuk - keluar,
// 				user_main: userMain,
// 				user_request: userRequest,
// 			},
// 		});
// 	}

// 	let masuk = existing.masuk || 0;
// 	let keluar = existing.keluar || 0;

// 	if (status === "MASUK") {
// 		masuk += qty;
// 	} else {
// 		keluar += qty;
// 	}

// 	const sisa_stok = (existing.stock_awal || 0) + masuk - keluar;
// 	const data = {
// 		masuk,
// 		keluar,
// 		sisa_stok,
// 	};

// 	if (status === "MASUK" && userMain) {
// 		data.user_main = userMain;
// 	}

// 	if (status === "KELUAR" && userRequest) {
// 		data.user_request = appendUniqueUser(existing.user_request, userRequest);
// 	}

// 	return automationDB.master_user.update({
// 		where: { id: existing.id },
// 		data,
// 	});
// }

export async function importMasterUser(req, res) {
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

		const { sheet, resolvedName } = resolveSheet(workbook, MASTER_SHEET_CANDIDATES);
		if (!sheet) {
			return res.status(400).json({ message: `Sheet ${MASTER_SHEET_CANDIDATES[0]} not found` });
		}

		const rows = xlsx.utils.sheet_to_json(sheet, {
			defval: null,
			raw: false,
			range: MASTER_RANGE,
		});

		rows.forEach((row, index) => {
			row.__excelRow = index + MASTER_RANGE + 1;
		});

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

			const asset = parseBoolean(mapped.asset);
			const record = compactObject({
				lokasi: sanitizeString(mapped.lokasi),
				kode,
				nama_item: namaItem,
				stock_awal: parseInteger(mapped.stock_awal),
				masuk: parseInteger(mapped.masuk),
				keluar: parseInteger(mapped.keluar),
				sisa_stok: parseInteger(mapped.sisa_stok),
				satuan: sanitizeString(mapped.satuan),
				asset,
				user_main: sanitizeString(mapped.user_main),
				user_request: sanitizeString(mapped.user_request),
				updated_at: new Date(),
			});

			try {
				const existing = await automationDB.master_user.findFirst({
					where: { kode },
				});

				if (existing) {
					await automationDB.master_user.update({
						where: { id: existing.id },
						data: record,
					});
					summary.updated += 1;
				} else {
					await automationDB.master_user.create({ data: record });
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
			message: "Master User import completed",
			summary,
		});
	} catch (err) {
		console.error("Failed to import Master User", err);
		return res.status(500).json({
			message: "Failed to import Master User",
			error: err.message,
		});
	} finally {
		await safeUnlink(filePath);
	}
}

export async function importHistoryUser(req, res) {
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

		if (!workbook.SheetNames.length) {
			return res.status(400).json({ message: "Workbook has no sheets" });
		}

		for (const [expectedStatus, candidates] of Object.entries(HISTORY_SHEET_MAP)) {
			const { sheet, resolvedName } = resolveSheet(workbook, candidates);
			if (!sheet) {
				if (summary.errors.length < 25) {
					summary.errors.push({
						sheet: candidates[0],
						reason: `Sheet ${candidates[0]} not found`,
					});
				}
				continue;
			}

			const rows = xlsx.utils.sheet_to_json(sheet, {
				defval: null,
				raw: false,
				range: HISTORY_RANGE,
			});

			rows.forEach((row, index) => {
				row.__excelRow = index + HISTORY_RANGE + 1;
			});

			for (const row of rows) {
				const mapped = extractMappedValues(row, HISTORY_HEADER_MAP);
				const kode = sanitizeString(mapped.kode);
				const namaItem = sanitizeString(mapped.nama_item);
				const jumlah = parseDecimal(mapped.jumlah);
				const unit = sanitizeString(mapped.unit);
				const tanggal = parseDate(mapped.tanggal);
				const status = expectedStatus;
				const userTransaksi = sanitizeString(mapped.user_transaksi);
				const pj = sanitizeString(mapped.pj);

				if (!kode || !namaItem || jumlah === null || !unit) {
					summary.skipped += 1;
					if (summary.errors.length < 25) {
						summary.errors.push({
							sheet: resolvedName,
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
					status,
					note: sanitizeString(mapped.note),
					user_transaksi: userTransaksi,
				};

				if (status === "MASUK") {
					Object.assign(baseData, compactObject({
						no_po: parseInteger(mapped.no_po),
						vendor: sanitizeString(mapped.vendor),
						plant: parseInteger(mapped.plant),
						stock_gdsp: parseInteger(mapped.stock_gdsp),
					}));
				} else {
					Object.assign(baseData, compactObject({
						pj,
						no_do_spk: sanitizeString(mapped.no_do_spk),
						sto: sanitizeString(mapped.sto),
						no_po_sto: sanitizeString(mapped.no_po_sto),
						no_gi: sanitizeString(mapped.no_gi),
						receipent: sanitizeString(mapped.receipent),
					}));
				}

				try {
					await automationDB.history_master_user.create({ data: compactObject(baseData) });
					summary.inserted += 1;
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
		}

		return res.status(200).json({
			message: "History User import completed",
			summary,
		});
	} catch (err) {
		console.error("Failed to import History User", err);
		return res.status(500).json({
			message: "Failed to import History User",
			error: err.message,
		});
	} finally {
		await safeUnlink(filePath);
	}
}