// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PainelApp } from "./PainelApp";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("apresenta indicadores financeiros, operacionais e próximas manutenções", async () => {
  const fetcher = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        gastoAbastecimentos: 250.5,
        gastoManutencoes: 400,
        gastoTotal: 650.5,
        quantidadeAbastecimentos: 2,
        quantidadeManutencoes: 1,
        totalVeiculos: 3,
        veiculosDisponiveis: 1,
        veiculosEmUso: 1,
        veiculosEmManutencao: 1,
        veiculosInativos: 0,
        proximasManutencoes: [
          {
            veiculoId: "56df1f89-3a94-444d-a4d3-b97463c74700",
            placa: "ABC1D23",
            tipo: "PREVENTIVA",
            data: "2026-12-06",
          },
        ],
      }),
      { status: 200 },
    ),
  );
  vi.stubGlobal("fetch", fetcher);

  render(<PainelApp token="token" perfil="GESTOR_FROTA" />);

  expect(await screen.findByText("R$ 650,50")).toBeInTheDocument();
  expect(screen.getByText("ABC1D23")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Situação da frota" })).toBeInTheDocument();
  await waitFor(() =>
    expect(fetcher).toHaveBeenCalledWith("/api/v1/dashboard", {
      headers: { Authorization: "Bearer token" },
    }),
  );
});

it("explica a falha e oferece nova tentativa", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
  render(<PainelApp token="token" perfil="GESTOR_FROTA" />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível");
  expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
});
