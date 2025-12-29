import { serializeBigInt } from "../../../config/sqlRaw.js";
import { automationDB } from "../../../src/db/automation.js";

export async function getMasterDataGdsp(req, res) {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const size = Math.max(Number(req.query.size) || 10, 1);
        const skip = (page - 1) * size;
        const q = req.query.q?.trim();
        const material = req.query.material?.trim();
        
        const where = {
          deleted_at: null,
          ...(q && {
              OR: [
              { material_description: { contains: q, mode: "insensitive" } },
              { material_group: { contains: q, mode: "insensitive" } },
              { valuation_type: { contains: q, mode: "insensitive" } },
              ],
          }),
        };

        let data, total;

        if (material) {
          // ⚠️ CONTAINS MATERIAL (BigInt → TEXT)
          const materialLike = `%${material}%`;

          data = await automationDB.$queryRaw`
            SELECT *
            FROM automation.master_data_gdsp
            WHERE deleted_at IS NULL AND 
            CAST(material AS TEXT) ILIKE ${materialLike}
            ORDER BY id ASC
            LIMIT ${size} OFFSET ${skip}
          `;

          const countResult = await automationDB.$queryRaw`
            SELECT COUNT(*)::int AS total
            FROM automation.master_data_gdsp
            WHERE deleted_at IS NULL AND 
            CAST(material AS TEXT) ILIKE ${materialLike}
          `;

          total = countResult[0]?.total ?? 0;
        } else {
          // 🔹 NORMAL PRISMA QUERY
          [data, total] = await Promise.all([
            automationDB.master_data_gdsp.findMany({
              where,
              skip,
              take: size,
              orderBy: { id: "asc" },
            }),
            automationDB.master_data_gdsp.count({ where }),
          ]);
        }

        const serialize = serializeBigInt(data)

        res.json({
        data: serialize,
        meta: {
            page,
            size,
            total,
            totalPages: Math.ceil(total / size),
            q,
            material
        },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export async function getMasterDataByMaterial(req, res) {
  try {
    const keyword = req.params.material?.trim();

    if (!keyword || !/^\d+$/.test(keyword)) {
      return res.json([]);
    }

    let whereClause;
    let param;

    if (keyword.length >= 10) {
      // 👉 exact match
      whereClause = `material::text = $1`;
      param = keyword;
    } else {
      // 👉 contains (typing mode)
      whereClause = `material::text LIKE $1`;
      param = `%${keyword}%`;
    }

    const data = await automationDB.$queryRawUnsafe(
      `
      SELECT
        material,
        material_description,
        base_unit_of_measure,
        plant
      FROM automation.master_data_gdsp
      WHERE deleted_at IS NULL AND ${whereClause}
      ORDER BY material
      LIMIT 20
      `,
      param
    );

    res.json(
      data.map((d) => ({
        material: d.material.toString(),
        material_description: d.material_description,
        base_unit_of_measure: d.base_unit_of_measure,
        plant: d.plant,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function createMasterDataGdsp(req, res) {
    try {
        const payload = {
          ...req.body,
          material: req.body.material ? BigInt(req.body.material) : null,
          price: req.body.price ? BigInt(req.body.price) : null,
          last_change: req.body.last_change
              ? new Date(req.body.last_change)
              : null,
        };

        const created = await automationDB.master_data_gdsp.create({
          data: payload,
        });

        res.status(201).json({
        message: "Created successfully",
        data: serializeBigInt(created),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export async function updateMasterDataGdsp(req, res) {
  try {
    const id = Number(req.params.id);

    const exist = await automationDB.master_data_gdsp.findUnique({
      where: { id, deleted_at: null },
    });

    if (!exist) {
      return res.status(404).json({ message: "Data not found" });
    }

    const payload = {
      ...req.body,
      material: req.body.material
        ? BigInt(req.body.material)
        : exist.material,
      price: req.body.price ? BigInt(req.body.price) : exist.price,
      last_change: req.body.last_change
        ? new Date(req.body.last_change)
        : exist.last_change,
    };

    const updated = await automationDB.master_data_gdsp.update({
      where: { id },
      data: payload,
    });

    res.json({
      message: "Updated successfully",
      data: serializeBigInt(updated),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function deleteMasterDataGdsp(req, res) {
  try {
    const id = Number(req.params.id);

    const exist = await automationDB.master_data_gdsp.findUnique({
      where: { id },
    });

    if (!exist || exist.deleted_at) {
      return res.status(404).json({ message: "Data not found" });
    }

    await automationDB.master_data_gdsp.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getDeletedMasterDataGdsp(req, res) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const size = Math.max(Number(req.query.size) || 20, 1);
    const skip = (page - 1) * size;

    const [data, total] = await Promise.all([
      automationDB.master_data_gdsp.findMany({
        where: {
          deleted_at: { not: null },
        },
        orderBy: { deleted_at: "desc" },
        skip,
        take: size,
      }),
      automationDB.master_data_gdsp.count({
        where: {
          deleted_at: { not: null },
        },
      }),
    ]);

    const serialize = serializeBigInt(data)
    res.json({
      data: serialize,
      meta: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function restoreMasterDataGdsp(req, res) {
  try {
    const id = Number(req.params.id);

    const restored = await automationDB.master_data_gdsp.update({
      where: { id },
      data: { deleted_at: null },
    });

    res.json({
      message: "Restored successfully",
      data: serializeBigInt(restored),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}