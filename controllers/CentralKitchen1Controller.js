import { iotDB } from "../src/db/iot.js";

const WHERE_L1 = { line: 'L1' };

// ==== BASIC CENKIT L1 ====
export const getCenkitL1 = async (req, res) => {
    try {
        const result = await iotDB.ck_wafer_status.findMany({
            where: WHERE_L1,
            orderBy: { id: 'desc' },
            take: 1
        })

        res.status(200).send(result);
    } catch (error) {
        console.error('Error in GET /cenkit_l1', error.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}

// ==== WEIGHT MIXING HISTORY ====
// Endpoint untuk mendapatkan history weight_mixing dengan date range
export const getCenkitL1WeightMixingHistory = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).send({ 
                error: 'startDate and endDate query parameters are required. Format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss' 
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).send({ error: 'Invalid date format' });
        }

        if (start > end) {
            return res.status(400).send({ error: 'startDate must be before or equal to endDate' });
        }

        const data = await iotDB.ck_wafer_status.findMany({
            where: {
                ...WHERE_L1,
                realdatetime: {
                    gte: start,
                    lte: end
                },
                weight_mixing: {
                    not: null
                }
            },
            select: {
                id: true,
                weight_mixing: true,
                realdatetime: true
            },
            orderBy: { realdatetime: 'asc' }
        });

        res.status(200).send({
            startDate: start,
            endDate: end,
            totalRecords: data.length,
            data: data
        });
    } catch (error) {
        console.error('Error in GET /cenkit_l1/weight_mixing/history', error.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};
