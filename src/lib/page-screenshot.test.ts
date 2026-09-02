import { describe, expect, it } from "vitest";
import { exportScale, getFullPageSize } from "./page-screenshot";

function mockRoot(size: { scrollWidth: number; scrollHeight: number }) {
  return {
    scrollWidth: size.scrollWidth,
    scrollHeight: size.scrollHeight,
    offsetWidth: size.scrollWidth,
    offsetHeight: size.scrollHeight,
    clientWidth: size.scrollWidth,
    clientHeight: size.scrollHeight,
  } as HTMLElement;
}

describe("getFullPageSize", () => {
  it("uses scroll dimensions for tall pages", () => {
    expect(getFullPageSize(mockRoot({ scrollWidth: 1200, scrollHeight: 4800 }))).toEqual({
      width: 1200,
      height: 4800,
    });
  });
});

describe("exportScale", () => {
  it("reduces scale when the page exceeds canvas limits", () => {
    expect(exportScale(mockRoot({ scrollWidth: 6000, scrollHeight: 9000 }))).toBeLessThan(1);
  });
});
