#!/usr/bin/env node

/**
 * 初始化测试环境脚本
 * 创建测试目录结构和示例测试文件
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// 测试目录结构
const testDirs = [
  '__tests__',
  '__tests__/unit',
  '__tests__/unit/services',
  '__tests__/unit/utils',
  '__tests__/unit/middleware',
  '__tests__/integration',
  '__tests__/integration/api',
  '__tests__/integration/workflows',
  '__tests__/fixtures',
  '__tests__/helpers'
];

// 创建目录
console.log(chalk.blue('🔧 初始化测试环境...'));

testDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(chalk.green(`✅ 创建目录: ${dir}`));
  } else {
    console.log(chalk.gray(`⏭️  目录已存在: ${dir}`));
  }
});

// 创建测试辅助文件
const testHelperContent = `/**
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
      name: \`Test Account \${Date.now()}\`,
      type,
      status: 'active',
      createdAt: new Date().toISOString()
    };
  }

  static user() {
    const id = crypto.randomUUID();
    return {
      id,
      email: \`test.\${id.substring(0, 8)}@example.com\`,
      username: \`testuser_\${Date.now()}\`,
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
`;

const helperPath = path.join(process.cwd(), '__tests__/helpers/testUtils.js');
if (!fs.existsSync(helperPath)) {
  fs.writeFileSync(helperPath, testHelperContent);
  console.log(chalk.green('✅ 创建测试辅助文件: __tests__/helpers/testUtils.js'));
} else {
  console.log(chalk.gray('⏭️  测试辅助文件已存在'));
}

// 创建示例fixture
const fixtureContent = `{
  "testApiKeys": [
    {
      "id": "test-key-1",
      "key": "cr_test_1234567890",
      "name": "Test API Key 1",
      "status": "active",
      "rateLimit": 100,
      "permissions": "all"
    },
    {
      "id": "test-key-2",
      "key": "cr_test_0987654321",
      "name": "Test API Key 2",
      "status": "active",
      "rateLimit": 50,
      "permissions": "claude"
    }
  ],
  "testAccounts": [
    {
      "id": "test-account-1",
      "name": "Test Claude Account",
      "type": "claude-official",
      "status": "active",
      "accessToken": "test_access_token",
      "refreshToken": "test_refresh_token"
    },
    {
      "id": "test-account-2",
      "name": "Test Gemini Account",
      "type": "gemini",
      "status": "active",
      "apiKey": "test_gemini_key"
    }
  ],
  "testUsers": [
    {
      "id": "test-user-1",
      "email": "test1@example.com",
      "username": "testuser1",
      "password": "$2a$10$test_hashed_password"
    }
  ]
}
`;

const fixturePath = path.join(process.cwd(), '__tests__/fixtures/testData.json');
if (!fs.existsSync(fixturePath)) {
  fs.writeFileSync(fixturePath, fixtureContent);
  console.log(chalk.green('✅ 创建测试数据fixture: __tests__/fixtures/testData.json'));
} else {
  console.log(chalk.gray('⏭️  测试数据fixture已存在'));
}

// 创建第一个示例单元测试
const sampleUnitTestContent = `/**
 * API Key Service 单元测试示例
 */

const { describe, test, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const apiKeyService = require('@services/apiKeyService');
const redis = require('@models/redis');
const { TestDataGenerator, createRedisMock } = require('../../helpers/testUtils');

// Mock Redis
jest.mock('@models/redis', () => createRedisMock());

describe('ApiKeyService', () => {
  beforeEach(() => {
    // 重置所有 mocks
    jest.clearAllMocks();
  });

  describe('createApiKey', () => {
    test('应该创建带有默认值的API Key', async () => {
      // Arrange
      const mockApiKeyData = {
        name: 'Test API Key',
        userId: 'user123'
      };

      // 配置 mock 返回值
      redis.hset.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');

      // Act
      const result = await apiKeyService.create(mockApiKeyData);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('key');
      expect(result.key).toMatch(/^cr_/);
      expect(result.name).toBe(mockApiKeyData.name);
      expect(redis.hset).toHaveBeenCalled();
    });

    test('应该在缺少name时抛出错误', async () => {
      // Arrange
      const invalidData = { userId: 'user123' };

      // Act & Assert
      await expect(apiKeyService.create(invalidData))
        .rejects
        .toThrow('Name is required');
    });

    test('应该正确设置自定义速率限制', async () => {
      // Arrange
      const mockData = {
        name: 'Test Key',
        userId: 'user123',
        rateLimit: 200
      };

      redis.hset.mockResolvedValue(1);

      // Act
      const result = await apiKeyService.create(mockData);

      // Assert
      expect(result.rateLimit).toBe(200);
      expect(redis.hset).toHaveBeenCalledWith(
        expect.stringContaining('api_key:'),
        expect.objectContaining({
          rateLimit: 200
        })
      );
    });
  });

  describe('validateApiKey', () => {
    test('应该验证有效的API Key', async () => {
      // Arrange
      const testKey = TestDataGenerator.apiKey();
      redis.get.mockResolvedValue(\`api_key:test123\`);
      redis.hgetall.mockResolvedValue({
        id: 'test123',
        key: testKey,
        status: 'active',
        rateLimit: 100
      });

      // Act
      const result = await apiKeyService.validate(testKey);

      // Assert
      expect(result).toBeTruthy();
      expect(result.status).toBe('active');
    });

    test('应该拒绝无效的API Key', async () => {
      // Arrange
      redis.get.mockResolvedValue(null);

      // Act
      const result = await apiKeyService.validate('invalid_key');

      // Assert
      expect(result).toBeFalsy();
    });
  });
});
`;

const sampleTestPath = path.join(process.cwd(), '__tests__/unit/services/apiKeyService.test.js');
if (!fs.existsSync(sampleTestPath)) {
  fs.writeFileSync(sampleTestPath, sampleUnitTestContent);
  console.log(chalk.green('✅ 创建示例单元测试: __tests__/unit/services/apiKeyService.test.js'));
} else {
  console.log(chalk.gray('⏭️  示例单元测试已存在'));
}

// 创建示例集成测试
const sampleIntegrationTestContent = `/**
 * Claude API 集成测试示例
 */

const request = require('supertest');
const { describe, test, expect, beforeAll, afterAll, jest } = require('@jest/globals');
const app = require('@/app');
const redis = require('@models/redis');
const { TestDataGenerator } = require('../../helpers/testUtils');

describe('Claude API Integration', () => {
  let server;
  let apiKey;

  beforeAll(async () => {
    // 启动测试服务器
    server = app.listen(0); // 使用随机端口

    // 创建测试 API Key
    apiKey = TestDataGenerator.apiKey();
    await redis.hset(\`api_key:test1\`, {
      id: 'test1',
      key: apiKey,
      status: 'active',
      rateLimit: 100,
      permissions: 'claude'
    });
  });

  afterAll(async () => {
    // 清理测试数据
    await redis.del('api_key:test1');

    // 关闭服务器
    server.close();
  });

  describe('POST /api/v1/messages', () => {
    test('应该在没有API Key时返回401', async () => {
      // Act
      const response = await request(server)
        .post('/api/v1/messages')
        .send({
          model: 'claude-3-opus-20240229',
          messages: [{ role: 'user', content: 'Hello' }]
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('API key');
    });

    test('应该使用有效的API Key处理消息', async () => {
      // Mock 账户服务响应
      jest.spyOn(require('@services/claudeAccountService'), 'getNextAvailableAccount')
        .mockResolvedValue({
          id: 'test-account',
          name: 'Test Account',
          status: 'active',
          accessToken: 'test_token'
        });

      // Act
      const response = await request(server)
        .post('/api/v1/messages')
        .set('x-api-key', apiKey)
        .set('content-type', 'application/json')
        .send({
          model: 'claude-3-opus-20240229',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 100
        });

      // Assert - 注意：实际响应取决于mock的配置
      expect(response.status).toBeLessThan(500); // 不应该是服务器错误
      expect(response.headers).toHaveProperty('x-request-id');
    });

    test('应该正确处理速率限制', async () => {
      // 这里可以测试速率限制逻辑
      // 需要mock rateLimitService
    });
  });

  describe('GET /api/v1/models', () => {
    test('应该返回可用模型列表', async () => {
      // Act
      const response = await request(server)
        .get('/api/v1/models')
        .set('x-api-key', apiKey);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
`;

const integrationTestPath = path.join(process.cwd(), '__tests__/integration/api/claude.test.js');
if (!fs.existsSync(integrationTestPath)) {
  fs.writeFileSync(integrationTestPath, sampleIntegrationTestContent);
  console.log(chalk.green('✅ 创建示例集成测试: __tests__/integration/api/claude.test.js'));
} else {
  console.log(chalk.gray('⏭️  示例集成测试已存在'));
}

// 创建 GitHub Actions 测试工作流
const githubWorkflowContent = `name: Tests

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint:check

      - name: Run tests
        run: npm run test:ci
        env:
          NODE_ENV: test
          REDIS_HOST: localhost
          REDIS_PORT: 6379
          REDIS_TEST_DB: 15
          JWT_SECRET: test_jwt_secret_for_ci
          ENCRYPTION_KEY: 12345678901234567890123456789012

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        if: always()
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false
          verbose: true

      - name: Check coverage thresholds
        run: npx jest --coverage --coverageThreshold='{"global":{"branches":25,"functions":25,"lines":25,"statements":25}}'
`;

const workflowDir = path.join(process.cwd(), '.github/workflows');
if (!fs.existsSync(workflowDir)) {
  fs.mkdirSync(workflowDir, { recursive: true });
}

const workflowPath = path.join(workflowDir, 'test.yml');
if (!fs.existsSync(workflowPath)) {
  fs.writeFileSync(workflowPath, githubWorkflowContent);
  console.log(chalk.green('✅ 创建GitHub Actions测试工作流: .github/workflows/test.yml'));
} else {
  console.log(chalk.gray('⏭️  GitHub Actions测试工作流已存在'));
}

// 完成提示
console.log(chalk.green('\n✨ 测试环境初始化完成！\n'));
console.log(chalk.yellow('下一步：'));
console.log(chalk.white('1. 安装额外的测试依赖（可选）:'));
console.log(chalk.gray('   npm install --save-dev @jest/globals jest-extended jest-mock-extended @babel/preset-env babel-jest'));
console.log(chalk.white('\n2. 运行示例测试:'));
console.log(chalk.gray('   npm test'));
console.log(chalk.white('\n3. 查看测试覆盖率:'));
console.log(chalk.gray('   npm run test:coverage'));
console.log(chalk.white('\n4. 开始编写你的测试:'));
console.log(chalk.gray('   参考 __tests__/unit/services/apiKeyService.test.js'));
console.log(chalk.gray('   和 __tests__/integration/api/claude.test.js'));

console.log(chalk.blue('\n📚 查看 TEST_SOP.md 了解完整的测试规范和最佳实践。'));