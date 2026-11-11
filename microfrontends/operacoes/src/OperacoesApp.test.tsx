// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { OperacoesApp } from "./OperacoesApp";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("exibe formulário e histórico reais da Sprint 2", async () => {
  vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response("[]", { status: 200 }))
    .mockResolvedValueOnce(new Response("[]", { status: 200 }))
    .mockResolvedValueOnce(new Response("[]", { status: 200 }))
    .mockResolvedValueOnce(new Response("[]", { status: 200 }));
  render(<OperacoesApp token="token" perfil="GESTOR_FROTA" />);
  expect(screen.getByRole("heading", { name: "Operações" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Novo abastecimento" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Nova manutenção" })).toBeInTheDocument();
  expect(await screen.findByText("Nenhum abastecimento registrado.")).toBeInTheDocument();
  expect(screen.getByText("Nenhuma manutenção registrada.")).toBeInTheDocument();
});

it("CQ06 preserva dados válidos e marca o valor obrigatório", async () => {
  const vinculo = {
    id: "1d4be0d1-4801-41e1-9c5f-9002b2fc6dcc",
    veiculoId: "b176f1b1-bc54-4f22-9b2e-fb69469ab033",
    veiculoPlaca: "ABC1D23",
    motoristaId: "3ce0bdb7-f1de-47c2-baa3-7b99e343650c",
    motoristaNome: "Ana Silva",
    inicio: "2026-11-08T00:00:00Z",
    fim: null,
  };
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(JSON.stringify([vinculo]), { status: 200 }))
    .mockResolvedValueOnce(new Response("[]", { status: 200 }))
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: vinculo.veiculoId,
            placa: vinculo.veiculoPlaca,
            modelo: "Delivery",
            status: "DISPONIVEL",
          },
        ]),
        { status: 200 },
      ),
    )
    .mockResolvedValueOnce(new Response("[]", { status: 200 }));
  render(<OperacoesApp token="token" perfil="GESTOR_FROTA" />);
  await screen.findByRole("option", { name: /ABC1D23.*Ana Silva/ });
  fireEvent.change(screen.getByLabelText("Veículo e motorista"), {
    target: { value: vinculo.id },
  });
  fireEvent.change(screen.getByLabelText("Litros"), {
    target: { value: "45.50" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Registrar abastecimento" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Revise os campos marcados",
  );
  expect(screen.getByLabelText("Litros")).toHaveValue(45.5);
  expect(screen.getByLabelText("Valor total")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(fetch).toHaveBeenCalledTimes(4);
});
