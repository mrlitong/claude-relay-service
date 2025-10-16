/**
 * Jest 全局测试设置
 * 在每个测试文件执行前运行
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // 测试时减少日志输出
process.env.REDIS_TEST_DB = process.env.REDIS_TEST_DB || '15'; // 使用独立的测试数据库

// 扩展 Jest matchers (如果安装了 jest-extended)
try {
  require('jest-extended');
} catch (e) {
  // jest-extended 是可选的
}

// 全局超时设置
jest.setTimeout(10000);

// Mock 常用的外部服务
jest.mock('./src/utils/logger', () => {
  const originalLogger = jest.requireActual('./src/utils/logger');
  return {
    ...originalLogger,
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    // 保留 createLogger 用于测试
    createLogger: originalLogger.createLogger
  };
});

// Mock 外部 HTTP 请求（如果需要）
jest.mock('axios');

// 全局 Mock console 方法（可选，减少测试输出）
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Redis 连接管理
// 注意：在单元测试中，Redis 通常会被 mock
// 只有集成测试才需要真实的 Redis 连接

// 全局 setup 和 teardown
beforeAll(async () => {
  // 单元测试通常不需要真实的 Redis 连接
  // 集成测试可以在各自的测试文件中处理连接
});

afterAll(async () => {
  // 清理工作
  // 如果有真实的 Redis 连接，可以在这里断开
});

// 每个测试前后的钩子
beforeEach(() => {
  // 清理所有 mock 调用记录
  jest.clearAllMocks();
});

afterEach(() => {
  // 可以在这里添加每个测试后的清理逻辑
});

// 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in test:', reason);
});

// 自定义 Jest Matchers（可选）
expect.extend({
  toBeValidApiKey(received) {
    const pass = typeof received === 'string' && received.startsWith('cr_');
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid API key`
          : `expected ${received} to be a valid API key (should start with 'cr_')`
    };
  },

  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid UUID`
          : `expected ${received} to be a valid UUID`
    };
  }
});