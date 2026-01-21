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

    // First, find all existing records with same pmtablename and grup
    // This ensures we delete ALL duplicates and keep only 1 unique record
    const allExisting = await automationDB.setting_pm.findMany({
      where: {
        pmtablename: PMTableName,
        grup: grup
      },
      orderBy: {
        created_at: 'asc' // Get the oldest record to preserve original created_at
      }
    });

    let result;
    let isUpdate = false;
    let deletedCount = 0;

    if (allExisting.length > 0) {
      // If exists, delete ALL duplicate records first
      // This ensures only 1 unique record exists for pmtablename + grup combination
      const deleteResult = await automationDB.setting_pm.deleteMany({
        where: {
          pmtablename: PMTableName,
          grup: grup
        }
      });
      deletedCount = deleteResult.count;

      // Preserve the original created_at from the oldest record
      const originalCreatedAt = allExisting[0].created_at || new Date();

      // Create new record with updated week, but preserve original created_at
      result = await automationDB.setting_pm.create({
        data: {
          pmtablename: PMTableName,
          grup,
          week: weekNumber,
          created_at: originalCreatedAt, // Preserve original created_at
          updated_at: new Date() // Update timestamp
        }
      });
      isUpdate = true;
      
      console.log(`[SETTING_PM] Synced ${PMTableName}/${grup}: Deleted ${deletedCount} duplicate(s), created 1 unique record`);
    } else {
      // Create new record if doesn't exist
      result = await automationDB.setting_pm.create({
        data: {
          pmtablename: PMTableName,
          grup,
          week: weekNumber,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log(`[SETTING_PM] Created new setting for ${PMTableName}/${grup}`);
    }

    res.json({
      message: isUpdate 
        ? `Setting synced successfully (deleted ${deletedCount} duplicate(s), kept 1 unique record)` 
        : "Setting created successfully",
      data: result,
      action: isUpdate ? "synced" : "created",
      deletedDuplicates: deletedCount
    });

  } catch (error) {
    console.error("Error setting:", error);
    res.status(500).json({
      error: "Error updating/inserting setting",
      details: error.message
    });
  }
}
