import { hash, verify } from "#src/common/crypto/mod.ts";

const h = await hash("bar");
const ok = await verify("bar", h);

console.log(h, ok);
