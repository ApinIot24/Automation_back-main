import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Function to log errors to file
export const logErrorToFile = (error, context = '') => {
  const timestamp = new Date().toISOString();
  const logFile = path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`);
  
  const logEntry = {
    timestamp,
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
      ...error
    },
    context
  };
  
  const logText = `[${timestamp}] ${context ? `[${context}] ` : ''}${error.message}\n${error.stack}\n\n`;
  
  fs.appendFile(logFile, logText, (err) => {
    if (err) console.error('Failed to write to log file:', err);
  });
  
  // Also log to console
  console.error(logText);
};

// Function to log database connection errors specifically
export const logDatabaseError = (error, operation = 'database_operation') => {
  const context = {
    operation,
    timestamp: new Date().toISOString(),
    errorCode: error.code,
    address: error.address,
    port: error.port
  };
  
  logErrorToFile(error, `Database operation: ${operation}`);
  
  // Special handling for connection refused errors
  if (error.code === 'ECONNREFUSED') {
    logErrorToFile(new Error('Database connection failed - please check if PostgreSQL is running'), 'Connection Check');
  }
};

// Function to log general information
export const logInfo = (message, context = 'info') => {
  const timestamp = new Date().toISOString();
  const logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);
  
  const logText = `[${timestamp}] [${context}] ${message}\n`;
  
  fs.appendFile(logFile, logText, (err) => {
    if (err) console.error('Failed to write to log file:', err);
  });
  
  // Also log to console
  console.log(logText);
};