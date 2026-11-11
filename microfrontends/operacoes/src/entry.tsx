import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { OperacoesApp } from "./OperacoesApp";
import "./style.css";

export type OperacoesProps = { token: string; perfil: string };

export function mount(container: HTMLElement, props: OperacoesProps) {
  const root = createRoot(container);
  root.render(<StrictMode><OperacoesApp {...props} /></StrictMode>);
  return () => root.unmount();
}
