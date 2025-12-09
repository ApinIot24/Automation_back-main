import { automationDB } from "../../../src/db/automation.js"

export const getControlLhp = async (req, res) => {
    try {
        const { grup } = req.params
        const data = await automationDB.control_lhp.findUnique({
            where: { grup: grup },
            select: {
                grup: true,
                custom_control_1: true
            }
        })
        if (!data) {
            return res.status(404).json({ message: "Group not found" })
        }
        res.status(200).json(data.custom_control_1)
    } catch (error) {
        console.error("Error fetching control_lhp:", error)
        res.status(500).json({ message: "Internal server error" })
    }
}

export const updateControlLhp = async (req, res) => {
    try {
        const { grup } = req.params
        const formData = req.body

        const exist = await automationDB.control_lhp.findUnique({
            where: { grup }
        })
        if (!exist) {
            return res.status(404).json({ message: "Group not found" })
        }

        const updated = await automationDB.control_lhp.update({
            where: { grup },
            data: {
                custom_control_1: formData
            },
            select: {
                custom_control_1: true
            }
        })

        return res.status(200).json({
            message: "Data updated successfully",
            data: updated.custom_control_1
        })
    } catch (error) {
        console.error("Error updating control_lhp:", error)
        res.status(500).json({ message: "Internal server error" })
    }
}