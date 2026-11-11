import { useEffect, useState } from "react";
import { consultarDashboard, type Dashboard } from "./dashboard";

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const data = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export function PainelApp({ token }: { token: string; perfil: string }) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      setDashboard(await consultarDashboard(token));
    } catch {
      setDashboard(null);
      setErro("Não foi possível carregar os indicadores. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, [token]);

  return (
    <div className="mfe-painel">
      <header className="mfe-cabecalho">
        <div>
          <p className="mfe-etiqueta">Visão executiva</p>
          <h2>Painel</h2>
          <p>Visão consolidada da situação e dos gastos válidos da frota.</p>
        </div>
        <button className="botao-atualizar" disabled={carregando} onClick={() => void carregar()}>
          <span aria-hidden="true">↻</span> Atualizar
        </button>
      </header>

      {carregando && <p role="status">Carregando indicadores…</p>}
      {erro && (
        <div role="alert" className="painel-erro">
          <p>{erro}</p>
          <button onClick={() => void carregar()}>Tentar novamente</button>
        </div>
      )}

      {dashboard && (
        <>
          <section className="painel-secao" aria-labelledby="titulo-financeiro">
            <h3 id="titulo-financeiro">Indicadores financeiros</h3>
            <div className="painel-cards">
              <Card titulo="Gasto total" valor={moeda.format(dashboard.gastoTotal)} destaque />
              <Card
                titulo="Abastecimentos"
                valor={moeda.format(dashboard.gastoAbastecimentos)}
                detalhe={`${dashboard.quantidadeAbastecimentos} registros`}
              />
              <Card
                titulo="Manutenções"
                valor={moeda.format(dashboard.gastoManutencoes)}
                detalhe={`${dashboard.quantidadeManutencoes} registros`}
              />
            </div>
          </section>

          <section className="painel-secao" aria-labelledby="titulo-frota">
            <h3 id="titulo-frota">Situação da frota</h3>
            <div className="painel-cards">
              <Card titulo="Total" valor={String(dashboard.totalVeiculos)} />
              <Card titulo="Disponíveis" valor={String(dashboard.veiculosDisponiveis)} />
              <Card titulo="Em uso" valor={String(dashboard.veiculosEmUso)} />
              <Card
                titulo="Em manutenção"
                valor={String(dashboard.veiculosEmManutencao)}
              />
              <Card titulo="Inativos" valor={String(dashboard.veiculosInativos)} />
            </div>
          </section>

          <section className="painel-secao" aria-labelledby="titulo-proximas">
            <h3 id="titulo-proximas">Próximas manutenções</h3>
            {dashboard.proximasManutencoes.length === 0 ? (
              <p>Nenhuma próxima manutenção informada.</p>
            ) : (
              <ul className="painel-manutencoes">
                {dashboard.proximasManutencoes.map((item) => (
                  <li key={item.veiculoId}>
                    <strong>{item.placa}</strong>
                    <span>{item.tipo.replaceAll("_", " ")}</span>
                    <time dateTime={item.data}>
                      {data.format(new Date(`${item.data}T00:00:00Z`))}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Card({
  titulo,
  valor,
  detalhe,
  destaque = false,
}: {
  titulo: string;
  valor: string;
  detalhe?: string;
  destaque?: boolean;
}) {
  return (
    <article className={destaque ? "painel-card painel-card-destaque" : "painel-card"}>
      <span>{titulo}</span>
      <strong>{valor}</strong>
      {detalhe && <small>{detalhe}</small>}
    </article>
  );
}
