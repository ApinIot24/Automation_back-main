import { iotDB } from "../../../src/db/iot.js";

export const getGasMeterHistory = async (req, res) => {
    const { gas_id } = req.params;
    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({
            error: "Missing required query parameters: start and end (format: YYYY-MM-DD)"
        });
    }

    const startDate = new Date((start + "T00:00:00.000Z"));
    const endDate = new Date((end + "T23:59:59.999Z"));

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
            error: "Invalid date format. Use YYYY-MM-DD format"
        });
    }

    const data = await iotDB.gasmeter.findMany({
        where: {
            created_at: { gte: startDate, lte: endDate },
            line: gas_id,
        },
    })
    res.status(200).json(data);
}