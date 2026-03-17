export enum EMessageEngineMode {
  AUTO = 1,
}

export interface IMessageListItem {
  uid: number;
  turn_id: string;
  text: string;
  status: number; // 1 usually means END or complete
}

export interface IMessageEngineConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rtcEngine: any;
  renderMode: EMessageEngineMode;
  callback: (list: IMessageListItem[]) => void;
}

export class MessageEngine {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private rtcEngine: any;
  private callback: (list: IMessageListItem[]) => void;
  private messages: IMessageListItem[] = [];

  constructor(config: IMessageEngineConfig) {
    this.rtcEngine = config.rtcEngine;
    this.callback = config.callback;
    
    // Listen to data streams from Agora
    if (this.rtcEngine && this.rtcEngine.on) {
      this.rtcEngine.on("stream-message", (uid: number, payload: Uint8Array) => {
        try {
          // Attempt to parse payload. Depending on the backend, it could be JSON or protobuf.
          // For now, we assume it's a JSON string encoded in UTF-8.
          const textDecoder = new TextDecoder("utf-8");
          const decodedText = textDecoder.decode(payload);
          const data = JSON.parse(decodedText);
          
          const newMessage: IMessageListItem = {
            uid,
            turn_id: data.turn_id || Math.random().toString(),
            text: data.text || "",
            status: data.status || 1,
          };
          
          this.messages.push(newMessage);
          this.callback([...this.messages]);
        } catch (error) {
          console.error("Error decoding stream message:", error);
        }
      });
    }
  }

  public cleanup() {
    if (this.rtcEngine && this.rtcEngine.off) {
      // Remove listener if possible, but in simple case we can just clear references
      this.rtcEngine = null;
    }
    this.messages = [];
  }
}
