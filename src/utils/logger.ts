import * as log from 'loglevel';

// Set the default log level.
// During development, you might want to set this to log.levels.DEBUG or log.levels.TRACE.
// For production, log.levels.WARN or log.levels.ERROR would be more appropriate.
// This can also be configured based on an environment variable.
const currentLogLevel = process.env.NODE_ENV === 'development' ? log.levels.DEBUG : log.levels.WARN;
log.setLevel(currentLogLevel);

// You can customize the prefix for log messages if desired
// For example, to include a timestamp or the log level in the message
const originalFactory = log.methodFactory;
log.methodFactory = (methodName, logLevel, loggerName) => {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);
  return (message, ...args) => {
    rawMethod(`[${methodName.toUpperCase()}] ${new Date().toISOString()} - ${message}`, ...args);
  };
};
// Re-apply the level after overriding methodFactory (important)
log.setLevel(currentLogLevel);


export default log;
