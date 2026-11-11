import { useState } from "react";
import { Login } from "./Login";
import { consultarAmbiente, type Ambiente } from "./ambiente";

const rotulos = {
  identidade: "Identidade",
  frota: "Frota",
  operacoes: "Operações",
  indicadores: "Indicadores",
};

export function App() {
  const [ambiente, setAmbiente] = useState<Ambiente | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function verificar() {
    setCarregando(true);
    setErro("");
    setAmbiente(null);
    try {
      setAmbiente(await consultarAmbiente());
    } catch {
      setErro(
        "Não foi possível consultar o ambiente. Confira o Docker e o Gateway na porta 8080 e tente novamente.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="app-root">
      <div className="landing-intro">
        <header className="landing-header">
          <a className="marca" href="#inicio" aria-label="NexFleet, início">
            <span className="marca-simbolo" aria-hidden="true">N</span>
            <span>Nex<span>Fleet</span></span>
          </a>
          <span className="versao-badge">Sprint 4 · Qualidade</span>
        </header>

        <section className="hero" id="inicio" aria-labelledby="hero-titulo">
          <div className="hero-conteudo">
            <span className="eyebrow">Gestão de frotas em uma única visão</span>
            <h1 id="hero-titulo">Sua operação mais clara, segura e eficiente.</h1>
            <p>
              Acompanhe veículos, motoristas, abastecimentos, manutenções e
              indicadores sem perder o contexto da sua operação.
            </p>
            <div className="hero-destaques" aria-label="Recursos principais">
              <span>Dados protegidos</span>
              <span>Operação integrada</span>
              <span>Indicadores em tempo real</span>
            </div>
          </div>

          <section
            className="ambiente-card"
            aria-labelledby="ambiente-titulo"
            aria-live="polite"
            aria-busy={carregando}
          >
            <div className="ambiente-card-cabecalho">
              <div>
                <span className="eyebrow">Diagnóstico local</span>
                <h2 id="ambiente-titulo">Status do ambiente</h2>
              </div>
              <span
                className={`status-dot ${ambiente?.status === "UP" ? "ativo" : ""}`}
                aria-hidden="true"
              />
            </div>
            {!ambiente && !erro && !carregando && (
              <p>Nenhuma consulta realizada. Clique no botão para começar.</p>
            )}
            {erro && <p role="alert" className="alerta erro">{erro}</p>}
            {ambiente && (
              <>
                <p className="ambiente-resumo">
                  {ambiente.status === "UP"
                    ? "Ambiente disponível"
                    : "Ambiente parcialmente indisponível"}
                </p>
                <ul className="servicos-grid">
                  {ambiente.services.map((servico) => (
                    <li key={servico.name}>
                      <strong>{rotulos[servico.name]}</strong>
                      <span className={servico.status === "UP" ? "ok" : "erro"}>
                        {servico.status === "UP" ? "Disponível" : "Indisponível"}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button className="botao secundario" onClick={verificar} disabled={carregando}>
              {carregando ? "Consultando…" : "Verificar ambiente"}
            </button>
          </section>
        </section>
      </div>
      <Login />
      <footer className="landing-footer">
        <span>NexFleet · Gestão de frotas</span>
        <span>Acesso seguro via Gateway e BFF</span>
      </footer>
    </div>
  );
}
