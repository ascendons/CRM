import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "alive",
    service: "crm-frontend",
    timestamp: new Date().toISOString(),
  });
}
