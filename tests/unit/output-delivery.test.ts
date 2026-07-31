import { describe, it, expect } from "vitest";
import { shouldWarnLargeFile } from "../../core/export/output-delivery";

describe("shouldWarnLargeFile", () => {
  it("should warn for files over 2GB", () => {
    const twoGB = 2 * 1024 * 1024 * 1024;
    expect(shouldWarnLargeFile(twoGB + 1)).toBe(true);
  });

  it("should not warn for files under 2GB", () => {
    const oneGB = 1024 * 1024 * 1024;
    expect(shouldWarnLargeFile(oneGB)).toBe(false);
  });

  it("should not warn for small files", () => {
    expect(shouldWarnLargeFile(1000)).toBe(false);
  });
});
