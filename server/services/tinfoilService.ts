import bcrypt from "bcryptjs";

/**
 * Gera credenciais Tinfoil personalizadas para um usuário
 * @param email Email do usuário
 * @returns Objeto com tinfoilUser e tinfoilPass (hash)
 */
export function generateTinfoilCredentials(email: string) {
  // Gera username baseado no email
  const baseUser = email
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

  // Gera senha aleatória
  const tinfoilPassPlain = Math.random().toString(36).slice(-6).toUpperCase();

  // Faz hash da senha
  const salt = bcrypt.genSaltSync(10);
  const tinfoilPass = bcrypt.hashSync(tinfoilPassPlain, salt);

  return {
    tinfoilUser: baseUser,
    tinfoilPass,
    tinfoilPassPlain, // Retorna apenas para enviar por email
  };
}

/**
 * Valida credenciais Tinfoil
 * @param password Senha em texto plano
 * @param hash Hash armazenado no banco
 * @returns true se válido
 */
export function validateTinfoilPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
