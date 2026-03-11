  Start with Approach 2 (Dedicated Inventory Module) — it's the right balance:

  1. It completes the half-built inventory fields already in Product
  2. The reservation system prevents overselling (Approach 1 doesn't)
  3. The linkedProductId bridge cleanly connects both Product and DynamicProduct to inventory without breaking
  either system
  4. It's architecturally extensible to Approach 3 (multi-warehouse, POs) later without refactoring

  Suggested phasing:

  ┌───────┬──────────────────────────────────────────────────────────────────────┬────────┐
  │ Phase │                                Scope                                 │ Effort │
  ├───────┼──────────────────────────────────────────────────────────────────────┼────────┤
  │ P1    │ StockMovement + manual adjust + stock deduction on proposal accept   │ 1 week │
  ├───────┼──────────────────────────────────────────────────────────────────────┼────────┤
  │ P2    │ Reservation on draft + release on cancel/reject + auto-status update │ 1 week │
  ├───────┼──────────────────────────────────────────────────────────────────────┼────────┤
  │ P3    │ Alert engine + low-stock notifications + inventory dashboard         │ 1 week │
  ├───────┼──────────────────────────────────────────────────────────────────────┼────────┤
  │ P4    │ DynamicProduct → Product linkage + catalog shows stock status        │ 1 week │
  └───────┴──────────────────────────────────────────────────────────────────────┴────────┘

  ---
  Want me to start implementing a specific approach or phase? I can also draw out the full data model and API
  design before writing code if you'd like to validate the design first.