import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from "react-native";

export type NativeSmsMessage = {
  body: string;
  id: string;
  readAt: number | null;
  receivedAt: number;
  sender: string;
};

type SmsNativeModule = {
  readInbox: (limit: number, sinceTimestamp?: number | null) => Promise<NativeSmsMessage[]>;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
};

const moduleRef = NativeModules.MonisensSms as SmsNativeModule | undefined;
const smsEventEmitter = moduleRef ? new NativeEventEmitter(NativeModules.MonisensSms) : null;
const SMS_EVENT_NAME = "MonisensSmsReceived";

export function isSmsSupportedPlatform() {
  return Platform.OS === "android" && Boolean(moduleRef);
}

export async function getSmsPermissionDiagnostics() {
  if (Platform.OS !== "android") {
    return {
      readGranted: false,
      receiveGranted: false,
      supported: false,
    };
  }

  const [readGranted, receiveGranted] = await Promise.all([
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS),
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS),
  ]);

  return {
    readGranted,
    receiveGranted,
    supported: Boolean(moduleRef),
  };
}

export async function getSmsPermissionStatus() {
  if (Platform.OS !== "android") {
    return "unsupported" as const;
  }

  const readGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);

  return readGranted ? "granted" : "denied";
}

export async function requestSmsPermission() {
  if (Platform.OS !== "android") {
    return "unsupported" as const;
  }

  const result = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  ]);

  const granted =
    result[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED;

  return granted ? "granted" : "denied";
}

export async function ensureSmsListeningPermission() {
  if (Platform.OS !== "android") {
    return "unsupported" as const;
  }

  const alreadyGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  );

  if (alreadyGranted) {
    return "granted" as const;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  );

  return result === PermissionsAndroid.RESULTS.GRANTED ? "granted" : "denied";
}

export async function readSmsInbox(limit: number, sinceTimestamp?: number | null) {
  if (!moduleRef || Platform.OS !== "android") {
    return [];
  }

  const messages = await moduleRef.readInbox(limit, sinceTimestamp ?? null);

  return messages.map((message) => ({
    ...message,
    readAt: message.readAt && message.readAt > 0 ? message.readAt : null,
  }));
}

export async function startSmsListening() {
  if (!moduleRef || Platform.OS !== "android") {
    return;
  }

  await moduleRef.startListening();
}

export async function stopSmsListening() {
  if (!moduleRef || Platform.OS !== "android") {
    return;
  }

  await moduleRef.stopListening();
}

export function subscribeToSmsEvents(listener: (message: NativeSmsMessage) => void) {
  if (!smsEventEmitter) {
    return { remove() {} };
  }

  return smsEventEmitter.addListener(SMS_EVENT_NAME, listener);
}
