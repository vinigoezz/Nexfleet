export type Token = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};
export type Usuario = { id: string; perfil?: "ADMINISTRADOR" | "GESTOR_FROTA" };
export class AuthError extends Error {
  constructor(public status: number) {
    super(
      status === 401
        ? "E-mail, senha ou sessão inválidos."
        : status === 400
          ? "Confira os campos. A senha deve ter no máximo 72 bytes UTF-8."
          : "Não foi possível acessar o serviço de identidade. Tente novamente.",
    );
  }
}

export async function entrar(email: string, senha: string): Promise<Token> {
  const response = await fetch(apiUrl("/api/v1/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
    credentials: "omit",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new AuthError(response.status);
  const data = await response.json();
  if (
    !data ||
    typeof data.accessToken !== "string" ||
    !data.accessToken.trim() ||
    data.tokenType !== "Bearer" ||
    !Number.isInteger(data.expiresIn) ||
    data.expiresIn < 1 ||
    data.expiresIn > 900
  )
    throw new AuthError(503);
  return data;
}

export async function consultarUsuario(accessToken: string): Promise<Usuario> {
  const response = await fetch(apiUrl("/api/v1/auth/me"), {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: "omit",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new AuthError(response.status);
  const data = await response.json();
  if (
    !data ||
    typeof data.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      data.id,
    )
  )
    throw new AuthError(503);
  if (
    data.perfil != null &&
    data.perfil !== "ADMINISTRADOR" &&
    data.perfil !== "GESTOR_FROTA"
  )
    throw new AuthError(503);
  return { id: data.id, perfil: data.perfil ?? undefined };
}
import { apiUrl } from "./api-url";

