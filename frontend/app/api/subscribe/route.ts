import { NextRequest, NextResponse } from "next/server";
import { makeSessionToken } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      api_id?: string;
      commitment?: string;
      leaf_index?: number;
      subscriber_secret?: string;
      subscription_id?: string;
      expiry?: number;
    };

    const { commitment, expiry } = body;
    if (!commitment || !expiry) {
      return NextResponse.json({ error: "commitment and expiry are required" }, { status: 400 });
    }

    if (Math.floor(Date.now() / 1000) > expiry) {
      return NextResponse.json({ error: "expiry is in the past" }, { status: 400 });
    }

    const session_token = makeSessionToken(commitment, expiry);
    return NextResponse.json({ session_token, expires_at: expiry });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
