import { describe, expect, it } from "vitest";
import { rankingPublicConfig } from "./rankingConfig";

describe("ranking deployment configuration", () => {
  const bundled = { url: "https://public.example.test", key: "public-test-key" };
  it("uses a complete runtime configuration in Lovable", () => {
    const runtime = { url: "https://runtime.example.test", key: "runtime-public-key" };
    expect(rankingPublicConfig(runtime, bundled)).toEqual(runtime);
  });
  it("uses bundled public configuration when Vercel runtime variables are absent", () => {
    expect(rankingPublicConfig({}, bundled)).toEqual(bundled);
  });
  it("does not mix a partial runtime configuration with another project's public key", () => {
    expect(rankingPublicConfig({ url: "https://other.example.test" }, bundled)).toEqual(bundled);
    expect(rankingPublicConfig({ key: "other-key" }, bundled)).toEqual(bundled);
  });
  it("fails explicitly when neither environment has a complete configuration", () => {
    expect(() => rankingPublicConfig({ url: "https://other.example.test" }, { key: "key" })).toThrow("RANKING_PUBLIC_CONFIG_MISSING");
  });
});