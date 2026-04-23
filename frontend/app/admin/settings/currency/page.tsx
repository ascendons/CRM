"use client";

import { useState, useEffect } from "react";
import { currencyApi } from "@/lib/currency";
import { showToast } from "@/lib/toast";
import { RefreshCw, Plus, X } from "lucide-react";

const COMMON_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "JPY", "CAD", "AUD"];

export default function CurrencySettingsPage() {
  const [config, setConfig] = useState<any>(null);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCurrency, setNewCurrency] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cfg, rts] = await Promise.all([currencyApi.getConfig(), currencyApi.getRates()]);
      setConfig(cfg);
      setRates(rts || {});
    } catch {
      showToast.error("Failed to load currency settings");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await currencyApi.refresh();
      showToast.success("Exchange rates refreshed");
      loadData();
    } catch {
      showToast.error("Failed to refresh rates");
    }
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      setSaving(true);
      await currencyApi.updateConfig(config.baseCurrency, config.supportedCurrencies);
      showToast.success("Settings saved");
    } catch {
      showToast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addCurrency = () => {
    if (!newCurrency || config.supportedCurrencies.includes(newCurrency)) return;
    setConfig({
      ...config,
      supportedCurrencies: [...config.supportedCurrencies, newCurrency.toUpperCase()],
    });
    setNewCurrency("");
  };

  const removeCurrency = (code: string) => {
    if (code === config.baseCurrency) return;
    setConfig({
      ...config,
      supportedCurrencies: config.supportedCurrencies.filter((c: string) => c !== code),
    });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!config) return <div className="p-8 text-center text-red-500">Failed to load config</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Multi-Currency Settings</h1>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Rates
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Base Currency</label>
          <select
            value={config.baseCurrency}
            onChange={(e) => setConfig({ ...config, baseCurrency: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {COMMON_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supported Currencies
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {config.supportedCurrencies.map((code: string) => (
              <span
                key={code}
                className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm"
              >
                {code}
                {code !== config.baseCurrency && (
                  <button onClick={() => removeCurrency(code)} className="hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newCurrency}
              onChange={(e) => setNewCurrency(e.target.value.toUpperCase())}
              placeholder="e.g. SGD"
              maxLength={3}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addCurrency}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        {Object.keys(rates).length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Exchange Rates (from {config.baseCurrency})
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(rates)
                .slice(0, 12)
                .map(([code, rate]) => (
                  <div key={code} className="bg-gray-50 rounded-lg p-2 text-sm">
                    <span className="font-medium">{code}</span>
                    <span className="text-gray-500 ml-2">{(rate as number).toFixed(4)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
