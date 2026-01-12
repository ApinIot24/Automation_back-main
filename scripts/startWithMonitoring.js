import { startDatabaseMonitoring } from '../utils/databaseMonitor.js';
import { logInfo } from '../config/logger.js';

// Start monitoring databases
logInfo('Starting application with database monitoring', 'app_startup');
const monitorInterval = startDatabaseMonitoring(5); // Check every 5 minutes

// Handle process termination
process.on('SIGINT', () => {
  logInfo('Shutting down application', 'app_shutdown');
  clearInterval(monitorInterval);
  process.exit(0);
});

process.on('SIGTERM', () => {
  logInfo('Shutting down application', 'app_shutdown');
  clearInterval(monitorInterval);
  process.exit(0);
});

// Export for potential use in main server file
export { monitorInterval };