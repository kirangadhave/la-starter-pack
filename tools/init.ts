import * as prompt from "prompt";
import { mv, rm, which, exec } from "shelljs";
import * as colors from "colors";
import path from "path";

console.log("Test");
const rmDirs = [".git"];
prompt.start();
prompt.message = "Hello";
process.stdout.write("\x1B[2J\x1B[0f");

console.log(colors.cyan("Beginning setup"));

if (process.env.CI == null) {
}

function suggestLibName(): string {
  return path
    .basename(path.resolve(__dirname, ".."))
    .replace(/[^\w\d]|_/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function isSuggestionDefault(): string {
  if (suggestLibName() === "la_starter_pack")
}