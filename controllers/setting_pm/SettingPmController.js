import { automationDB } from "../../src/db/automation.js";

// export async function upsertSettingPM(req, res) {
//   try {
//     const { PMTableName, grup } = req.params;
//     const { week } = req.body;
//     const weekNumber = Number(week);

//     if (!PMTableName || !grup || !weekNumber) {
//       return res.status(400).json({
//         error: "PMTableName, grup, dan week wajib diisi"
//       });
//     }

//     // Cek existing data
//     const existing = await automationDB.setting_pm.findFirst({
//       where: {
//         pmtablename: PMTableName,
//         grup: grup
//       }
//     });

//     let result;

//     if (existing) {
//       // UPDATE
//       result = await automationDB.setting_pm.update({
//         where: { id: existing.id },
//         data: {
//           week: weekNumber,
//           updated_at: new Date()
//         }
//       });
//     } else {
//       // INSERT
//       result = await automationDB.setting_pm.create({
//         data: {
//           pmtablename: PMTableName,
//           grup,
//           week: weekNumber,
//           created_at: new Date()
//         }
//       });
//     }

//     return res.json({
//       message: "Setting updated/inserted successfully.",
//       data: result,
//       affectedRows: 1
//     });

//   } catch (error) {
//     console.error("Error setting:", error);
//     res.status(500).json({
//       error: "Error updating/inserting setting.",
//       details: error.message
//     });
//   }
// }
export async function upsertSettingPM(req, res) {
  try {
    const { PMTableName, grup } = req.params;
    const { week } = req.body;
    const weekNumber = Number(week);

    if (!PMTableName || !grup || !weekNumber) {
      return res.status(400).json({
        error: "PMTableName, grup, dan week wajib diisi"
      });
    }

    const result = await automationDB.setting_pm.upsert({
      where: {
        pmtablename_grup_week: {
          pmtablename: PMTableName,
          grup,
          week: weekNumber
        }
      },
      update: {
        week: weekNumber,
        updated_at: new Date()
      },
      create: {
        pmtablename: PMTableName,
        grup,
        week: weekNumber,
        created_at: new Date()
      }
    });

    res.json({
      message: "Setting updated/inserted successfully",
      data: result,
      affectedRows: 1
    });

  } catch (error) {
    console.error("Error setting:", error);
    res.status(500).json({
      error: "Error updating/inserting setting",
      details: error.message
    });
  }
}
