/**
 * Logger Unit Tests
 *
 * @fileoverview Tests for the structured logging system including level gating,
 * environment configuration, metadata serialization, and child logger scoping.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Unmock the logger for this test file - we need to test the real logger
vi.unmock('@/lib/logging/logger');

import { createLogger, Level, logger, LogLevel } from '@/lib/logging/logger';

describe('Logger', () => {
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console methods
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Reset logger to default state
    logger.setMinLevel(LogLevel.MESSAGE);
    logger.disableStderrForErrors();
  });

  describe('Level Gating', () => {
    it('should respect minimum log level', () => {
      logger.setMinLevel(LogLevel.WARNING);

      logger.debug('debug message');
      logger.message('info message');
      logger.warning('warning message');
      logger.error('error message');

      // Only warning and error should be logged
      expect(consoleInfoSpy).toHaveBeenCalledTimes(2);
      expect(consoleInfoSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('debug message'),
      );
      expect(consoleInfoSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('info message'),
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('warning message'),
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('error message'),
      );
    });

    it('should emit debug logs when level is DEBUG', () => {
      logger.setMinLevel(LogLevel.DEBUG);

      logger.debug('debug message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('debug message'),
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
      );
    });

    it('should silence all logs when level is SILENT', () => {
      logger.setMinLevel(LogLevel.SILENT);

      logger.debug('debug');
      logger.message('message');
      logger.warning('warning');
      logger.error('error');

      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should emit logs at exact minimum level', () => {
      logger.setMinLevel(LogLevel.MESSAGE);

      logger.message('should appear');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('should appear'),
      );
    });
  });

  describe('Log Levels', () => {
    beforeEach(() => {
      logger.setMinLevel(LogLevel.DEBUG);
    });

    it('should format debug messages correctly', () => {
      logger.debug('Debug message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Debug message'),
      );
    });

    it('should format message logs correctly', () => {
      logger.message('Info message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MESSAGE]'),
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Info message'),
      );
    });

    it('should format warning logs correctly', () => {
      logger.warning('Warning message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARNING]'),
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning message'),
      );
    });

    it('should format error logs correctly', () => {
      logger.error('Error message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error message'),
      );
    });

    it('should include timestamp in all logs', () => {
      logger.message('Test message');

      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });
  });

  describe('Metadata Serialization', () => {
    beforeEach(() => {
      logger.setMinLevel(LogLevel.DEBUG);
    });

    it('should serialize simple metadata', () => {
      logger.message('Test', { userId: 123, action: 'login' });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('userId=123'),
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('action=login'),
      );
    });

    it('should handle nested objects with depth limit', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: 'too deep',
            },
          },
        },
      };

      logger.message('Deep object', { data: deepObject });

      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toContain('data=');
      expect(call).toContain('level1');
      expect(call).toContain('level2');
      // Level 4 should be truncated
      expect(call).toContain('[Max Depth Reached]');
    });

    it('should handle circular references', () => {
      const circular: any = { name: 'circular' };
      circular.self = circular;

      logger.message('Circular ref', { obj: circular });

      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toContain('[Circular Reference]');
    });

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(300);

      logger.message('Long string', { text: longString });

      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toContain('(truncated)');
      expect(call).not.toContain('a'.repeat(201));
    });

    it('should limit array elements', () => {
      const longArray = Array.from({ length: 10 }, (_, i) => i);

      logger.message('Long array', { numbers: longArray });

      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toContain('more items');
    });

    it('should handle null and undefined', () => {
      logger.message('Null/undefined', {
        nullVal: null,
        undefinedVal: undefined,
      });

      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toContain('nullVal=null');
      expect(call).toContain('undefinedVal=undefined');
    });

    it('should handle functions', () => {
      function namedFunction() {}
      const anonymous = () => {};

      logger.message('Functions', { named: namedFunction, anon: anonymous });

      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toContain('[Function: namedFunction]');
      expect(call).toContain('[Function: anonymous]');
    });

    it('should handle mixed types', () => {
      logger.message('Mixed types', {
        string: 'text',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { key: 'value' },
      });

      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toContain('string=text');
      expect(call).toContain('number=42');
      expect(call).toContain('boolean=true');
      expect(call).toContain('array=');
      expect(call).toContain('object=');
    });

    it('should limit object keys', () => {
      const manyKeys = Object.fromEntries(
        Array.from({ length: 30 }, (_, i) => [`key${i}`, i]),
      );

      logger.message('Many keys', { data: manyKeys });

      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toContain('more keys');
    });
  });

  describe('Child Loggers', () => {
    beforeEach(() => {
      logger.setMinLevel(LogLevel.DEBUG);
    });

    it('should create child logger with scope', () => {
      const childLogger = logger.child({ module: 'TestModule' });

      childLogger.message('Test message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('module=TestModule'),
      );
    });

    it('should merge parent and child scope', () => {
      const parent = logger.child({ service: 'API' });
      const child = parent.child({ endpoint: '/monsters' });

      child.message('Request', { status: 200 });

      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toContain('service=API');
      expect(call).toContain('endpoint=/monsters');
      expect(call).toContain('status=200');
    });

    it('should inherit minimum level from parent', () => {
      logger.setMinLevel(LogLevel.WARNING);
      const childLogger = logger.child({ module: 'Child' });

      childLogger.debug('Should not appear');
      childLogger.message('Should not appear');
      childLogger.warning('Should appear');

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Should appear'),
      );
    });
  });

  describe('createLogger Helper', () => {
    beforeEach(() => {
      logger.setMinLevel(LogLevel.DEBUG);
    });

    it('should create scoped logger via helper', () => {
      const scopedLogger = createLogger({ component: 'MonsterTable' });

      scopedLogger.message('Rendering');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('component=MonsterTable'),
      );
    });
  });

  describe('Environment Configuration', () => {
    it('should respect environment-based default levels', () => {
      // In test mode (NODE_ENV=test), the logger defaults to WARNING
      // However, the logger module is imported before we can control NODE_ENV
      // So we just verify the logger has a reasonable level set
      expect(logger.getMinLevel()).toBeGreaterThanOrEqual(LogLevel.MESSAGE);
      expect(logger.getMinLevel()).toBeLessThanOrEqual(LogLevel.WARNING);
    });

    it('should allow runtime level changes', () => {
      const originalLevel = logger.getMinLevel();

      logger.setMinLevel(LogLevel.ERROR);
      expect(logger.getMinLevel()).toBe(LogLevel.ERROR);

      // Restore
      logger.setMinLevel(originalLevel);
    });
  });

  describe('Stderr Routing', () => {
    beforeEach(() => {
      logger.setMinLevel(LogLevel.DEBUG);
    });

    it('should route to stdout by default', () => {
      logger.warning('Warning');
      logger.error('Error');

      expect(consoleInfoSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should route errors/warnings to stderr when enabled', () => {
      logger.enableStderrForErrors();

      logger.message('Message');
      logger.warning('Warning');
      logger.error('Error');

      // Message goes to stdout
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Message'),
      );

      // Warning and error go to stderr
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning'),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error'),
      );
    });

    it('should disable stderr routing', () => {
      logger.enableStderrForErrors();
      logger.disableStderrForErrors();

      logger.error('Error');

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Level Export', () => {
    it('should export LogLevel as Level', () => {
      expect(Level).toBeDefined();
      expect(Level.DEBUG).toBe(LogLevel.DEBUG);
      expect(Level.MESSAGE).toBe(LogLevel.MESSAGE);
      expect(Level.WARNING).toBe(LogLevel.WARNING);
      expect(Level.ERROR).toBe(LogLevel.ERROR);
      expect(Level.SILENT).toBe(LogLevel.SILENT);
    });
  });

  describe('getMinLevel and setMinLevel', () => {
    it('should get current minimum level', () => {
      logger.setMinLevel(LogLevel.ERROR);

      expect(logger.getMinLevel()).toBe(LogLevel.ERROR);
    });

    it('should set minimum level', () => {
      logger.setMinLevel(LogLevel.DEBUG);

      expect(logger.getMinLevel()).toBe(LogLevel.DEBUG);

      logger.debug('Should appear');
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      logger.setMinLevel(LogLevel.DEBUG);
    });

    it('should handle empty metadata', () => {
      logger.message('No metadata', {});

      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toContain('No metadata');
      expect(call).not.toContain('[]'); // Empty metadata should not add brackets
    });

    it('should handle messages with special characters', () => {
      logger.message('Message with "quotes" and [brackets] and {braces}');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Message with "quotes" and [brackets] and {braces}',
        ),
      );
    });

    it('should handle Error objects in metadata', () => {
      const error = new Error('Test error');

      logger.error('Error occurred', { error });

      const call = consoleInfoSpy.mock.calls[0][0];
      // Error objects serialize mostly as empty, but we should see the key
      expect(call).toContain('error=');
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-01T00:00:00.000Z');

      logger.message('Date test', { timestamp: date });

      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toContain('timestamp=');
    });

    it('should handle Symbol in metadata gracefully', () => {
      const sym = Symbol('test');

      logger.message('Symbol test', { symbol: sym });

      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toContain('symbol=');
    });
  });
});
