import db from "../config/util.js";
import { executeQuery, countQuery } from "../models/pagetable.js";

// Constants
const SORT_MAPPING = {
  id: "history.id",
  category: "history.category",
  created_at: "history.created_at",
};

const TABLE_SCHEMA = "ticket";
const DEFAULT_SORT = "id";

// Function to retrieve tickets with filters, pagination, and sorting
export const ticket = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      sortBy = DEFAULT_SORT,
      sortOrder = "asc",
    } = req.query;

    // Parse and validate query parameters
    const parsedPage = Math.max(1, parseInt(page));
    const parsedLimit = Math.max(1, parseInt(limit));
    const offset = (parsedPage - 1) * parsedLimit;

    // Build filter conditions for query
    const filterConditions = [];
    const filterValues = [];
    let paramCount = 1;

    if (category) {
      filterConditions.push(`history.category ILIKE $${paramCount}`);
      filterValues.push(`%${category}%`);
      paramCount++;
    }

    // Validate sorting order
    const validSortOrder = ["asc", "desc"].includes(sortOrder.toLowerCase())
      ? sortOrder.toUpperCase()
      : "ASC";

    const mappedSortColumn = SORT_MAPPING[sortBy] || SORT_MAPPING[DEFAULT_SORT];
    const orderClause = `ORDER BY ${mappedSortColumn} ${validSortOrder}`;

    // Build WHERE clause
    const whereClause = filterConditions.length
      ? `WHERE ${filterConditions.join(" AND ")}`
      : "";

    // Select query to get data
    const selectQuery = `
      SELECT 
        history.id,
        history.category,
        history.description,
        history.photo_path,
        history.created_at,
        history.status
      FROM ${TABLE_SCHEMA}.history
      ${whereClause}
      ${orderClause}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    // Query to count total records
    const countQuery = `
      SELECT COUNT(DISTINCT history.id) as total
      FROM ${TABLE_SCHEMA}.history
      ${whereClause}
    `;

    // Execute queries
    const [rows, totalResult] = await Promise.all([
      db.query(selectQuery, [...filterValues, parsedLimit, offset]),
      db.query(countQuery, filterValues),
    ]);

    // Transform data and add full URL for photo path
    const transformedData = rows.rows.map((row) => ({
      id: row.id,
      category: row.category,
      description: row.description,
      photoPath: row.photo_path
        ? `${req.protocol}://${req.get("host")}/api/uploads/${row.photo_path}`
        : null,
      createdAt: row.created_at,
      status: row.status,
    }));

    // Get total and pagination info
    const total = parseInt(totalResult.rows[0].total);

    // Send response
    return res.status(200).json({
      status: "success",
      data: transformedData,
      pagination: {
        currentPage: parsedPage,
        pageSize: parsedLimit,
        totalRecords: total,
        totalPages: Math.ceil(total / parsedLimit),
      },
      filters: {
        category: category || null,
      },
      sorting: {
        sortBy,
        sortOrder: validSortOrder,
      },
    });
  } catch (error) {
    console.error("Error in getTicket:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const updateTicket = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Expecting only the status field to be updated

  try {
    // Check if the ticket exists in the database
    const checkTicketQuery = "SELECT * FROM ticket.history WHERE id = $1";
    const ticketResult = await db.query(checkTicketQuery, [id]);

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Update only the status field
    const updateQuery = `
      UPDATE ticket.history
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, status, updated_at
    `;

    const result = await db.query(updateQuery, [status, id]);

    // Send a success response with the updated data
    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the ticket",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export default { ticket, updateTicket };
