import { decodeBase64, encodeBase64 } from "@std/encoding";
import { timingSafeEqual } from "@std/crypto";
import { decode, encode } from "@std/msgpack";
import config from "#src/common/config/mod.ts";

type PWHashFunctionAlgo = "SHA-256" | "SHA-384" | "SHA-512";

type PasswordHashComponents = {
  hf: PWHashFunctionAlgo;
  i: number;
  s: Uint8Array;
  h: Uint8Array;
};

const textEncoder = new TextEncoder();

const getKeyLenFromHashFunctionAlgo = (hashFuncName: string) => {
  if (hashFuncName === "SHA-256") {
    return 256;
  }

  if (hashFuncName === "SHA-384") {
    return 384;
  }

  if (hashFuncName === "SHA-512") {
    return 512;
  }

  throw new Error(`Invalid "${hashFuncName}" hash function algorithm provided`);
};

const _hash = async (
  password: string,
  s?: Uint8Array,
  i?: number,
  h?: PWHashFunctionAlgo,
  kl?: number,
): Promise<PasswordHashComponents> => {
  const salt = s ??
    crypto.getRandomValues(new Uint8Array(config.crypto.pbkdf2.saltLength));
  const iterations = i ?? config.crypto.pbkdf2.iterations;
  const hashF = h ?? config.crypto.pbkdf2.hashFunction;
  const keyL = kl ?? getKeyLenFromHashFunctionAlgo(hashF);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const hashed = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: iterations,
      hash: hashF,
    } as Pbkdf2Params,
    baseKey,
    keyL,
  );

  return {
    hf: hashF,
    i: iterations,
    s: salt,
    h: new Uint8Array(hashed),
  };
};

export const hash = async (password: string) => {
  const components = await _hash(password);

  return encodeBase64(
    encode([components.hf, components.i, components.s, components.h]),
  );
};

export const verify = async (password: string, hash: string) => {
  let parts: Awaited<ReturnType<typeof extractParts>>;

  try {
    parts = extractParts(hash);
  } catch {
    throw new Error("Malformed hash provided");
  }

  const [hf, i, s, h] = parts;

  if (!hf || !h || !i || !s) {
    throw new Error("Malformed hash provided");
  }

  const { h: passIn } = await _hash(
    password,
    s,
    Number(i),
    hf,
    h.length * 8,
  );

  return timingSafeEqual(h, passIn);
};

export const extractParts = (hash: string) =>
  decode(decodeBase64(hash)) as [
    PasswordHashComponents["hf"],
    PasswordHashComponents["i"],
    PasswordHashComponents["s"],
    PasswordHashComponents["h"],
  ];
