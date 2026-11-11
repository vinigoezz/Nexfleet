const nomes = ["identidade", "frota", "operacoes", "indicadores"] as const;
type NomeServico = (typeof nomes)[number];
export type Ambiente = {
  application: "NexFleet";
  stage: "sprint-0";
  status: "UP" | "DEGRADED";
  services: { name: NomeServico; status: "UP" | "DOWN" }[];
};

// TypeScript verifica nosso código, mas o JSON recebido precisa de validação real.
export function validarAmbiente(value: unknown): Ambiente {
  if (!value || typeof value !== "object")
    throw new Error("Resposta inválida da API.");
  const data = value as Record<string, unknown>;
  if (
    data.application !== "NexFleet" ||
    data.stage !== "sprint-0" ||
    !["UP", "DEGRADED"].includes(String(data.status)) ||
    !Array.isArray(data.services) ||
    data.services.length !== 4
  ) {
    throw new Error("Resposta inválida da API.");
  }
  const vistos = new Set<string>();
  for (const item of data.services) {
    if (
      !item ||
      typeof item !== "object" ||
      !nomes.includes(item.name) ||
      !["UP", "DOWN"].includes(item.status) ||
      vistos.has(item.name)
    ) {
      throw new Error("Resposta inválida da API.");
    }
    vistos.add(item.name);
  }
  const todosDisponiveis = data.services.every((item) => item.status === "UP");
  if ((data.status === "UP") !== todosDisponiveis)
    throw new Error("Status inconsistente da API.");
  return data as Ambiente;
}

export async function consultarAmbiente(): Promise<Ambiente> {
  const response = await fetch(apiUrl("/api/v1/ambiente"), {
    signal: AbortSignal.timeout(30000),
  });
  // 503 também tem conteúdo útil: identifica quais serviços estão indisponíveis.
  if (response.status !== 200 && response.status !== 503) {
    throw new Error(`Gateway respondeu HTTP ${response.status}.`);
  }
  const ambiente = validarAmbiente(await response.json());
  if ((response.status === 200) !== (ambiente.status === "UP")) {
    throw new Error("Código HTTP inconsistente com o estado do ambiente.");
  }
  return ambiente;
}
import { apiUrl } from "./api-url";

