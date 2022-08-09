#!/usr/bin/env node
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-unused-expressions */

import { $, echo, argv } from "zx";

$.verbose = false;

async function getRemoteBrowserUrl() {
  const { stdout } = await $`git remote get-url origin`;

  return stdout.trim().replace("git@", "https://").replace(".com:", ".com/").replace(".git", "");
}

async function getTags() {
  const { stdout } = await $`git tag`;
  const result = stdout.trim().split("\n");

  if (argv._.at(0)) {
    result.push(argv._.at(0));
  }

  return result.reverse();
}

/**
 * @param {string} from
 * @param {string} to
 */
async function getCommitsBetween(from, to) {
  const remoteBrowserUrl = await getRemoteBrowserUrl();
  const cmd = $`git log ${[
    from ? `${from}..${to}` : `${to}`,
  ]} --invert-grep --grep="Release v" --format="- %s - [%h]({{remoteBrowserUrl}}/commit/%H)"`;
  const { stdout } = await cmd;

  return stdout.trim().replaceAll("{{remoteBrowserUrl}}", remoteBrowserUrl).split("\n");
}

/**
 * @param {string} tag
 */
async function tagExists(tag) {
  try {
    await $`git rev-parse ${tag} >/dev/null 2>&1`;

    return true;
  } catch {
    return false;
  }
}

echo`# Changelog`;
echo``;

const tags = Object.entries(await getTags());

for (const [index, tag] of tags) {
  const next = tags[Number(index) + 1]?.at(1);
  const exists = await tagExists(tag);

  if (exists) {
    const { stdout: tagDate } = await $`git log -1 --format=%as ${tag}`;
    echo`## ${tag} - ${tagDate.trim()}`;
    echo``;

    const commits = await getCommitsBetween(next, tag);
    echo`${commits.join("\n")}`;
  } else {
    const now = new Date();
    const { stdout: currentCommitHash } = await $`git log HEAD -1 --format="%H"`;

    echo`## ${tag} - ${now.toISOString().split("T").at(0)}`;
    echo``;

    const commits = await getCommitsBetween(next, currentCommitHash.trim());
    echo`${commits.join("\n")}`;
  }

  if (Number(index) < tags.length - 1) {
    echo``;
  }
}
