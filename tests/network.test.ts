import { describe, it, expect } from "vitest";
import { execFile } from "child_process";
import { promisify } from "util";
import { resolve } from "path";

const execFileAsync = promisify(execFile);

const PROFILE1 = resolve(import.meta.dirname, "fixtures/network-profile-1.json.gz");
const PROFILE2 = resolve(import.meta.dirname, "fixtures/network-profile-2.json.gz");
const PROFILE3 = resolve(import.meta.dirname, "fixtures/network-profile-3.json.gz");
const CLI = resolve(import.meta.dirname, "../dist/index.js");

async function runCli(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync("node", [CLI, ...args], { timeout: 120_000 });
}

describe("--page-load", () => {
  describe("network-profile-1 (youtube)", () => {
    it("shows page load summary with navigation timing and resources", async () => {
      const { stdout } = await runCli([PROFILE1, "--page-load"]);

      expect(stdout).toContain("URL: https://www.youtube.com/");
      expect(stdout).toContain("Load: 7012.64 ms");
      expect(stdout).toContain("FCP : 7403.00 ms");
      expect(stdout).toContain("Total resources: 20");
      expect(stdout).toContain("Max duration: 6615.95 ms");
      expect(stdout).toContain("1. m=root_chunk,base_chunk,main_chunk - 6615.95 ms (Other)");
      expect(stdout).toContain("Total jank periods: 2");
    }, 120_000);
  });

  describe("network-profile-2 (no page load data)", () => {
    it("reports no page load metrics found", async () => {
      const { stdout } = await runCli([PROFILE2, "--page-load"]);

      expect(stdout).toContain("No page load metrics found.");
    }, 120_000);
  });

  describe("network-profile-3 (reddit)", () => {
    it("shows page load summary with FCP and load timing", async () => {
      const { stdout } = await runCli([PROFILE3, "--page-load"]);

      expect(stdout).toContain("URL: https://www.reddit.com/");
      expect(stdout).toContain("FCP : 502.00 ms");
      expect(stdout).toContain("Load: 1519.84 ms");
      expect(stdout).toContain("Total resources: 79");
      expect(stdout).toContain("Max duration: 1256.62 ms");
      expect(stdout).toContain("1. 64x64.png - 1256.62 ms (Image)");
    }, 120_000);
  });
});

describe("--network", () => {
  describe("network-profile-1 (youtube)", () => {
    it("shows network resources with timing totals", async () => {
      const { stdout } = await runCli([PROFILE1, "--network"]);

      expect(stdout).toContain("Total resources: 133");
      expect(stdout).toContain("Unknown: 133 (100.0%)");
      expect(stdout).toContain("HTTP response: 15921.71 ms");
      expect(stdout).toContain("1. https://www.youtube.com/");
      expect(stdout).toContain("Start: -262.93 ms | Duration: 7296.19 ms");
    }, 120_000);
  });

  describe("network-profile-2 (6 resources)", () => {
    it("shows all 6 network resources with phases", async () => {
      const { stdout } = await runCli([PROFILE2, "--network"]);

      expect(stdout).toContain("Total resources: 6");
      expect(stdout).toContain("Unknown: 6 (100.0%)");
      expect(stdout).toContain("HTTP request and waiting for response: 235.64 ms");
      expect(stdout).toContain("Start: 21659.52 ms | Duration: 67.97 ms");
      expect(stdout).toContain("Content-Type: image/png");
      expect(stdout).toContain("Size: 2.18 KB");
    }, 120_000);
  });

  describe("network-profile-3 (reddit)", () => {
    it("shows network resources with timing totals", async () => {
      const { stdout } = await runCli([PROFILE3, "--network"]);

      expect(stdout).toContain("Total resources: 79");
      expect(stdout).toContain("Unknown: 79 (100.0%)");
      expect(stdout).toContain("HTTP request and waiting for response: 5197.09 ms");
      expect(stdout).toContain("1. https://www.reddit.com/");
      expect(stdout).toContain("Start: -199.85 ms | Duration: 573.96 ms");
    }, 120_000);
  });
});
