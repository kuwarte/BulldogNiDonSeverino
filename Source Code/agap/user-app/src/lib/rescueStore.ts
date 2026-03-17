import { RescueRequest, RescueStatus, StoreMessage } from "@/types/rescue";

const CHANNEL_NAME = "rescue_channel";
const STORAGE_KEY = "rescue_requests";

export function generateRequestId(): string {
  if (typeof window === "undefined") return "USR-0000";
  
  const count = parseInt(localStorage.getItem("rescue_request_counter") || "0", 10) + 1;
  localStorage.setItem("rescue_request_counter", count.toString());
  return `USR-${count.toString().padStart(4, "0")}`;
}

export function publishRequest(request: RescueRequest) {
  try {
    // 1. Save to local storage
    const existing = loadPersistedRequests();
    const updated = [request, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // 2. Broadcast
    const channel = new BroadcastChannel(CHANNEL_NAME);
    const message: StoreMessage = { type: "NEW_REQUEST", payload: request };
    channel.postMessage(message);
    channel.close();
  } catch (error) {
    console.error("Failed to publish request:", error);
  }
}

export function publishStatusUpdate(id: string, status: RescueStatus) {
  try {
    // 1. Update local storage
    const existing = loadPersistedRequests();
    const updated = existing.map((req) =>
      req.id === id ? { ...req, status } : req
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // 2. Broadcast
    const channel = new BroadcastChannel(CHANNEL_NAME);
    const message: StoreMessage = { type: "UPDATE_STATUS", payload: { id, status } };
    channel.postMessage(message);
    channel.close();
  } catch (error) {
    console.error("Failed to publish status update:", error);
  }
}

export function loadPersistedRequests(): RescueRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to load requests:", error);
    return [];
  }
}

export function subscribeToStore(
  onMessage: (message: StoreMessage) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event) => {
    onMessage(event.data);
  };

  return () => {
    channel.close();
  };
}
