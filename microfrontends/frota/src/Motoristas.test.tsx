// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Motoristas } from "./Motoristas";
import { listarMotoristas } from "./motoristas-api";

const id = "3ce0bdb7-f1de-47c2-baa3-7b99e343650c";
const motorista = {
  id,
  nome: "Ana Silva",
  cpf: "12345678901",
  cnh: "98765432100",
  categoria: "D",
  validadeCnh: "2028-06-30",
  telefone: "41999990000",
  status: "ATIVO",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("lista, mascara documentos e filtra motoristas", async () => {
  const fetch = vi.fn().mockResolvedValue(json([motorista]));
  vi.stubGlobal("fetch", fetch);
  render(<Motoristas token="teste" />);
  expect(
    await screen.findByRole("button", { name: "Editar Ana Silva" }),
  ).toBeInTheDocument();
  expect(screen.getByText(/\*\*\*\.\*\*\*\.\*\*\*-01/)).toBeInTheDocument();
  expect(screen.queryByText(/123\.456\.789-01/)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Filtrar por status"), {
    target: { value: "ATIVO" },
  });
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(fetch).toHaveBeenLastCalledWith(
    "/api/v1/motoristas?pagina=0&tamanho=20&status=ATIVO",
    expect.objectContaining({
      credentials: "omit",
      headers: { Authorization: "Bearer teste" },
    }),
  );
});

it("cadastra com os campos definidos no PJBL", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(json([]))
    .mockResolvedValueOnce(json(motorista, 201))
    .mockResolvedValueOnce(json([motorista]));
  vi.stubGlobal("fetch", fetch);
  render(<Motoristas token="teste" />);
  await screen.findByText("Nenhum motorista nesta página.");
  fireEvent.change(screen.getByLabelText("Nome"), {
    target: { value: "Ana Silva" },
  });
  fireEvent.change(screen.getByLabelText("CPF"), {
    target: { value: "123.456.789-01" },
  });
  fireEvent.change(screen.getByLabelText("CNH"), {
    target: { value: "98765432100" },
  });
  fireEvent.change(screen.getByLabelText("Categoria"), {
    target: { value: "d" },
  });
  fireEvent.change(screen.getByLabelText("Validade da CNH"), {
    target: { value: "2028-06-30" },
  });
  fireEvent.change(screen.getByLabelText("Telefone"), {
    target: { value: "41999990000" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar motorista" }));
  await screen.findByRole("button", { name: "Editar Ana Silva" });
  expect(fetch).toHaveBeenNthCalledWith(
    2,
    "/api/v1/motoristas",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        nome: "Ana Silva",
        cpf: "123.456.789-01",
        cnh: "98765432100",
        categoria: "D",
        validadeCnh: "2028-06-30",
        telefone: "41999990000",
        status: "ATIVO",
      }),
    }),
  );
});

it("edita e permite marcar motorista como inativo", async () => {
  const inativo = { ...motorista, status: "INATIVO" };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(json([motorista]))
    .mockResolvedValueOnce(json(inativo))
    .mockResolvedValueOnce(json([inativo]));
  vi.stubGlobal("fetch", fetch);
  render(<Motoristas token="teste" />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Editar Ana Silva" }),
  );
  fireEvent.change(screen.getByLabelText("Status"), {
    target: { value: "INATIVO" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
  expect(fetch).toHaveBeenNthCalledWith(
    2,
    `/api/v1/motoristas/${id}`,
    expect.objectContaining({ method: "PUT" }),
  );
});

it("recusa resposta fora do contrato", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(json([{ ...motorista, status: "OUTRO" }])),
  );
  await expect(listarMotoristas("teste", 0)).rejects.toThrow(
    "Não foi possível",
  );
});
