/**
 * apiKeyMiddleware.ts
 * Validates x-vexa-key header and attaches marketplace context to request.
 * Used by all /api/* routes that serve marketplace clients.
 *
 * RULE: no raw API keys in logs, no `any` types.
 * RULE: Only the SHA-256 hash of the key is stored in the DB — the raw key is never persisted.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { MarketplaceContext } from '@/types';
import type { ApiKeyRow, Database } from '@/types/database';
import { hashApiKey } from './crypto';

export const VEXA_KEY_HEADER = 'x-vexa-key';
export const MARKETPLACE_CTX_HEADER = 'x-vexa-marketplace-id';

/**
 * SHA-256 hash of the raw API key.
 * Only the hash is stored in the DB — the raw key is never persisted.
 */

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

/**
 * Validate the x-vexa-key header and return MarketplaceContext or null.
 * Never logs the key value.
 */
export async function validateApiKey(
  req: NextRequest
): Promise<MarketplaceContext | null> {
  const rawKey = req.headers.get(VEXA_KEY_HEADER);
  if (!rawKey) return null;

  // In development/test, allow a hardcoded dev key via env var only
  if (process.env.NODE_ENV !== 'production' && rawKey === process.env.DEV_API_KEY) {
    return {
      marketplaceId: 'mkt_dev',
      name: 'Local Dev',
      apiKey: rawKey,
      createdAt: new Date().toISOString(),
    };
  }

  // Internal onboarding flow — key must be set in environment, never hardcoded
  if (process.env.INTERNAL_ONBOARDING_KEY && rawKey === process.env.INTERNAL_ONBOARDING_KEY) {
    return {
      marketplaceId: 'mkt_internal',
      name: 'Internal Onboarding',
      apiKey: rawKey,
      createdAt: new Date().toISOString(),
    };
  }

  try {
    const hashedKey = await hashApiKey(rawKey);
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('api_keys')
      .select('marketplace_id, marketplace_name, webhook_url, created_at, status')
      .eq('key_hash', hashedKey)
      .eq('status', 'active')
      .single();

    if (error || !data) return null;

    const keyData = data as ApiKeyRow;
    return {
      marketplaceId: keyData.marketplace_id,
      name: keyData.marketplace_name,
      apiKey: rawKey, // never log this
      webhookUrl: keyData.webhook_url ?? undefined,
      createdAt: keyData.created_at,
    };
  } catch {
    return null;
  }
}

/**
 * Higher-order function for protecting route handlers.
 * Wrap any route handler: export const GET = withApiKey(handler);
 */
export function withApiKey(
  handler: (
    req: NextRequest,
    ctx: MarketplaceContext,
    params?: Record<string, string>
  ) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    routeContext?: { params?: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const ctx = await validateApiKey(req);

    if (!ctx) {
      return NextResponse.json(
        { error: 'Unauthorized — invalid or missing x-vexa-key' },
        { status: 401 }
      );
    }

    const params = routeContext?.params ? await routeContext.params : undefined;
    return handler(req, ctx, params);
  };
}

/**
 * Standalone middleware check — returns 401 response or null (authorized).
 * Use in route handlers that prefer inline checks.
 */
export async function requireApiKey(
  req: NextRequest
): Promise<{ ctx: MarketplaceContext; error: null } | { ctx: null; error: NextResponse }> {
  const ctx = await validateApiKey(req);
  if (!ctx) {
    return {
      ctx: null,
      error: NextResponse.json(
        { error: 'Unauthorized — invalid or missing x-vexa-key' },
        { status: 401 }
      ),
    };
  }
  return { ctx, error: null };
}
