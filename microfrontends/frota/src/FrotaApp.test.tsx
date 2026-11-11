// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { FrotaApp } from "./FrotaApp";

afterEach(cleanup);

it("apresenta as três capacidades reais de Frota", () => {
  render(<FrotaApp token="teste" perfil="GESTOR_FROTA" />);
  expect(screen.getByRole("button", { name: "Veículos" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Motoristas" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Vínculos" })).toBeInTheDocument();
});
