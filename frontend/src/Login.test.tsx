// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Login } from "./Login";
import { entrar, consultarUsuario, AuthError } from "./auth";

const id = "e2f6b588-00cf-45bc-927e-c4a08647dfde";
const token = {
  accessToken: "token-apenas-teste",
  tokenType: "Bearer",
  expiresIn: 900,
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
const success = () =>
  vi
    .fn()
    .mockResolvedValueOnce(json(token))
    .mockResolvedValueOnce(json({ id }));

it("mostra administração somente para o perfil Administrador", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(json(token))
      .mockResolvedValueOnce(json({ id, perfil: "ADMINISTRADOR" })),
  );
  render(<Login />);
  preencher();
  expect(
    await screen.findByRole("button", { name: "Gerenciar usuários" }),
  ).toBeInTheDocument();
});

it("Gestor não recebe botão administrativo", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(json(token))
      .mockResolvedValueOnce(json({ id, perfil: "GESTOR_FROTA" })),
  );
  render(<Login />);
  preencher();
  await screen.findByText(`Usuário autenticado: ${id}`);
  expect(
    screen.queryByRole("button", { name: "Gerenciar usuários" }),
  ).not.toBeInTheDocument();
});
function preencher() {
  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: "teste@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Senha"), {
    target: { value: "senha-apenas-teste" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("distingue campos inválidos de falha no serviço", () => {
  expect(new AuthError(400).message).toContain("Confira os campos");
  expect(new AuthError(503).message).toContain("serviço de identidade");
});

it("CQ06 marca o campo inválido e preserva o e-mail válido", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  render(<Login />);
  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: "gestor@nexfleet.local" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Revise os campos marcados",
  );
  expect(screen.getByLabelText("E-mail")).toHaveValue(
    "gestor@nexfleet.local",
  );
  expect(screen.getByLabelText("Senha")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(fetch).not.toHaveBeenCalled();
});

it("login confirma identidade via BFF e não persiste token no navegador", async () => {
  const mock = success();
  vi.stubGlobal("fetch", mock);
  render(<Login />);
  preencher();
  expect(
    await screen.findByText(`Usuário autenticado: ${id}`),
  ).toBeInTheDocument();
  expect(mock).toHaveBeenNthCalledWith(
    1,
    "/api/v1/auth/login",
    expect.objectContaining({ method: "POST", credentials: "omit" }),
  );
  expect(mock).toHaveBeenNthCalledWith(
    2,
    "/api/v1/auth/me",
    expect.objectContaining({
      headers: { Authorization: "Bearer token-apenas-teste" },
    }),
  );
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
  expect(screen.queryByText(token.accessToken)).not.toBeInTheDocument();
});

it("sair limpa sessão e senha; remontar a tela não recupera o token", async () => {
  vi.stubGlobal("fetch", success());
  const view = render(<Login />);
  preencher();
  await screen.findByText(`Usuário autenticado: ${id}`);
  fireEvent.click(screen.getByRole("button", { name: "Sair" }));
  expect(screen.getByLabelText("Senha")).toHaveValue("");
  expect(
    screen.queryByText(`Usuário autenticado: ${id}`),
  ).not.toBeInTheDocument();
  view.unmount();
  render(<Login />);
  expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
});

it("senha errada permite tentar novamente e não mantém a senha digitada", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({}, 401)));
  render(<Login />);
  preencher();
  expect(
    await screen.findByText("E-mail, senha ou sessão inválidos."),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Senha")).toHaveValue("");
  expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
});

it("token recusado por me nunca cria sessão autenticada", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(json(token))
      .mockResolvedValueOnce(json({}, 401)),
  );
  render(<Login />);
  preencher();
  await screen.findByText("E-mail, senha ou sessão inválidos.");
  expect(screen.queryByText(/Usuário autenticado/)).not.toBeInTheDocument();
});

it("a verificação de uma sessão expirada devolve ao formulário", async () => {
  vi.stubGlobal("fetch", success().mockResolvedValueOnce(json({}, 401)));
  render(<Login />);
  preencher();
  await screen.findByText(`Usuário autenticado: ${id}`);
  fireEvent.click(screen.getByRole("button", { name: "Verificar sessão" }));
  await screen.findByText("Sessão expirada ou inválida. Entre novamente.");
  expect(screen.getByLabelText("Senha")).toBeInTheDocument();
});

it("expira automaticamente pelo prazo informado pela API", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", success());
  render(<Login />);
  await act(async () => {
    preencher();
  });
  expect(screen.getByText(`Usuário autenticado: ${id}`)).toBeInTheDocument();
  await act(async () => {
    vi.advanceTimersByTime(900000);
  });
  expect(
    screen.getByText("Sessão expirada. Entre novamente."),
  ).toBeInTheDocument();
});

it("rejeita respostas de sucesso que não cumprem o contrato", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(json({ ...token, expiresIn: -1 }))
      .mockResolvedValueOnce(json({ id: "invalido" })),
  );
  await expect(entrar("a@b.com", "senha")).rejects.toThrow();
  await expect(consultarUsuario("token")).rejects.toThrow();
});

it("falha de rede não autentica e permite nova tentativa", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
  render(<Login />);
  preencher();
  await screen.findByText(
    "Não foi possível entrar. Confira sua conexão e tente novamente.",
  );
  expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
});
