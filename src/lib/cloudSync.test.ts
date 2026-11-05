import { describe, it, expect } from "vitest";
import { mergeMines, visibleSlice } from "./cloudSync";
import type { Mine } from "@/types";

const m = (id: string, t: number): Mine => ({ id, type: "rock", level: 1, createdAt: t });

describe("cloud sync", () => {
  it("first sync on a device keeps local and server mines without duplicates", () => {
    expect(mergeMines([m("a", 1), m("b", 2)], [m("b", 2), m("c", 3)], true).map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
  it("later syncs trust the server so deletions on other devices stick", () => {
    expect(mergeMines([m("a", 1)], [m("c", 3)], false).map((x) => x.id)).toEqual(["c"]);
  });
  it("lists show 10 per page, adding 10 each time", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    expect(visibleSlice(items, 1)).toHaveLength(10);
    expect(visibleSlice(items, 2)).toHaveLength(20);
    expect(visibleSlice(items, 3)).toHaveLength(25);
  });
});
