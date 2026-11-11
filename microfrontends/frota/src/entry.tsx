import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FrotaApp } from "./FrotaApp";
import "./style.css";

export type FrotaProps = { token: string; perfil: string };

export function mount(container: HTMLElement, props: FrotaProps) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <FrotaApp {...props} />
    </StrictMode>,
  );
  return () => root.unmount();
}
