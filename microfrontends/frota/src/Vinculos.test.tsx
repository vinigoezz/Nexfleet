// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Vinculos } from "./Vinculos";
import { listarVinculos } from "./vinculos-api";

const veiculoId = "b176f1b1-bc54-4f22-9b2e-fb69469ab033";
const motoristaId = "3ce0bdb7-f1de-47c2-baa3-7b99e343650c";
const vinculoId = "1d4be0d1-4801-41e1-9c5f-9002b2fc6dcc";
const veiculo = {
  id: veiculoId,
  placa: "ABC1D23",
  marca: "Marca",
  modelo: "Van",
  ano: 2026,
  tipo: "Utilitário",
  quilometragem: 0,
  status: "DISPONIVEL",
  dataAquisicao: "2026-01-01",
};
const motorista = {
  id: motoristaId,
  nome: "Ana Silva",
  cpf: "12345678901",
  cnh: "98765432100",
  categoria: "D",
  validadeCnh: "2028-06-30",
  telefone: "41999990000",
  status: "ATIVO",
};
const vinculo = {
  id: vinculoId,
  veiculoId,
  veiculoPlaca: "ABC1D23",
  motoristaId,
  motoristaNome: "Ana Silva",
  inicio: "2026-10-23T15:00:00Z",
  fim: null,
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

function servidor() {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith("/api/v1/veiculos")) return json([veiculo]);
    if (url.startsWith("/api/v1/motoristas")) return json([motorista]);
    if (url.includes("/encerramento"))
      return json({ ...vinculo, fim: "2026-10-23T16:00:00Z" });
    if (url === "/api/v1/vinculos" && init?.method === "POST")
      return json(vinculo, 201);
    return json([vinculo]);
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("lista o histórico e carrega referências ativas", async () => {
  const fetch = servidor();
  vi.stubGlobal("fetch", fetch);
  render(<Vinculos token="teste" />);

  expect(
    await screen.findByRole("button", { name: "Encerrar vínculo de ABC1D23" }),
  ).toBeInTheDocument();
  expect(screen.getAllByText(/Ana Silva/).length).toBeGreaterThan(0);
  expect(fetch).toHaveBeenCalledWith(
    "/api/v1/motoristas?pagina=0&tamanho=100&status=ATIVO",
    expect.objectContaining({ headers: { Authorization: "Bearer teste" } }),
  );
});

it("cria vínculo enviando somente os identificadores", async () => {
  const fetch = servidor();
  vi.stubGlobal("fetch", fetch);
  render(<Vinculos token="teste" />);
  await screen.findByRole("button", { name: "Encerrar vínculo de ABC1D23" });

  fireEvent.change(screen.getByLabelText("Veículo"), {
    target: { value: veiculoId },
  });
  fireEvent.change(screen.getByLabelText("Motorista"), {
    target: { value: motoristaId },
  });
  fireEvent.click(screen.getByRole("button", { name: "Criar vínculo" }));

  await waitFor(() =>
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/vinculos",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ veiculoId, motoristaId }),
      }),
    ),
  );
});

it("encerra com confirmação e mantém o item no histórico", async () => {
  const fetch = servidor();
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("confirm", vi.fn(() => true));
  render(<Vinculos token="teste" />);

  fireEvent.click(
    await screen.findByRole("button", { name: "Encerrar vínculo de ABC1D23" }),
  );
  await waitFor(() =>
    expect(fetch).toHaveBeenCalledWith(
      `/api/v1/vinculos/${vinculoId}/encerramento`,
      expect.objectContaining({ method: "PUT" }),
    ),
  );
});

it("recusa resposta fora do contrato", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(json([{ ...vinculo, veiculoId: "inválido" }])),
  );
  await expect(listarVinculos("teste", 0)).rejects.toThrow("Não foi possível");
});
