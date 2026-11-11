import { useEffect, useState, type FormEvent } from "react";
import {
  ErroVeiculos,
  inativarVeiculo,
  listarVeiculos,
  salvarVeiculo,
  type StatusVeiculo,
  type Veiculo,
} from "./veiculos-api";
import { useFormValidation } from "./useFormValidation";

const hoje = () => new Date().toISOString().slice(0, 10);
const rotulos: Record<StatusVeiculo, string> = {
  DISPONIVEL: "Disponível",
  EM_USO: "Em uso",
  EM_MANUTENCAO: "Em manutenção",
  INATIVO: "Inativo",
};

export function Veiculos({ token }: { token: string }) {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [pagina, setPagina] = useState(0);
  const [filtro, setFiltro] = useState<StatusVeiculo | "">("");
  const [revisao, setRevisao] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [id, setId] = useState<string>();
  const [placa, setPlaca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear());
  const [tipo, setTipo] = useState("");
  const [quilometragem, setQuilometragem] = useState(0);
  const [status, setStatus] = useState<StatusVeiculo>("DISPONIVEL");
  const [dataAquisicao, setDataAquisicao] = useState(hoje());
  const [confirmar, setConfirmar] = useState<Veiculo>();
  const ocupado = carregando || salvando;
  const validacaoVeiculo = useFormValidation("veiculo-validacao");

  useEffect(() => {
    let atual = true;
    setCarregando(true);
    setErro("");
    setVeiculos([]);
    listarVeiculos(token, pagina, filtro || undefined)
      .then((dados) => atual && setVeiculos(dados))
      .catch((error) => atual && falha(error))
      .finally(() => atual && setCarregando(false));
    return () => {
      atual = false;
    };
  }, [token, pagina, filtro, revisao]);

  function falha(error: unknown) {
    setErro(
      error instanceof ErroVeiculos
        ? error.message
        : "Falha de conexão. Tente novamente.",
    );
  }

  function limpar() {
    setId(undefined);
    setPlaca("");
    setMarca("");
    setModelo("");
    setAno(new Date().getFullYear());
    setTipo("");
    setQuilometragem(0);
    setStatus("DISPONIVEL");
    setDataAquisicao(hoje());
  }

  function editar(veiculo: Veiculo) {
    setId(veiculo.id);
    setPlaca(veiculo.placa);
    setMarca(veiculo.marca);
    setModelo(veiculo.modelo);
    setAno(veiculo.ano);
    setTipo(veiculo.tipo);
    setQuilometragem(veiculo.quilometragem);
    setStatus(veiculo.status);
    setDataAquisicao(veiculo.dataAquisicao);
  }

  async function salvar(event: FormEvent) {
    event.preventDefault();
    validacaoVeiculo.clear();
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await salvarVeiculo(
        token,
        {
          placa,
          marca,
          modelo,
          ano,
          tipo,
          quilometragem,
          status,
          dataAquisicao,
        },
        id,
      );
      setMensagem(id ? "Veículo atualizado." : "Veículo cadastrado.");
      limpar();
      setRevisao((valor) => valor + 1);
    } catch (error) {
      falha(error);
    } finally {
      setSalvando(false);
    }
  }

  async function inativar() {
    if (!confirmar) return;
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await inativarVeiculo(token, confirmar.id);
      setMensagem("Veículo inativado; cadastro preservado.");
      setConfirmar(undefined);
      setRevisao((valor) => valor + 1);
    } catch (error) {
      falha(error);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section aria-labelledby="veiculos-titulo">
      <h2 id="veiculos-titulo">Veículos</h2>
      <p>
        Cadastro mestre da Frota. Inativar preserva o veículo para históricos
        operacionais futuros.
      </p>
      {erro && <p role="alert">{erro}</p>}
      <p role="status">{carregando ? "Carregando veículos…" : mensagem}</p>
      <form
        onSubmit={salvar}
        onInvalid={validacaoVeiculo.onInvalid}
        onInput={validacaoVeiculo.onInput}
        className={validacaoVeiculo.className("formulario-veiculo")}
        aria-describedby={validacaoVeiculo.message ? validacaoVeiculo.messageId : undefined}
      >
        <h3>{id ? "Editar veículo" : "Cadastrar veículo"}</h3>
        {validacaoVeiculo.message && (
          <p id={validacaoVeiculo.messageId} className="mensagem-validacao" role="alert">
            {validacaoVeiculo.message}
          </p>
        )}
        <label htmlFor="veiculo-placa">Placa</label>
        <input
          id="veiculo-placa"
          required
          maxLength={10}
          value={placa}
          onChange={(event) => setPlaca(event.target.value.toUpperCase())}
          disabled={ocupado}
        />
        <label htmlFor="veiculo-marca">Marca</label>
        <input
          id="veiculo-marca"
          required
          maxLength={80}
          value={marca}
          onChange={(event) => setMarca(event.target.value)}
          disabled={ocupado}
        />
        <label htmlFor="veiculo-modelo">Modelo</label>
        <input
          id="veiculo-modelo"
          required
          maxLength={80}
          value={modelo}
          onChange={(event) => setModelo(event.target.value)}
          disabled={ocupado}
        />
        <label htmlFor="veiculo-ano">Ano</label>
        <input
          id="veiculo-ano"
          type="number"
          min={1886}
          max={9999}
          required
          value={ano}
          onChange={(event) => setAno(Number(event.target.value))}
          disabled={ocupado}
        />
        <label htmlFor="veiculo-tipo">Tipo</label>
        <input
          id="veiculo-tipo"
          required
          maxLength={40}
          value={tipo}
          onChange={(event) => setTipo(event.target.value)}
          disabled={ocupado}
        />
        <label htmlFor="veiculo-km">Quilometragem</label>
        <input
          id="veiculo-km"
          type="number"
          min={0}
          step={1}
          required
          value={quilometragem}
          onChange={(event) => setQuilometragem(Number(event.target.value))}
          disabled={ocupado}
        />
        <label htmlFor="veiculo-status">Status</label>
        <select
          id="veiculo-status"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as StatusVeiculo)
          }
          disabled={ocupado}
        >
          {Object.entries(rotulos).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
        <label htmlFor="veiculo-data">Data de aquisição</label>
        <input
          id="veiculo-data"
          type="date"
          required
          value={dataAquisicao}
          onChange={(event) => setDataAquisicao(event.target.value)}
          disabled={ocupado}
        />
        <div className="acoes">
          <button type="submit" disabled={ocupado}>
            {salvando
              ? "Salvando…"
              : id
                ? "Salvar alterações"
                : "Cadastrar veículo"}
          </button>
          {id && (
            <button type="button" disabled={ocupado} onClick={limpar}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>
      <label htmlFor="filtro-status">Filtrar por status</label>
      <select
        id="filtro-status"
        value={filtro}
        disabled={ocupado}
        onChange={(event) => {
          setFiltro(event.target.value as StatusVeiculo | "");
          setPagina(0);
        }}
      >
        <option value="">Todos</option>
        {Object.entries(rotulos).map(([valor, rotulo]) => (
          <option key={valor} value={valor}>
            {rotulo}
          </option>
        ))}
      </select>
      {!carregando && veiculos.length === 0 && !erro && (
        <p>Nenhum veículo nesta página.</p>
      )}
      <ul className="lista-veiculos">
        {veiculos.map((veiculo) => (
          <li key={veiculo.id}>
            <strong>
              {veiculo.placa} — {veiculo.marca} {veiculo.modelo}
            </strong>
            <span>
              {veiculo.ano} · {veiculo.tipo} ·{" "}
              {veiculo.quilometragem.toLocaleString("pt-BR")} km ·{" "}
              {rotulos[veiculo.status]}
            </span>
            <span>
              Adquirido em{" "}
              {new Date(
                `${veiculo.dataAquisicao}T00:00:00`,
              ).toLocaleDateString("pt-BR")}
            </span>
            <div className="acoes">
              <button
                type="button"
                disabled={ocupado}
                onClick={() => editar(veiculo)}
              >
                Editar {veiculo.placa}
              </button>
              {veiculo.status !== "INATIVO" && (
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => setConfirmar(veiculo)}
                >
                  Inativar {veiculo.placa}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {confirmar && (
        <div role="group" aria-label="Confirmar inativação">
          <p>Inativar {confirmar.placa}? O cadastro será preservado.</p>
          <button type="button" disabled={ocupado} onClick={inativar}>
            Confirmar inativação
          </button>
          <button
            type="button"
            disabled={ocupado}
            onClick={() => setConfirmar(undefined)}
          >
            Cancelar inativação
          </button>
        </div>
      )}
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
          disabled={ocupado || veiculos.length < 20}
          onClick={() => setPagina((valor) => valor + 1)}
        >
          Próxima página
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => setRevisao((valor) => valor + 1)}
        >
          Atualizar lista
        </button>
      </div>
    </section>
  );
}
