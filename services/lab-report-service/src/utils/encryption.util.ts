import crypto from "crypto";

export class EncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly encryptionKey: Buffer;

  constructor() {
    // Get encryption key from environment variable or generate one
    const keyString = process.env.LAB_DATA_ENCRYPTION_KEY;

    if (!keyString) {
      console.warn(
        "⚠️  LAB_DATA_ENCRYPTION_KEY not found in environment variables. Using a default key for development."
      );
      // In production, this should always come from environment variables
      this.encryptionKey = Buffer.from(
        "your-32-character-secret-key-here12",
        "utf8"
      );
    } else {
      this.encryptionKey = Buffer.from(keyString, "hex");
    }

    if (this.encryptionKey.length !== this.keyLength) {
      throw new Error(
        `Encryption key must be exactly ${this.keyLength} bytes (64 hex characters)`
      );
    }
  }

  /**
   * Encrypt sensitive lab data
   */
  encrypt(data: Record<string, any>): string {
    try {
      const dataString = JSON.stringify(data);
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.encryptionKey,
        iv
      );
      cipher.setAAD(Buffer.from("labdata", "utf8")); // Additional authenticated data

      let encrypted = cipher.update(dataString, "utf8", "hex");
      encrypted += cipher.final("hex");

      const tag = cipher.getAuthTag();

      // Combine IV + tag + encrypted data
      const result =
        iv.toString("hex") + ":" + tag.toString("hex") + ":" + encrypted;

      console.log("🔒 Lab data encrypted successfully");
      return result;
    } catch (error) {
      console.error("❌ Failed to encrypt lab data:", error);
      throw new Error("Encryption failed");
    }
  }

  /**
   * Decrypt sensitive lab data
   */
  decrypt(encryptedData: string): Record<string, any> {
    try {
      const parts = encryptedData.split(":");
      if (parts.length !== 3) {
        throw new Error("Invalid encrypted data format");
      }

      const iv = Buffer.from(parts[0], "hex");
      const tag = Buffer.from(parts[1], "hex");
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv
      );
      decipher.setAAD(Buffer.from("labdata", "utf8"));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      console.log("🔓 Lab data decrypted successfully");
      return JSON.parse(decrypted);
    } catch (error) {
      console.error("❌ Failed to decrypt lab data:", error);
      throw new Error("Decryption failed");
    }
  }

  /**
   * Generate a new encryption key (for setup/rotation)
   */
  static generateNewKey(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Hash sensitive data for indexing/searching (one-way)
   */
  hashForIndex(data: string): string {
    return crypto
      .createHash("sha256")
      .update(data + this.encryptionKey.toString("hex"))
      .digest("hex");
  }
}

export const encryptionService = new EncryptionService();
