/**
 * Structured Logging System
 * 
 * @fileoverview Provides a standardized logging abstraction with level gating,
 * environment-based configuration, safe metadata serialization, and file-based persistence.
 * Replaces direct console.* usage throughout the codebase.
 * 
 * @module lib/logging/logger
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires fs Node.js filesystem module for log file writes
 * @requires path Node.js path module for log file path resolution
 * 
 * @description
 * Logging system with five levels (DEBUG, MESSAGE, WARNING, ERROR, SILENT).
 * Automatically detects context (test, build, session) and writes to appropriate
 * log files in .logs/ directory. Supports scoped loggers for module-specific context,
 * safe serialization of complex objects with circular reference detection, and
 * environment-based configuration via IKUISUUS_LOG_LEVEL and NODE_ENV.
 * 
 * Features:
 * - Level-based filtering (DEBUG < MESSAGE < WARNING < ERROR < SILENT)
 * - File-based persistence (.logs/test-logs.log, build-logs.log, session-logs.log)
 * - Scoped loggers with inherited metadata
 * - Circular reference detection
 * - Browser-safe (file writes disabled in browser environments)
 * - Silent error handling (never crashes due to failed log writes)
 * 
 * @example
 * // Basic usage
 * import { logger } from '@/lib/logging/logger';
 * logger.message('User action completed', { userId: 123 });
 * 
 * @example
 * // Scoped logger
 * const log = logger.child({ module: 'EncounterPlanner' });
 * log.debug('Processing combat round', { round: 5 });
 * 
 * @example
 * // Error logging with metadata
 * logger.error('Database connection failed', {
 *   error: err.message,
 *   retryCount: 3,
 *   lastAttempt: new Date().toISOString()
 * });
 */

/**
 * Log levels in ascending order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  MESSAGE = 1,
  WARNING = 2,
  ERROR = 3,
  SILENT = 4,
}

/**
 * Configuration options for logger
 * @interface LoggerConfig
 * @property {LogLevel} minLevel - Minimum level to output
 * @property {boolean} useStderrForErrors - Route errors/warnings to stderr
 * @property {Record<string, any>} [scope] - Metadata to include in all logs
 * @property {string} [logFilePath] - Path to log file (optional)
 */
interface LoggerConfig {
  minLevel: LogLevel;
  useStderrForErrors: boolean;
  scope?: Record<string, any>;
}

/**
 * Metadata object for structured logging
 */
type LogMetadata = Record<string, any>;

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
function safeSerialize(value: any, depth: number = 0, seen: WeakSet<any> = new WeakSet()): any {
  // Depth limit
  if (depth > MAX_DEPTH) {
    return '[Max Depth Reached]';
  }

  // Null/undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Primitives
  const type = typeof value;
  if (type === 'string') {
    return value.length > MAX_STRING_LENGTH
      ? `${value.substring(0, MAX_STRING_LENGTH)}... (truncated)`
      : value;
  }
  if (type === 'number' || type === 'boolean') {
    return value;
  }

  // Functions
  if (type === 'function') {
    return `[Function: ${value.name || 'anonymous'}]`;
  }

  // Circular reference detection
  if (type === 'object') {
    if (seen.has(value)) {
      return '[Circular Reference]';
    }
    seen.add(value);

    // Arrays
    if (Array.isArray(value)) {
      const serialized = value
        .slice(0, MAX_ARRAY_ELEMENTS)
        .map(item => safeSerialize(item, depth + 1, seen));
      
      if (value.length > MAX_ARRAY_ELEMENTS) {
        serialized.push(`... (${value.length - MAX_ARRAY_ELEMENTS} more items)`);
      }
      return serialized;
    }

    // Objects
    const result: Record<string, any> = {};
    const keys = Object.keys(value).slice(0, 20); // Limit keys
    
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
 * @param {LogMetadata} meta - Metadata object
 * @returns {string} Formatted metadata string
 */
function formatMetadata(meta: LogMetadata): string {
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
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Detect the logging context based on environment and process
 * 
 * @returns {string} Log file name (build-logs, test-logs, or session-logs)
 */
function detectLogContext(): string {
  // Check if running tests
  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
    return 'test-logs';
  }
  
  // Check if building (next build)
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    return 'build-logs';
  }
  
  // Default to session (dev server)
  return 'session-logs';
}

/**
 * Ensure .logs directory exists and return log file path
 * 
 * @returns {string | null} Path to log file, or null if running in browser
 */
// function getLogFilePath(): string | null {
//   // Only create log files in Node.js environment
//   if (typeof window !== 'undefined') {
//     return null; // Browser environment
//   }
  
//   try {
//     const logsDir = path.join(process.cwd(), '.logs');
    
//     // Create .logs directory if it doesn't exist
//     if (!fs.existsSync(logsDir)) {
//       fs.mkdirSync(logsDir, { recursive: true });
//     }
    
//     const context = detectLogContext();
//     return path.join(logsDir, `${context}.log`);
//   } catch (error) {
//     // If we can't create the log file, just return null and log to console only
//     return null;
//   }
// }

/**
 * Logger class providing structured logging with level gating
 * 
 * @class Logger
 */
class Logger {
  private config: LoggerConfig;

  /**
   * Create a Logger instance
   * 
   * @param {Partial<LoggerConfig>} config - Configuration options
   */
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      minLevel: this.getDefaultMinLevel(),
      useStderrForErrors: false,
      ...config,
    };
  }

  /**
   * Determine default minimum log level based on environment
   * 
   * @private
   * @returns {LogLevel} Default minimum level
   */
  private getDefaultMinLevel(): LogLevel {
    // Explicit log level from env
    const logLevelEnv = process.env.IKUISUUS_LOG_LEVEL || process.env.LOG_LEVEL;
    if (logLevelEnv) {
      const level = logLevelEnv.toUpperCase();
      if (level === 'DEBUG') return LogLevel.DEBUG;
      if (level === 'MESSAGE' || level === 'INFO') return LogLevel.MESSAGE;
      if (level === 'WARNING' || level === 'WARN') return LogLevel.WARNING;
      if (level === 'ERROR') return LogLevel.ERROR;
      if (level === 'SILENT') return LogLevel.SILENT;
    }

    // Debug mode override
    if (process.env.IKUISUUS_DEBUG_LOGS === 'true') {
      return LogLevel.DEBUG;
    }

    // Environment-based defaults
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'test') {
      return LogLevel.WARNING; // Tests should be quiet
    }
    if (nodeEnv === 'production') {
      return LogLevel.MESSAGE;
    }

    // Development default
    return LogLevel.MESSAGE;
  }

  /**
   * Check if a log level should be emitted
   * 
   * @private
   * @param {LogLevel} level - Log level to check
   * @returns {boolean} True if level meets minimum threshold
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.minLevel;
  }

  /**
   * Emit a log message
   * 
   * @private
   * @param {LogLevel} level - Log level
   * @param {string} message - Log message
   * @param {LogMetadata} [meta] - Optional metadata
   */
  private emit(level: LogLevel, message: string, meta?: LogMetadata): void {
    if (!this.shouldLog(level)) {
      return;
    }

    // Merge scope metadata if present
    const fullMeta = this.config.scope
      ? { ...this.config.scope, ...meta }
      : meta;

    const timestamp = getTimestamp();
    const levelName = LogLevel[level];
    const metaString = fullMeta ? formatMetadata(fullMeta) : '';
    const formattedMessage = `[${timestamp}] [${levelName}] ${message}${metaString}`;

    // TODO: Send logs to API route (POST /api/logs) for server-side persistence
    // See file-level TODO comment for implementation details

    // Route to appropriate output
    if (this.config.useStderrForErrors && (level === LogLevel.ERROR || level === LogLevel.WARNING)) {
      console.error(formattedMessage);
    } else {
      // Use console methods for styling but all to stdout by default
      if (level === LogLevel.ERROR) {
        console.log(formattedMessage); // Intentionally log, not error
      } else if (level === LogLevel.WARNING) {
        console.log(formattedMessage); // Intentionally log, not warn
      } else if (level === LogLevel.DEBUG) {
        console.log(formattedMessage);
      } else {
        console.log(formattedMessage);
      }
    }
  }

  /**
   * Log debug message (only emitted if debug mode enabled)
   * 
   * @param {string} message - Debug message
   * @param {LogMetadata} [meta] - Optional metadata
   * 
   * @example
   * logger.debug('Processing item', { itemId: 42, step: 'validation' });
   */
  debug(message: string, meta?: LogMetadata): void {
    this.emit(LogLevel.DEBUG, message, meta);
  }

  /**
   * Log informational message (expected operational messages)
   * 
   * @param {string} message - Info message
   * @param {LogMetadata} [meta] - Optional metadata
   * 
   * @example
   * logger.message('Metadata generated', { fileCount: 48, duration: '50ms' });
   */
  message(message: string, meta?: LogMetadata): void {
    this.emit(LogLevel.MESSAGE, message, meta);
  }

  /**
   * Log warning message
   * 
   * @param {string} message - Warning message
   * @param {LogMetadata} [meta] - Optional metadata
   * 
   * @example
   * logger.warning('Deprecated API used', { api: 'oldMethod', replacement: 'newMethod' });
   */
  warning(message: string, meta?: LogMetadata): void {
    this.emit(LogLevel.WARNING, message, meta);
  }

  /**
   * Log error message
   * 
   * @param {string} message - Error message
   * @param {LogMetadata} [meta] - Optional metadata
   * 
   * @example
   * logger.error('Failed to load data', { error: err.message, path: '/api/monsters' });
   */
  error(message: string, meta?: LogMetadata): void {
    this.emit(LogLevel.ERROR, message, meta);
  }

  /**
   * Create a child logger with scoped metadata
   * 
   * @param {LogMetadata} scope - Metadata to include in all child logs
   * @returns {Logger} New logger instance with scope
   * 
   * @example
   * const log = logger.child({ module: 'MonsterGenerator' });
   * log.message('Processing file', { file: 'albedo.sheet.mdx' });
   * // Output: [timestamp] [MESSAGE] Processing file [module=MonsterGenerator file=albedo.sheet.mdx]
   */
  child(scope: LogMetadata): Logger {
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
   * @returns {LogLevel} Current minimum level
   */
  getMinLevel(): LogLevel {
    return this.config.minLevel;
  }

  /**
   * Set minimum log level
   * 
   * @param {LogLevel} level - New minimum level
   */
  setMinLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  /**
   * Enable stderr routing for errors/warnings
   */
  enableStderrForErrors(): void {
    this.config.useStderrForErrors = true;
  }

  /**
   * Disable stderr routing (all logs to stdout)
   */
  disableStderrForErrors(): void {
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
 * @param {LogMetadata} scope - Metadata to include in all logs
 * @returns {Logger} New logger instance with scope
 * 
 * @example
 * const log = createLogger({ module: 'SpellGenerator' });
 * log.message('Parsing spell', { spell: 'fireball' });
 */
export function createLogger(scope: LogMetadata): Logger {
  return logger.child(scope);
}

/**
 * Export LogLevel enum for consumers
 */
export { LogLevel as Level };
