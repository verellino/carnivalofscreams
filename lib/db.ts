import postgres from "postgres";

function connectionString() {
  const pooled = process.env.SUPABASE_DB_POOLER_URL;
  if (pooled) return pooled;

  const direct =
    process.env.SUPABASE_DB_DIRECT_CONNECTION ??
    process.env.SUPABASE_DB_URL ??
    process.env.DATABASE_URL;
  if (direct) return direct;

  const password = process.env.SUPABASE_DB_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!password || !supabaseUrl) {
    throw new Error("Supabase database connection is not configured");
  }

  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

const globalForSql = globalThis as unknown as {
  carnivalSql?: ReturnType<typeof postgres>;
};

export function getSql() {
  if (!globalForSql.carnivalSql) {
    globalForSql.carnivalSql = postgres(connectionString(), {
      ssl: "require",
      max: 1,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return globalForSql.carnivalSql;
}
