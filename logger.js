const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

// Define custom log format
const myFormat = winston.format.printf(({ level, message, timestamp, spanId, traceId, httpRequest }) => {
  // Map Winston severity to Cloud Logging severity

  const logObject = {
    severity: level.toUpperCase(), // Use mapped severity or default to upper case
    message: message,
    timestamp: timestamp,
    "logging.googleapis.com/insertId": uuidv4(), // Generate unique insert ID using UUID
    "logging.googleapis.com/spanId": spanId,
    "logging.googleapis.com/trace": traceId,
    "logging.googleapis.com/trace_sampled": true // Assuming trace is always sampled
  };

  // Add HTTP request details if available
  if (httpRequest) {
    logObject["httpRequest"] = httpRequest;
  }

  return JSON.stringify(logObject);
});

// Create a custom Winston transport for structured logging
const structuredLogger = winston.createLogger({
  level: 'debug', // Default logging level
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
  },
  //levels: winston.config.syslog.levels, // Use syslog levels to ensure compatibility with Cloud Logging
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DDTHH:mm:ss.SSSZZ' // Format to match the Ops Agent's expected timestamp format
    }),
    winston.format.json(), // Ensure logs are output in JSON format
    winston.format.splat(), // Interpolate variables in message
    myFormat // Apply custom log format
  ),
  transports: [
    new winston.transports.File({ filename: '/var/log/csye6225-combined.log' }), // Log file path
  ],
});

// If not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  structuredLogger.add(new winston.transports.Console());
}

module.exports = structuredLogger;
