import pino from "pino";
import pretty from "pino-pretty";

const isProd = process.env.NODE_ENV === "production";
const level = process.env.LOG_LEVEL || "info";

// Use a direct stream instead of transport workers so logs stay visible
// in packaged/sidecar runtimes where transport workers can be unreliable.
const stream = isProd
  ? process.stdout
  : pretty({
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    });

const logger = pino({ level }, stream);

export default logger;
