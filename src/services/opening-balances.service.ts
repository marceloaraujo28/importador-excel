import type {
  ListOpeningBalancesResponse,
  UpdateOpeningBalancePayload,
  UpdateOpeningBalanceResponse,
} from "../types/opening-balance";

const BASE_URL = "http://localhost:3333";

export async function listOpeningBalances(): Promise<ListOpeningBalancesResponse> {
  const response = await fetch(`${BASE_URL}/accounts/opening-balances`);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Erro ao carregar saldos iniciais");
  }

  return response.json();
}

export async function updateOpeningBalance(
  accountCode: string,
  payload: UpdateOpeningBalancePayload,
): Promise<UpdateOpeningBalanceResponse> {
  const response = await fetch(
    `${BASE_URL}/accounts/opening-balances/${accountCode}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Erro ao atualizar saldo inicial");
  }

  return response.json();
}
