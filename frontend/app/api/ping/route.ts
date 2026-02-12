import { NextResponse } from "next/server";

export async function GET() {
  // Ping backend to keep it alive too
  const backendUrl = process.env.BACKEND_URL;
  let backendStatus = "skipped";

  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/v1/ping`, {
        signal: AbortSignal.timeout(60000),
      });
      backendStatus = `HTTP ${res.status}`;
    } catch {
      backendStatus = "unreachable";
    }
  }

  return NextResponse.json({
    status: "alive",
    service: "crm-frontend",
    backend: backendStatus,
    timestamp: new Date().toISOString(),
  });
}
