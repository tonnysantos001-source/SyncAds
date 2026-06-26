// =========================================================================
// MÓDULO DE INTEGRAÇÕES GLOBAL - SUPORTE DE CRIPTOGRAFIA AES-GCM (Deno)
// =========================================================================

import { CryptoInterface } from "../types.ts";

export class Crypto implements CryptoInterface {
  private keyBase64: string | undefined;

  constructor() {
    this.keyBase64 = Deno.env.get("CREDENTIALS_ENCRYPTION_KEY");
  }

  /**
   * Criptografa dados em AES-GCM
   */
  async encrypt(plaintext: any): Promise<string> {
    if (!this.keyBase64) {
      console.warn(
        "[CRYPTO] CREDENTIALS_ENCRYPTION_KEY is not defined. Returning JSON plaintext base64."
      );
      return btoa(JSON.stringify(plaintext));
    }

    try {
      const key = await this.importKey(this.keyBase64);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = new TextEncoder().encode(JSON.stringify(plaintext));
      
      const cipher = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        data
      );

      const out = new Uint8Array(iv.byteLength + cipher.byteLength);
      out.set(iv, 0);
      out.set(new Uint8Array(cipher), iv.byteLength);

      return this.toBase64(out);
    } catch (error: any) {
      console.error("[CRYPTO] Encryption failed:", error.message);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Descriptografa dados em AES-GCM
   */
  async decrypt(ciphertext: string): Promise<any> {
    if (!ciphertext) return {};

    if (!this.keyBase64) {
      console.warn(
        "[CRYPTO] CREDENTIALS_ENCRYPTION_KEY is not defined. Attempting to parse JSON plaintext."
      );
      try {
        return JSON.parse(atob(ciphertext));
      } catch {
        return {};
      }
    }

    try {
      const key = await this.importKey(this.keyBase64);
      const bin = atob(ciphertext);
      const packed = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        packed[i] = bin.charCodeAt(i);
      }

      const iv = packed.slice(0, 12);
      const data = packed.slice(12);

      const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        data
      );

      const text = new TextDecoder().decode(new Uint8Array(plain));
      return JSON.parse(text);
    } catch (error: any) {
      console.error("[CRYPTO] Decryption failed:", error.message);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  private async importKey(base64Key: string): Promise<CryptoKey> {
    const raw = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
    return await crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
      "encrypt",
      "decrypt",
    ]);
  }

  private toBase64(arr: Uint8Array): string {
    let s = "";
    arr.forEach((b) => (s += String.fromCharCode(b)));
    return btoa(s);
  }
}
