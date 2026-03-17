import { NextRequest, NextResponse } from "next/server";

const AGORA_BASE_URL = "https://api.agora.io/api/conversational-ai/v1";

function basicAuth() {
  const key = process.env.AGORA_CUSTOMER_KEY!;
  const secret = process.env.AGORA_CUSTOMER_SECRET!;
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

export async function POST(req: NextRequest) {
  const { agentId } = await req.json();
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;

  const res = await fetch(
    `${AGORA_BASE_URL}/projects/${appId}/agents/${agentId}/leave`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: basicAuth(),
      },
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: data.message ?? "Failed to stop agent" },
      { status: res.status },
    );
  }

  return NextResponse.json({ success: true });
}
