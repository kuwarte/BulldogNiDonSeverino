import { NextRequest, NextResponse } from "next/server";

const AGORA_REGIONS = [
  "https://api.agora.io/api/conversational-ai-agent/v2",
  "https://api.sd-rtn.com/api/conversational-ai-agent/v2",
];

function basicAuth() {
  const key = process.env.AGORA_CUSTOMER_KEY!;
  const secret = process.env.AGORA_CUSTOMER_SECRET!;
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

export async function POST(req: NextRequest) {
  const { channel, uid, token } = await req.json();

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;

  // Robust agent UID handling
  const agentUid = process.env.AGORA_AGENT_UID;
  if (!agentUid) {
    console.error(
      "AGORA_AGENT_UID is not set in environment! Using fallback '100'.",
    );
  }

  const body = {
    name: `agap-agent-${channel}-${Math.floor(Math.random() * 1000)}`,
    properties: {
      rtc: {
        app_id: appId,
        channel_name: channel,
        token: token ?? "",
        agent_rtc_uid: String(agentUid || "100"),
        remote_rtc_uids: [String(uid ?? "0")],
        enable_string_uid: true,
        idle_timeout: 30,
      },
      asr: {
        language: "en-US",
      },
      llm: {
        url:
          process.env.AGORA_LLM_URL ??
          "https://generativelanguage.googleapis.com/v1beta",
        api_key: process.env.AGORA_LLM_API_KEY!,
        system_messages: [
          {
            role: "system",
            content:
              process.env.AGORA_SYSTEM_PROMPT ??
              "You are an emergency triage assistant for flood and disaster victims in the Philippines. Speak in Filipino (Tagalog). Ask: 1) Where are you? 2) How many people? 3) How high is the water? Keep responses short and calm.",
          },
        ],
        greeting_message:
          "Nandito ako. Sabihin ang inyong emergency. I am here. State your emergency.",
        failure_message: "Pasensya na, may problema. Please try again.",
        max_history: 10,
        params: {
          model: process.env.AGORA_LLM_MODEL ?? "gemini-2.0-flash",
          max_tokens: 256,
          temperature: 0.7,
        },
      },
      tts: {
        vendor: process.env.AGORA_TTS_VENDOR ?? "elevenlabs",
        params: {
          key: process.env.AGORA_TTS_KEY!,
          voice_id: process.env.AGORA_TTS_VOICE ?? "21m00Tcm4TlvDq8ikWAM",
          model_id: "eleven_turbo_v2_5",
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
    },
  };

  const auth = basicAuth();
  let lastRaw = "";
  let lastStatus = 500;

  for (const base of AGORA_REGIONS) {
    const url = `${base}/projects/${appId}/join`;
    console.log("[start-agent] trying", url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: JSON.stringify(body),
    });

    lastRaw = await res.text();
    lastStatus = res.status;
    console.log("[start-agent] status", res.status, lastRaw);

    if (res.status !== 404) {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(lastRaw);
      } catch {
        /* not json */
      }
      if (!res.ok) {
        return NextResponse.json(
          { error: data, raw: lastRaw },
          { status: res.status },
        );
      }
      return NextResponse.json({ agentId: data.agent_id });
    }
  }

  return NextResponse.json(
    { error: "All regions returned 404", raw: lastRaw },
    { status: 404 },
  );
}
