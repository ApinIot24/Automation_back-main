/**
 * Timezone utility functions
 * Handles conversion between UTC and WIB (UTC+7)
 */

/**
 * Convert UTC date to WIB (UTC+7) timezone
 * @param {Date|string} date - Date object or ISO string
 * @returns {Date} Date object in WIB timezone
 */
export function convertToWIB(date) {
    if (!date) return null;
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    // WIB is UTC+7, so we add 7 hours
    const wibDate = new Date(d.getTime() + (7 * 60 * 60 * 1000));
    return wibDate;
}

/**
 * Format date to ISO string in WIB timezone
 * @param {Date|string} date - Date object or ISO string (assumed to be in UTC from database)
 * @returns {string} ISO string in WIB format (YYYY-MM-DDTHH:mm:ss.sss+07:00)
 */
export function formatToWIBISO(date) {
    if (!date) return null;
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    // Get UTC components (database returns UTC)
    const utcYear = d.getUTCFullYear();
    const utcMonth = d.getUTCMonth();
    const utcDay = d.getUTCDate();
    const utcHours = d.getUTCHours();
    const utcMinutes = d.getUTCMinutes();
    const utcSeconds = d.getUTCSeconds();
    const utcMilliseconds = d.getUTCMilliseconds();
    
    // Add 7 hours for WIB (UTC+7)
    let wibHours = utcHours + 7;
    let wibDay = utcDay;
    let wibMonth = utcMonth;
    let wibYear = utcYear;
    
    // Handle day/month/year overflow
    if (wibHours >= 24) {
        wibHours -= 24;
        wibDay += 1;
        
        // Check if day overflows to next month
        const daysInMonth = new Date(wibYear, wibMonth + 1, 0).getDate();
        if (wibDay > daysInMonth) {
            wibDay = 1;
            wibMonth += 1;
            
            // Check if month overflows to next year
            if (wibMonth >= 12) {
                wibMonth = 0;
                wibYear += 1;
            }
        }
    }
    
    // Format: YYYY-MM-DDTHH:mm:ss.sss+07:00
    const year = String(wibYear).padStart(4, '0');
    const month = String(wibMonth + 1).padStart(2, '0');
    const day = String(wibDay).padStart(2, '0');
    const hours = String(wibHours).padStart(2, '0');
    const minutes = String(utcMinutes).padStart(2, '0');
    const seconds = String(utcSeconds).padStart(2, '0');
    const milliseconds = String(utcMilliseconds).padStart(3, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+07:00`;
}

/**
 * Convert database date to WIB and return as ISO string
 * This handles the case where database stores time in WIB but returns as UTC
 * @param {Date|string} date - Date from database
 * @returns {string|null} ISO string in WIB timezone
 */
export function convertDBDateToWIB(date) {
    if (!date) return null;
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    // If date is already in correct timezone, just format it
    // Otherwise, assume it's UTC and convert to WIB
    return formatToWIBISO(d);
}

/**
 * Serialize object with date fields converted to WIB
 * @param {Object} obj - Object to serialize
 * @param {string[]} dateFields - Array of field names that contain dates
 * @returns {Object} Object with date fields converted to WIB ISO strings
 */
export function serializeDatesToWIB(obj, dateFields = ['realdatetime', 'created_at', 'updated_at', 'tanggal', 'date']) {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
        return obj.map(item => serializeDatesToWIB(item, dateFields));
    }
    
    const result = { ...obj };
    
    for (const field of dateFields) {
        if (result[field] && (result[field] instanceof Date || typeof result[field] === 'string')) {
            result[field] = convertDBDateToWIB(result[field]);
        }
    }
    
    return result;
}

/**
 * Convert WIB date string to UTC Date object
 * @param {string} wibDateString - Date string in WIB format
 * @returns {Date|null} Date object in UTC
 */
export function convertWIBToUTC(wibDateString) {
    if (!wibDateString) return null;
    
    // Parse WIB date string (YYYY-MM-DDTHH:mm:ss+07:00)
    const dateStr = wibDateString.replace('+07:00', '').replace('+0700', '');
    const d = new Date(dateStr);
    
    if (isNaN(d.getTime())) return null;
    
    // Subtract 7 hours to convert to UTC
    return new Date(d.getTime() - (7 * 60 * 60 * 1000));
}
