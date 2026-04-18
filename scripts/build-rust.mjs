import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rustDir = join(root, "rust-modules");

console.log("Building Rust Wasm module...");

const result = spawnSync("wasm-pack", ["build", "--target", "web"], {
  cwd: rustDir,
  stdio: "inherit",
  shell: true,
});

if (result.error) {
  console.error(result.error.message);
  console.error(
    "Install wasm-pack: https://rustwasm.github.io/wasm-pack/installer/",
  );
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const pkgGitignore = join(rustDir, "pkg", ".gitignore");
if (existsSync(pkgGitignore)) {
  rmSync(pkgGitignore);
}

console.log("Build complete. Now run: npm install ./rust-modules/pkg");
