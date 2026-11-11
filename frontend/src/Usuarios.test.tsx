// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Usuarios } from "./Usuarios";
import { listarContas } from "./usuarios-api";

const id = "e2f6b588-00cf-45bc-927e-c4a08647dfde";
const conta = {
  id,
  email: "novo@example.com",
  perfil: "GESTOR_FROTA",
  ativo: true,
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("lista contas pelo Gateway e não busca hashes", async () => {
  const fetch = vi.fn().mockResolvedValue(json([conta]));
  vi.stubGlobal("fetch", fetch);
  render(<Usuarios token="teste" />);
  expect(
    await screen.findByRole("button", { name: "Editar novo@example.com" }),
  ).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith(
    "/api/v1/usuarios?pagina=0&tamanho=20",
    expect.objectContaining({
      credentials: "omit",
      headers: { Authorization: "Bearer teste" },
    }),
  );
});
it("cadastra e limpa senha depois da resposta", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(json([]))
    .mockResolvedValueOnce(json(conta, 201))
    .mockResolvedValueOnce(json([conta]));
  vi.stubGlobal("fetch", fetch);
  render(<Usuarios token="teste" />);
  await screen.findByText("Nenhum usuário nesta página.");
  fireEvent.change(screen.getByLabelText("E-mail do usuário"), {
    target: { value: "novo@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Senha inicial"), {
    target: { value: "senha-nova-segura" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar usuário" }));
  await screen.findByRole("button", { name: "Editar novo@example.com" });
  expect(fetch).toHaveBeenNthCalledWith(
    2,
    "/api/v1/usuarios",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        email: "novo@example.com",
        perfil: "GESTOR_FROTA",
        senha: "senha-nova-segura",
      }),
    }),
  );
  expect(screen.getByLabelText("Senha inicial")).toHaveValue("");
});
it("edita sem reenviar senha e permite desativar só após confirmação", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(json([conta]))
    .mockResolvedValueOnce(json(conta))
    .mockResolvedValueOnce(json([conta]))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(json([{ ...conta, ativo: false }]));
  vi.stubGlobal("fetch", fetch);
  render(<Usuarios token="teste" />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Editar novo@example.com" }),
  );
  expect(screen.queryByLabelText("Senha inicial")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Desativar novo@example.com" }),
    ).toBeEnabled(),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Desativar novo@example.com" }),
  );
  expect(fetch).toHaveBeenCalledTimes(3);
  fireEvent.click(
    screen.getByRole("button", { name: "Confirmar desativação" }),
  );
  await screen.findByText(/novo@example.com — Gestor de Frota — Inativo/);
  expect(fetch).toHaveBeenNthCalledWith(
    2,
    `/api/v1/usuarios/${id}`,
    expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({
        email: conta.email,
        perfil: conta.perfil,
        ativo: true,
      }),
    }),
  );
  expect(fetch).toHaveBeenNthCalledWith(
    4,
    `/api/v1/usuarios/${id}`,
    expect.objectContaining({ method: "DELETE" }),
  );
});
it("mostra 403 sem exibir lista de contas", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({}, 403)));
  render(<Usuarios token="gestor" />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Administrador ativo",
  );
  expect(
    screen.queryByRole("button", { name: /Editar novo/ }),
  ).not.toBeInTheDocument();
});
it("preserva e-mail após conflito e apaga a senha", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(json([]))
      .mockResolvedValueOnce(json({}, 409)),
  );
  render(<Usuarios token="teste" />);
  await screen.findByText("Nenhum usuário nesta página.");
  fireEvent.change(screen.getByLabelText("E-mail do usuário"), {
    target: { value: conta.email },
  });
  fireEvent.change(screen.getByLabelText("Senha inicial"), {
    target: { value: "senha-nova-segura" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar usuário" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "já está cadastrado",
  );
  expect(screen.getByLabelText("E-mail do usuário")).toHaveValue(conta.email);
  expect(screen.getByLabelText("Senha inicial")).toHaveValue("");
});
it("CQ06 mantém o e-mail válido e identifica a senha obrigatória", async () => {
  const fetch = vi.fn().mockResolvedValue(json([]));
  vi.stubGlobal("fetch", fetch);
  render(<Usuarios token="teste" />);
  await screen.findByText("Nenhum usuário nesta página.");
  fireEvent.change(screen.getByLabelText("E-mail do usuário"), {
    target: { value: conta.email },
  });
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar usuário" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Revise os campos marcados",
  );
  expect(screen.getByLabelText("E-mail do usuário")).toHaveValue(conta.email);
  expect(screen.getByLabelText("Senha inicial")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("recusa contrato inválido", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(json([{ ...conta, perfil: "OUTRO" }])),
  );
  await expect(listarContas("teste", 0)).rejects.toThrow("Não foi possível");
});
