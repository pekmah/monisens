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
  const key = await getDeviceBackupKey();
  const sealedData = AESSealedData.fromCombined(backup.sealedData);
  const plaintext = await aesDecryptAsync(sealedData, key, { output: "bytes" });

  return JSON.parse(new TextDecoder().decode(plaintext as Uint8Array));
}
