import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export class CredentialVault {
  private readonly key: Buffer;

  constructor(keyBase64: string) {
    this.key = Buffer.from(keyBase64, "base64");

    if (this.key.length !== 32) {
      throw new Error("ENCRYPTION_KEY_BASE64 must decode to exactly 32 bytes.");
    }
  }

  encryptSecret(secret: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return ["v1", iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":");
  }

  decryptSecret(payload: string) {
    const [version, ivBase64, tagBase64, ciphertextBase64] = payload.split(":");

    if (version !== "v1" || !ivBase64 || !tagBase64 || !ciphertextBase64) {
      throw new Error("Unsupported encrypted credential format.");
    }

    const decipher = createDecipheriv("aes-256-gcm", this.key, Buffer.from(ivBase64, "base64"));
    decipher.setAuthTag(Buffer.from(tagBase64, "base64"));

    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextBase64, "base64")),
      decipher.final()
    ]).toString("utf8");
  }
}
