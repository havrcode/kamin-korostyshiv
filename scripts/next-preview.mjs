import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const forwarded = process.argv.slice(2);
const nextArguments = ["dev"];

for (let index = 0; index < forwarded.length; index += 1) {
  const argument = forwarded[index];

  if (argument === "--host") {
    nextArguments.push("--hostname", forwarded[index + 1]);
    index += 1;
  } else if (argument !== "--strictPort") {
    nextArguments.push(argument);
  }
}

const nextBinary = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);
const child = spawn(process.execPath, [nextBinary, ...nextArguments], {
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code) => process.exit(code ?? 1));
