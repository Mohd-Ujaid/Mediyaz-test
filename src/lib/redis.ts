import { Redis } from '@upstash/redis';

// Serverless Edge Redis Client (Compatible with Vercel Edge Functions)
// The user must provide these variables in their Vercel environment settings
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});
