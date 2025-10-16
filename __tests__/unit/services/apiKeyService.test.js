/**
 * API Key Service 单元测试
 * 基于实际的apiKeyService接口
 */

// Mock必须在require之前声明
jest.mock('@models/redis');
jest.mock('@utils/logger');

const apiKeyService = require('@services/apiKeyService');
const redis = require('@models/redis');

describe('ApiKeyService', () => {
  beforeEach(() => {
    // 重置所有 mock
    jest.clearAllMocks();

    // 配置 Redis mock的基本行为
    redis.client = {
      keys: jest.fn().mockResolvedValue([]),
      hgetall: jest.fn().mockResolvedValue({}),
      hset: jest.fn().mockResolvedValue(1),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1)
    };
    redis.isConnected = true;
    redis.setApiKey = jest.fn().mockResolvedValue(true);
    redis.getApiKey = jest.fn().mockResolvedValue(null);
    redis.getAllApiKeys = jest.fn().mockResolvedValue([]);
    redis.findApiKeyByHash = jest.fn().mockResolvedValue(null);
    redis.getUsageStats = jest.fn().mockResolvedValue({});
    redis.getDailyCost = jest.fn().mockResolvedValue(0);
    redis.getCostStats = jest.fn().mockResolvedValue({ total: 0 });
    redis.getWeeklyOpusCost = jest.fn().mockResolvedValue(0);
    redis.getClientSafe = jest.fn(() => redis.client);
  });

  describe('generateApiKey', () => {
    test('应该生成带有默认值的API Key', async () => {
      // Act
      const result = await apiKeyService.generateApiKey({
        name: 'Test API Key'
      });

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('apiKey');
      expect(result.apiKey).toMatch(/^cr_/);
      expect(result.name).toBe('Test API Key');
      expect(redis.setApiKey).toHaveBeenCalled();
    });

    test('应该支持自定义速率限制', async () => {
      // Act
      const result = await apiKeyService.generateApiKey({
        name: 'Limited Key',
        rateLimitRequests: 100,
        rateLimitWindow: 60
      });

      // Assert
      expect(result.rateLimitRequests).toBe(100);
      expect(result.rateLimitWindow).toBe(60);
    });

    test('应该生成UUID作为Key ID', async () => {
      // Act
      const result = await apiKeyService.generateApiKey({
        name: 'UUID Test'
      });

      // Assert - UUID格式
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('validateApiKey', () => {
    test('应该拒绝无效格式的API Key', async () => {
      // Act
      const result = await apiKeyService.validateApiKey('invalid_key');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid API key format');
    });

    test('应该拒绝不存在的API Key', async () => {
      // Arrange
      redis.findApiKeyByHash.mockResolvedValue(null);

      // Act
      const result = await apiKeyService.validateApiKey('cr_test_key_12345');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('应该验证有效的API Key', async () => {
      // Arrange
      const mockKeyData = {
        id: 'test-key-id',
        name: 'Test Key',
        isActive: 'true',
        tokenLimit: '10000',
        expiresAt: '',
        permissions: 'all',
        enableModelRestriction: 'false',
        enableClientRestriction: 'false',
        restrictedModels: '[]',
        allowedClients: '[]',
        tags: '[]',
        concurrencyLimit: '0',
        rateLimitWindow: '0',
        rateLimitRequests: '0',
        rateLimitCost: '0',
        dailyCostLimit: '0',
        totalCostLimit: '0',
        weeklyOpusCostLimit: '0',
        expirationMode: 'fixed',
        isActivated: 'true'
      };

      redis.findApiKeyByHash.mockResolvedValue(mockKeyData);
      redis.getUsageStats.mockResolvedValue({ total: { requests: 10 } });

      // Act
      const result = await apiKeyService.validateApiKey('cr_valid_key_123');

      // Assert
      expect(result.valid).toBe(true);
      expect(result.keyData).toBeDefined();
      expect(result.keyData.id).toBe('test-key-id');
      expect(result.keyData.name).toBe('Test Key');
    });

    test('应该拒绝已禁用的API Key', async () => {
      // Arrange
      const mockKeyData = {
        id: 'disabled-key',
        name: 'Disabled Key',
        isActive: 'false'
      };

      redis.findApiKeyByHash.mockResolvedValue(mockKeyData);

      // Act
      const result = await apiKeyService.validateApiKey('cr_disabled_key');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('disabled');
    });

    test('应该拒绝已过期的API Key', async () => {
      // Arrange
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // 昨天
      const mockKeyData = {
        id: 'expired-key',
        name: 'Expired Key',
        isActive: 'true',
        expiresAt: pastDate,
        permissions: 'all',
        enableModelRestriction: 'false',
        enableClientRestriction: 'false',
        restrictedModels: '[]',
        allowedClients: '[]',
        tags: '[]',
        concurrencyLimit: '0',
        rateLimitWindow: '0',
        rateLimitRequests: '0',
        rateLimitCost: '0',
        dailyCostLimit: '0',
        totalCostLimit: '0',
        weeklyOpusCostLimit: '0',
        expirationMode: 'fixed',
        isActivated: 'true'
      };

      redis.findApiKeyByHash.mockResolvedValue(mockKeyData);

      // Act
      const result = await apiKeyService.validateApiKey('cr_expired_key');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  describe('getAllApiKeys', () => {
    test('应该返回所有API Keys', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key1',
          name: 'Key 1',
          isDeleted: 'false',
          tokenLimit: '0',
          concurrencyLimit: '0',
          rateLimitWindow: '0',
          rateLimitRequests: '0',
          rateLimitCost: '0'
        },
        {
          id: 'key2',
          name: 'Key 2',
          isDeleted: 'false',
          tokenLimit: '0',
          concurrencyLimit: '0',
          rateLimitWindow: '0',
          rateLimitRequests: '0',
          rateLimitCost: '0'
        }
      ];

      redis.getAllApiKeys.mockResolvedValue(mockKeys);
      redis.getUsageStats.mockResolvedValue({});
      redis.getCostStats.mockResolvedValue({ total: 0 });
      redis.getDailyCost.mockResolvedValue(0);
      redis.getWeeklyOpusCost.mockResolvedValue(0);
      redis.getConcurrency = jest.fn().mockResolvedValue(0);

      // Act
      const result = await apiKeyService.getAllApiKeys();

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    test('应该过滤掉已删除的API Keys', async () => {
      // Arrange
      const mockKeys = [
        { id: 'key1', name: 'Key 1', isDeleted: 'false' },
        { id: 'key2', name: 'Key 2', isDeleted: 'true' },
        { id: 'key3', name: 'Key 3', isDeleted: 'false' }
      ];

      redis.getAllApiKeys.mockResolvedValue(mockKeys);
      redis.getUsageStats.mockResolvedValue({});
      redis.getCostStats.mockResolvedValue({ total: 0 });
      redis.getDailyCost.mockResolvedValue(0);
      redis.getWeeklyOpusCost.mockResolvedValue(0);
      redis.getConcurrency = jest.fn().mockResolvedValue(0);

      // Act
      const result = await apiKeyService.getAllApiKeys(false);

      // Assert
      expect(result.length).toBe(2);
      expect(result.every(key => key.isDeleted !== 'true')).toBe(true);
    });
  });

  describe('updateApiKey', () => {
    test('应该更新API Key的名称', async () => {
      // Arrange
      const existingKey = {
        id: 'test-key',
        name: 'Old Name',
        tokenLimit: '0',
        isActive: 'true'
      };

      redis.getApiKey.mockResolvedValue(existingKey);

      // Act
      const result = await apiKeyService.updateApiKey('test-key', {
        name: 'New Name'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(redis.setApiKey).toHaveBeenCalled();
    });

    test('应该在Key不存在时抛出错误', async () => {
      // Arrange
      redis.getApiKey.mockResolvedValue(null);

      // Act & Assert
      await expect(
        apiKeyService.updateApiKey('non-existent', { name: 'New' })
      ).rejects.toThrow('API key not found');
    });
  });
});