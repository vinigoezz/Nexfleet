// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Veiculos } from "./Veiculos";
import { listarVeiculos } from "./veiculos-api";

const id = "b176f1b1-bc54-4f22-9b2e-fb69469ab033";
const veiculo = {
  id,
  placa: "ABC1D23",
  marca: "Volkswagen",
  modelo: "Delivery",
  ano: 2025,
  tipo: "Caminhão",
  quilometragem: 1200,
  status: "DISPONIVEL",
  dataAquisicao: "2026-01-15",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("lista e filtra veículos pelo Gateway", async () => {
  const fetch = vi.fn().mockResolvedValue(json([veiculo]));
  vi.stubGlobal("fetch", fetch);
  render(<Veiculos token="teste" />);
  expect(
    await screen.findByRole("button", { name: "Editar ABC1D23" }),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Filtrar por status"), {
    target: { value: "DISPONIVEL" },
  });
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(fetch).toHaveBeenLastCalledWith(
    "/api/v1/veiculos?pagina=0&tamanho=20&status=DISPONIVEL",
    expect.objectContaining({
      credentials: "omit",
      headers: { Authorization: "Bearer teste" },
    }),
  );
});

it("cadastra com os campos do PJBL", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(json([]))
    .mockResolvedValueOnce(json(veiculo, 201))
    .mockResolvedValueOnce(json([veiculo]));
  vi.stubGlobal("fetch", fetch);
  render(<Veiculos token="teste" />);
  await screen.findByText("Nenhum veículo nesta página.");
  fireEvent.change(screen.getByLabelText("Placa"), { target: { value: "abc1d23" } });
  fireEvent.change(screen.getByLabelText("Marca"), { target: { value: "Volkswagen" } });
  fireEvent.change(screen.getByLabelText("Modelo"), { target: { value: "Delivery" } });
  fireEvent.change(screen.getByLabelText("Ano"), { target: { value: "2025" } });
  fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "Caminhão" } });
  fireEvent.change(screen.getByLabelText("Quilometragem"), { target: { value: "1200" } });
  fireEvent.change(screen.getByLabelText("Data de aquisição"), { target: { value: "2026-01-15" } });
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar veículo" }));
  await screen.findByRole("button", { name: "Editar ABC1D23" });
  expect(fetch).toHaveBeenNthCalledWith(
    2,
    "/api/v1/veiculos",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        placa: "ABC1D23",
        marca: "Volkswagen",
        modelo: "Delivery",
        ano: 2025,
        tipo: "Caminhão",
        quilometragem: 1200,
        status: "DISPONIVEL",
        dataAquisicao: "2026-01-15",
      }),
    }),
  );
});

it("CQ06 preserva a placa válida e marca os campos obrigatórios", async () => {
  const fetch = vi.fn().mockResolvedValue(json([]));
  vi.stubGlobal("fetch", fetch);
  render(<Veiculos token="teste" />);
  await screen.findByText("Nenhum veículo nesta página.");
  fireEvent.change(screen.getByLabelText("Placa"), {
    target: { value: "abc1d23" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar veículo" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Revise os campos marcados",
  );
  expect(screen.getByLabelText("Placa")).toHaveValue("ABC1D23");
  expect(screen.getByLabelText("Marca")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("inativa somente após confirmação", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(json([veiculo]))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(json([{ ...veiculo, status: "INATIVO" }]));
  vi.stubGlobal("fetch", fetch);
  render(<Veiculos token="teste" />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Inativar ABC1D23" }),
  );
  expect(fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Confirmar inativação" }));
  await screen.findByText("Veículo inativado; cadastro preservado.");
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Inativar ABC1D23" }),
    ).not.toBeInTheDocument(),
  );
  expect(fetch).toHaveBeenNthCalledWith(
    2,
    `/api/v1/veiculos/${id}`,
    expect.objectContaining({ method: "DELETE" }),
  );
});

it("oferece exclusão só para inativo, confirma e usa a rota definitiva", async () => {
  const inativo = { ...veiculo, status: "INATIVO" };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(json([veiculo, { ...inativo, id: "c176f1b1-bc54-4f22-9b2e-fb69469ab033", placa: "XYZ9K87" }]))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(json([veiculo]));
  vi.stubGlobal("fetch", fetch);
  render(<Veiculos token="teste" />);
  await screen.findByRole("button", { name: "Editar ABC1D23" });
  expect(screen.queryByRole("button", { name: "Excluir ABC1D23" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Excluir XYZ9K87" }));
  expect(fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
  await screen.findByText("Veículo XYZ9K87 excluído.");
  expect(fetch).toHaveBeenNthCalledWith(
    2,
    "/api/v1/veiculos/c176f1b1-bc54-4f22-9b2e-fb69469ab033/definitivo",
    expect.objectContaining({ method: "DELETE" }),
  );
});

it("explica quando o veículo tem histórico", async () => {
  const inativo = { ...veiculo, status: "INATIVO" };
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(json([inativo]))
      .mockResolvedValueOnce(
        json({ message: "O veículo possui histórico e não pode ser excluído. Mantenha-o inativo." }, 409),
      ),
  );
  render(<Veiculos token="teste" />);
  fireEvent.click(await screen.findByRole("button", { name: "Excluir ABC1D23" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("possui histórico");
});

it("recusa resposta fora do contrato", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json([{ ...veiculo, status: "OUTRO" }])));
  await expect(listarVeiculos("teste", 0)).rejects.toThrow("Não foi possível");
});
