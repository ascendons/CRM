// Insert test products into catalog
// Run with: mongosh crm insert-test-products.js

const tenantId = "your_tenant_id"; // Replace with your actual tenant ID
const userId = "your_user_id";     // Replace with your actual user ID

const products = [
  {
    tenantId: tenantId,
    productId: "DP-TEST-001",
    displayName: "Laptop Computer",
    category: "Electronics",
    attributes: [
      { key: "productname", originalKey: "ProductName", value: "Laptop Computer", type: "STRING", searchable: true },
      { key: "unit", originalKey: "Unit", value: "Piece", type: "STRING", searchable: true },
      { key: "description", originalKey: "Description", value: "Dell Laptop 16GB RAM", type: "STRING", searchable: true },
      { key: "unitprice", originalKey: "UnitPrice", value: "50000", type: "NUMBER", numericValue: 50000, searchable: true },
      { key: "hsncode", originalKey: "HsnCode", value: "8471", type: "STRING", searchable: true }
    ],
    source: {
      fileName: "test_data.xlsx",
      uploadedAt: new Date(),
      uploadedBy: userId,
      headers: ["ProductName", "Unit", "Description", "UnitPrice", "HsnCode"]
    },
    createdAt: new Date(),
    createdBy: userId,
    lastModifiedAt: new Date(),
    lastModifiedBy: userId,
    deleted: false
  },
  {
    tenantId: tenantId,
    productId: "DP-TEST-002",
    displayName: "Office Chair",
    category: "Furniture",
    attributes: [
      { key: "productname", originalKey: "ProductName", value: "Office Chair", type: "STRING", searchable: true },
      { key: "unit", originalKey: "Unit", value: "Piece", type: "STRING", searchable: true },
      { key: "description", originalKey: "Description", value: "Ergonomic Office Chair", type: "STRING", searchable: true },
      { key: "unitprice", originalKey: "UnitPrice", value: "8000", type: "NUMBER", numericValue: 8000, searchable: true },
      { key: "hsncode", originalKey: "HsnCode", value: "9401", type: "STRING", searchable: true }
    ],
    source: {
      fileName: "test_data.xlsx",
      uploadedAt: new Date(),
      uploadedBy: userId,
      headers: ["ProductName", "Unit", "Description", "UnitPrice", "HsnCode"]
    },
    createdAt: new Date(),
    createdBy: userId,
    lastModifiedAt: new Date(),
    lastModifiedBy: userId,
    deleted: false
  },
  {
    tenantId: tenantId,
    productId: "DP-TEST-003",
    displayName: "Desk Lamp",
    category: "Office Supplies",
    attributes: [
      { key: "productname", originalKey: "ProductName", value: "Desk Lamp", type: "STRING", searchable: true },
      { key: "unit", originalKey: "Unit", value: "Piece", type: "STRING", searchable: true },
      { key: "description", originalKey: "Description", value: "LED Desk Lamp", type: "STRING", searchable: true },
      { key: "unitprice", originalKey: "UnitPrice", value: "2000", type: "NUMBER", numericValue: 2000, searchable: true },
      { key: "hsncode", originalKey: "HsnCode", value: "9405", type: "STRING", searchable: true }
    ],
    source: {
      fileName: "test_data.xlsx",
      uploadedAt: new Date(),
      uploadedBy: userId,
      headers: ["ProductName", "Unit", "Description", "UnitPrice", "HsnCode"]
    },
    createdAt: new Date(),
    createdBy: userId,
    lastModifiedAt: new Date(),
    lastModifiedBy: userId,
    deleted: false
  }
];

print("Inserting test products...");
const result = db.dynamic_products.insertMany(products);
print("Inserted " + result.insertedIds.length + " products");
print("Product IDs:", result.insertedIds);
