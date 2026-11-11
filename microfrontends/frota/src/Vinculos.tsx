import { useEffect, useState, type FormEvent } from "react";
import { listarMotoristas, type Motorista } from "./motoristas-api";
import { listarVeiculos, type Veiculo } from "./veiculos-api";
import {
  criarVinculo,
  encerrarVinculo,
  ErroVinculos,
  listarVinculos,
  type Vinculo,
} from "./vinculos-api";
import { useFormValidation } from "./useFormValidation";

export function Vinculos({ token }: { token: string }) {
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [veiculoId, setVeiculoId] = useState("");
  const [motoristaId, setMotoristaId] = useState("");
  const [filtroVeiculo, setFiltroVeiculo] = useState("");
  const [pagina, setPagina] = useState(0);
  const [revisao, setRevisao] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const ocupado = carregando || salvando;
  const validacaoVinculo = useFormValidation("vinculo-validacao");

  useEffect(() => {
    let atual = true;
    setCarregando(true);
    setErro("");
    Promise.all([
      listarVinculos(token, pagina, filtroVeiculo || undefined),
      listarVeiculos(token, 0, undefined, 100),
      listarMotoristas(token, 0, "ATIVO", 100),
    ])
      .then(([historico, frota, condutores]) => {
        if (!atual) return;
        setVinculos(historico);
        setVeiculos(frota);
        setMotoristas(condutores);
      })
      .catch((error) => atual && falha(error))
      .finally(() => atual && setCarregando(false));
    return () => {
      atual = false;
    };
  }, [token, pagina, filtroVeiculo, revisao]);

  function falha(error: unknown) {
    setErro(
      error instanceof ErroVinculos
        ? error.message
        : "Falha de conexão. Tente novamente.",
    );
  }

  async function criar(event: FormEvent) {
    event.preventDefault();
    validacaoVinculo.clear();
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await criarVinculo(token, veiculoId, motoristaId);
      setMensagem("Vínculo criado.");
      setVeiculoId("");
      setMotoristaId("");
      setRevisao((valor) => valor + 1);
    } catch (error) {
      falha(error);
    } finally {
      setSalvando(false);
    }
  }

  async function encerrar(item: Vinculo) {
    if (!window.confirm(`Encerrar o vínculo do veículo ${item.veiculoPlaca}?`))
      return;
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await encerrarVinculo(token, item.id);
      setMensagem("Vínculo encerrado e mantido no histórico.");
      setRevisao((valor) => valor + 1);
    } catch (error) {
      falha(error);
    } finally {
      setSalvando(false);
    }
  }

  const disponiveis = veiculos.filter((veiculo) => veiculo.status !== "INATIVO");

  return (
    <section aria-labelledby="vinculos-titulo">
      <h2 id="vinculos-titulo">Vínculos de motorista e veículo</h2>
      <p>
        Um veículo pode ter somente um vínculo ativo. Motorista inativo ou com
        CNH vencida não pode iniciar um novo vínculo.
      </p>
      {erro && <p role="alert">{erro}</p>}
      <p role="status">{carregando ? "Carregando vínculos…" : mensagem}</p>
      <form
        onSubmit={criar}
        onInvalid={validacaoVinculo.onInvalid}
        onInput={validacaoVinculo.onInput}
        className={validacaoVinculo.className("formulario-vinculo")}
        aria-describedby={validacaoVinculo.message ? validacaoVinculo.messageId : undefined}
      >
        <h3>Novo vínculo</h3>
        {validacaoVinculo.message && (
          <p id={validacaoVinculo.messageId} className="mensagem-validacao" role="alert">
            {validacaoVinculo.message}
          </p>
        )}
        <label htmlFor="vinculo-veiculo">Veículo</label>
        <select
          id="vinculo-veiculo"
          required
          value={veiculoId}
          disabled={ocupado}
          onChange={(event) => setVeiculoId(event.target.value)}
        >
          <option value="">Selecione</option>
          {disponiveis.map((veiculo) => (
            <option key={veiculo.id} value={veiculo.id}>
              {veiculo.placa} · {veiculo.modelo}
            </option>
          ))}
        </select>
        <label htmlFor="vinculo-motorista">Motorista</label>
        <select
          id="vinculo-motorista"
          required
          value={motoristaId}
          disabled={ocupado}
          onChange={(event) => setMotoristaId(event.target.value)}
        >
          <option value="">Selecione</option>
          {motoristas.map((motorista) => (
            <option key={motorista.id} value={motorista.id}>
              {motorista.nome} · CNH final {motorista.cnh.slice(-4)}
            </option>
          ))}
        </select>
        <button type="submit" disabled={ocupado}>
          {salvando ? "Salvando…" : "Criar vínculo"}
        </button>
      </form>
      <label htmlFor="filtro-vinculo-veiculo">Histórico do veículo</label>
      <select
        id="filtro-vinculo-veiculo"
        value={filtroVeiculo}
        disabled={ocupado}
        onChange={(event) => {
          setFiltroVeiculo(event.target.value);
          setPagina(0);
        }}
      >
        <option value="">Todos os veículos</option>
        {veiculos.map((veiculo) => (
          <option key={veiculo.id} value={veiculo.id}>
            {veiculo.placa} · {veiculo.modelo}
          </option>
        ))}
      </select>
      {!carregando && vinculos.length === 0 && !erro && (
        <p>Nenhum vínculo nesta página.</p>
      )}
      <ul className="lista-vinculos">
        {vinculos.map((item) => (
          <li key={item.id}>
            <strong>{item.veiculoPlaca}</strong>
            <span>{item.motoristaNome}</span>
            <span>
              Início {new Date(item.inicio).toLocaleString("pt-BR")}
              {item.fim
                ? ` · fim ${new Date(item.fim).toLocaleString("pt-BR")}`
                : " · ativo"}
            </span>
            {!item.fim && (
              <button
                type="button"
                disabled={ocupado}
                onClick={() => encerrar(item)}
              >
                Encerrar vínculo de {item.veiculoPlaca}
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="acoes">
        <button
          type="button"
          disabled={ocupado || pagina === 0}
          onClick={() => setPagina((valor) => valor - 1)}
        >
          Página anterior
        </button>
        <span>Página {pagina + 1}</span>
        <button
          type="button"
          disabled={ocupado || vinculos.length < 20}
          onClick={() => setPagina((valor) => valor + 1)}
        >
          Próxima página
        </button>
      </div>
    </section>
  );
}
