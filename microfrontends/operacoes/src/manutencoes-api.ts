export type Veiculo = { id: string; placa: string; modelo: string; status: string };
export type Manutencao = { id: string; veiculoId: string; tipo: string; realizadaEm: string; quilometragem: number; descricao: string; oficina: string; valor: number; proximaManutencao: string | null; criadoEm: string };
export type NovaManutencao = Omit<Manutencao, "id" | "criadoEm">;
export class ErroManutencao extends Error {}

async function resposta<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  let message = "Não foi possível concluir a manutenção.";
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) message = body.message;
  } catch { /* resposta sem JSON */ }
  throw new ErroManutencao(message);
}

export async function listarVeiculosAtivos(token: string): Promise<Veiculo[]> {
  const response = await fetch(apiUrl("/api/v1/veiculos?pagina=0&tamanho=100"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return (await resposta<Veiculo[]>(response)).filter((item) => item.status !== "INATIVO");
}

export async function listarManutencoes(token: string, pagina = 0) {
  const response = await fetch(apiUrl(`/api/v1/manutencoes?pagina=${pagina}&tamanho=20`), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resposta<Manutencao[]>(response);
}

export async function registrarManutencao(token: string, entrada: NovaManutencao) {
  const response = await fetch(apiUrl("/api/v1/manutencoes"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(entrada),
  });
  return resposta<Manutencao>(response);
}
import { apiUrl } from "./api-url";

