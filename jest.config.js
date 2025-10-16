/**
 * Jest 测试配置文件
 * @see https://jestjs.io/docs/configuration
 */

module.exports = {
  // 测试环境
  testEnvironment: 'node',

  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js'
  ],

  // 忽略路径
  testPathIgnorePatterns: [
    '/node_modules/',
    '/web/',
    '/logs/',
    '/data/',
    '/coverage/',
    '/.git/'
  ],

  // 覆盖率收集范围
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/index.js',
    '!src/**/*.index.js',
    '!src/cli/**',
    '!src/**/*.config.js'
  ],

  // 覆盖率报告
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // 覆盖率阈值（初期设置较低，逐步提高）
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 25,
      lines: 25,
      statements: 25
    }
  },

  // Setup 文件
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // 超时设置
  testTimeout: 15000,

  // 详细输出
  verbose: true,

  // 模块路径映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@config/(.*)$': '<rootDir>/config/$1'
  },

  // 测试结果缓存
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // 错误时停止
  bail: false,

  // 最大并发数
  maxWorkers: '50%',

  // 清理 mocks
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,

  // 收集详细的时间信息
  collectCoverage: false, // 默认关闭，通过 --coverage 参数开启

  // Node.js 18+ 原生支持现代 JS 特性，不需要转换
  transform: {},

  // 全局变量
  globals: {
    __DEV__: true,
    __TEST__: true
  }
};