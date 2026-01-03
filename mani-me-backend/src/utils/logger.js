// Simple logger utility
module.exports = function log(message, meta) {
  console.log(`[LOG] ${new Date().toISOString()} - ${message}`, meta || '');
};
