import { applyFinanceMigrations } from "@/lib/finance/migrations";
import {
  createBudget,
  createTransaction,
  ensureSyncStateRow,
  getFinanceSnapshot,
  softDeleteTransaction,
  updateTransaction,
} from "@/lib/finance/repository";
import { hasRemoteSync, runFinanceSync } from "@/lib/finance/sync-engine";
import type {
  CreateTransactionInput,
  FinanceSnapshot,
  SyncEngineStatus,
} from "@/lib/finance/types";

export function bootstrapFinanceStore() {
  applyFinanceMigrations();
  ensureSyncStateRow();
}

export function loadFinanceSnapshot(input: {
  isOnline: boolean;
  searchText?: string;
  status: SyncEngineStatus;
}): FinanceSnapshot {
  return getFinanceSnapshot({
    hasRemote: hasRemoteSync(),
    isOnline: input.isOnline,
    searchText: input.searchText,
    status: input.status,
  });
}

export async function runFinanceSyncUseCase(trigger: "launch" | "manual" | "network_reconnect" | "resume" | "write") {
  return runFinanceSync(trigger);
}

export function canUseRemoteSync() {
  return hasRemoteSync();
}

export function createBudgetUseCase(input: {
  amount: string;
  categoryId: string;
  monthKey?: string;
  notes?: string;
}) {
  return createBudget(input);
}

export function createTransactionUseCase(input: CreateTransactionInput) {
  return createTransaction(input);
}

export function updateTransactionUseCase(id: string, input: Partial<CreateTransactionInput>) {
  updateTransaction(id, input);
}

export function deleteTransactionUseCase(id: string) {
  softDeleteTransaction(id);
}
