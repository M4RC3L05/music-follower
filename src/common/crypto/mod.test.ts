import { describe, it } from "@std/testing/bdd";
import { assertEquals, assertRejects } from "@std/assert";
import { encode } from "@std/msgpack";
import { encodeBase64 } from "@std/encoding";
import { extractParts, hash, verify } from "#src/common/crypto/mod.ts";

describe("Crypto", () => {
  describe("hash()", () => {
    it("should hash a password", async () => {
      const p = await hash("foobar");
      const [hf, i, s, h] = extractParts(p);

      assertEquals(hf, "SHA-256");
      assertEquals(i, 600_000);
      assertEquals(s.length, 16);
      assertEquals(h.length * 8, 256);
    });
  });

  describe("verify()", () => {
    it("should throw and error if malformed hash provided", async () => {
      const err = await assertRejects(() => verify("foobar", "foobar"));
      assertEquals(
        (err as Error).message,
        "Malformed hash provided",
      );

      const err2 = await assertRejects(() =>
        verify("foobar", encodeBase64(encode(["foobar"])))
      );
      assertEquals(
        (err2 as Error).message,
        "Malformed hash provided",
      );
    });

    it("should return true if passwords match", async () => {
      const p = await hash("foobar");
      const ok = await verify("foobar", p);

      assertEquals(ok, true);
    });

    it("should return false if passwords do not match", async () => {
      const p = await hash("foobar");
      const ok = await verify("foobar!", p);

      assertEquals(ok, false);
    });

    describe("when hash has different defaults", () => {
      it("should return true if passwords match", async () => {
        // Password = foobar, Iterations = 800_000 & hash function algo = SHA-512 & salt length = 32
        const p =
          "lKdTSEEtNTEyzgAMNQDEIHwlnmGZw3t5B4ywbvTOUKazo3+RmUn8oe20HFqcQmwUxEDSJE2YEkV5OFBAhIAJIz3aEdwVkcw2R9jFIVU7jHsofxhu0gyPcJAcKRbRfp+CmJGi5xrkiViL9uPQpNbhkiYk";
        const ok = await verify("foobar", p);

        assertEquals(ok, true);
      });

      it("should return false if passwords do not match", async () => {
        // Password = foobar, Iterations = 800_000 & hash function algo = SHA-512 & salt length = 32
        const p =
          "lKdTSEEtNTEyzgAMNQDEIHwlnmGZw3t5B4ywbvTOUKazo3+RmUn8oe20HFqcQmwUxEDSJE2YEkV5OFBAhIAJIz3aEdwVkcw2R9jFIVU7jHsofxhu0gyPcJAcKRbRfp+CmJGi5xrkiViL9uPQpNbhkiYk";
        const ok = await verify("foobar!", p);

        assertEquals(ok, false);
      });
    });
  });
});
