import { api } from "@/lib/axios";
import type { ContactFormData } from "@/types";

export async function sendContactMessage(data: ContactFormData): Promise<void> {
  await api.post("/contact", data);
}
