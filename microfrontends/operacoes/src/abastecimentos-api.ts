export type Vinculo = { id: string; veiculoId: string; veiculoPlaca: string; motoristaId: string; motoristaNome: string; inicio: string; fim: string | null };
export type Abastecimento = { id: string; veiculoId: string; motoristaId: string; realizadoEm: string; combustivel: string; litros: number; valorTotal: number; quilometragem: number; criadoEm: string };
export type NovoAbastecimento = Omit<Abastecimento, "id" | "criadoEm">;
export class ErroAbastecimento extends Error {}

async function resposta<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  let message = "Não foi possível concluir a operação.";
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) message = body.message;
  } catch { /* resposta sem JSON */ }
  throw new ErroAbastecimento(message);
}

export async function listarVinculosAtivos(token: string): Promise<Vinculo[]> {
  const response = await fetch(apiUrl("/api/v1/vinculos?pagina=0&tamanho=100"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return (await resposta<Vinculo[]>(response)).filter((item) => !item.fim);
}

export async function listarAbastecimentos(token: string, pagina = 0) {
  const response = await fetch(apiUrl(`/api/v1/abastecimentos?pagina=${pagina}&tamanho=20`), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resposta<Abastecimento[]>(response);
}

export async function registrarAbastecimento(token: string, entrada: NovoAbastecimento) {
  const response = await fetch(apiUrl("/api/v1/abastecimentos"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(entrada),
  });
  return resposta<Abastecimento>(response);
}
import { apiUrl } from "./api-url";

