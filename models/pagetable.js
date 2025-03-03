// models/pagetable.js
import pool from "../config/util.js";

/**
 * Custom error class for database operations
 */
class DatabaseError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

/**
 * Validates and sanitizes pagination parameters
 * @param {number} limit - Number of records per page
 * @param {number} offset - Number of records to skip
 * @returns {Object} Validated pagination parameters
 */
const validatePaginationParams = (limit, offset) => {
  const maxLimit = 100; // Maximum allowed limit
  const sanitizedLimit = Math.min(Math.max(1, Number(limit)), maxLimit);
  const sanitizedOffset = Math.max(0, Number(offset));

  return {
    limit: sanitizedLimit,
    offset: sanitizedOffset
  };
};

/**
 * Executes a paginated query with filtering and sorting
 * @param {string} baseQuery - Base SQL query
 * @param {Array} filterParams - Array of filter parameters
 * @param {number} limit - Number of records per page
 * @param {number} offset - Number of records to skip
 * @param {string} [orderQuery=''] - Optional ORDER BY clause
 * @returns {Promise<Array>} Query results
 */
export const executeQuery = async (
  baseQuery,
  filterParams = [],
  limit = 10,
  offset = 0,
  orderQuery = ''
) => {
  try {
    // Validate parameters
    if (!baseQuery || typeof baseQuery !== 'string') {
      throw new DatabaseError('Invalid base query parameter');
    }

    if (!Array.isArray(filterParams)) {
      throw new DatabaseError('Filter parameters must be an array');
    }

    // Validate and sanitize pagination parameters
    const { limit: validLimit, offset: validOffset } = validatePaginationParams(limit, offset);

    // Build the complete query
    let completeQuery = baseQuery.trim();
    
    // Handle ORDER BY clause
    if (orderQuery && typeof orderQuery === 'string') {
      // Remove any existing 'ORDER BY' to prevent injection
      completeQuery = completeQuery.replace(/ORDER\s+BY\s+.*$/i, '');
      completeQuery += ` ORDER BY ${orderQuery}`;
    }

    // Add pagination
    completeQuery += ` LIMIT $${filterParams.length + 1} OFFSET $${filterParams.length + 2}`;

    // Execute query with parameters
    const result = await pool.query(completeQuery, [
      ...filterParams,
      validLimit,
      validOffset
    ]);

    return result.rows;

  } catch (error) {
    console.error('Error executing paginated query:', error);
    throw new DatabaseError(
      'Failed to execute paginated query',
      error
    );
  }
};

/**
 * Executes a count query with filtering
 * @param {string} baseCountQuery - Base SQL count query
 * @param {Array} filterParams - Array of filter parameters
 * @returns {Promise<number>} Total record count
 */
export const countQuery = async (baseCountQuery, filterParams = []) => {
  try {
    // Validate parameters
    if (!baseCountQuery || typeof baseCountQuery !== 'string') {
      throw new DatabaseError('Invalid base count query parameter');
    }

    if (!Array.isArray(filterParams)) {
      throw new DatabaseError('Filter parameters must be an array');
    }

    // Execute count query
    const result = await pool.query(baseCountQuery, filterParams);
    
    if (!result.rows[0] || !('total' in result.rows[0])) {
      throw new DatabaseError('Invalid count query result structure');
    }

    const total = parseInt(result.rows[0].total, 10);
    
    if (isNaN(total)) {
      throw new DatabaseError('Invalid count result');
    }

    return total;

  } catch (error) {
    console.error('Error executing count query:', error);
    throw new DatabaseError(
      'Failed to execute count query',
      error
    );
  }
};

/**
 * Builds a WHERE clause from filter conditions
 * @param {Array} conditions - Array of filter conditions
 * @returns {string} Constructed WHERE clause
 */
export const buildWhereClause = (conditions = []) => {
  if (!conditions.length) return '';
  return `WHERE ${conditions.join(' AND ')}`;
};

/**
 * Creates a parameterized filter condition
 * @param {string} column - Column name
 * @param {string} operator - SQL operator
 * @param {number} paramIndex - Parameter index
 * @returns {string} Parameterized condition
 */
export const createFilterCondition = (column, operator, paramIndex) => {
  return `${column} ${operator} $${paramIndex}`;
};

/**
 * Example usage:
 * 
 * const baseQuery = `
 *   SELECT * FROM users
 *   ${buildWhereClause([
 *     createFilterCondition('name', 'ILIKE', 1),
 *     createFilterCondition('age', '>', 2)
 *   ])}
 * `;
 * 
 * const filterParams = ['%John%', 18];
 * const results = await executeQuery(baseQuery, filterParams, 10, 0, 'name ASC');
 * const total = await countQuery(countQuery, filterParams);
 */