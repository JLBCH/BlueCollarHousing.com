import { describe, expect, it } from "vitest";
import { citySlug } from "./cities";

describe("citySlug", () => {
  it("lowercases and joins city + state with a hyphen", () => {
    expect(citySlug("Baytown", "TX")).toBe("baytown-tx");
  });

  it("hyphenates multi-word cities", () => {
    expect(citySlug("Corpus Christi", "TX")).toBe("corpus-christi-tx");
    expect(citySlug("Lake Charles", "LA")).toBe("lake-charles-la");
  });

  it("strips punctuation like apostrophes and periods", () => {
    expect(citySlug("O'Fallon", "MO")).toBe("o-fallon-mo");
    expect(citySlug("St. Louis", "MO")).toBe("st-louis-mo");
  });

  it("collapses extra whitespace and trims stray hyphens", () => {
    expect(citySlug("  Port  Arthur ", "TX")).toBe("port-arthur-tx");
  });
});
