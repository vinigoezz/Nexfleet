// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { App } from "./App";
import { consultarAmbiente, validarAmbiente } from "./ambiente";

const saudavel = {
  application: "NexFleet",
  stage: "sprint-0",
  status: "UP",
  services: ["identidade", "frota", "operacoes", "indicadores"].map((name) => ({
    name,
    status: "UP",
  })),
};
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("aguarda ação do usuário antes de consultar", () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  render(<App />);
  expect(screen.getByText(/Nenhuma consulta/)).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("consulta somente o Gateway e apresenta os quatro serviços", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(saudavel), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Verificar ambiente" }));
  expect(await screen.findByText("Ambiente disponível")).toBeInTheDocument();
  expect(screen.getAllByText("Disponível")).toHaveLength(4);
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/ambiente",
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
});

it("mostra falha parcial recebida como HTTP 503", async () => {
  const parcial = {
    ...saudavel,
    status: "DEGRADED",
    services: saudavel.services.map((s) => ({
      ...s,
      status: s.name === "frota" ? "DOWN" : "UP",
    })),
  };
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(parcial), { status: 503 }),
      ),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Verificar ambiente" }));
  expect(
    await screen.findByText("Ambiente parcialmente indisponível"),
  ).toBeInTheDocument();
  expect(screen.getByText("Indisponível")).toBeInTheDocument();
});

it("desabilita consultas simultâneas enquanto aguarda resposta", () => {
  vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Verificar ambiente" }));
  expect(screen.getByRole("button", { name: "Consultando…" })).toBeDisabled();
});

it("permite tentar novamente após erro de rede", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce(new Response(JSON.stringify(saudavel))),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Verificar ambiente" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível",
  );
  fireEvent.click(screen.getByRole("button", { name: "Verificar ambiente" }));
  expect(await screen.findByText("Ambiente disponível")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("rejeita serviços repetidos e status agregado incoerente", () => {
  expect(() =>
    validarAmbiente({
      ...saudavel,
      services: Array(4).fill(saudavel.services[0]),
    }),
  ).toThrow();
  expect(() => validarAmbiente({ ...saudavel, status: "DEGRADED" })).toThrow();
});

it("rejeita erro HTTP sem contrato de ambiente", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("bad gateway", { status: 502 })),
  );
  await expect(consultarAmbiente()).rejects.toThrow("HTTP 502");
});

it("rejeita JSON inválido e divergência entre HTTP e conteúdo", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(new Response("{}"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(saudavel), { status: 503 }),
      ),
  );
  await expect(consultarAmbiente()).rejects.toThrow("Resposta inválida");
  await expect(consultarAmbiente()).rejects.toThrow(
    "Código HTTP inconsistente",
  );
});
