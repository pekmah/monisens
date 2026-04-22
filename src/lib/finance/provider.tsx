import NetInfo from "@react-native-community/netinfo";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";

import type { CreateTransactionInput, FinanceSnapshot, SyncEngineStatus } from "@/lib/finance/types";
import {
  bootstrapFinanceStore,
  canUseRemoteSync,
  createBudgetUseCase,
  createTransactionUseCase,
  deleteTransactionUseCase,
  loadFinanceSnapshot,
  runFinanceSyncUseCase,
  updateTransactionUseCase,
} from "@/lib/finance/use-cases";

const FinanceContext = createContext<{
  createBudget: (input: {
    amount: string;
    categoryId: string;
    monthKey?: string;
    notes?: string;
  }) => Promise<string>;
  createTransaction: (input: CreateTransactionInput) => Promise<string>;
  deleteTransaction: (id: string) => Promise<void>;
  error: string | null;
  ready: boolean;
  refresh: (searchText?: string) => Promise<void>;
  searchText: string;
  setSearchText: (value: string) => void;
  snapshot: FinanceSnapshot | null;
  syncNow: () => Promise<void>;
  updateTransaction: (id: string, input: Partial<CreateTransactionInput>) => Promise<void>;
} | null>(null);

export function FinanceProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncEngineStatus>("idle");
  const onlineRef = useRef(true);
  const searchRef = useRef(searchText);

  useEffect(() => {
    searchRef.current = searchText;
  }, [searchText]);

  const refresh = useCallback(async (nextSearchText?: string) => {
    const nextSnapshot = loadFinanceSnapshot({
      isOnline: onlineRef.current,
      searchText: nextSearchText ?? searchRef.current,
      status: syncStatus,
    });
    setSnapshot(nextSnapshot);
  }, [syncStatus]);

  const syncNow = useCallback(async () => {
    if (!onlineRef.current || !canUseRemoteSync()) {
      setSyncStatus(!onlineRef.current ? "offline" : "disabled");
      await refresh();
      return;
    }

    setSyncStatus("syncing");
    await refresh();
    const result = await runFinanceSyncUseCase("manual");
    setSyncStatus(result.status);
    await refresh();
    setSyncStatus("idle");
    await refresh();
  }, [refresh]);

  const createLocalTransaction = useCallback(async (input: CreateTransactionInput) => {
    const id = createTransactionUseCase(input);
    await refresh();

    if (onlineRef.current && canUseRemoteSync()) {
      setSyncStatus("syncing");
      await refresh();
      const result = await runFinanceSyncUseCase("write");
      setSyncStatus(result.status);
      await refresh();
      setSyncStatus("idle");
      await refresh();
    }

    return id;
  }, [refresh]);

  const createLocalBudget = useCallback(
    async (input: { amount: string; categoryId: string; monthKey?: string; notes?: string }) => {
      const id = createBudgetUseCase(input);
      await refresh();

      if (onlineRef.current && canUseRemoteSync()) {
        setSyncStatus("syncing");
        await refresh();
        const result = await runFinanceSyncUseCase("write");
        setSyncStatus(result.status);
        await refresh();
        setSyncStatus("idle");
        await refresh();
      }

      return id;
    },
    [refresh],
  );

  const updateLocalTransaction = useCallback(
    async (id: string, input: Partial<CreateTransactionInput>) => {
      updateTransactionUseCase(id, input);
      await refresh();

      if (onlineRef.current && canUseRemoteSync()) {
        setSyncStatus("syncing");
        await refresh();
        const result = await runFinanceSyncUseCase("write");
        setSyncStatus(result.status);
        await refresh();
        setSyncStatus("idle");
        await refresh();
      }
    },
    [refresh],
  );

  const deleteLocalTransaction = useCallback(
    async (id: string) => {
      deleteTransactionUseCase(id);
      await refresh();

      if (onlineRef.current && canUseRemoteSync()) {
        setSyncStatus("syncing");
        await refresh();
        const result = await runFinanceSyncUseCase("write");
        setSyncStatus(result.status);
        await refresh();
        setSyncStatus("idle");
        await refresh();
      }
    },
    [refresh],
  );

  useEffect(() => {
    try {
      bootstrapFinanceStore();
      setSnapshot(
        loadFinanceSnapshot({
          isOnline: onlineRef.current,
          searchText: "",
          status: "idle",
        }),
      );
      setReady(true);
    } catch (setupError) {
      setError(
        setupError instanceof Error
          ? setupError.message
          : "Failed to initialize local finance storage.",
      );
    }
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    void refresh();
  }, [ready, refresh, searchText, syncStatus]);

  useEffect(() => {
    if (!ready || !onlineRef.current || !canUseRemoteSync()) {
      return;
    }

    void runFinanceSyncUseCase("launch").then(() => refresh());
  }, [ready, refresh]);

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const isConnected = Boolean(state.isConnected && state.isInternetReachable !== false);
      const wasOnline = onlineRef.current;
      onlineRef.current = isConnected;
      setSyncStatus(isConnected ? "idle" : "offline");
      void refresh();

      if (isConnected && !wasOnline && canUseRemoteSync()) {
        void runFinanceSyncUseCase("network_reconnect").then(() => refresh());
      }
    });

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void refresh();
        if (onlineRef.current && canUseRemoteSync()) {
          void runFinanceSyncUseCase("resume").then(() => refresh());
        }
      }
    });

    return () => {
      unsubscribeNetInfo();
      appStateSubscription.remove();
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      createBudget: createLocalBudget,
      createTransaction: createLocalTransaction,
      deleteTransaction: deleteLocalTransaction,
      error,
      ready,
      refresh,
      searchText,
      setSearchText,
      snapshot,
      syncNow,
      updateTransaction: updateLocalTransaction,
    }),
    [
      createLocalBudget,
      createLocalTransaction,
      deleteLocalTransaction,
      error,
      ready,
      refresh,
      searchText,
      snapshot,
      syncNow,
      updateLocalTransaction,
    ],
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);

  if (!context) {
    throw new Error("useFinance must be used within FinanceProvider.");
  }

  return context;
}
