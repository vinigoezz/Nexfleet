export type StatusMotorista = "ATIVO" | "INATIVO";

export type Motorista = {
  id: string;
  nome: string;
  cpf: string;
  cnh: string;
  categoria: string;
  validadeCnh: string;
  telefone: string;
  status: StatusMotorista;
};

export type DadosMotorista = Omit<Motorista, "id">;

const statusValidos = new Set<StatusMotorista>(["ATIVO", "INATIVO"]);

export class ErroMotoristas extends Error {
  constructor(public status: number) {
    super(
      status === 401
        ? "Sessão expirada. Entre novamente."
        : status === 403
          ? "Seu perfil não pode acessar a Frota."
          : status === 404
            ? "Motorista não encontrado. Atualize a lista."
            : status === 409
              ? "O CPF ou a CNH já está cadastrado."
              : status === 400 || status === 422
                ? "Confira nome, CPF, CNH, categoria, validade, telefone e status."
                : "Não foi possível acessar os motoristas. Tente novamente.",
    );
  }
}

function motorista(data: unknown): Motorista {
  if (!data || typeof data !== "object") throw new ErroMotoristas(503);
  const item = data as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      item.id,
    ) ||
    typeof item.nome !== "string" ||
    typeof item.cpf !== "string" ||
    typeof item.cnh !== "string" ||
    typeof item.categoria !== "string" ||
    typeof item.validadeCnh !== "string" ||
    typeof item.telefone !== "string" ||
    typeof item.status !== "string" ||
    !statusValidos.has(item.status as StatusMotorista)
  )
    throw new ErroMotoristas(503);
  return item as Motorista;
}

async function request(
  token: string,
  path: string,
  method = "GET",
  body?: object,
) {
  const response = await fetch(apiUrl(`/api/v1/motoristas${path}`), {
    method,
    credentials: "omit",
    signal: AbortSignal.timeout(10000),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new ErroMotoristas(response.status);
  return response.json();
}

export async function listarMotoristas(
  token: string,
  pagina: number,
  status?: StatusMotorista,
  tamanho = 20,
): Promise<Motorista[]> {
  const filtro = status ? `&status=${encodeURIComponent(status)}` : "";
  const data = await request(
    token,
    `?pagina=${pagina}&tamanho=${tamanho}${filtro}`,
  );
  if (!Array.isArray(data)) throw new ErroMotoristas(503);
  return data.map(motorista);
}

export async function salvarMotorista(
  token: string,
  dados: DadosMotorista,
  id?: string,
): Promise<Motorista> {
  return motorista(
    await request(
      token,
      id ? `/${encodeURIComponent(id)}` : "",
      id ? "PUT" : "POST",
      dados,
    ),
  );
}
import { apiUrl } from "./api-url";

