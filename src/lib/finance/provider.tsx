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

import { subscribeToAiQueueUpdates } from "@/lib/ai/events";
import type {
  CreateTransactionInput,
  FinanceSnapshot,
  IgnoredSmsMessageRecord,
  SmsCandidatePage,
  SmsImportResult,
  SmsPermissionState,
  SmsSourceProfileGroup,
  TransactionRecord,
} from "@/lib/finance/types";
import {
  acceptSmsCandidateReviewUseCase,
  approveCategoryProposalUseCase,
  bootstrapFinanceStore,
  connectAiJobStreamUseCase,
  createBudgetUseCase,
  createCategoryUseCase,
  createSmsSourceProfileUseCase,
  createTransactionUseCase,
  deleteCategoryUseCase,
  deleteSmsSourceProfileUseCase,
  deleteTransactionUseCase,
  disconnectAiJobStreamUseCase,
  dismissSmsCandidateReviewUseCase,
  duplicateSmsSourceProfileUseCase,
  getSmsListenerEnabledUseCase,
  getSmsPermissionStatusUseCase,
  handleIncomingSmsUseCase,
  importSmsInboxUseCase,
  loadFinanceSnapshot,
  loadIgnoredSmsMessagesUseCase,
  loadPendingSmsCandidatesPageUseCase,
  loadSmsSourceProfileGroupsUseCase,
  loadTransactionByIdUseCase,
  reorderSmsSourceProfilesUseCase,
  reprocessIgnoredSmsMessageUseCase,
  rejectCategoryProposalUseCase,
  requestSmsPermissionUseCase,
  retryAiJobUseCase,
  runAiJobQueueUseCase,
  seedLocalDemoTransactionsUseCase,
  setSmsSyncErrorUseCase,
  startSmsListenerUseCase,
  stopSmsListenerUseCase,
  syncRemoteAiJobsUseCase,
  syncRemoteAiJobUseCase,
  updateCategoryUseCase,
  updateSmsImportLimitUseCase,
  updateSmsSourceProfileUseCase,
  updateSmsCandidateCategoryUseCase,
  updateTransactionUseCase,
} from "@/lib/finance/use-cases";
import { stopSmsListening, subscribeToSmsEvents } from "@/lib/sms-native";

const FinanceContext = createContext<{
  acceptSmsCandidate: (id: string) => Promise<string>;
  approveCategoryProposal: (id: string) => Promise<void>;
  createCategory: (input: { color: string; label: string }) => Promise<string>;
  createSmsSourceProfile: (input: {
    action: "process" | "exclude";
    description?: string | null;
    enabled: boolean;
    label: string;
    matchers: Array<{
      caseSensitive: boolean;
      enabled: boolean;
      field: "sender" | "body";
      matchType: "exact" | "contains" | "regex";
      pattern: string;
    }>;
    parserKey: "mpesa" | "bank-credit-debit" | "none";
  }) => Promise<string>;
  createBudget: (input: {
    amount: string;
    categoryId: string;
    monthKey?: string;
    notes?: string;
  }) => Promise<string>;
  createTransaction: (input: CreateTransactionInput) => Promise<string>;
  deleteCategory: (id: string) => Promise<void>;
  deleteSmsSourceProfile: (id: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  dismissSmsCandidate: (id: string) => Promise<void>;
  duplicateSmsSourceProfile: (id: string) => Promise<string>;
  error: string | null;
  importSmsInbox: () => Promise<SmsImportResult>;
  loadIgnoredSmsMessages: (limit?: number) => Promise<IgnoredSmsMessageRecord[]>;
  loadPendingSmsCandidatesPage: (input: {
    limit: number;
    offset: number;
  }) => Promise<SmsCandidatePage>;
  loadSmsSourceProfileGroups: () => Promise<SmsSourceProfileGroup>;
  loadTransactionById: (id: string) => Promise<TransactionRecord | null>;
  requestSmsPermission: () => Promise<SmsPermissionState>;
  ready: boolean;
  refresh: (searchText?: string) => Promise<void>;
  reorderSmsSourceProfiles: (ids: string[]) => Promise<void>;
  reprocessIgnoredSmsMessage: (messageId: string) => Promise<void>;
  rejectCategoryProposal: (id: string) => Promise<void>;
  retryAiJobs: () => Promise<void>;
  runAiQueue: () => Promise<void>;
  searchText: string;
  seedDemoTransactions: () => Promise<{ count: number; ids: string[] }>;
  setSmsListenerEnabled: (enabled: boolean) => Promise<void>;
  setSearchText: (value: string) => void;
  snapshot: FinanceSnapshot | null;
  updateCategory: (input: {
    color: string;
    id: string;
    label: string;
  }) => Promise<void>;
  updateSmsSourceProfile: (input: {
    action: "process" | "exclude";
    description?: string | null;
    enabled: boolean;
    id: string;
    label: string;
    matchers: Array<{
      caseSensitive: boolean;
      enabled: boolean;
      field: "sender" | "body";
      id?: string;
      matchType: "exact" | "contains" | "regex";
      pattern: string;
    }>;
    parserKey: "mpesa" | "bank-credit-debit" | "none";
    sortOrder: number;
  }) => Promise<void>;
  updateSmsCandidateCategory: (
    id: string,
    categoryId: string | null,
  ) => Promise<void>;
  updateSmsImportLimit: (limit: number) => Promise<number>;
  updateTransaction: (
    id: string,
    input: Partial<CreateTransactionInput>,
  ) => Promise<void>;
} | null>(null);

export function FinanceProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null);
  const [smsPermissionState, setSmsPermissionState] =
    useState<SmsPermissionState>("unknown");
  const onlineRef = useRef(true);
  const readyRef = useRef(false);
  const remoteAiSyncRef = useRef(false);
  const searchRef = useRef(searchText);

  useEffect(() => {
    searchRef.current = searchText;
  }, [searchText]);

  const refresh = useCallback(
    async (nextSearchText?: string) => {
      if (!readyRef.current) {
        return;
      }

      if (onlineRef.current && !remoteAiSyncRef.current) {
        remoteAiSyncRef.current = true;
        void syncRemoteAiJobsUseCase()
          .then(() => refresh())
          .finally(() => {
            remoteAiSyncRef.current = false;
          });
      }

      const permissionState = await getSmsPermissionStatusUseCase();
      setSmsPermissionState(permissionState);
      const nextSnapshot = loadFinanceSnapshot({
        isOnline: onlineRef.current,
        smsPermissionState: permissionState,
        searchText: nextSearchText ?? searchRef.current,
      });
      setSnapshot(nextSnapshot);
    },
    [],
  );

  const createLocalTransaction = useCallback(
    async (input: CreateTransactionInput) => {
      const id = createTransactionUseCase(input);
      await refresh();
      return id;
    },
    [refresh],
  );

  const seedDemoTransactions = useCallback(async () => {
    const result = seedLocalDemoTransactionsUseCase();
    await refresh();
    return result;
  }, [refresh]);

  const createLocalBudget = useCallback(
    async (input: {
      amount: string;
      categoryId: string;
      monthKey?: string;
      notes?: string;
    }) => {
      const id = createBudgetUseCase(input);
      await refresh();
      return id;
    },
    [refresh],
  );

  const createLocalCategory = useCallback(
    async (input: { color: string; label: string }) => {
      const id = createCategoryUseCase(input);
      await refresh();
      return id;
    },
    [refresh],
  );

  const createLocalSmsSourceProfile = useCallback(
    async (input: {
      action: "process" | "exclude";
      description?: string | null;
      enabled: boolean;
      label: string;
      matchers: Array<{
        caseSensitive: boolean;
        enabled: boolean;
        field: "sender" | "body";
        matchType: "exact" | "contains" | "regex";
        pattern: string;
      }>;
      parserKey: "mpesa" | "bank-credit-debit" | "none";
    }) => {
      const id = createSmsSourceProfileUseCase(input);
      await refresh();
      return id;
    },
    [refresh],
  );

  const updateLocalTransaction = useCallback(
    async (id: string, input: Partial<CreateTransactionInput>) => {
      updateTransactionUseCase(id, input);
      await refresh();
    },
    [refresh],
  );

  const deleteLocalTransaction = useCallback(
    async (id: string) => {
      deleteTransactionUseCase(id);
      await refresh();
    },
    [refresh],
  );

  const updateLocalCategory = useCallback(
    async (input: { color: string; id: string; label: string }) => {
      updateCategoryUseCase(input);
      await refresh();
    },
    [refresh],
  );

  const deleteLocalCategory = useCallback(
    async (id: string) => {
      deleteCategoryUseCase(id);
      await refresh();
    },
    [refresh],
  );

  const updateLocalSmsSourceProfile = useCallback(
    async (input: {
      action: "process" | "exclude";
      description?: string | null;
      enabled: boolean;
      id: string;
      label: string;
      matchers: Array<{
        caseSensitive: boolean;
        enabled: boolean;
        field: "sender" | "body";
        id?: string;
        matchType: "exact" | "contains" | "regex";
        pattern: string;
      }>;
      parserKey: "mpesa" | "bank-credit-debit" | "none";
      sortOrder: number;
    }) => {
      updateSmsSourceProfileUseCase(input);
      await refresh();
    },
    [refresh],
  );

  const deleteLocalSmsSourceProfile = useCallback(
    async (id: string) => {
      deleteSmsSourceProfileUseCase(id);
      await refresh();
    },
    [refresh],
  );

  const duplicateLocalSmsSourceProfile = useCallback(
    async (id: string) => {
      const nextId = duplicateSmsSourceProfileUseCase(id);
      await refresh();
      return nextId;
    },
    [refresh],
  );

  const reorderLocalSmsSourceProfiles = useCallback(
    async (ids: string[]) => {
      reorderSmsSourceProfilesUseCase(ids);
      await refresh();
    },
    [refresh],
  );

  const requestSmsPermission = useCallback(async () => {
    const result = await requestSmsPermissionUseCase();
    setSmsPermissionState(result);
    await refresh();
    return result;
  }, [refresh]);

  const importSmsInbox = useCallback(async () => {
    try {
      const result = await importSmsInboxUseCase();
      if (onlineRef.current) {
        await runAiJobQueueUseCase();
      }
      await refresh();
      return result;
    } catch (importError) {
      setSmsSyncErrorUseCase(
        importError instanceof Error
          ? importError.message
          : "SMS import failed.",
      );
      await refresh();
      throw importError;
    }
  }, [refresh]);

  const loadPendingSmsCandidatesPage = useCallback(
    async (input: { limit: number; offset: number }) =>
      loadPendingSmsCandidatesPageUseCase(input),
    [],
  );

  const loadTransactionById = useCallback(
    async (id: string) => loadTransactionByIdUseCase(id),
    [],
  );

  const loadSmsSourceProfileGroups = useCallback(
    async () => loadSmsSourceProfileGroupsUseCase(),
    [],
  );

  const loadIgnoredSmsMessages = useCallback(
    async (limit = 100) => loadIgnoredSmsMessagesUseCase(limit),
    [],
  );

  const updateSmsImportLimit = useCallback(
    async (limit: number) => {
      const nextLimit = updateSmsImportLimitUseCase(limit);
      await refresh();
      return nextLimit;
    },
    [refresh],
  );

  const setSmsListenerEnabled = useCallback(
    async (enabled: boolean) => {
      try {
        if (enabled) {
          await startSmsListenerUseCase();
        } else {
          await stopSmsListenerUseCase();
        }
        setSmsSyncErrorUseCase(null);
        await refresh();
      } catch (listenerError) {
        setSmsSyncErrorUseCase(
          listenerError instanceof Error
            ? listenerError.message
            : "SMS listener failed.",
        );
        await refresh();
        throw listenerError;
      }
    },
    [refresh],
  );

  const acceptSmsCandidate = useCallback(
    async (id: string) => {
      const transactionId = acceptSmsCandidateReviewUseCase(id);
      await refresh();

      if (onlineRef.current) {
        await runAiJobQueueUseCase();
      }
      return transactionId;
    },
    [refresh],
  );

  const dismissSmsCandidate = useCallback(
    async (id: string) => {
      dismissSmsCandidateReviewUseCase(id);
      await refresh();
    },
    [refresh],
  );

  const updateCandidateCategory = useCallback(
    async (id: string, categoryId: string | null) => {
      updateSmsCandidateCategoryUseCase(id, categoryId);
      await refresh();
    },
    [refresh],
  );

  const approveCategoryProposal = useCallback(
    async (id: string) => {
      approveCategoryProposalUseCase(id);
      await refresh();
    },
    [refresh],
  );

  const rejectCategoryProposal = useCallback(
    async (id: string) => {
      rejectCategoryProposalUseCase(id);
      await refresh();
    },
    [refresh],
  );

  const runAiQueue = useCallback(async () => {
    await runAiJobQueueUseCase();
    await refresh();
  }, [refresh]);

  const retryAiJobs = useCallback(async () => {
    retryAiJobUseCase();
    await runAiJobQueueUseCase();
    await refresh();
  }, [refresh]);

  const reprocessIgnoredSmsMessage = useCallback(
    async (messageId: string) => {
      reprocessIgnoredSmsMessageUseCase(messageId);
      await refresh();
      if (onlineRef.current) {
        await runAiJobQueueUseCase();
        await refresh();
      }
    },
    [refresh],
  );

  useEffect(() => {
    try {
      bootstrapFinanceStore();
      readyRef.current = true;
      setReady(true);
      void refresh("");
    } catch (setupError) {
      setError(
        setupError instanceof Error
          ? setupError.message
          : "Failed to initialize local finance storage.",
      );
    }
  }, [refresh]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    void refresh();
  }, [ready, refresh, searchText, smsPermissionState]);

  useEffect(() => {
    const unsubscribe = subscribeToAiQueueUpdates(() => {
      void refresh();
    });

    return unsubscribe;
  }, [refresh]);

  useEffect(() => {
    if (!ready || !onlineRef.current) {
      return;
    }

    void runAiJobQueueUseCase().then(() => refresh());
  }, [ready, refresh]);

  useEffect(() => {
    if (!ready || smsPermissionState !== "granted") {
      return;
    }

    const listenerEnabled =
      snapshot?.sms.isListenerEnabled ?? getSmsListenerEnabledUseCase();
    if (!listenerEnabled) {
      return;
    }

    void startSmsListenerUseCase().catch((listenerError) => {
      setSmsSyncErrorUseCase(
        listenerError instanceof Error
          ? listenerError.message
          : "SMS listener failed.",
      );
      void refresh();
    });

    const subscription = subscribeToSmsEvents((message) => {
      handleIncomingSmsUseCase({
        ...message,
      });
      void runAiJobQueueUseCase();
      void refresh();
    });

    return () => {
      subscription.remove();
      void stopSmsListening();
    };
  }, [ready, refresh, smsPermissionState, snapshot?.sms.isListenerEnabled]);

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const isConnected = Boolean(
        state.isConnected && state.isInternetReachable !== false,
      );
      onlineRef.current = isConnected;
      void refresh();

      if (isConnected) {
        void runAiJobQueueUseCase().then(() => refresh());
      }
    });

    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") {
          void refresh();
          void runAiJobQueueUseCase().then(() => refresh());
        }
      },
    );

    return () => {
      readyRef.current = false;
      unsubscribeNetInfo();
      appStateSubscription.remove();
    };
  }, [refresh]);

  useEffect(() => {
    const activeBatchJob = snapshot?.ai.activeBatchJob;
    if (!activeBatchJob?.backendJobId) {
      return;
    }

    const disconnect = connectAiJobStreamUseCase(
      activeBatchJob.backendJobId,
      () => {
        void syncRemoteAiJobUseCase(activeBatchJob.backendJobId!).then(() =>
          refresh(),
        );
      },
    );

    const interval = setInterval(() => {
      void syncRemoteAiJobUseCase(activeBatchJob.backendJobId!).then(() =>
        refresh(),
      );
    }, 3_000);

    return () => {
      clearInterval(interval);
      disconnectAiJobStreamUseCase(disconnect);
    };
  }, [refresh, snapshot?.ai.activeBatchJob?.backendJobId]);

  useEffect(() => {
    const activeBatchJob = snapshot?.ai.activeBatchJob;
    if (!activeBatchJob?.backendJobId) {
      return;
    }

    void syncRemoteAiJobUseCase(activeBatchJob.backendJobId).then(() =>
      refresh(),
    );
  }, [
    refresh,
    snapshot?.ai.activeBatchJob?.backendJobId,
    snapshot?.ai.activeBatchJob?.status,
  ]);

  const value = useMemo(
    () => ({
      acceptSmsCandidate,
      approveCategoryProposal,
      createCategory: createLocalCategory,
      createSmsSourceProfile: createLocalSmsSourceProfile,
      createBudget: createLocalBudget,
      createTransaction: createLocalTransaction,
      deleteCategory: deleteLocalCategory,
      deleteSmsSourceProfile: deleteLocalSmsSourceProfile,
      deleteTransaction: deleteLocalTransaction,
      dismissSmsCandidate,
      duplicateSmsSourceProfile: duplicateLocalSmsSourceProfile,
      error,
      importSmsInbox,
      loadIgnoredSmsMessages,
      loadSmsSourceProfileGroups,
      loadTransactionById,
      loadPendingSmsCandidatesPage,
      requestSmsPermission,
      ready,
      refresh,
      reorderSmsSourceProfiles: reorderLocalSmsSourceProfiles,
      reprocessIgnoredSmsMessage,
      rejectCategoryProposal,
      retryAiJobs,
      runAiQueue,
      searchText,
      seedDemoTransactions,
      setSmsListenerEnabled,
      setSearchText,
      snapshot,
      updateCategory: updateLocalCategory,
      updateSmsImportLimit,
      updateSmsSourceProfile: updateLocalSmsSourceProfile,
      updateSmsCandidateCategory: updateCandidateCategory,
      updateTransaction: updateLocalTransaction,
    }),
    [
      acceptSmsCandidate,
      approveCategoryProposal,
      createLocalCategory,
      createLocalSmsSourceProfile,
      createLocalBudget,
      createLocalTransaction,
      deleteLocalCategory,
      deleteLocalSmsSourceProfile,
      deleteLocalTransaction,
      dismissSmsCandidate,
      duplicateLocalSmsSourceProfile,
      error,
      importSmsInbox,
      loadIgnoredSmsMessages,
      loadSmsSourceProfileGroups,
      loadTransactionById,
      loadPendingSmsCandidatesPage,
      requestSmsPermission,
      ready,
      refresh,
      reorderLocalSmsSourceProfiles,
      reprocessIgnoredSmsMessage,
      rejectCategoryProposal,
      retryAiJobs,
      runAiQueue,
      searchText,
      seedDemoTransactions,
      setSmsListenerEnabled,
      snapshot,
      updateLocalCategory,
      updateSmsImportLimit,
      updateLocalSmsSourceProfile,
      updateCandidateCategory,
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
