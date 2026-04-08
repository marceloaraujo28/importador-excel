export type ExtractAssignment =
  | "ENTRADAS"
  | "SAÍDAS"
  | "TARIFAS"
  | "APLICAÇÕES"
  | "RESGATES"
  | "RENDIMENTOS"
  | "TRANSFERÊNCIA EC"
  | "IGNORAR"
  | "OUTROS";

export type ExtractSignal = "C" | "D";

export type ImportedTransaction = {
  accountId: string;
  bankName: string;
  companyName: string;
  date: string;
  description: string;
  amount: number;
  ignoreDailySummary?: boolean;
  signal: ExtractSignal;
  assignment: ExtractAssignment;
};

export type ImportedFileResult = {
  fileName: string;
  accountId: string | null;
  bankName: string | null;
  companyName: string | null;
  parser: string | null;
  mimetype: string;
  size: number;
  transactions?: ImportedTransaction[];
  error?: string;
};

export type UploadExtractFilesResponse = {
  message: string;
  files: ImportedFileResult[];
};

export type SaveExtratosPayload = {
  transactions: ImportedTransaction[];
};

export type SaveExtratosResponse = {
  message: string;
  savedCount?: number;
};

export type ConfirmExtractReviewPayload = SaveExtratosPayload;

export type ConfirmExtractReviewResponse = SaveExtratosResponse;

export type CreateExtratosPayload = SaveExtratosPayload;

export type CreateExtratosResponse = SaveExtratosResponse;

export type ExtratoListItem = {
  id: string;
  accountId: string;
  bankName: string;
  companyName: string;
  date: string;
  description: string;
  amount: number;
  ignoreDailySummary?: boolean;
  signal: ExtractSignal;
  assignment: Exclude<ExtractAssignment, "IGNORAR">;
  createdAt: string;
};

export type ListExtratosMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ListExtratosResponse = {
  message: string;
  data: ExtratoListItem[];
  meta: ListExtratosMeta;
};

export type ListExtratosParams = {
  page?: number;
  pageSize?: number;
  assignment?: Exclude<ExtractAssignment, "IGNORAR">;
  dateFrom?: string;
  dateTo?: string;
  dateOrder?: "asc" | "desc";
  value?: number;
  accountIds?: string[];
  bankNames?: string[];
};

export type UpdateExtratosPayload = {
  updates: Array<{
    id: string;
    assignment: Exclude<ExtractAssignment, "IGNORAR">;
    amount?: number;
    ignoreDailySummary?: boolean;
  }>;
};

export type UpdateExtratosResponse = {
  message: string;
  updatedCount: number;
};

export type DeleteExtratoResponse = {
  message: string;
  deletedCount: number;
};
