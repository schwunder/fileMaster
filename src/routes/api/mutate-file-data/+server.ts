/* import { $ } from "bun";

export default async function mutateImageData(
  absPath: string,
  newName: string,
  comment: string,
  tags: string[]
) {
  //todo set name of the_File to "${newName}"
  Bun.spawnSync([
    "osascript",
    "-e",
    `
      set filepath to POSIX file "${absPath}"
      set the_File to filepath as alias
      tell application "Finder"
        set the comment of the_File to "${comment}"
      end tell
    `.replace(/'/g, "'\\''"),
  ]);
  await $`tag -a "${tags.join(",")}" ${absPath}`;
}
*/
