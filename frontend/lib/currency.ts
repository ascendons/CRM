import { apiRequest } from "./api-client";

export function formatCurrency(amount: number, currency: string, rate: number = 1): string {
  const converted = amount / rate;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(converted);
}

export const currencyApi = {
  getConfig: () => apiRequest<any>("/admin/settings/currency"),
  updateConfig: (baseCurrency: string, supportedCurrencies: string[]) =>
    apiRequest<any>(`/admin/settings/currency?baseCurrency=${baseCurrency}`, {
      method: "PUT",
      body: JSON.stringify(supportedCurrencies),
    }),
  getRates: () => apiRequest<any>("/admin/settings/currency/rates"),
  refresh: () => apiRequest<any>("/admin/settings/currency/refresh", { method: "POST" }),
};
