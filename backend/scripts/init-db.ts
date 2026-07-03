/**
 * 一键数据库初始化脚本
 *
 * 流程：
 *   0. 检测后端是否正在运行（占用 3002 端口）—— 会持有 Prisma 引擎锁，需先停掉
 *   1. 从 .env 读取 DATABASE_URL
 *   2. 用 mysql2 连接 MySQL（不指定数据库），创建 resume_pilot_ai 数据库（如不存在）
 *   3. 调用 prisma db push 建表
 *   4. 调用 seed-test-data.ts 填充测试数据（可选）
 *
 * 使用：
 *   npm run db:init
 *
 * 等价于 Spring JPA 的 ddl-auto=update，一条命令建好所有表。
 */

import mysql from 'mysql2/promise';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import * as dotenv from 'dotenv';

// ─── 0. 检测后端进程是否在跑（占用端口会导致 Prisma 引擎 DLL 被锁）────────
function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once('error', () => resolve(true))   // 端口被占用
      .once('listening', () => {
        tester.close(() => resolve(false));  // 端口空闲
      })
      .listen(port);
  });
}

async function checkBackendNotRunning() {
  const port = parseInt(process.env.PORT || '3002', 10);
  const inUse = await isPortInUse(port);
  if (!inUse) return;

  console.error('');
  console.error('\u274c 检测到端口 ' + port + ' 被占用，后端进程可能正在运行。');
  console.error('   后端运行时会持有 Prisma 查询引擎的锁文件（query_engine-windows.dll.node），');
  console.error('   导致 prisma db push 无法重新生成，会报 EPERM 错误。');
  console.error('');
  console.error('   请先停止后端进程：');
  console.error('     - 在运行 npm run start:dev 的终端按 Ctrl+C');
  console.error('     - 或执行：Stop-Process -Id <PID> -Force（PID 可通过 netstat -ano | findstr :' + port + ' 查询）');
  console.error('   停止后重新运行：npm run db:init');
  process.exit(1);
}

// ─── 1. 读取 .env ──────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('\u274c 找不到 .env 文件，请先复制 .env.example 为 .env 并填写配置。');
  console.error('   命令：cp .env.example .env');
  process.exit(1);
}
dotenv.config({ path: envPath });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('\u274c .env 中未配置 DATABASE_URL');
  process.exit(1);
}

// ─── 2. 解析 DATABASE_URL ──────────────────────────────────────
// 格式：mysql://USER:PASSWORD@HOST:PORT/DATABASE?charset=utf8mb4
const m = databaseUrl.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
if (!m) {
  console.error('\u274c DATABASE_URL 格式错误，应为：mysql://user:pass@host:port/dbname');
  process.exit(1);
}
const [, user, password, host, portStr, dbName] = m;
const port = parseInt(portStr, 10);

const log = (msg: string) => console.log(`[db:init] ${msg}`);
const ok = (msg: string) => console.log(`\u2705 [db:init] ${msg}`);

// ─── 3. 主流程 ──────────────────────────────────────────────────
async function main() {
  // 步骤 0：检测后端是否在跑（会锁住 Prisma 引擎 DLL）
  log('步骤 0/4：检测后端进程...');
  await checkBackendNotRunning();
  ok('后端未运行（端口空闲）');

  log(`目标数据库：${dbName} @ ${host}:${port}`);

  // 步骤 1：创建数据库本身（如不存在）
  log('步骤 1/3：创建数据库（如不存在）...');
  let conn;
  try {
    conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      // 不指定 database，连接到 MySQL server 本身
    });
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    ok(`数据库 \`${dbName}\` 已就绪`);
  } catch (err: any) {
    console.error(`\u274c 连接 MySQL 失败：${err.message}`);
    console.error('   请检查 .env 中的 DATABASE_URL 是否正确，以及 MySQL 服务是否启动');
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }

  // 步骤 2：用 prisma db push 建表
  log('步骤 2/3：生成 Prisma Client 并推送 schema（建表）...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit', cwd: process.cwd() });
    execSync('npx prisma db push', { stdio: 'inherit', cwd: process.cwd() });
    ok('所有表已创建');
  } catch (err) {
    console.error('\u274c prisma db push 失败，请查看上方错误信息');
    process.exit(1);
  }

  // 步骤 3：种子数据（可选，失败不影响使用）
  log('步骤 3/3：填充测试数据（可选）...');
  const seedScript = path.resolve(process.cwd(), 'prisma', 'seed-test-data.ts');
  if (!fs.existsSync(seedScript)) {
    log('未找到 seed-test-data.ts，跳过种子数据');
  } else {
    try {
      execSync('npx tsx prisma/seed-test-data.ts', { stdio: 'inherit', cwd: process.cwd() });
      ok('测试数据已填充');
    } catch (err) {
      console.warn('\u26a0\ufe0f  种子数据填充失败（不影响主流程，可稍后手动运行）');
    }
  }

  console.log('');
  console.log('\u2705 数据库初始化完成！现在可以运行 npm run start:dev 启动后端了');
  console.log(`   Swagger 文档：http://localhost:${process.env.PORT || 3002}/api/docs`);
}

main().catch((err) => {
  console.error('\u274c 初始化失败：', err);
  process.exit(1);
});
