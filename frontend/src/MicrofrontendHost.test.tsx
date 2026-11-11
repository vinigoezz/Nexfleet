// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MicrofrontendHost } from "./MicrofrontendHost";

afterEach(cleanup);

it("monta o remoto e o desmonta ao fechar o host", async () => {
  const desmontar = vi.fn();
  const mount = vi.fn((element: HTMLElement) => {
    element.textContent = "Frota carregada";
    return desmontar;
  });
  const loader = vi.fn().mockResolvedValue({ mount });
  const view = render(
    <MicrofrontendHost
      nome="Frota"
      url="http://remoto/entry.js"
      props={{ token: "token", perfil: "GESTOR_FROTA" }}
      loader={loader}
    />,
  );

  expect(await screen.findByText("Frota carregada")).toBeInTheDocument();
  expect(mount).toHaveBeenCalledWith(
    expect.any(HTMLDivElement),
    expect.objectContaining({ token: "token", perfil: "GESTOR_FROTA" }),
  );
  expect(document.head.querySelector("link[data-nexfleet-mfe='Frota']"))
    .toHaveAttribute("href", "http://remoto/entry.css");
  view.unmount();
  expect(desmontar).toHaveBeenCalledOnce();
  expect(document.head.querySelector("link[data-nexfleet-mfe='Frota']"))
    .not.toBeInTheDocument();
});

it("explica quando o remoto está indisponível", async () => {
  render(
    <MicrofrontendHost
      nome="Painel"
      url="http://remoto/entry.js"
      props={{ token: "token", perfil: "ADMINISTRADOR" }}
      loader={() => Promise.reject(new Error("offline"))}
    />,
  );
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent(
      "Não foi possível carregar Painel",
    ),
  );
});
