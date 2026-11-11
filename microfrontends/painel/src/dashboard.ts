export type ProximaManutencao = {
  veiculoId: string;
  placa: string;
  tipo: string;
  data: string;
};

export type Dashboard = {
  gastoAbastecimentos: number;
  gastoManutencoes: number;
  gastoTotal: number;
  quantidadeAbastecimentos: number;
  quantidadeManutencoes: number;
  totalVeiculos: number;
  veiculosDisponiveis: number;
  veiculosEmUso: number;
  veiculosEmManutencao: number;
  veiculosInativos: number;
  proximasManutencoes: ProximaManutencao[];
};

export async function consultarDashboard(
  token: string,
  fetcher: typeof fetch = fetch,
): Promise<Dashboard> {
  const resposta = await fetcher(apiUrl("/api/v1/dashboard"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resposta.ok) throw new Error("dashboard_indisponivel");
  return (await resposta.json()) as Dashboard;
}
import { apiUrl } from "./api-url";

