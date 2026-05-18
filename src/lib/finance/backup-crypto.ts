import {
  AESEncryptionKey,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
} from "expo-crypto";
import * as SecureStore from "expo-secure-store";

import type {
  EncryptedFinanceBackup,
  FinanceBackupPayload,
} from "@/lib/finance/backup-schema";
import {
  MONISENS_BACKUP_FORMAT,
  MONISENS_BACKUP_FORMAT_VERSION,
} from "@/lib/finance/backup-schema";

const BACKUP_KEY_STORAGE_KEY = "monisens.backup.device-key.v1";
const BACKUP_CRYPTO_LOG_TAG = "[MonisensBackupCrypto]";
const BASE64_LOOKUP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const BACKUP_DECRYPT_FAILED_MESSAGE =
  "This backup could not be decrypted with this app install. Restore the file on the same device/app install that created it, or create a new backup from the current install.";
const BACKUP_KEY_MISSING_MESSAGE =
  "This app install does not have the device key needed to decrypt local backups. Create a new backup from this install before restoring here.";

export class BackupDecryptFailedError extends Error {
  constructor(message = BACKUP_DECRYPT_FAILED_MESSAGE) {
    super(message);
    this.name = "BackupDecryptFailedError";
  }
}

function getCryptoErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      errorMessage: error.message,
      errorName: error.name,
    };
  }

  return {
    errorMessage: String(error),
    errorName: "UnknownError",
  };
}

function logBackupCryptoDebug(message: string, details?: Record<string, unknown>) {
  console.info(BACKUP_CRYPTO_LOG_TAG, message, details ?? {});
}

function logBackupCryptoError(message: string, error: unknown) {
  console.error(BACKUP_CRYPTO_LOG_TAG, message, getCryptoErrorDetails(error));
}

function isAesAuthenticationError(error: unknown) {
  return (
    error instanceof Error
    && (
      error.message.includes("BAD_DECRYPT")
      || error.message.includes("AES decryption failed")
    )
  );
}

function decodeBase64(value: string) {
  const normalized = value.replace(/\s/g, "");

  if (normalized.length === 0 || normalized.length % 4 === 1) {
    throw new Error("The backup encryption payload is malformed.");
  }

  if (/=/.test(normalized.replace(/={1,2}$/, ""))) {
    throw new Error("The backup encryption payload is malformed.");
  }

  const padding = normalized.endsWith("==")
    ? 2
    : normalized.endsWith("=")
      ? 1
      : 0;
  const bytes = new Uint8Array(Math.floor((normalized.length * 3) / 4) - padding);
  let buffer = 0;
  let bits = 0;
  let index = 0;

  for (const char of normalized) {
    if (char === "=") {
      break;
    }

    const sixBitValue = BASE64_LOOKUP.indexOf(char);

    if (sixBitValue === -1) {
      throw new Error("The backup encryption payload is malformed.");
    }

    buffer = (buffer << 6) | sixBitValue;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      bytes[index] = (buffer >> bits) & 0xff;
      index += 1;
    }
  }

  if (index !== bytes.length) {
    throw new Error("The backup encryption payload is malformed.");
  }

  return bytes;
}

async function getDeviceBackupKey() {
  const existingKey = await SecureStore.getItemAsync(BACKUP_KEY_STORAGE_KEY);

  if (existingKey) {
    return AESEncryptionKey.import(existingKey, "base64");
  }

  const key = await AESEncryptionKey.generate(256);
  await SecureStore.setItemAsync(
    BACKUP_KEY_STORAGE_KEY,
    await key.encoded("base64"),
  );

  return key;
}

async function getExistingDeviceBackupKey() {
  const existingKey = await SecureStore.getItemAsync(BACKUP_KEY_STORAGE_KEY);

  logBackupCryptoDebug("decrypt-device-key-state", {
    hasExistingDeviceKey: Boolean(existingKey),
  });

  if (!existingKey) {
    throw new BackupDecryptFailedError(BACKUP_KEY_MISSING_MESSAGE);
  }

  return AESEncryptionKey.import(existingKey, "base64");
}

export async function encryptFinanceBackupPayload(
  payload: FinanceBackupPayload,
): Promise<EncryptedFinanceBackup> {
  const key = await getDeviceBackupKey();
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const sealedData = await aesEncryptAsync(plaintext, key);
  const combined = await sealedData.combined("base64");

  return {
    algorithm: "AES-GCM",
    createdAt: payload.createdAt,
    format: MONISENS_BACKUP_FORMAT,
    formatVersion: MONISENS_BACKUP_FORMAT_VERSION,
    keyRef: "device",
    keyVersion: 1,
    payloadEncoding: "utf8-json",
    sealedData: combined as string,
  };
}

export async function decryptFinanceBackupPayload(
  backup: EncryptedFinanceBackup,
): Promise<unknown> {
  try {
    logBackupCryptoDebug("decrypt-device-key-load-start", {
      formatVersion: backup.formatVersion,
      keyVersion: backup.keyVersion,
    });

    const key = await getExistingDeviceBackupKey();

    logBackupCryptoDebug("decrypt-device-key-load-complete");

    // Android's native AES bridge expects combined sealed data as bytes, so decode
    // the stored base64 explicitly before crossing into the native module.
    const sealedDataBytes = decodeBase64(backup.sealedData);

    logBackupCryptoDebug("decrypt-sealed-data-decoded", {
      byteLength: sealedDataBytes.byteLength,
    });

    const sealedData = AESSealedData.fromCombined(sealedDataBytes);

    logBackupCryptoDebug("decrypt-native-start");

    const plaintext = await aesDecryptAsync(sealedData, key, { output: "bytes" });

    logBackupCryptoDebug("decrypt-native-complete", {
      byteLength: (plaintext as Uint8Array).byteLength,
    });

    return JSON.parse(new TextDecoder().decode(plaintext as Uint8Array));
  } catch (error) {
    logBackupCryptoError("decrypt-failed", error);

    if (error instanceof BackupDecryptFailedError) {
      throw error;
    }

    if (isAesAuthenticationError(error)) {
      throw new BackupDecryptFailedError();
    }

    throw error;
  }
}
