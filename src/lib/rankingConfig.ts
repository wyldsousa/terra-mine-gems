type PublicConfig = { url?: string | undefined; key?: string | undefined };

/** Never combine credentials from different deployment configurations. */
export function rankingPublicConfig(runtime: PublicConfig, bundled: PublicConfig) {
  if (runtime.url && runtime.key) return { url: runtime.url, key: runtime.key };
  if (bundled.url && bundled.key) return { url: bundled.url, key: bundled.key };
  throw new Error("RANKING_PUBLIC_CONFIG_MISSING");
}