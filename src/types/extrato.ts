export type ExtractAssignment =
  | "ENTRADAS"
  | "SAÍDAS"
  | "TARIFAS"
  | "APLICAÇÕES"
  | "RESGATES"
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

export type ConfirmExtractReviewPayload = {
  transactions: ImportedTransaction[];
};

export type ConfirmExtractReviewResponse = {
  message: string;
  savedCount?: number;
};

export type ExtratoListItem = {
  id: string;
  accountId: string;
  bankName: string;
  companyName: string;
  date: string;
  description: string;
  amount: number;
  signal: ExtractSignal;
  assignment: Exclude<ExtractAssignment, "IGNORAR">;
  createdAt: string;
};

export type ListExtratosResponse = {
  message: string;
  data: ExtratoListItem[];
};
