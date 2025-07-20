import { decodeHex, encodeHex } from "@std/encoding";
import { timingSafeEqual } from "@std/crypto";

export const hash = async (password: string, s?: string) => {
  const salt = s ? decodeHex(s) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const hashed = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 800_000,
      hash: "SHA-256",
    } as Pbkdf2Params,
    key,
    256,
  );

  return `${encodeHex(salt)}$$${encodeHex(hashed)}`;
};

export const verify = async (password: string, stored: string) => {
  const [saltStored, hashStored] = stored.split("$$");

  if (!saltStored || !hashStored) {
    throw new Error("Malformed password stored provided");
  }

  const passHashIn = await hash(password, saltStored);
  const [_, passIn] = passHashIn.split("$$");

  if (!passIn) {
    throw new Error("Malformed password generated");
  }

  return timingSafeEqual(decodeHex(hashStored), decodeHex(passIn));
};
