/**
 * Node.js Logger for Scripts
 * 
 * @fileoverview Logging module for Node.js scripts (metadata generators, build scripts).
 * Provides the same API as src/lib/logging/logger.ts but for CommonJS/ESM scripts.
 * Includes file-based logging for build and metadata generation processes.
 * 
 * @module scripts/core/logger
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires fs Node.js filesystem module for log file writes
 * @requires path Node.js path module for log file path resolution
 * @requires url fileURLToPath for ESM __dirname emulation
 * 
 * @description
 * ESM-compatible logger for use in build scripts and metadata generators.
 * Automatically writes logs to .logs/build-logs.log for all script-based operations.
 * 
 * Features:
 * - Same API as TypeScript logger for consistency
 * - Automatic context detection (metadata generation, asset compression, etc.)
 * - File persistence in .logs/build-logs.log
 * - Safe metadata serialization with circular reference handling
 * - No dependencies on TypeScript or Next.js runtime
 * 
 * @example
 * // In a metadata generator
 * import { createLogger } from './core/logger.mjs';
 * const logger = createLogger({ scope: { script: 'generateMonsterMetadata' } });
 * logger.message('Processing monsters', { count: 48 });
 * 
 * @example
 * // Error handling
 * logger.error('Failed to parse file', { file: filePath, error: err.message });
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Log levels in ascending order of severity
 */
export const LogLevel = {
  DEBUG: 0,
  MESSAGE: 1,
  WARNING: 2,
  ERROR: 3,
  SILENT: 4,
};

/**
 * Maximum depth for object serialization
 */
const MAX_DEPTH = 3;

/**
 * Maximum string length before truncation
 */
const MAX_STRING_LENGTH = 200;

/**
 * Maximum array elements to show
 */
const MAX_ARRAY_ELEMENTS = 5;

/**
 * Safely serialize metadata with circular reference handling and truncation
 * 
 * @param {any} value - Value to serialize
 * @param {number} depth - Current depth in object tree
 * @param {WeakSet<any>} seen - Set of already-seen objects (circular detection)
 * @returns {any} Serialized value safe for JSON output
 */
function safeSerialize(value, depth = 0, seen = new WeakSet()) {
  if (depth > MAX_DEPTH) {
    return '[Max Depth Reached]';
  }

  if (value === null || value === undefined) {
    return value;
  }

  const type = typeof value;
  if (type === 'string') {
    return value.length > MAX_STRING_LENGTH
      ? `${value.substring(0, MAX_STRING_LENGTH)}... (truncated)`
      : value;
  }
  if (type === 'number' || type === 'boolean') {
    return value;
  }

  if (type === 'function') {
    return `[Function: ${value.name || 'anonymous'}]`;
  }

  if (type === 'object') {
    if (seen.has(value)) {
      return '[Circular Reference]';
    }
    seen.add(value);

    if (Array.isArray(value)) {
      const serialized = value
        .slice(0, MAX_ARRAY_ELEMENTS)
        .map(item => safeSerialize(item, depth + 1, seen));
      
      if (value.length > MAX_ARRAY_ELEMENTS) {
        serialized.push(`... (${value.length - MAX_ARRAY_ELEMENTS} more items)`);
      }
      return serialized;
    }

    const result = {};
    const keys = Object.keys(value).slice(0, 20);
    
    for (const key of keys) {
      try {
        result[key] = safeSerialize(value[key], depth + 1, seen);
      } catch (err) {
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
 * Format metadata as compact single-line string
 * 
 * @param {Record<string, any>} meta - Metadata object
 * @returns {string} Formatted metadata string
 */
function formatMetadata(meta) {
  const safe = safeSerialize(meta);
  const entries = Object.entries(safe)
    .map(([key, value]) => {
      const stringValue = typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
      return `${key}=${stringValue}`;
    });
  
  return entries.length > 0 ? ` [${entries.join(' ')}]` : '';
}

/**
 * Get timestamp prefix for logs
 * 
 * @returns {string} ISO timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Detect the logging context based on environment and process
 * 
 * @returns {string} Log file name (build-logs, test-logs, or session-logs)
 */
function detectLogContext() {
  // Check script name
  const scriptName = process.argv[1] || '';
  
  // Metadata generators
  if (scriptName.includes('generateMetadata') || scriptName.includes('Metadata.mjs')) {
    return 'build-logs';
  }
  
  // Build scripts
  if (scriptName.includes('compress') || scriptName.includes('kebabify') || scriptName.includes('mdToMdx')) {
    return 'build-logs';
  }
  
  // Default to build logs for scripts
  return 'build-logs';
}

/**
 * Ensure .logs directory exists and return log file path
 * 
 * @returns {string | null} Path to log file
 */
function getLogFilePath() {
  try {
    const projectRoot = path.resolve(__dirname, '..', '..');
    const logsDir = path.join(projectRoot, '.logs');
    
    // Create .logs directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const context = detectLogContext();
    return path.join(logsDir, `${context}.log`);
  } catch (error) {
    return null;
  }
}

/**
 * Logger class providing structured logging with level gating
 * 
 * @class Logger
 */
class Logger {
  /**
   * Create a Logger instance
   * 
   * @param {object} config - Configuration options
   * @param {number} config.minLevel - Minimum level to output
   * @param {boolean} config.useStderrForErrors - Route errors/warnings to stderr
   * @param {Record<string, any>} config.scope - Metadata to include in all logs
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
   * Determine default minimum log level based on environment
   * 
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

    if (process.env.IKUISUUS_DEBUG_LOGS === 'true') {
      return LogLevel.DEBUG;
    }

    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'test') {
      return LogLevel.WARNING;
    }
    if (nodeEnv === 'production') {
      return LogLevel.MESSAGE;
    }

    return LogLevel.MESSAGE;
  }

  /**
   * Check if a log level should be emitted
   * 
   * @private
   * @param {number} level - Log level to check
   * @returns {boolean} True if level meets minimum threshold
   */
  _shouldLog(level) {
    return level >= this.config.minLevel;
  }

  /**
   * Emit a log message
   * 
   * @private
   * @param {number} level - Log level
   * @param {string} message - Log message
   * @param {Record<string, any>} [meta] - Optional metadata
   */
  _emit(level, message, meta) {
    if (!this._shouldLog(level)) {
      return;
    }

    const fullMeta = this.config.scope
      ? { ...this.config.scope, ...meta }
      : meta;

    const timestamp = getTimestamp();
    const levelNames = ['DEBUG', 'MESSAGE', 'WARNING', 'ERROR', 'SILENT'];
    const levelName = levelNames[level] || 'UNKNOWN';
    const metaString = fullMeta ? formatMetadata(fullMeta) : '';
    const formattedMessage = `[${timestamp}] [${levelName}] ${message}${metaString}`;

    // Console output
    if (this.config.useStderrForErrors && (level === LogLevel.ERROR || level === LogLevel.WARNING)) {
      console.error(formattedMessage);
    } else {
      console.log(formattedMessage);
    }

    // File output
    if (this.config.logFilePath) {
      try {
        fs.appendFileSync(this.config.logFilePath, formattedMessage + '\n', 'utf8');
      } catch (error) {
        // Silently fail file writes - don't crash the app if we can't write logs
      }
    }
  }

  /**
   * Log debug message (only emitted if debug mode enabled)
   * 
   * @param {string} message - Debug message
   * @param {Record<string, any>} [meta] - Optional metadata
   */
  debug(message, meta) {
    this._emit(LogLevel.DEBUG, message, meta);
  }

  /**
   * Log informational message (expected operational messages)
   * 
   * @param {string} message - Info message
   * @param {Record<string, any>} [meta] - Optional metadata
   */
  message(message, meta) {
    this._emit(LogLevel.MESSAGE, message, meta);
  }

  /**
   * Log warning message
   * 
   * @param {string} message - Warning message
   * @param {Record<string, any>} [meta] - Optional metadata
   */
  warning(message, meta) {
    this._emit(LogLevel.WARNING, message, meta);
  }

  /**
   * Log error message
   * 
   * @param {string} message - Error message
   * @param {Record<string, any>} [meta] - Optional metadata
   */
  error(message, meta) {
    this._emit(LogLevel.ERROR, message, meta);
  }

  /**
   * Create a child logger with scoped metadata
   * 
   * @param {Record<string, any>} scope - Metadata to include in all child logs
   * @returns {Logger} New logger instance with scope
   */
  child(scope) {
    return new Logger({
      ...this.config,
      scope: {
        ...this.config.scope,
        ...scope,
      },
    });
  }

  /**
   * Get current minimum log level
   * 
   * @returns {number} Current minimum level
   */
  getMinLevel() {
    return this.config.minLevel;
  }

  /**
   * Set minimum log level
   * 
   * @param {number} level - New minimum level
   */
  setMinLevel(level) {
    this.config.minLevel = level;
  }

  /**
   * Enable stderr routing for errors/warnings
   */
  enableStderrForErrors() {
    this.config.useStderrForErrors = true;
  }

  /**
   * Disable stderr routing (all logs to stdout)
   */
  disableStderrForErrors() {
    this.config.useStderrForErrors = false;
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a scoped logger
 * 
 * @param {Record<string, any>} scope - Metadata to include in all logs
 * @returns {Logger} New logger instance with scope
 */
export function createLogger(scope) {
  return logger.child(scope);
}
