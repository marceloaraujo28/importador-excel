export type OpeningBalanceItem = {
  accountId: string;
  bankName: string;
  companyName: string;
  groupName: string;
  referenceDate: string | null;
  initialAvailable: number;
  initialApplication: number;
};

export type ListOpeningBalancesResponse = {
  message: string;
  data: OpeningBalanceItem[];
};

export type UpdateOpeningBalancePayload = {
  referenceDate: string | null;
  initialAvailable: number;
  initialApplication: number;
};

export type UpdateOpeningBalanceResponse = {
  message: string;
  data: {
    accountId: string;
    referenceDate: string | null;
    initialAvailable: number;
    initialApplication: number;
  };
};
