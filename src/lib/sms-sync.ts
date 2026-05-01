import {
  acceptSmsCandidate,
  getSmsSyncState,
  ingestSmsParseResult,
  markSmsCandidateDismissed,
  updateSmsSyncState,
} from "@/lib/finance/repository";
import type { NativeSmsMessage } from "@/lib/sms-native";
import { resolveSmsSourceMessage } from "@/lib/sms-source";

export function computeSmsFingerprint(message: NativeSmsMessage) {
  return `${normalizeText(message.sender)}:${message.receivedAt}:${hashString(message.body)}`;
}

export async function importSmsMessages(messages: NativeSmsMessage[]) {
  let matchedCount = 0;

  for (const message of messages) {
    const resolved = resolveSmsSourceMessage(message);
    if (resolved.parsed?.parseStatus === "matched") {
      matchedCount += 1;
    }

    ingestSmsParseResult({
      body: message.body,
      deviceMessageId: message.id,
      fingerprint: computeSmsFingerprint(message),
      matchScore: resolved.matchScore,
      parsed: resolved.parsed,
      readAt: message.readAt,
      receivedAt: message.receivedAt,
      sender: message.sender,
      sourceAction: resolved.sourceAction,
      sourceProfileId: resolved.sourceProfileId,
    });
  }

  updateSmsSyncState({
    lastError: null,
    lastImportCount: messages.length,
    lastImportedAt: messages.length ? Math.max(...messages.map((message) => message.receivedAt)) : Date.now(),
  });

  return {
    importedCount: messages.length,
    matchedCount,
  };
}

export function recordSmsListenerEvent(message: NativeSmsMessage) {
  const resolved = resolveSmsSourceMessage(message);
  ingestSmsParseResult({
    body: message.body,
    deviceMessageId: message.id,
    fingerprint: computeSmsFingerprint(message),
    matchScore: resolved.matchScore,
    parsed: resolved.parsed,
    readAt: message.readAt,
    receivedAt: message.receivedAt,
    sender: message.sender,
    sourceAction: resolved.sourceAction,
    sourceProfileId: resolved.sourceProfileId,
  });
  updateSmsSyncState({
    lastError: null,
    lastListenerEventAt: message.receivedAt,
  });
}

export function setSmsListenerEnabled(enabled: boolean) {
  updateSmsSyncState({
    isListenerEnabled: enabled,
    lastError: null,
  });
}

export function setSmsSyncError(message: string | null) {
  updateSmsSyncState({
    lastError: message,
  });
}

export function getSmsListenerEnabled() {
  return Boolean(getSmsSyncState()?.isListenerEnabled);
}

export function acceptSmsCandidateUseCase(id: string) {
  return acceptSmsCandidate(id);
}

export function dismissSmsCandidateUseCase(id: string) {
  markSmsCandidateDismissed(id);
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return String(Math.abs(hash));
}
