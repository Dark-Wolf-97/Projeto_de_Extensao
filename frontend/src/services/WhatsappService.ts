import { http } from "./http";

export type WhatsappStatus = "DESCONECTADO" | "AGUARDANDO_QR" | "CONECTADO";

export interface WhatsappStatusResponse {
  status: WhatsappStatus;
  qr: string | null;
}

export const WhatsappService = {
  status: (): Promise<WhatsappStatusResponse> => http<WhatsappStatusResponse>("/whatsapp/status"),

  conectar: (): Promise<WhatsappStatusResponse> =>
    http<WhatsappStatusResponse>("/whatsapp/conectar", { method: "POST" }),

  desconectar: (): Promise<WhatsappStatusResponse> =>
    http<WhatsappStatusResponse>("/whatsapp/desconectar", { method: "POST" }),
};
