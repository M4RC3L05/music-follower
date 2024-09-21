#!/usr/bin/env deno

import { pretty, resolveRuntime, runtime } from "@m4rc3l05/pretty-logs";

if (import.meta.main) {
  await pretty(resolveRuntime(runtime()!));
}
