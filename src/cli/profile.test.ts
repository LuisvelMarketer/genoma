import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "genoma",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "genoma", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "genoma", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "genoma", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "genoma", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "genoma", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "genoma", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it.each([
    ["--dev first", ["node", "genoma", "--dev", "--profile", "work", "status"]],
    ["--profile first", ["node", "genoma", "--profile", "work", "--dev", "status"]],
  ])("rejects combining --dev with --profile (%s)", (_name, argv) => {
    const res = parseCliProfileArgs(argv);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".genoma-dev");
    expect(env.GENOMA_PROFILE).toBe("dev");
    expect(env.GENOMA_STATE_DIR).toBe(expectedStateDir);
    expect(env.GENOMA_CONFIG_PATH).toBe(path.join(expectedStateDir, "genoma.json"));
    expect(env.GENOMA_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      GENOMA_STATE_DIR: "/custom",
      GENOMA_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.GENOMA_STATE_DIR).toBe("/custom");
    expect(env.GENOMA_GATEWAY_PORT).toBe("19099");
    expect(env.GENOMA_CONFIG_PATH).toBe(path.join("/custom", "genoma.json"));
  });

  it("uses GENOMA_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      GENOMA_HOME: "/srv/genoma-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/genoma-home");
    expect(env.GENOMA_STATE_DIR).toBe(path.join(resolvedHome, ".genoma-work"));
    expect(env.GENOMA_CONFIG_PATH).toBe(
      path.join(resolvedHome, ".genoma-work", "genoma.json"),
    );
  });
});

describe("formatCliCommand", () => {
  it.each([
    {
      name: "no profile is set",
      cmd: "genoma doctor --fix",
      env: {},
      expected: "genoma doctor --fix",
    },
    {
      name: "profile is default",
      cmd: "genoma doctor --fix",
      env: { GENOMA_PROFILE: "default" },
      expected: "genoma doctor --fix",
    },
    {
      name: "profile is Default (case-insensitive)",
      cmd: "genoma doctor --fix",
      env: { GENOMA_PROFILE: "Default" },
      expected: "genoma doctor --fix",
    },
    {
      name: "profile is invalid",
      cmd: "genoma doctor --fix",
      env: { GENOMA_PROFILE: "bad profile" },
      expected: "genoma doctor --fix",
    },
    {
      name: "--profile is already present",
      cmd: "genoma --profile work doctor --fix",
      env: { GENOMA_PROFILE: "work" },
      expected: "genoma --profile work doctor --fix",
    },
    {
      name: "--dev is already present",
      cmd: "genoma --dev doctor",
      env: { GENOMA_PROFILE: "dev" },
      expected: "genoma --dev doctor",
    },
  ])("returns command unchanged when $name", ({ cmd, env, expected }) => {
    expect(formatCliCommand(cmd, env)).toBe(expected);
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("genoma doctor --fix", { GENOMA_PROFILE: "work" })).toBe(
      "genoma --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("genoma doctor --fix", { GENOMA_PROFILE: "  jbgenoma  " })).toBe(
      "genoma --profile jbgenoma doctor --fix",
    );
  });

  it("handles command with no args after genoma", () => {
    expect(formatCliCommand("genoma", { GENOMA_PROFILE: "test" })).toBe(
      "genoma --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm genoma doctor", { GENOMA_PROFILE: "work" })).toBe(
      "pnpm genoma --profile work doctor",
    );
  });
});
