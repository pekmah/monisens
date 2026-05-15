import { createElement, useEffect, useMemo, useState } from "react";
import { AppState, Platform } from "react-native";
import { createMMKV } from "react-native-mmkv";

import type { HotUpdaterOptions, RunUpdateProcessResponse } from "@hot-updater/react-native";
import type { ComponentType, PropsWithChildren } from "react";

export const HOT_UPDATER_BASE_URL =
  process.env.EXPO_PUBLIC_HOT_UPDATER_BASE_URL ??
  "https://monisense.ericpekmah.workers.dev/api/check-update";
const OTA_STATUS_KEY = "ota.status";
type HotUpdaterModule = typeof import("@hot-updater/react-native");
const hotUpdaterModule: HotUpdaterModule | null =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Platform.OS === "web" ? null : require("@hot-updater/react-native");

export type OtaUpdateStatus = {
  lastAppliedAt: number | null;
  lastCheckedAt: number | null;
  lastDownloadedAt: number | null;
  lastError: string | null;
  lastUpdateId: string | null;
  status:
    | "disabled"
    | "idle"
    | "checking"
    | "downloading"
    | "downloaded"
    | "up_to_date"
    | "applying"
    | "recovered"
    | "error";
};

const initialStatus: OtaUpdateStatus = {
  lastAppliedAt: null,
  lastCheckedAt: null,
  lastDownloadedAt: null,
  lastError: null,
  lastUpdateId: null,
  status: HOT_UPDATER_BASE_URL ? "idle" : "disabled",
};

const nativeStorage = Platform.OS === "web" ? null : createMMKV();

export const hotUpdaterConfigured = Boolean(HOT_UPDATER_BASE_URL);

export function withHotUpdater<TProps extends object>(
  component: ComponentType<TProps>,
) {
  return (
    hotUpdaterModule?.HotUpdater.wrap(getHotUpdaterOptions())(
      component as ComponentType<object>,
    ) as ComponentType<TProps> | undefined
  ) ?? component;
}

export function getHotUpdaterOptions(): HotUpdaterOptions {
  return {
    baseURL: HOT_UPDATER_BASE_URL,
    onError: (error) => {
      updateStoredOtaStatus({
        lastCheckedAt: Date.now(),
        lastError:
          error instanceof Error ? error.message : "Update check failed.",
        status: "error",
      });
    },
    onNotifyAppReady: (result) => {
      updateStoredOtaStatus({
        lastError: null,
        ...(result.status === "RECOVERED"
          ? {
              lastAppliedAt: Date.now(),
              status: "recovered" as const,
            }
          : {
              status: "idle" as const,
            }),
      });
    },
    onProgress: (progress) => {
      updateStoredOtaStatus({
        lastCheckedAt: Date.now(),
        lastDownloadedAt: progress >= 1 ? Date.now() : getStoredOtaStatus().lastDownloadedAt,
        lastError: null,
        status: progress >= 1 ? "downloaded" : "downloading",
      });
    },
    onUpdateProcessCompleted: (response) => {
      updateStoredOtaStatus(resolveCompletedStatus(response));
    },
    reloadOnForceUpdate: false,
    updateMode: "auto",
    updateStrategy: "appVersion",
  };
}

export function OtaUpdateController({ children }: PropsWithChildren) {
  if (!hotUpdaterModule) {
    return children;
  }

  return createElement(NativeOtaUpdateController, { module: hotUpdaterModule }, children);
}

function NativeOtaUpdateController({
  children,
  module,
}: PropsWithChildren<{ module: HotUpdaterModule }>) {
  const hotUpdater = module.HotUpdater;
  const isUpdateDownloaded = module.useHotUpdaterStore(
    (state) => state.isUpdateDownloaded,
  );

  useEffect(() => {
    if (!hotUpdaterConfigured || !isUpdateDownloaded) {
      return;
    }

    const applyIfBackgrounded = (state: string) => {
      if (state === "active") {
        return;
      }

      updateStoredOtaStatus({
        lastAppliedAt: Date.now(),
        status: "applying",
      });
      void hotUpdater.reload();
    };

    applyIfBackgrounded(AppState.currentState);

    const subscription = AppState.addEventListener(
      "change",
      applyIfBackgrounded,
    );

    return () => {
      subscription.remove();
    };
  }, [hotUpdater, isUpdateDownloaded]);

  return children;
}

export function useOtaUpdateStatus() {
  const progress = hotUpdaterModule?.useHotUpdaterStore((state) => state.progress) ?? 0;
  const isUpdateDownloaded =
    hotUpdaterModule?.useHotUpdaterStore((state) => state.isUpdateDownloaded) ?? false;
  const [storedStatus, setStoredStatus] = useState(getStoredOtaStatus);

  useEffect(() => {
    const interval = setInterval(() => {
      setStoredStatus(getStoredOtaStatus());
    }, 1_000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return useMemo(
    () => ({
      ...storedStatus,
      configured: hotUpdaterConfigured,
      isUpdateDownloaded,
      progress,
    }),
    [isUpdateDownloaded, progress, storedStatus],
  );
}

function resolveCompletedStatus(
  response: RunUpdateProcessResponse,
): Partial<OtaUpdateStatus> {
  if (response.status === "UPDATE") {
    return {
      lastCheckedAt: Date.now(),
      lastDownloadedAt: Date.now(),
      lastError: null,
      lastUpdateId: response.id,
      status: "downloaded",
    };
  }

  if (response.status === "ROLLBACK") {
    return {
      lastCheckedAt: Date.now(),
      lastError: response.message,
      lastUpdateId: response.id,
      status: "recovered",
    };
  }

  return {
    lastCheckedAt: Date.now(),
    lastError: null,
    status: "up_to_date",
  };
}

function getStoredOtaStatus(): OtaUpdateStatus {
  const raw =
    Platform.OS === "web"
      ? getWebStorage()?.getItem(OTA_STATUS_KEY)
      : nativeStorage?.getString(OTA_STATUS_KEY);

  if (!raw) {
    return initialStatus;
  }

  try {
    const parsedStatus = JSON.parse(raw) as Partial<OtaUpdateStatus>;

    return {
      ...initialStatus,
      ...parsedStatus,
      status: hotUpdaterConfigured
        ? parsedStatus.status ?? initialStatus.status
        : "disabled",
    };
  } catch {
    return initialStatus;
  }
}

function updateStoredOtaStatus(update: Partial<OtaUpdateStatus>) {
  const nextStatus = {
    ...getStoredOtaStatus(),
    ...update,
  };
  const raw = JSON.stringify(nextStatus);

  if (Platform.OS === "web") {
    getWebStorage()?.setItem(OTA_STATUS_KEY, raw);
    return;
  }

  nativeStorage?.set(OTA_STATUS_KEY, raw);
}

function getWebStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}
