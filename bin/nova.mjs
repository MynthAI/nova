#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const cliJsPath = path.join(projectRoot, "dist", "entrypoint.js");

process.env.INIT_CWD = process.env.INIT_CWD || process.cwd();

await import(pathToFileURL(cliJsPath).href);
