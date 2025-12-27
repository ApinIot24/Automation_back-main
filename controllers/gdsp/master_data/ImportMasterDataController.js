import xlsx from "xlsx";
import { automationDB } from "../../../src/db/automation.js";

const HEADER_MAP = {
    "Material": "material",
    "Plant": "plant",
    "Material Description": "material_description",
    "Valuation Type": "valuation_type",
    "Last Change": "last_change",
    "Material Type": "material_type",
    "Material Group": "material_group",
    "Base Unit of Measure": "base_unit_of_measure",
    "Purchasing Group": "purchasing_group",
    "ABC Indicator": "abc_indicator",
    "MRP Type": "mrp_type",
    "Valuation Class": "valuation_class",
    "Price Control": "price_control",
    "Price": "price",
    "Currency": "currency",
    "Price Unit": "price_unit",
    "Created by": "created_by",
};

export async function importMasterDataGdsp(req, res) {
    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet);

        const validRows = [];
        const rejectedRows = [];
        console.log("EXCEL HEADERS:", Object.keys(rows[0] || {}));

        rows.forEach((row, index) => {
            const mapped = {};

            // map header Excel -> field DB
            for (const excelKey in HEADER_MAP) {
                mapped[HEADER_MAP[excelKey]] = row[excelKey] ?? null;
            }

            // ✅ VALIDASI WAJIB
            if (!mapped.material || isNaN(mapped.material)) {
                rejectedRows.push({
                row: index + 2, // header + 1-based index
                reason: "Material is required or invalid",
                });
                return;
            }

            validRows.push({
                material: BigInt(mapped.material),
                plant: mapped.plant ? Number(mapped.plant) : null,
                material_description: mapped.material_description ?? null,
                valuation_type: mapped.valuation_type ?? null,
                last_change: mapped.last_change
                ? new Date(mapped.last_change)
                : null,
                material_type: mapped.material_type ?? null,
                material_group: mapped.material_group ?? null,
                base_unit_of_measure: mapped.base_unit_of_measure ?? null,
                purchasing_group: mapped.purchasing_group ?? null,
                abc_indicator: mapped.abc_indicator ?? null,
                mrp_type: mapped.mrp_type ?? null,
                valuation_class: mapped.valuation_class ?? null,
                price_control: mapped.price_control ?? null,
                price: mapped.price && !isNaN(mapped.price)
                ? BigInt(mapped.price)
                : null,
                currency: mapped.currency ?? null,
                price_unit: mapped.price_unit
                ? Number(mapped.price_unit)
                : null,
                created_by: mapped.created_by ?? null,
            });
        });

        const result = await automationDB.master_data_gdsp.createMany({
            data: validRows,
            skipDuplicates: true,
        });

        res.json({
            message: "Import success",
            summary : {
                totalRows: rows.length,
                inserted: result.count,
                rejected: rejectedRows.length
            },
            rejectedRows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Import failed" });
    }
}