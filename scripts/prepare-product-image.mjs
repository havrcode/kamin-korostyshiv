#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";

const DEFAULTS = {
  focus: "50,50",
  quality: 86,
  ratio: "3:2",
  width: 1536,
};

function usage() {
  console.log(`Usage: node scripts/prepare-product-image.mjs --input SOURCE --output OUTPUT.webp [options]

Options:
  --ratio W:H       Crop ratio, default 3:2
  --width PX        Maximum output width, default 1536
  --focus X,Y       Crop focus in percent, default 50,50
  --quality 1-100   WebP quality, default 86
  --help            Show this help

Supported input formats: PNG, JPG/JPEG, WebP, HEIC/HEIF on macOS.
`);
}

function parseArgs(argv) {
  const values = { ...DEFAULTS };
  const aliases = new Map([
    ["-i", "input"],
    ["-o", "output"],
  ]);

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") {
      usage();
      process.exit(0);
    }

    const [rawName, inlineValue] = token.includes("=")
      ? token.split(/=(.*)/s, 2)
      : [token, undefined];
    const name = aliases.get(rawName) ?? rawName.replace(/^--/, "");
    const value = inlineValue ?? argv[++index];
    if (!value || value.startsWith("-")) {
      throw new Error(`Missing value for ${rawName}`);
    }
    if (!["input", "output", "ratio", "width", "focus", "quality"].includes(name)) {
      throw new Error(`Unknown option ${rawName}`);
    }
    values[name] = value;
  }

  if (!values.input || !values.output) {
    throw new Error("Both --input and --output are required");
  }
  return values;
}

function parsePositiveNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${label} must be a positive number`);
  }
  return number;
}

function parseRatio(value) {
  const [width, height] = String(value).split(":").map(Number);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("--ratio must look like 3:2");
  }
  return width / height;
}

function parseFocus(value) {
  const [x, y] = String(value).split(",").map(Number);
  if (![x, y].every((item) => Number.isFinite(item) && item >= 0 && item <= 100)) {
    throw new Error("--focus must contain X,Y values from 0 to 100");
  }
  return { x, y };
}

function readDimensions(input) {
  const output = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", input], {
    encoding: "utf8",
  });
  const width = Number(output.match(/pixelWidth:\s+(\d+)/)?.[1]);
  const height = Number(output.match(/pixelHeight:\s+(\d+)/)?.[1]);
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error(`Could not read image dimensions for ${input}`);
  }
  return { width, height };
}

function prepareSource(input) {
  const extension = extname(input).toLowerCase();
  if (![".heic", ".heif"].includes(extension)) {
    return { path: input, temporaryDirectory: null };
  }

  const temporaryDirectory = mkdtempSync(join(tmpdir(), "kaminchyk-image-"));
  const converted = join(temporaryDirectory, "source.png");
  execFileSync("sips", ["-s", "format", "png", input, "--out", converted], {
    stdio: "inherit",
  });
  return { path: converted, temporaryDirectory };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const input = resolve(options.input);
  const output = resolve(options.output);
  const extension = extname(input).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".webp", ".heic", ".heif"].includes(extension)) {
    throw new Error("Input must be PNG, JPG/JPEG, WebP, HEIC or HEIF");
  }
  if (extname(output).toLowerCase() !== ".webp") {
    throw new Error("Output must use the .webp extension");
  }

  const targetRatio = parseRatio(options.ratio);
  const targetWidth = Math.min(4096, Math.round(parsePositiveNumber(options.width, "--width")));
  const quality = parsePositiveNumber(options.quality, "--quality");
  if (quality > 100) {
    throw new Error("--quality must be between 1 and 100");
  }
  const focus = parseFocus(options.focus);
  const sourceDimensions = readDimensions(input);
  const sourceRatio = sourceDimensions.width / sourceDimensions.height;
  const cropWidth = sourceRatio > targetRatio
    ? Math.floor(sourceDimensions.height * targetRatio)
    : sourceDimensions.width;
  const cropHeight = sourceRatio > targetRatio
    ? sourceDimensions.height
    : Math.floor(sourceDimensions.width / targetRatio);
  const cropX = Math.round((sourceDimensions.width - cropWidth) * (focus.x / 100));
  const cropY = Math.round((sourceDimensions.height - cropHeight) * (focus.y / 100));
  const targetHeight = Math.round(targetWidth / targetRatio);
  const prepared = prepareSource(input);

  try {
    mkdirSync(dirname(output), { recursive: true });
    execFileSync("cwebp", [
      "-quiet",
      "-mt",
      "-q",
      String(quality),
      "-crop",
      String(cropX),
      String(cropY),
      String(cropWidth),
      String(cropHeight),
      "-resize",
      String(targetWidth),
      String(targetHeight),
      "-resize_mode",
      "down_only",
      "-metadata",
      "none",
      prepared.path,
      "-o",
      output,
    ], { stdio: "inherit" });
  } finally {
    if (prepared.temporaryDirectory) {
      rmSync(prepared.temporaryDirectory, { recursive: true, force: true });
    }
  }

  console.log(`Prepared ${output}`);
  console.log(`Source: ${sourceDimensions.width}x${sourceDimensions.height}; crop: ${cropWidth}x${cropHeight} at ${cropX},${cropY}; target: ${targetWidth}x${targetHeight}; quality: ${quality}`);
}

main();
