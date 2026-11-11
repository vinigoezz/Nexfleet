import { useState } from "react";
import { Motoristas } from "./Motoristas";
import { Veiculos } from "./Veiculos";
import { Vinculos } from "./Vinculos";

type Area = "veiculos" | "motoristas" | "vinculos";

export function FrotaApp({ token }: { token: string; perfil: string }) {
  const [area, setArea] = useState<Area>("veiculos");
  const areas: ReadonlyArray<[Area, string]> = [
    ["veiculos", "Veículos"],
    ["motoristas", "Motoristas"],
    ["vinculos", "Vínculos"],
  ];

  return (
    <div className="mfe-frota">
      <header className="mfe-cabecalho">
        <div>
          <p className="mfe-etiqueta">Gestão de ativos</p>
          <h2>Frota</h2>
          <p>Cadastros mestres e histórico entre veículos e motoristas.</p>
        </div>
        <span className="mfe-status">Base operacional</span>
      </header>
      <nav className="frota-tabs" aria-label="Cadastros de Frota">
        {areas.map(([id, label]) => (
          <button
            key={id}
            aria-pressed={area === id}
            onClick={() => setArea(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {area === "veiculos" && <Veiculos token={token} />}
      {area === "motoristas" && <Motoristas token={token} />}
      {area === "vinculos" && <Vinculos token={token} />}
    </div>
  );
}
