import * as prompt from "prompt";
import { mv, rm, which, exec } from "shelljs";
import * as colors from "colors";
import * as path from "path";
import * as replace from "replace-in-file";
import { readFileSync, writeFileSync } from "fs";

const rmDirs = [".git"];

const rmFiles = [".gitattributes", "tools/init.ts"];

const modifyFiles = ["LICENSE", "package.json", "webpack.config.js"];

prompt.start();
prompt.message = "";
process.stdout.write("\x1B[2J\x1B[0f");

if (!which("git")) {
  console.log(colors.red("Sorry, this script requires git"));
  cleanUp();
  process.exit(1);
}

const promptSchemaLibrarySuggest = {
  properties: {
    useSuggestedName: {
      description: colors.cyan(
        'Would you like it to be called "' + suggestLibName() + '"? [Yes/No]'
      ),
      pattern: /^(y(es)?|n(o)?)$/i,
      type: "string",
      required: true,
      message: 'You need to type "Yes" or "No" to continue...'
    }
  }
};

const promptSchemaLibraryName = {
  properties: {
    library: {
      description: colors.cyan(
        "What do you want the library to be called? (use kebab-case)"
      ),
      pattern: /^[a-z]+(\-[a-z]+)*$/,
      type: "string",
      required: true,
      message:
        '"kebab-case" uses lowercase letters, and hyphens for any punctuation'
    }
  }
};

console.log(colors.cyan("Beginning setup"));

if (process.env.CI == null) {
  if (!isSuggestionDefault()) {
    acceptSuggestedName();
  } else {
    createLibraryName();
  }
} else {
  setup(suggestLibName());
}

function suggestLibName(): string {
  return path
    .basename(path.resolve(__dirname, ".."))
    .replace(/[^\w\d]|_/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function isSuggestionDefault(): boolean {
  return suggestLibName() === "la-starter-pack";
}

function acceptSuggestedName() {
  prompt.get(promptSchemaLibrarySuggest, (err: any, res: any) => {
    if (err) {
      console.log(colors.red("Sorry, you'll need to type the library name"));
      createLibraryName();
    }

    if (res.useSuggestedName.toLowerCase().charAt(0) === "y")
      setup(suggestLibName());
    else createLibraryName();
  });
}

function createLibraryName() {
  prompt.get(promptSchemaLibraryName, (err: any, res: any) => {
    if (err) {
      console.log(
        colors.red("Sorry, there was an error building the workspace :(")
      );
      cleanUp();
      process.exit(1);
      return;
    }

    setup(res.library);
  });
}

function setup(libName: string) {
  console.log(
    colors.cyan(
      "\nThanks for the info. The last few changes are being made... hang tight!\n\n"
    )
  );

  let username = exec("git config user.name").stdout.trim();
  let usermail = exec("git config user.email").stdout.trim();

  cleanUp();
  modifyContents(libName, username, usermail);
  renameItems(libName);
  finalize();
  console.log(colors.cyan("OK, you're all set. Happy coding!! ;)\n"));
}

function cleanUp() {
  console.log(colors.underline.white("Removing unneeded directories"));

  let rmItems = rmDirs.concat(rmFiles);
  rm("-rf", rmItems.map(f => path.resolve(__dirname, "..", f)));
  console.log(colors.red(rmItems.join("\n")));
  console.log("\n");
}

function modifyContents(
  libraryName: string,
  username: string,
  usermail: string
) {
  console.log(colors.underline.white("Modified"));
  let files = modifyFiles.map(f => path.resolve(__dirname, "..", f));
  try {
    const changes = replace.sync({
      files,
      from: [/--libraryname--/g, /--username--/g, /--usermail--/g],
      to: [libraryName, username, usermail]
    });
    console.log(colors.yellow(modifyFiles.join("\n")));
  } catch (error) {
    console.error("An error occurred modifying the file: ", error);
  }

  console.log("\n");
}

function renameItems(libName: string) {}

function finalize() {
  console.log(colors.underline.white("Finalizing"));

  let gitInitOutput = exec('git init "' + path.resolve(__dirname, "..") + '"', {
    silent: true
  }).stdout;
  console.log(colors.green(gitInitOutput.replace(/(\n|\r)+/g, "")));

  let jsonPackage = path.resolve(__dirname, "..", "package.json");
  const pkg = JSON.parse(readFileSync(jsonPackage) as any);

  // Note: Add items to remove from the package file here
  delete pkg.scripts.postinstall;

  // writeFileSync(jsonPackage, JSON.stringify(pkg, null, 2));
  console.log(colors.green("Postinstall script has been removed"));

  console.log("\n");
}
