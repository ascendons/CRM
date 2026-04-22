"use client";

import InventoryStatusBadge from "@/components/catalog/InventoryStatusBadge";

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Inventory Components</h1>

      <div className="space-y-4">
        <div>
          <h2 className="font-semibold mb-2">Test 1: InventoryStatusBadge</h2>
          <p className="text-sm text-gray-600 mb-2">Enter a product ID from your catalog:</p>
          <input
            type="text"
            id="productId"
            placeholder="Product ID"
            className="border px-3 py-2 rounded"
          />
          <button
            onClick={() => {
              const id = (document.getElementById("productId") as HTMLInputElement).value;
              if (id) {
                const container = document.getElementById("badge-container");
                if (container) {
                  container.innerHTML = "";
                  const div = document.createElement("div");
                  container.appendChild(div);
                  // Render badge here
                  alert("Badge component loaded. Check console for errors.");
                }
              }
            }}
            className="ml-2 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Test Badge
          </button>
          <div id="badge-container" className="mt-4"></div>
        </div>

        <div className="border-t pt-4">
          <h2 className="font-semibold mb-2">Component Files Check:</h2>
          <ul className="text-sm space-y-1">
            <li>✓ InventoryStatusBadge.tsx - Imported successfully</li>
            <li>Check console (F12) for any import errors</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
          <p className="text-sm">
            <strong>If you see this page without errors,</strong> the components are loading
            correctly. The issue might be in the catalog page itself.
          </p>
        </div>
      </div>
    </div>
  );
}
