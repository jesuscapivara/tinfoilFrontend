/**
 * Email Service
 * Integra com o sistema de notificações do Manus
 */

import { notifyOwner } from "../_core/notification";

/**
 * Notifica o admin sobre um novo usuário pendente de aprovação
 */
export async function notifyNewUserRegistration(email: string): Promise<boolean> {
  try {
    return await notifyOwner({
      title: "Novo Usuário Aguardando Aprovação",
      content: `Um novo usuário se registrou: ${email}\n\nAcesse o painel administrativo para revisar e aprovar.`,
    });
  } catch (error) {
    console.error("[Email] Error notifying new user registration:", error);
    return false;
  }
}

/**
 * Notifica o usuário sobre sua aprovação
 */
export async function notifyUserApproval(email: string, tinfoilUser: string, tinfoilPass: string): Promise<boolean> {
  try {
    return await notifyOwner({
      title: `Usuário Aprovado: ${email}`,
      content: `Credenciais Tinfoil:\nUsuário: ${tinfoilUser}\nSenha: ${tinfoilPass}`,
    });
  } catch (error) {
    console.error("[Email] Error notifying user approval:", error);
    return false;
  }
}

/**
 * Notifica sobre um download completado
 */
export async function notifyDownloadComplete(gameName: string, size: string, duration: number): Promise<boolean> {
  try {
    const durationMinutes = Math.floor(duration / 60);
    return await notifyOwner({
      title: "Download Completado",
      content: `Jogo: ${gameName}\nTamanho: ${size}\nDuração: ${durationMinutes} minutos`,
    });
  } catch (error) {
    console.error("[Email] Error notifying download complete:", error);
    return false;
  }
}
