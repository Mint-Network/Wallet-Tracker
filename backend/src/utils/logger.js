// Use a simple console logger for packaged builds to avoid pkg/pino issues
// pkg has trouble bundling pino's native dependencies
const isPkg = typeof process.pkg !== 'undefined';

let logger;

if (isPkg) {
  // Simple console logger for packaged builds
  const formatMsg = (msg, level) => {
    const timestamp = new Date().toISOString();
    if (typeof msg === 'object') {
      return `[${timestamp}] [${level}] ${JSON.stringify(msg)}`;
    }
    return `[${timestamp}] [${level}] ${msg}`;
  };
  
  logger = {
    info: (msg, ...args) => {
      const formatted = formatMsg(msg, 'INFO');
      if (args.length > 0) {
        console.log(formatted, ...args);
      } else {
        console.log(formatted);
      }
    },
    error: (msg, ...args) => {
      const formatted = formatMsg(msg, 'ERROR');
      if (args.length > 0) {
        console.error(formatted, ...args);
      } else {
        console.error(formatted);
      }
    },
    warn: (msg, ...args) => {
      const formatted = formatMsg(msg, 'WARN');
      if (args.length > 0) {
        console.warn(formatted, ...args);
      } else {
        console.warn(formatted);
      }
    },
    debug: (msg, ...args) => {
      const formatted = formatMsg(msg, 'DEBUG');
      if (args.length > 0) {
        console.log(formatted, ...args);
      } else {
        console.log(formatted);
      }
    },
  };
} else {
  // Use pino for development - use dynamic import to avoid bundling issues
  try {
    const pino = require("pino");
    const pretty = require("pino-pretty");
    
    const isProd = process.env.NODE_ENV === "production";
    const level = process.env.LOG_LEVEL || "info";

    const stream = isProd
      ? process.stdout
      : pretty({
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        });

    logger = pino({ level }, stream);
  } catch (e) {
    // Fallback to console logger if pino fails to load
    console.warn("Failed to load pino, using console logger:", e.message);
    const formatMsg = (msg, level) => {
      const timestamp = new Date().toISOString();
      if (typeof msg === 'object') {
        return `[${timestamp}] [${level}] ${JSON.stringify(msg)}`;
      }
      return `[${timestamp}] [${level}] ${msg}`;
    };
    logger = {
      info: (msg, ...args) => console.log(formatMsg(msg, 'INFO'), ...args),
      error: (msg, ...args) => console.error(formatMsg(msg, 'ERROR'), ...args),
      warn: (msg, ...args) => console.warn(formatMsg(msg, 'WARN'), ...args),
      debug: (msg, ...args) => console.log(formatMsg(msg, 'DEBUG'), ...args),
    };
  }
}

export default logger;
