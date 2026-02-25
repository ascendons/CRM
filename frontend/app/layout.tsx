import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import ToastProvider from "@/components/ToastProvider";
import { TenantProvider } from "@/providers/TenantProvider";
import { PermissionProvider } from "@/providers/PermissionProvider";
import { OrganizationProvider } from "@/providers/OrganizationProvider";
import { WebSocketProvider } from "@/providers/WebSocketProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ascendons CRM",
  description: "Enterprise CRM Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-display antialiased`} suppressHydrationWarning>
        <TenantProvider>
          <PermissionProvider>
            <OrganizationProvider>
              <WebSocketProvider>
                <ToastProvider />
                <Navigation />
                {children}
              </WebSocketProvider>
            </OrganizationProvider>
          </PermissionProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
