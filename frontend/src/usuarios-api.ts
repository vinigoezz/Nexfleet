export type Perfil = "ADMINISTRADOR" | "GESTOR_FROTA";
export type Conta = {
  id: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
};

export class ErroUsuarios extends Error {
  constructor(
    public status: number,
    mensagem?: string,
  ) {
    super(
      mensagem ??
      (status === 401
        ? "Sessão expirada. Entre novamente."
        : status === 403
          ? "Acesso exclusivo de Administrador ativo."
          : status === 409
            ? "Este e-mail já está cadastrado."
            : status === 400 || status === 422
              ? "Confira e-mail, perfil e senha (12 caracteres a 72 bytes UTF-8)."
              : status === 404
                ? "Usuário não encontrado. Atualize a lista."
                : "Não foi possível acessar os usuários. Tente novamente."),
    );
  }
}

function conta(data: unknown): Conta {
  if (!data || typeof data !== "object") throw new ErroUsuarios(503);
  const item = data as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      item.id,
    ) ||
    typeof item.email !== "string" ||
    typeof item.ativo !== "boolean" ||
    (item.perfil !== "ADMINISTRADOR" && item.perfil !== "GESTOR_FROTA")
  )
    throw new ErroUsuarios(503);
  return {
    id: item.id,
    email: item.email,
    perfil: item.perfil,
    ativo: item.ativo,
  };
}

async function request(
  token: string,
  path: string,
  method = "GET",
  body?: object,
) {
  const response = await fetch(apiUrl(`/api/v1/usuarios${path}`), {
    method,
    credentials: "omit",
    signal: AbortSignal.timeout(10000),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new ErroUsuarios(response.status);
  return response.status === 204 ? null : response.json();
}

export async function listarContas(
  token: string,
  pagina: number,
): Promise<Conta[]> {
  const data = await request(token, `?pagina=${pagina}&tamanho=20`);
  if (!Array.isArray(data)) throw new ErroUsuarios(503);
  return data.map(conta);
}
export async function salvarConta(
  token: string,
  dados: { email: string; perfil: Perfil; senha?: string; ativo?: boolean },
  id?: string,
): Promise<Conta> {
  return conta(
    await request(
      token,
      id ? `/${encodeURIComponent(id)}` : "",
      id ? "PUT" : "POST",
      dados,
    ),
  );
}
export async function desativarConta(token: string, id: string): Promise<void> {
  await request(token, `/${encodeURIComponent(id)}`, "DELETE");
}

/** Exclusão definitiva: só para conta desativada e diferente da própria (ADR 0038). */
export async function excluirConta(token: string, id: string): Promise<void> {
  const response = await fetch(
    apiUrl(`/api/v1/usuarios/${encodeURIComponent(id)}/definitivo`),
    {
      method: "DELETE",
      credentials: "omit",
      signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (response.ok) return;
  let mensagem: string | undefined;
  if (response.status === 422) {
    const corpo = await response.json().catch(() => null);
    if (corpo && typeof corpo.message === "string") mensagem = corpo.message;
  }
  throw new ErroUsuarios(response.status, mensagem);
}
import { apiUrl } from "./api-url";

