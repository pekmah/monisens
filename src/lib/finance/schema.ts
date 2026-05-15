import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const categoriesTable = sqliteTable("categories", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  label: text("label").notNull(),
  color: text("color").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  deletedAt: integer("deleted_at"),
  version: integer("version").notNull(),
  serverUpdatedAt: integer("server_updated_at"),
});

export const transactionsTable = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    merchant: text("merchant").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull(),
    direction: text("direction", { enum: ["expense", "income"] }).notNull(),
    categoryId: text("category_id"),
    accountLabel: text("account_label").notNull(),
    source: text("source", {
      enum: ["manual", "sms", "statement", "import"],
    }).notNull(),
    notes: text("notes"),
    reference: text("reference"),
    transactionAt: integer("transaction_at").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
    version: integer("version").notNull(),
    serverUpdatedAt: integer("server_updated_at"),
  },
  (table) => [
    index("transactions_user_transaction_at_idx").on(
      table.userId,
      table.transactionAt,
    ),
  ],
);

export const budgetsTable = sqliteTable(
  "budgets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    categoryId: text("category_id").notNull(),
    monthKey: text("month_key").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    notes: text("notes"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
    version: integer("version").notNull(),
    serverUpdatedAt: integer("server_updated_at"),
  },
  (table) => [
    index("budgets_user_month_idx").on(table.userId, table.monthKey),
  ],
);

export const billsTable = sqliteTable(
  "bills",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    expectedMerchant: text("expected_merchant").notNull(),
    merchantPattern: text("merchant_pattern"),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull(),
    categoryId: text("category_id"),
    accountLabel: text("account_label").notNull(),
    cadence: text("cadence", {
      enum: ["once", "weekly", "monthly", "yearly"],
    }).notNull(),
    startAt: integer("start_at").notNull(),
    endAt: integer("end_at"),
    occurrenceCount: integer("occurrence_count"),
    notes: text("notes"),
    status: text("status", {
      enum: ["active", "archived"],
    }).notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
    version: integer("version").notNull(),
    serverUpdatedAt: integer("server_updated_at"),
  },
  (table) => [
    index("bills_user_status_idx").on(table.userId, table.status, table.startAt),
  ],
);

export const billOccurrencesTable = sqliteTable(
  "bill_occurrences",
  {
    id: text("id").primaryKey(),
    billId: text("bill_id").notNull(),
    userId: text("user_id").notNull(),
    periodKey: text("period_key").notNull(),
    dueAt: integer("due_at").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull(),
    status: text("status", {
      enum: ["due", "paid", "skipped"],
    }).notNull(),
    linkedTransactionId: text("linked_transaction_id"),
    paidAt: integer("paid_at"),
    matchConfidence: integer("match_confidence"),
    matchReason: text("match_reason"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("bill_occurrences_bill_idx").on(table.billId, table.dueAt),
    index("bill_occurrences_user_due_idx").on(table.userId, table.status, table.dueAt),
  ],
);

export const importsTable = sqliteTable(
  "imports",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    fileName: text("file_name").notNull(),
    source: text("source").notNull(),
    rowCount: integer("row_count").notNull(),
    status: text("status", {
      enum: ["draft", "reviewed", "synced"],
    }).notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
    version: integer("version").notNull(),
    serverUpdatedAt: integer("server_updated_at"),
  },
  (table) => [
    index("imports_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const attachmentsTable = sqliteTable(
  "attachments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    linkedEntityType: text("linked_entity_type"),
    linkedEntityId: text("linked_entity_id"),
    localUri: text("local_uri").notNull(),
    mimeType: text("mime_type").notNull(),
    status: text("status", {
      enum: ["local", "uploaded", "failed"],
    }).notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
    version: integer("version").notNull(),
    serverUpdatedAt: integer("server_updated_at"),
  },
  (table) => [
    index("attachments_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const smsMessagesTable = sqliteTable(
  "sms_messages",
  {
    id: text("id").primaryKey(),
    sender: text("sender").notNull(),
    body: text("body").notNull(),
    receivedAt: integer("received_at").notNull(),
    readAt: integer("read_at"),
    fingerprint: text("fingerprint").notNull(),
    sourceProfileId: text("source_profile_id"),
    sourceAction: text("source_action", {
      enum: ["process", "exclude"],
    }),
    matchScore: integer("match_score"),
    parserKey: text("parser_key"),
    parseStatus: text("parse_status", {
      enum: ["matched", "ignored", "failed"],
    }).notNull(),
    metadataJson: text("metadata_json"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("sms_messages_fingerprint_idx").on(table.fingerprint),
    index("sms_messages_received_at_idx").on(table.receivedAt),
    index("sms_messages_source_profile_idx").on(table.sourceProfileId, table.receivedAt),
  ],
);

export const smsSourceProfilesTable = sqliteTable(
  "sms_source_profiles",
  {
    id: text("id").primaryKey(),
    label: text("label").notNull(),
    description: text("description"),
    parserKey: text("parser_key", {
      enum: ["mpesa", "bank-credit-debit", "none"],
    }).notNull(),
    action: text("action", {
      enum: ["process", "exclude"],
    }).notNull(),
    enabled: integer("enabled").notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("sms_source_profiles_sort_idx").on(table.enabled, table.sortOrder),
  ],
);

export const smsSourceMatchersTable = sqliteTable(
  "sms_source_matchers",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id").notNull(),
    field: text("field", {
      enum: ["sender", "body"],
    }).notNull(),
    matchType: text("match_type", {
      enum: ["exact", "contains", "regex"],
    }).notNull(),
    pattern: text("pattern").notNull(),
    caseSensitive: integer("case_sensitive").notNull(),
    enabled: integer("enabled").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("sms_source_matchers_profile_idx").on(table.profileId, table.enabled),
  ],
);

export const smsTransactionCandidatesTable = sqliteTable(
  "sms_transaction_candidates",
  {
    id: text("id").primaryKey(),
    smsMessageId: text("sms_message_id").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull(),
    direction: text("direction", { enum: ["expense", "income"] }).notNull(),
    merchant: text("merchant").notNull(),
    reference: text("reference"),
    occurredAt: integer("occurred_at").notNull(),
    categoryId: text("category_id"),
    confidence: integer("confidence").notNull(),
    notes: text("notes"),
    status: text("status", {
      enum: ["pending", "accepted", "dismissed"],
    }).notNull(),
    transactionId: text("transaction_id"),
    parserKey: text("parser_key"),
    classificationStatus: text("classification_status", {
      enum: ["not_needed", "queued", "processing", "classified", "failed"],
    }).notNull(),
    classificationSource: text("classification_source", {
      enum: ["rule", "merchant_memory", "ai", "user"],
    }).notNull(),
    classificationConfidence: integer("classification_confidence"),
    classificationReason: text("classification_reason"),
    merchantKey: text("merchant_key"),
    aiJobId: text("ai_job_id"),
    categoryProposalId: text("category_proposal_id"),
    suggestedCategoryLabel: text("suggested_category_label"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("sms_candidates_status_idx").on(table.status, table.occurredAt),
    index("sms_candidates_message_idx").on(table.smsMessageId),
    index("sms_candidates_ai_status_idx").on(table.classificationStatus, table.occurredAt),
  ],
);

export const smsSyncStateTable = sqliteTable("sms_sync_state", {
  scope: text("scope").primaryKey(),
  listenerEnabled: integer("listener_enabled").notNull(),
  importLimit: integer("import_limit").notNull(),
  lastImportedAt: integer("last_imported_at"),
  lastImportCount: integer("last_import_count"),
  lastListenerEventAt: integer("last_listener_event_at"),
  lastError: text("last_error"),
});

export const aiJobsTable = sqliteTable(
  "ai_jobs",
  {
    id: text("id").primaryKey(),
    jobType: text("job_type", {
      enum: ["parse_sms", "classify_candidate", "submit_feedback"],
    }).notNull(),
    scope: text("scope", {
      enum: ["sms_single", "sms_batch", "import_batch"],
    }).notNull(),
    status: text("status", {
      enum: ["pending", "running", "completed", "failed"],
    }).notNull(),
    payloadJson: text("payload_json").notNull(),
    attemptCount: integer("attempt_count").notNull(),
    nextRetryAt: integer("next_retry_at"),
    lastError: text("last_error"),
    backendJobId: text("backend_job_id"),
    progress: integer("progress").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    completedAt: integer("completed_at"),
  },
  (table) => [
    index("ai_jobs_due_idx").on(table.status, table.nextRetryAt, table.createdAt),
  ],
);

export const aiJobItemsTable = sqliteTable(
  "ai_job_items",
  {
    id: text("id").primaryKey(),
    jobId: text("job_id").notNull(),
    itemType: text("item_type", {
      enum: ["sms_message", "sms_candidate", "feedback_event"],
    }).notNull(),
    itemId: text("item_id").notNull(),
    status: text("status", {
      enum: ["pending", "running", "completed", "failed"],
    }).notNull(),
    resultJson: text("result_json"),
    lastError: text("last_error"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("ai_job_items_job_idx").on(table.jobId, table.status),
    index("ai_job_items_target_idx").on(table.itemType, table.itemId),
  ],
);

export const aiFeedbackEventsTable = sqliteTable(
  "ai_feedback_events",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type", {
      enum: ["sms_candidate", "transaction", "bill_payment"],
    }).notNull(),
    entityId: text("entity_id").notNull(),
    merchantName: text("merchant_name"),
    merchantKey: text("merchant_key"),
    amountMinor: integer("amount_minor"),
    direction: text("direction", { enum: ["expense", "income"] }),
    oldCategoryId: text("old_category_id"),
    oldCategoryLabel: text("old_category_label"),
    finalCategoryId: text("final_category_id"),
    finalCategoryLabel: text("final_category_label").notNull(),
    aiSuggestedCategoryLabel: text("ai_suggested_category_label"),
    classificationSource: text("classification_source"),
    aiConfidence: integer("ai_confidence"),
    correctionType: text("correction_type", {
      enum: ["confirmed", "corrected", "manual_teach", "dismissed"],
    }).notNull(),
    syncStatus: text("sync_status", {
      enum: ["pending", "synced", "failed"],
    }).notNull(),
    lastError: text("last_error"),
    createdAt: integer("created_at").notNull(),
    syncedAt: integer("synced_at"),
  },
  (table) => [
    index("ai_feedback_events_sync_idx").on(table.syncStatus, table.createdAt),
    index("ai_feedback_events_merchant_idx").on(table.merchantKey, table.createdAt),
  ],
);

export const categoryProposalsTable = sqliteTable(
  "category_proposals",
  {
    id: text("id").primaryKey(),
    proposedName: text("proposed_name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    linkedCandidateId: text("linked_candidate_id"),
    status: text("status", {
      enum: ["pending", "approved", "rejected"],
    }).notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("category_proposals_status_idx").on(table.status, table.createdAt),
  ],
);

export const merchantMemoryTable = sqliteTable(
  "merchant_memory",
  {
    merchantKey: text("merchant_key").primaryKey(),
    merchantName: text("merchant_name").notNull(),
    categoryId: text("category_id").notNull(),
    confidence: integer("confidence").notNull(),
    source: text("source", {
      enum: ["ai", "user"],
    }).notNull(),
    useCount: integer("use_count").notNull(),
    lastUsedAt: integer("last_used_at").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
);

export const monthlyTotalsTable = sqliteTable("monthly_totals", {
  monthKey: text("month_key").primaryKey(),
  incomeMinor: integer("income_minor").notNull(),
  expenseMinor: integer("expense_minor").notNull(),
  netMinor: integer("net_minor").notNull(),
  transactionCount: integer("transaction_count").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const categorySummaryTable = sqliteTable(
  "category_summary",
  {
    monthKey: text("month_key").notNull(),
    categoryId: text("category_id"),
    amountMinor: integer("amount_minor").notNull(),
    transactionCount: integer("transaction_count").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.monthKey, table.categoryId] })],
);
