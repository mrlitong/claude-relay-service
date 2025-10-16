#!/usr/bin/env node

/**
 * Redis测试环境验证脚本
 * 确保Redis配置安全且适合测试使用
 */

const redis = require('ioredis');
const chalk = require('chalk');

async function verifyRedisTestEnvironment() {
  console.log(chalk.blue('🔍 验证Redis测试环境...\n'));

  const results = {
    connection: false,
    localOnly: false,
    testDb: false,
    performance: false
  };

  // 1. 测试连接
  console.log(chalk.yellow('1. 测试Redis连接...'));
  const client = new redis({
    host: '127.0.0.1',
    port: 6379,
    db: 15, // 测试数据库
    retryStrategy: () => null
  });

  try {
    const pong = await client.ping();
    if (pong === 'PONG') {
      results.connection = true;
      console.log(chalk.green('   ✅ Redis连接成功\n'));
    }
  } catch (error) {
    console.log(chalk.red('   ❌ Redis连接失败:', error.message, '\n'));
    process.exit(1);
  }

  // 2. 验证只监听本地地址
  console.log(chalk.yellow('2. 验证安全配置...'));
  try {
    const configGet = await client.config('GET', 'bind');
    const bindAddresses = configGet[1];

    if (bindAddresses && (bindAddresses.includes('127.0.0.1') || bindAddresses.includes('localhost'))) {
      results.localOnly = true;
      console.log(chalk.green('   ✅ Redis仅绑定到本地地址:', bindAddresses));
    } else {
      console.log(chalk.yellow('   ⚠️  无法验证bind配置，请手动确认'));
    }

    const protectedMode = await client.config('GET', 'protected-mode');
    if (protectedMode[1] === 'yes') {
      console.log(chalk.green('   ✅ 保护模式已启用'));
    } else {
      console.log(chalk.yellow('   ⚠️  保护模式未启用'));
    }
  } catch (error) {
    // CONFIG命令可能被禁用，这是正常的
    console.log(chalk.yellow('   ⚠️  无法读取配置（CONFIG命令可能被禁用）'));
    console.log(chalk.green('   ✅ 这通常意味着Redis配置更安全'));
  }
  console.log();

  // 3. 测试数据库隔离
  console.log(chalk.yellow('3. 测试数据库隔离...'));
  try {
    // 切换到测试数据库
    await client.select(15);

    // 测试写入和读取
    const testKey = 'test:verification:' + Date.now();
    await client.set(testKey, 'test_value', 'EX', 10);
    const value = await client.get(testKey);

    if (value === 'test_value') {
      results.testDb = true;
      console.log(chalk.green('   ✅ 测试数据库(DB 15)可用'));

      // 清理测试数据
      await client.del(testKey);
    }
  } catch (error) {
    console.log(chalk.red('   ❌ 测试数据库操作失败:', error.message));
  }
  console.log();

  // 4. 性能测试
  console.log(chalk.yellow('4. 性能测试...'));
  const startTime = Date.now();
  const operations = 100;

  try {
    for (let i = 0; i < operations; i++) {
      await client.ping();
    }
    const duration = Date.now() - startTime;
    const avgTime = duration / operations;

    if (avgTime < 10) {
      results.performance = true;
      console.log(chalk.green(`   ✅ 性能良好 (平均响应时间: ${avgTime.toFixed(2)}ms)`));
    } else {
      console.log(chalk.yellow(`   ⚠️  性能一般 (平均响应时间: ${avgTime.toFixed(2)}ms)`));
    }
  } catch (error) {
    console.log(chalk.red('   ❌ 性能测试失败:', error.message));
  }
  console.log();

  // 5. 显示Redis信息
  console.log(chalk.yellow('5. Redis服务器信息...'));
  try {
    const info = await client.info('server');
    const lines = info.split('\n');
    const version = lines.find(l => l.startsWith('redis_version:'));
    const mode = lines.find(l => l.startsWith('redis_mode:'));

    if (version) console.log(chalk.cyan('   ' + version));
    if (mode) console.log(chalk.cyan('   ' + mode));

    // 检查内存使用
    const memInfo = await client.info('memory');
    const memLines = memInfo.split('\n');
    const usedMemory = memLines.find(l => l.startsWith('used_memory_human:'));
    if (usedMemory) console.log(chalk.cyan('   ' + usedMemory));
  } catch (error) {
    console.log(chalk.yellow('   ⚠️  无法获取服务器信息'));
  }
  console.log();

  // 断开连接
  await client.disconnect();

  // 总结
  console.log(chalk.blue('📊 验证结果总结：'));
  console.log(chalk.white('────────────────────────────'));

  const allPassed = Object.values(results).every(v => v === true);

  if (allPassed) {
    console.log(chalk.green.bold('✅ Redis测试环境完全就绪！'));
    console.log(chalk.green('   - 连接正常'));
    console.log(chalk.green('   - 安全配置正确'));
    console.log(chalk.green('   - 测试数据库可用'));
    console.log(chalk.green('   - 性能良好'));
  } else {
    console.log(chalk.yellow.bold('⚠️  Redis测试环境部分就绪'));
    console.log(results.connection ? chalk.green('   ✅ 连接正常') : chalk.red('   ❌ 连接失败'));
    console.log(results.localOnly ? chalk.green('   ✅ 仅本地访问') : chalk.yellow('   ⚠️  安全配置未验证'));
    console.log(results.testDb ? chalk.green('   ✅ 测试数据库可用') : chalk.red('   ❌ 测试数据库不可用'));
    console.log(results.performance ? chalk.green('   ✅ 性能良好') : chalk.yellow('   ⚠️  性能一般'));
  }

  console.log(chalk.white('────────────────────────────'));
  console.log(chalk.gray('\n💡 提示：'));
  console.log(chalk.gray('   - Redis使用DB 15作为测试数据库'));
  console.log(chalk.gray('   - 确保.env中设置 REDIS_TEST_DB=15'));
  console.log(chalk.gray('   - 运行测试: npm test'));

  process.exit(allPassed ? 0 : 1);
}

// 运行验证
verifyRedisTestEnvironment().catch(error => {
  console.error(chalk.red('验证失败:'), error);
  process.exit(1);
});