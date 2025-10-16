/**
 * 测试辅助工具
 */

const crypto = require('crypto');

/**
 * 测试数据生成器
 */
class TestDataGenerator {
  static apiKey(prefix = 'cr_test_') {
    return prefix + crypto.randomBytes(16).toString('hex');
  }

  static account(type = 'claude-official') {
    return {
      id: crypto.randomUUID(),
      name: `Test Account ${Date.now()}`,
      type,
      status: 'active',
      createdAt: new Date().toISOString()
    };
  }

  static user() {
    const id = crypto.randomUUID();
    return {
      id,
      email: `test.${id.substring(0, 8)}@example.com`,
      username: `testuser_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
  }

  static message() {
    return {
      role: 'user',
      content: 'Test message content'
    };
  }
}

/**
 * Mock 工具集
 */
const createRedisMock = () => ({
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  isReady: jest.fn().mockReturnValue(true),
  select: jest.fn().mockResolvedValue('OK'),
  get: jest.fn(),
  set: jest.fn().mockResolvedValue('OK'),
  hget: jest.fn(),
  hset: jest.fn().mockResolvedValue(1),
  hgetall: jest.fn(),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(-1),
  flushdb: jest.fn().mockResolvedValue('OK'),
  keys: jest.fn().mockResolvedValue([]),
  scan: jest.fn().mockResolvedValue(['0', []])
});

const createRequestMock = (overrides = {}) => ({
  headers: {},
  body: {},
  params: {},
  query: {},
  get: jest.fn((header) => {
    if (header.toLowerCase() === 'x-api-key') {
      return overrides.apiKey || 'cr_test_key';
    }
    return null;
  }),
  ...overrides
});

const createResponseMock = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    write: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis()
  };
  return res;
};

const createNextMock = () => jest.fn();

module.exports = {
  TestDataGenerator,
  createRedisMock,
  createRequestMock,
  createResponseMock,
  createNextMock
};
