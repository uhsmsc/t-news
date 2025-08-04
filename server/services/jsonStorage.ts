import fs from "fs";
import path from "path";

import { getEnv, ConfigKeyType } from "../utils/config";

type loadFn<T> = () => T[];
type saveFn<T> = (data: T[]) => void;

export function createLoadFn<T>(envKey: ConfigKeyType): loadFn<T> {
  return () => {
    const data = fs.readFileSync(getJsonPath(envKey), "utf-8");

    return JSON.parse(data) as T[];
  };
}

export function createSaveFn<T>(envKey: ConfigKeyType): saveFn<T> {
  return (data: T[]) => {
    const jsonPath = getJsonPath(envKey);
    const jsonData = JSON.stringify(data, null, 2);

    fs.writeFileSync(jsonPath, jsonData, "utf-8");
  };
}

function getJsonPath(envKey: ConfigKeyType): string {
  return path.resolve(__dirname, "..", getEnv(envKey));
}

