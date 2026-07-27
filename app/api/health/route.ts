import { pool } from "@/lib/db";
import { createRouteHandler, ApiError } from "@/lib/apiUtils";

/**
 * Liveness plus database reachability, for the container healthcheck.
 *
 * It touches the database on purpose: an app process that is up but cannot reach Postgres
 * is not serving anything useful, and compose should know that rather than reporting the
 * container healthy.
 */
export const dynamic = "force-dynamic";

export const GET = createRouteHandler(async () => {
  const client = await pool.connect().catch(() => null);

  if (!client) {
    throw new ApiError("Database unreachable", 503);
  }

  try {
    await client.query("SELECT 1");
    return { status: "ok" };
  } catch {
    throw new ApiError("Database unreachable", 503);
  } finally {
    client.release();
  }
});
