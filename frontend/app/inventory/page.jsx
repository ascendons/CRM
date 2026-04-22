"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Warehouse,
  Package,
  ShoppingCart,
  PackageCheck,
  BookmarkCheck,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const InventoryDashboard = () => {
  const router = useRouter();

  const modules = [
    {
      title: "Warehouses",
      description: "Manage warehouses and storage locations",
      icon: Warehouse,
      path: "/inventory/warehouses",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Stock Management",
      description: "Track inventory levels and stock movements",
      icon: Package,
      path: "/inventory/stock",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Purchase Orders",
      description: "Create and manage purchase orders",
      icon: ShoppingCart,
      path: "/inventory/purchase-orders",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Batch Management",
      description: "Track batches, expiry dates, and QC",
      icon: PackageCheck,
      path: "/inventory/batches",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Reservations",
      description: "Manage stock reservations and allocations",
      icon: BookmarkCheck,
      path: "/inventory/reservations",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Reports & Analytics",
      description: "View comprehensive inventory reports",
      icon: BarChart3,
      path: "/inventory/reports",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management System</h1>
        <p className="text-muted-foreground">
          Comprehensive warehouse and stock management solution
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module, index) => {
          const Icon = module.icon;
          return (
            <Card
              key={index}
              className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
              onClick={() => router.push(module.path)}
            >
              <CardHeader className="space-y-4">
                <div
                  className={`w-16 h-16 rounded-lg ${module.bgColor} flex items-center justify-center`}
                >
                  <Icon className={`w-8 h-8 ${module.color}`} />
                </div>
                <div>
                  <CardTitle>{module.title}</CardTitle>
                  <CardDescription className="mt-2">{module.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Open Module
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryDashboard;
