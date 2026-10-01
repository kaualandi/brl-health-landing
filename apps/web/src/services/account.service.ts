import { api } from "@/lib/axios";

/**
 * Exclui a conta do usuário e todos os dados (LGPD — DELETE /me/account, cascata
 * no backend). A sessão local é encerrada por quem chama, após o sucesso.
 */
export async function deleteAccount(): Promise<void> {
  await api.delete("/me/account");
}
