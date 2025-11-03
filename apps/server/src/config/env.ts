import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import { z } from 'zod';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);
const serverRoot = resolve(currentDir, '..', '..');
const projectRoot = resolve(serverRoot, '..', '..');

const rootEnvPath = resolve(projectRoot, '.env');
const serverEnvPath = resolve(serverRoot, '.env');

if (existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else {
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .optional()
    .transform((value) => (value ? Number.parseInt(value, 10) : 4000)),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').optional(),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  LINE_CHANNEL_ACCESS_TOKEN: z.string().min(1, 'LINE_CHANNEL_ACCESS_TOKEN is required'),
  LINE_CHANNEL_SECRET: z.string().min(1, 'LINE_CHANNEL_SECRET is required'),
  LINE_LOGIN_CHANNEL_ID: z.string().min(1, 'LINE_LOGIN_CHANNEL_ID is required'),
  LINE_LOGIN_CHANNEL_SECRET: z.string().min(1, 'LINE_LOGIN_CHANNEL_SECRET is required'),
  BASE_URL: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  LIFF_BASE_URL: z.string().optional(),
});

export type Env = Omit<z.infer<typeof envSchema>, 'DATABASE_URL' | 'PORT'> & {
  DATABASE_URL: string;
  PORT: number;
};

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      throw new Error(`Environment validation error: ${message}`);
    }
    const databaseUrl = parsed.data.DATABASE_URL ?? 'mysql://user:pass@localhost:3306/test';
    if (!databaseUrl) {
      throw new Error('Environment validation error: DATABASE_URL is required');
    }
    cachedEnv = { ...parsed.data, DATABASE_URL: databaseUrl, PORT: parsed.data.PORT ?? 4000 };
  }
  return cachedEnv;
}
