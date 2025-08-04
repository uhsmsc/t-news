import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export interface Config {
  PORT: string;
  JWT_SECRET: string;
  USERS_DATA: string;
  POSTS_DATA: string;
  COMMENTS_DATA: string;
}
export type ConfigKeyType = keyof Config;

const CONFIG_KEYS = [
  "PORT",
  "JWT_SECRET",
  "USERS_DATA",
  "POSTS_DATA",
  "COMMENTS_DATA",
] as const;
type ConfigKey = (typeof CONFIG_KEYS)[number];

// Compile-time check
type Missing = Exclude<keyof Config, ConfigKey>;
const __typecheck__: Record<Missing, never> = {} as const;

const CONFIG_FILE = path.join(process.cwd(), "config.yaml");

export function loadConfig() {
  const config = readConfig();
  console.log("Loaded config:", config);

  for (const key in config) {
    process.env[key] = config[key as ConfigKey];
  }
}


function readConfig(): Config {
  let fileConfig: Partial<Config> = {};

  if (fs.existsSync(CONFIG_FILE)) {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const parsed = yaml.load(raw);
    if (typeof parsed === "object" && parsed !== null) {
      fileConfig = parsed as Partial<Config>;
    }
  }

  const config: Partial<Config> = {};

  for (const key of CONFIG_KEYS) {
    config[key] = process.env[key] || fileConfig[key];
  }

  const missing = CONFIG_KEYS.filter((k) => !config[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required config values: ${missing.join(", ")}`);
  }

  return config as Config;
}

export function getEnv<K extends keyof Config>(key: K): string {
  return process.env[key] || "";
}
