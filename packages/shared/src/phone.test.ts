import { describe, expect, it } from "vitest";
import { extractTunisiaPhoneLead } from "./phone";

describe("extractTunisiaPhoneLead", () => {
  it.each([
    ["98421295", "+21698421295", ""],
    ["98 421 295", "+21698421295", ""],
    ["98-421-295", "+21698421295", ""],
    ["98.421.295", "+21698421295", ""],
    ["21698421295", "+21698421295", ""],
    ["216 98 421 295", "+21698421295", ""],
    ["+21698421295", "+21698421295", ""],
    ["+216 98 421 295", "+21698421295", ""],
    ["٩٨٤٢١٢٩٥ robe", "+21698421295", "robe"],
    ["۹۸۴۲۱۲۹۵ robe", "+21698421295", "robe"],
    ["robe rouge 98421295 taille M", "+21698421295", "robe rouge taille M"],
    ["+216 98 421 295 noir L", "+21698421295", "noir L"],
  ])("extracts %s", (input, phoneE164, cleanContent) => {
    expect(extractTunisiaPhoneLead(input)).toMatchObject({
      phoneE164,
      displayPhone: "+216 98 421 295",
      cleanContent,
      originalContent: input,
    });
  });

  it.each(["prix?", "hello", "123", "999999999999"])(
    "rejects invalid comment %s",
    (input) => {
      expect(extractTunisiaPhoneLead(input)).toBeNull();
    },
  );

  it("uses the first valid phone number when multiple are present", () => {
    expect(extractTunisiaPhoneLead("98421295 55120884")).toMatchObject({
      phoneE164: "+21698421295",
      cleanContent: "55120884",
    });
  });
});
