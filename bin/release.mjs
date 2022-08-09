#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unused-expressions */

import { $, echo, argv } from "zx";

$.verbose = false;

const allowedReleaseTypes = ["major", "minor", "patch"];
const releaseType = argv._.at(0);

if (!releaseType || !allowedReleaseTypes.includes(releaseType)) {
  echo`Invalid or not provided release type: "${releaseType}"`;
  echo`Valid release types are: ${allowedReleaseTypes.join(", ")}`;

  process.exit(128);
}

echo`Creating a ${releaseType} release.`;

let { stdout: finalTag } = await $`npm version --git-tag-version=false ${releaseType}`;
finalTag = finalTag.trim();

await $`./bin/changelog-generator.mjs ${finalTag} > CHANGELOG.md`;
await $`git add .`;
await $`git commit --no-verify -sm "Release ${finalTag}" &>/dev/null`;
await $`git tag ${finalTag}`;

echo`Release ${finalTag} created.`;
