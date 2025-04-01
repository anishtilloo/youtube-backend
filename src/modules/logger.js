import { config } from '../config/default.js';
import fs from 'fs/promises';
import { EOL } from 'os';

const LogLevel = {
    DEBUG : "DEBUG",
    INFO : "INFO",
    WARN : "WARN",
    ERROR : "ERROR",
    FATAL : "FATAL"
}

class Logger {
    colors = {
        [LogLevel.DEBUG]: "\x1b[36m", // Cyan
        [LogLevel.INFO]: "\x1b[32m",  // Green
        [LogLevel.WARN]: "\x1b[33m",  // Yellow
        [LogLevel.ERROR]: "\x1b[31m", // Red
        [LogLevel.FATAL]: "\x1b[35m"  // Magenta
    };

    resetColor = "\x1b[0m"; // Reset
    timestampColor = "\x1b[90m"; // Gray

    shouldLog(level) {
        const priority = {
            [LogLevel.DEBUG]: 1,
            [LogLevel.INFO]: 2,
            [LogLevel.WARN]: 3,
            [LogLevel.ERROR]: 4,
            [LogLevel.FATAL]: 5
        };

        if (!config.enableLogs && priority[level] < 4) {
            return false;
        }
        return true;
    }

    log(level, message, ...optionalParams) {
        if (this.shouldLog(level)) {
            const timestamp = new Date().toISOString();
            const color = this.colors[level];
            if (config.storeLogs) {
                fs.appendFile('app.log', JSON.stringify(`[${timestamp}] [${level}] ${message} ${optionalParams}`).trim());
                fs.appendFile('app.log', EOL);
            }
            console.log(`${this.timestampColor}[${timestamp}] ${color}[${level}]${this.resetColor}`, message, ...optionalParams);
        }
    }

    debug(message, ...optionalParams) {
        this.log(LogLevel.DEBUG, message, ...optionalParams);
    }

    info(message, ...optionalParams) {
        this.log(LogLevel.INFO, message, ...optionalParams);
    }

    warn(message, ...optionalParams) {
        this.log(LogLevel.WARN, message, ...optionalParams);
    }

    error(message, ...optionalParams) {
        this.log(LogLevel.ERROR, message, ...optionalParams);
    }

    fatal(message, ...optionalParams) {
        this.log(LogLevel.FATAL, message, ...optionalParams);
    }
}

export const logger = new Logger();
