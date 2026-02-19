import { describe, expect } from "vitest";
import { it } from "./base";

describe("nova address", () => {
  it("prints address", async ({ nova }) => {
    const stdout = await nova(["address"]);
    expect(stdout.length).toBe(38);
  });

  it("prints address in JSON format", async ({ nova }) => {
    const stdout = await nova(["-j", "address"]);
    const result = JSON.parse(stdout);
    expect(result.status).toBe("ok");
    expect(result.result.address.length).toBe(38);
  });
});
