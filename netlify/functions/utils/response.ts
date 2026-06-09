import type { Handler, HandlerEvent } from '@netlify/functions';
import { verifyAuthUser } from './supabase.js';

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };
}

export function jsonResponse(data: unknown, status = 200) {
  return {
    statusCode: status,
    headers: corsHeaders(),
    body: JSON.stringify(data),
  };
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

/** @deprecated Use requireAuth instead */
export function getUserId(event: HandlerEvent): string | null {
  return event.headers['x-user-id'] || event.headers['X-User-Id'] || null;
}

export async function requireAuth(event: HandlerEvent): Promise<{ id: string; email?: string } | null> {
  return verifyAuthUser(event);
}

export function parseBody<T>(event: HandlerEvent): T | null {
  if (!event.body) return null;
  try {
    return JSON.parse(event.body) as T;
  } catch {
    return null;
  }
}

export function withCors(handler: Handler): Handler {
  return async (event, context) => {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: corsHeaders(), body: '' };
    }
    try {
      return await handler(event, context);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Internal server error';
      return errorResponse(message, 500);
    }
  };
}
