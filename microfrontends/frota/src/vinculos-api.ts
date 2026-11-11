export type Vinculo = {
  id: string;
  veiculoId: string;
  veiculoPlaca: string;
  motoristaId: string;
  motoristaNome: string;
  inicio: string;
  fim: string | null;
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ErroVinculos extends Error {
  constructor(public status: number) {
    super(
      status === 401
        ? "Sessão expirada. Entre novamente."
        : status === 403
          ? "Seu perfil não pode acessar a Frota."
          : status === 404
            ? "Veículo, motorista ou vínculo não encontrado."
            : status === 409
              ? "O veículo já possui vínculo ativo ou o vínculo já foi encerrado."
              : status === 400 || status === 422
                ? "O vínculo exige veículo ativo, motorista ativo e CNH válida."
                : "Não foi possível acessar os vínculos. Tente novamente.",
    );
  }
}

function vinculo(data: unknown): Vinculo {
  if (!data || typeof data !== "object") throw new ErroVinculos(503);
  const item = data as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    !uuid.test(item.id) ||
    typeof item.veiculoId !== "string" ||
    !uuid.test(item.veiculoId) ||
    typeof item.veiculoPlaca !== "string" ||
    typeof item.motoristaId !== "string" ||
    !uuid.test(item.motoristaId) ||
    typeof item.motoristaNome !== "string" ||
    typeof item.inicio !== "string" ||
    !(item.fim === null || typeof item.fim === "string")
  )
    throw new ErroVinculos(503);
  return item as Vinculo;
}

async function request(
  token: string,
  path: string,
  method = "GET",
  body?: object,
) {
  const response = await fetch(apiUrl(`/api/v1/vinculos${path}`), {
    method,
    credentials: "omit",
    signal: AbortSignal.timeout(10000),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new ErroVinculos(response.status);
  return response.json();
}

export async function listarVinculos(
  token: string,
  pagina: number,
  veiculoId?: string,
): Promise<Vinculo[]> {
  const filtro = veiculoId
    ? `&veiculoId=${encodeURIComponent(veiculoId)}`
    : "";
  const data = await request(token, `?pagina=${pagina}&tamanho=20${filtro}`);
  if (!Array.isArray(data)) throw new ErroVinculos(503);
  return data.map(vinculo);
}

export async function criarVinculo(
  token: string,
  veiculoId: string,
  motoristaId: string,
): Promise<Vinculo> {
  return vinculo(await request(token, "", "POST", { veiculoId, motoristaId }));
}

export async function encerrarVinculo(
  token: string,
  id: string,
): Promise<Vinculo> {
  return vinculo(
    await request(token, `/${encodeURIComponent(id)}/encerramento`, "PUT"),
  );
}
import { apiUrl } from "./api-url";

