import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PainelApp } from "./PainelApp";
import "./style.css";

export type PainelProps = { token: string; perfil: string };

export function mount(container: HTMLElement, props: PainelProps) {
  const root = createRoot(container);
  root.render(<StrictMode><PainelApp {...props} /></StrictMode>);
  return () => root.unmount();
}
