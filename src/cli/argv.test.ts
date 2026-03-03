import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  isRootHelpInvocation,
  isRootVersionInvocation,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it.each([
    {
      name: "help flag",
      argv: ["node", "genoma", "--help"],
      expected: true,
    },
    {
      name: "version flag",
      argv: ["node", "genoma", "-V"],
      expected: true,
    },
    {
      name: "normal command",
      argv: ["node", "genoma", "status"],
      expected: false,
    },
    {
      name: "root -v alias",
      argv: ["node", "genoma", "-v"],
      expected: true,
    },
    {
      name: "root -v alias with profile",
      argv: ["node", "genoma", "--profile", "work", "-v"],
      expected: true,
    },
    {
      name: "root -v alias with log-level",
      argv: ["node", "genoma", "--log-level", "debug", "-v"],
      expected: true,
    },
    {
      name: "subcommand -v should not be treated as version",
      argv: ["node", "genoma", "acp", "-v"],
      expected: false,
    },
    {
      name: "root -v alias with equals profile",
      argv: ["node", "genoma", "--profile=work", "-v"],
      expected: true,
    },
    {
      name: "subcommand path after global root flags should not be treated as version",
      argv: ["node", "genoma", "--dev", "skills", "list", "-v"],
      expected: false,
    },
  ])("detects help/version flags: $name", ({ argv, expected }) => {
    expect(hasHelpOrVersion(argv)).toBe(expected);
  });

  it.each([
    {
      name: "root --version",
      argv: ["node", "genoma", "--version"],
      expected: true,
    },
    {
      name: "root -V",
      argv: ["node", "genoma", "-V"],
      expected: true,
    },
    {
      name: "root -v alias with profile",
      argv: ["node", "genoma", "--profile", "work", "-v"],
      expected: true,
    },
    {
      name: "subcommand version flag",
      argv: ["node", "genoma", "status", "--version"],
      expected: false,
    },
    {
      name: "unknown root flag with version",
      argv: ["node", "genoma", "--unknown", "--version"],
      expected: false,
    },
  ])("detects root-only version invocations: $name", ({ argv, expected }) => {
    expect(isRootVersionInvocation(argv)).toBe(expected);
  });

  it.each([
    {
      name: "root --help",
      argv: ["node", "genoma", "--help"],
      expected: true,
    },
    {
      name: "root -h",
      argv: ["node", "genoma", "-h"],
      expected: true,
    },
    {
      name: "root --help with profile",
      argv: ["node", "genoma", "--profile", "work", "--help"],
      expected: true,
    },
    {
      name: "subcommand --help",
      argv: ["node", "genoma", "status", "--help"],
      expected: false,
    },
    {
      name: "help before subcommand token",
      argv: ["node", "genoma", "--help", "status"],
      expected: false,
    },
    {
      name: "help after -- terminator",
      argv: ["node", "genoma", "nodes", "run", "--", "git", "--help"],
      expected: false,
    },
    {
      name: "unknown root flag before help",
      argv: ["node", "genoma", "--unknown", "--help"],
      expected: false,
    },
    {
      name: "unknown root flag after help",
      argv: ["node", "genoma", "--help", "--unknown"],
      expected: false,
    },
  ])("detects root-only help invocations: $name", ({ argv, expected }) => {
    expect(isRootHelpInvocation(argv)).toBe(expected);
  });

  it.each([
    {
      name: "single command with trailing flag",
      argv: ["node", "genoma", "status", "--json"],
      expected: ["status"],
    },
    {
      name: "two-part command",
      argv: ["node", "genoma", "agents", "list"],
      expected: ["agents", "list"],
    },
    {
      name: "terminator cuts parsing",
      argv: ["node", "genoma", "status", "--", "ignored"],
      expected: ["status"],
    },
  ])("extracts command path: $name", ({ argv, expected }) => {
    expect(getCommandPath(argv, 2)).toEqual(expected);
  });

  it.each([
    {
      name: "returns first command token",
      argv: ["node", "genoma", "agents", "list"],
      expected: "agents",
    },
    {
      name: "returns null when no command exists",
      argv: ["node", "genoma"],
      expected: null,
    },
  ])("returns primary command: $name", ({ argv, expected }) => {
    expect(getPrimaryCommand(argv)).toBe(expected);
  });

  it.each([
    {
      name: "detects flag before terminator",
      argv: ["node", "genoma", "status", "--json"],
      flag: "--json",
      expected: true,
    },
    {
      name: "ignores flag after terminator",
      argv: ["node", "genoma", "--", "--json"],
      flag: "--json",
      expected: false,
    },
  ])("parses boolean flags: $name", ({ argv, flag, expected }) => {
    expect(hasFlag(argv, flag)).toBe(expected);
  });

  it.each([
    {
      name: "value in next token",
      argv: ["node", "genoma", "status", "--timeout", "5000"],
      expected: "5000",
    },
    {
      name: "value in equals form",
      argv: ["node", "genoma", "status", "--timeout=2500"],
      expected: "2500",
    },
    {
      name: "missing value",
      argv: ["node", "genoma", "status", "--timeout"],
      expected: null,
    },
    {
      name: "next token is another flag",
      argv: ["node", "genoma", "status", "--timeout", "--json"],
      expected: null,
    },
    {
      name: "flag appears after terminator",
      argv: ["node", "genoma", "--", "--timeout=99"],
      expected: undefined,
    },
  ])("extracts flag values: $name", ({ argv, expected }) => {
    expect(getFlagValue(argv, "--timeout")).toBe(expected);
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "genoma", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "genoma", "status", "--debug"])).toBe(false);
    expect(getVerboseFlag(["node", "genoma", "status", "--debug"], { includeDebug: true })).toBe(
      true,
    );
  });

  it.each([
    {
      name: "missing flag",
      argv: ["node", "genoma", "status"],
      expected: undefined,
    },
    {
      name: "missing value",
      argv: ["node", "genoma", "status", "--timeout"],
      expected: null,
    },
    {
      name: "valid positive integer",
      argv: ["node", "genoma", "status", "--timeout", "5000"],
      expected: 5000,
    },
    {
      name: "invalid integer",
      argv: ["node", "genoma", "status", "--timeout", "nope"],
      expected: undefined,
    },
  ])("parses positive integer flag values: $name", ({ argv, expected }) => {
    expect(getPositiveIntFlagValue(argv, "--timeout")).toBe(expected);
  });

  it("builds parse argv from raw args", () => {
    const cases = [
      {
        rawArgs: ["node", "genoma", "status"],
        expected: ["node", "genoma", "status"],
      },
      {
        rawArgs: ["node-22", "genoma", "status"],
        expected: ["node-22", "genoma", "status"],
      },
      {
        rawArgs: ["node-22.2.0.exe", "genoma", "status"],
        expected: ["node-22.2.0.exe", "genoma", "status"],
      },
      {
        rawArgs: ["node-22.2", "genoma", "status"],
        expected: ["node-22.2", "genoma", "status"],
      },
      {
        rawArgs: ["node-22.2.exe", "genoma", "status"],
        expected: ["node-22.2.exe", "genoma", "status"],
      },
      {
        rawArgs: ["/usr/bin/node-22.2.0", "genoma", "status"],
        expected: ["/usr/bin/node-22.2.0", "genoma", "status"],
      },
      {
        rawArgs: ["node24", "genoma", "status"],
        expected: ["node24", "genoma", "status"],
      },
      {
        rawArgs: ["/usr/bin/node24", "genoma", "status"],
        expected: ["/usr/bin/node24", "genoma", "status"],
      },
      {
        rawArgs: ["node24.exe", "genoma", "status"],
        expected: ["node24.exe", "genoma", "status"],
      },
      {
        rawArgs: ["nodejs", "genoma", "status"],
        expected: ["nodejs", "genoma", "status"],
      },
      {
        rawArgs: ["node-dev", "genoma", "status"],
        expected: ["node", "genoma", "node-dev", "genoma", "status"],
      },
      {
        rawArgs: ["genoma", "status"],
        expected: ["node", "genoma", "status"],
      },
      {
        rawArgs: ["bun", "src/entry.ts", "status"],
        expected: ["bun", "src/entry.ts", "status"],
      },
    ] as const;

    for (const testCase of cases) {
      const parsed = buildParseArgv({
        programName: "genoma",
        rawArgs: [...testCase.rawArgs],
      });
      expect(parsed).toEqual([...testCase.expected]);
    }
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "genoma",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "genoma", "status"]);
  });

  it("decides when to migrate state", () => {
    const nonMutatingArgv = [
      ["node", "genoma", "status"],
      ["node", "genoma", "health"],
      ["node", "genoma", "sessions"],
      ["node", "genoma", "config", "get", "update"],
      ["node", "genoma", "config", "unset", "update"],
      ["node", "genoma", "models", "list"],
      ["node", "genoma", "models", "status"],
      ["node", "genoma", "memory", "status"],
      ["node", "genoma", "agent", "--message", "hi"],
    ] as const;
    const mutatingArgv = [
      ["node", "genoma", "agents", "list"],
      ["node", "genoma", "message", "send"],
    ] as const;

    for (const argv of nonMutatingArgv) {
      expect(shouldMigrateState([...argv])).toBe(false);
    }
    for (const argv of mutatingArgv) {
      expect(shouldMigrateState([...argv])).toBe(true);
    }
  });

  it.each([
    { path: ["status"], expected: false },
    { path: ["config", "get"], expected: false },
    { path: ["models", "status"], expected: false },
    { path: ["agents", "list"], expected: true },
  ])("reuses command path for migrate state decisions: $path", ({ path, expected }) => {
    expect(shouldMigrateStateFromPath(path)).toBe(expected);
  });
});
