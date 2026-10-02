import { NextResponse } from "next/server";
import { extractBearerToken, verifyToken, type JwtPayload } from "@/lib/auth";

// Next.js expects params to be Promise<Record<string, string>> for dynamic
// segments and Promise<Record<string, never>> (i.e. empty object) for static routes.
// Using `Record<string, string>` as the upper bound satisfies both cases.
export type AuthenticatedHandler<TParams extends Record<string, string> = Record<string, never>> = (
  request: Request,
  context: { params: Promise<TParams>; auth: JwtPayload },
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps a Next.js route handler and enforces JWT authentication.
 *
 * Usage — static route (no dynamic segments):
 *   export const GET = requireAuth(async (req, { auth }) => { ... });
 *
 * Usage — dynamic route:
 *   export const PATCH = requireAuth<{ id: string; stepNumber: string }>(
 *     async (req, { params, auth }) => {
 *       const { id, stepNumber } = await params;
 *       ...
 *     }
 *   );
 */
export function requireAuth<TParams extends Record<string, string> = Record<string, never>>(
  handler: AuthenticatedHandler<TParams>,
) {
  return async (
    request: Request,
    context: { params: Promise<TParams> },
  ): Promise<NextResponse> => {
    const token = extractBearerToken(request.headers.get("Authorization"));

    if (!token) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Missing or invalid Authorization header.",
        },
        { status: 401 },
      );
    }

    let auth: JwtPayload;
    try {
      auth = await verifyToken(token);
    } catch {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Token is invalid or expired." },
        { status: 401 },
      );
    }

    return handler(request, { params: context.params, auth });
  };
}
