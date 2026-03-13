/**
 * CommonJS Logger Wrapper
 *
 * @fileoverview Thin CJS re-export of the ESM logger for use in `.js` scripts
 * that cannot use `import` syntax. Provides the same `createLogger` / `logger`
 * API surface as `logger.mjs`.
 *
 * @module scripts/core/logger-cjs
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @description
 * CJS scripts call:
 *   const { createLogger } = require('./core/logger.cjs');
 *   const log = createLogger({ scope: { script: 'myScript' } });
 *
 * Internally this mirrors the Logger class from logger.mjs without pulling in
 * ESM-only dependencies (url/fileURLToPath). File-based persistence works the
 * same way — logs are appended to `.logs/build-logs.log`.
 *
 * @example
 * const { createLogger } = require('../core/logger.cjs');
 * const log = createLogger({ scope: { script: 'compressAssets' } });
 * log.message('Compressing images', { count: 42 });
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Log levels in ascending order of severity
 *
 * @enum {number}
 * @property {number} DEBUG   - 0 — verbose development output
 * @property {number} MESSAGE - 1 — normal operational messages
 * @property {number} WARNING - 2 — recoverable problems
 * @property {number} ERROR   - 3 — failures
 * @property {number} SILENT  - 4 — suppress all output
 */
const LogLevel = {
  DEBUG: 0,
  MESSAGE: 1,
  WARNING: 2,
  ERROR: 3,
  SILENT: 4,
};

/** @type {number} */
const MAX_DEPTH = 3;

/** @type {number} */
const MAX_STRING_LENGTH = 200;

/** @type {number} */
const MAX_ARRAY_ELEMENTS = 5;

/**
 * Safely serialize a value with circular-reference and depth guards
 *
 * @param {any} value - Value to serialize
 * @param {number} [depth=0] - Current recursion depth
 * @param {WeakSet<object>} [seen] - Already-visited objects
 * @returns {any} JSON-safe representation
 */
function safeSerialize(value, depth = 0, seen = new WeakSet()) {
  if (depth > MAX_DEPTH) return '[Max Depth Reached]';
  if (value === null || value === undefined) return value;

  const type = typeof value;
  if (type === 'string') {
    return value.length > MAX_STRING_LENGTH
      ? `${value.substring(0, MAX_STRING_LENGTH)}... (truncated)`
      : value;
  }
  if (type === 'number' || type === 'boolean') return value;
  if (type === 'function') return `[Function: ${value.name || 'anonymous'}]`;

  if (type === 'object') {
    if (seen.has(value)) return '[Circular Reference]';
    seen.add(value);

    if (Array.isArray(value)) {
      const serialized = value
        .slice(0, MAX_ARRAY_ELEMENTS)
        .map((item) => safeSerialize(item, depth + 1, seen));
      if (value.length > MAX_ARRAY_ELEMENTS) {
        serialized.push(
          `... (${value.length - MAX_ARRAY_ELEMENTS} more items)`,
        );
      }
      return serialized;
    }

    const result = {};
    const keys = Object.keys(value).slice(0, 20);
    for (const key of keys) {
      try {
        result[key] = safeSerialize(value[key], depth + 1, seen);
      } catch (_err) {
        result[key] = '[Serialization Error]';
      }
    }
    if (Object.keys(value).length > 20) {
      result['...'] = `(${Object.keys(value).length - 20} more keys)`;
    }
    return result;
  }

  return String(value);
}

/**
 * Format metadata as a compact single-line string
 *
 * @param {Record<string, any>} meta - Metadata object
 * @returns {string} Formatted string such as ` [key=value key2=value2]`
 */
function formatMetadata(meta) {
  const safe = safeSerialize(meta);
  const entries = Object.entries(safe).map(([key, value]) => {
    const stringValue =
      typeof value === 'object' ? JSON.stringify(value) : String(value);
    return `${key}=${stringValue}`;
  });
  return entries.length > 0 ? ` [${entries.join(' ')}]` : '';
}

/**
 * @returns {string} ISO-8601 timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Ensure `.logs/` exists and return the target log file path
 *
 * @returns {string|null} Absolute path to the log file, or null on failure
 */
function getLogFilePath() {
  try {
    const projectRoot = path.resolve(__dirname, '..', '..');
    const logsDir = path.join(projectRoot, '.logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    return path.join(logsDir, 'build-logs.log');
  } catch (_err) {
    return null;
  }
}

/**
 * Logger class — mirrors `Logger` from `logger.mjs`
 *
 * @class Logger
 */
class Logger {
  /**
   * @param {object} [config] - Configuration
   * @param {number} [config.minLevel] - Minimum log level
   * @param {boolean} [config.useStderrForErrors] - Route errors to stderr
   * @param {Record<string, any>} [config.scope] - Metadata included in every log line
   */
  constructor(config = {}) {
    this.config = {
      minLevel: this._getDefaultMinLevel(),
      useStderrForErrors: false,
      logFilePath: getLogFilePath() || undefined,
      ...config,
    };
  }

  /**
   * @private
   * @returns {number} Default minimum level
   */
  _getDefaultMinLevel() {
    const logLevelEnv = process.env.IKUISUUS_LOG_LEVEL || process.env.LOG_LEVEL;
    if (logLevelEnv) {
      const level = logLevelEnv.toUpperCase();
      if (level === 'DEBUG') return LogLevel.DEBUG;
      if (level === 'MESSAGE' || level === 'INFO') return LogLevel.MESSAGE;
      if (level === 'WARNING' || level === 'WARN') return LogLevel.WARNING;
      if (level === 'ERROR') return LogLevel.ERROR;
      if (level === 'SILENT') return LogLevel.SILENT;
    }
    if (process.env.IKUISUUS_DEBUG_LOGS === 'true') return LogLevel.DEBUG;
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'test') return LogLevel.WARNING;
    if (nodeEnv === 'production') return LogLevel.MESSAGE;
    return LogLevel.MESSAGE;
  }

  /**
   * @private
   * @param {number} level - Level to test
   * @returns {boolean} Whether the level passes the minimum threshold
   */
  _shouldLog(level) {
    return level >= this.config.minLevel;
  }

  /**
   * @private
   * @param {number} level - Log level
   * @param {string} message - Human-readable message
   * @param {Record<string, any>} [meta] - Structured metadata
   */
  _emit(level, message, meta) {
    if (!this._shouldLog(level)) return;

    const fullMeta = this.config.scope
      ? { ...this.config.scope, ...meta }
      : meta;

    const timestamp = getTimestamp();
    const levelNames = ['DEBUG', 'MESSAGE', 'WARNING', 'ERROR', 'SILENT'];
    const levelName = levelNames[level] || 'UNKNOWN';
    const metaString = fullMeta ? formatMetadata(fullMeta) : '';
    const formattedMessage = `[${timestamp}] [${levelName}] ${message}${metaString}`;

    if (
      this.config.useStderrForErrors &&
      (level === LogLevel.ERROR || level === LogLevel.WARNING)
    ) {
      console.error(formattedMessage);
    } else {
      console.log(formattedMessage);
    }

    if (this.config.logFilePath) {
      try {
        fs.appendFileSync(
          this.config.logFilePath,
          formattedMessage + '\n',
          'utf8',
        );
      } catch (_err) {
        /* swallow — never crash on log write failure */
      }
    }
  }

  /**
   * @param {string} message - Debug message
   * @param {Record<string, any>} [meta] - Metadata
   */
  debug(message, meta) {
    this._emit(LogLevel.DEBUG, message, meta);
  }

  /**
   * @param {string} message - Info message
   * @param {Record<string, any>} [meta] - Metadata
   */
  message(message, meta) {
    this._emit(LogLevel.MESSAGE, message, meta);
  }

  /**
   * @param {string} message - Warning message
   * @param {Record<string, any>} [meta] - Metadata
   */
  warning(message, meta) {
    this._emit(LogLevel.WARNING, message, meta);
  }

  /**
   * @param {string} message - Error message
   * @param {Record<string, any>} [meta] - Metadata
   */
  error(message, meta) {
    this._emit(LogLevel.ERROR, message, meta);
  }

  /**
   * Create a child logger with additional scoped metadata
   *
   * @param {Record<string, any>} scope - Extra metadata
   * @returns {Logger} Child logger instance
   */
  child(scope) {
    return new Logger({
      ...this.config,
      scope: { ...this.config.scope, ...scope },
    });
  }
}

/** @type {Logger} */
const logger = new Logger();

/**
 * Create a scoped logger
 *
 * @param {Record<string, any>} scope - Metadata for every log line
 * @returns {Logger} Scoped logger instance
 */
function createLogger(scope) {
  return logger.child(scope);
}

module.exports = { Logger, LogLevel, logger, createLogger };
