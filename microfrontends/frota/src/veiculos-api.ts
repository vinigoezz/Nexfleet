export type StatusVeiculo =
  | "DISPONIVEL"
  | "EM_USO"
  | "EM_MANUTENCAO"
  | "INATIVO";

export type Veiculo = {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  tipo: string;
  quilometragem: number;
  status: StatusVeiculo;
  dataAquisicao: string;
};

export type DadosVeiculo = Omit<Veiculo, "id">;

const statusValidos = new Set<StatusVeiculo>([
  "DISPONIVEL",
  "EM_USO",
  "EM_MANUTENCAO",
  "INATIVO",
]);

export class ErroVeiculos extends Error {
  constructor(
    public status: number,
    mensagem?: string,
  ) {
    super(
      mensagem ??
      (status === 401
        ? "Sessão expirada. Entre novamente."
        : status === 403
          ? "Seu perfil não pode acessar a Frota."
          : status === 404
            ? "Veículo não encontrado. Atualize a lista."
            : status === 409
              ? "Esta placa já está cadastrada."
              : status === 400 || status === 422
                ? "Confira placa, marca, modelo, ano, tipo, quilometragem, status e data."
                : "Não foi possível acessar a Frota. Tente novamente."),
    );
  }
}

function veiculo(data: unknown): Veiculo {
  if (!data || typeof data !== "object") throw new ErroVeiculos(503);
  const item = data as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      item.id,
    ) ||
    typeof item.placa !== "string" ||
    typeof item.marca !== "string" ||
    typeof item.modelo !== "string" ||
    typeof item.ano !== "number" ||
    typeof item.tipo !== "string" ||
    typeof item.quilometragem !== "number" ||
    typeof item.status !== "string" ||
    !statusValidos.has(item.status as StatusVeiculo) ||
    typeof item.dataAquisicao !== "string"
  )
    throw new ErroVeiculos(503);
  return item as Veiculo;
}

async function request(
  token: string,
  path: string,
  method = "GET",
  body?: object,
) {
  const response = await fetch(apiUrl(`/api/v1/veiculos${path}`), {
    method,
    credentials: "omit",
    signal: AbortSignal.timeout(10000),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new ErroVeiculos(response.status);
  return response.status === 204 ? null : response.json();
}

export async function listarVeiculos(
  token: string,
  pagina: number,
  status?: StatusVeiculo,
  tamanho = 20,
): Promise<Veiculo[]> {
  const filtro = status ? `&status=${encodeURIComponent(status)}` : "";
  const data = await request(
    token,
    `?pagina=${pagina}&tamanho=${tamanho}${filtro}`,
  );
  if (!Array.isArray(data)) throw new ErroVeiculos(503);
  return data.map(veiculo);
}

export async function salvarVeiculo(
  token: string,
  dados: DadosVeiculo,
  id?: string,
): Promise<Veiculo> {
  return veiculo(
    await request(
      token,
      id ? `/${encodeURIComponent(id)}` : "",
      id ? "PUT" : "POST",
      dados,
    ),
  );
}

export async function inativarVeiculo(
  token: string,
  id: string,
): Promise<void> {
  await request(token, `/${encodeURIComponent(id)}`, "DELETE");
}

/** Exclusão definitiva: só para veículo inativo e sem histórico (ADR 0038). */
export async function excluirVeiculo(token: string, id: string): Promise<void> {
  const response = await fetch(
    apiUrl(`/api/v1/veiculos/${encodeURIComponent(id)}/definitivo`),
    {
      method: "DELETE",
      credentials: "omit",
      signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (response.ok) return;
  // 409 (com histórico) e 422 (ainda ativo) trazem a explicação do servidor.
  let mensagem: string | undefined;
  if (response.status === 409 || response.status === 422) {
    const corpo = await response.json().catch(() => null);
    if (corpo && typeof corpo.message === "string") mensagem = corpo.message;
  }
  throw new ErroVeiculos(response.status, mensagem);
}
import { apiUrl } from "./api-url";

