import { useEffect, useState, type FormEvent } from "react";
import {
  ErroMotoristas,
  excluirMotorista,
  listarMotoristas,
  salvarMotorista,
  type Motorista,
  type StatusMotorista,
} from "./motoristas-api";
import { useFormValidation } from "./useFormValidation";

const rotulos: Record<StatusMotorista, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
};

const cpfProtegido = (cpf: string) => `***.***.***-${cpf.slice(-2)}`;
const cnhProtegida = (cnh: string) => `*******${cnh.slice(-4)}`;

export function Motoristas({ token }: { token: string }) {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [pagina, setPagina] = useState(0);
  const [filtro, setFiltro] = useState<StatusMotorista | "">("");
  const [revisao, setRevisao] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [id, setId] = useState<string>();
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cnh, setCnh] = useState("");
  const [categoria, setCategoria] = useState("");
  const [validadeCnh, setValidadeCnh] = useState("");
  const [telefone, setTelefone] = useState("");
  const [status, setStatus] = useState<StatusMotorista>("ATIVO");
  const [confirmarExclusao, setConfirmarExclusao] = useState<Motorista>();
  const ocupado = carregando || salvando;
  const validacaoMotorista = useFormValidation("motorista-validacao");

  useEffect(() => {
    let atual = true;
    setCarregando(true);
    setErro("");
    setMotoristas([]);
    listarMotoristas(token, pagina, filtro || undefined)
      .then((dados) => atual && setMotoristas(dados))
      .catch((error) => atual && falha(error))
      .finally(() => atual && setCarregando(false));
    return () => {
      atual = false;
    };
  }, [token, pagina, filtro, revisao]);

  function falha(error: unknown) {
    setErro(
      error instanceof ErroMotoristas
        ? error.message
        : "Falha de conexão. Tente novamente.",
    );
  }

  function limpar() {
    setId(undefined);
    setNome("");
    setCpf("");
    setCnh("");
    setCategoria("");
    setValidadeCnh("");
    setTelefone("");
    setStatus("ATIVO");
  }

  function editar(motorista: Motorista) {
    setId(motorista.id);
    setNome(motorista.nome);
    setCpf(motorista.cpf);
    setCnh(motorista.cnh);
    setCategoria(motorista.categoria);
    setValidadeCnh(motorista.validadeCnh);
    setTelefone(motorista.telefone);
    setStatus(motorista.status);
  }

  async function salvar(event: FormEvent) {
    event.preventDefault();
    validacaoMotorista.clear();
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await salvarMotorista(
        token,
        { nome, cpf, cnh, categoria, validadeCnh, telefone, status },
        id,
      );
      setMensagem(id ? "Motorista atualizado." : "Motorista cadastrado.");
      limpar();
      setRevisao((valor) => valor + 1);
    } catch (error) {
      falha(error);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!confirmarExclusao) return;
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await excluirMotorista(token, confirmarExclusao.id);
      setMensagem(`Motorista ${confirmarExclusao.nome} excluído.`);
      if (id === confirmarExclusao.id) limpar();
      setConfirmarExclusao(undefined);
      setRevisao((valor) => valor + 1);
    } catch (error) {
      setConfirmarExclusao(undefined);
      falha(error);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section aria-labelledby="motoristas-titulo">
      <h2 id="motoristas-titulo">Motoristas</h2>
      <p>
        Cadastro de motoristas da Frota. CPF e CNH aparecem mascarados na
        lista; a validade será verificada ao criar vínculos.
      </p>
      {erro && <p role="alert">{erro}</p>}
      <p role="status">{carregando ? "Carregando motoristas…" : mensagem}</p>
      <form
        onSubmit={salvar}
        onInvalid={validacaoMotorista.onInvalid}
        onInput={validacaoMotorista.onInput}
        className={validacaoMotorista.className("formulario-motorista")}
        aria-describedby={validacaoMotorista.message ? validacaoMotorista.messageId : undefined}
      >
        <h3>{id ? "Editar motorista" : "Cadastrar motorista"}</h3>
        {validacaoMotorista.message && (
          <p id={validacaoMotorista.messageId} className="mensagem-validacao" role="alert">
            {validacaoMotorista.message}
          </p>
        )}
        <label htmlFor="motorista-nome">Nome</label>
        <input
          id="motorista-nome"
          required
          maxLength={120}
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          disabled={ocupado}
        />
        <label htmlFor="motorista-cpf">CPF</label>
        <input
          id="motorista-cpf"
          required
          inputMode="numeric"
          maxLength={14}
          value={cpf}
          onChange={(event) => setCpf(event.target.value)}
          disabled={ocupado}
        />
        <label htmlFor="motorista-cnh">CNH</label>
        <input
          id="motorista-cnh"
          required
          inputMode="numeric"
          maxLength={11}
          value={cnh}
          onChange={(event) => setCnh(event.target.value)}
          disabled={ocupado}
        />
        <label htmlFor="motorista-categoria">Categoria</label>
        <input
          id="motorista-categoria"
          required
          maxLength={5}
          value={categoria}
          onChange={(event) => setCategoria(event.target.value.toUpperCase())}
          disabled={ocupado}
        />
        <label htmlFor="motorista-validade">Validade da CNH</label>
        <input
          id="motorista-validade"
          type="date"
          required
          value={validadeCnh}
          onChange={(event) => setValidadeCnh(event.target.value)}
          disabled={ocupado}
        />
        <label htmlFor="motorista-telefone">Telefone</label>
        <input
          id="motorista-telefone"
          type="tel"
          required
          maxLength={30}
          value={telefone}
          onChange={(event) => setTelefone(event.target.value)}
          disabled={ocupado}
        />
        <label htmlFor="motorista-status">Status</label>
        <select
          id="motorista-status"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as StatusMotorista)
          }
          disabled={ocupado}
        >
          {Object.entries(rotulos).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
        <div className="acoes">
          <button type="submit" disabled={ocupado}>
            {salvando
              ? "Salvando…"
              : id
                ? "Salvar alterações"
                : "Cadastrar motorista"}
          </button>
          {id && (
            <button type="button" disabled={ocupado} onClick={limpar}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>
      <label htmlFor="filtro-motorista-status">Filtrar por status</label>
      <select
        id="filtro-motorista-status"
        value={filtro}
        disabled={ocupado}
        onChange={(event) => {
          setFiltro(event.target.value as StatusMotorista | "");
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
      {!carregando && motoristas.length === 0 && !erro && (
        <p>Nenhum motorista nesta página.</p>
      )}
      <ul className="lista-motoristas">
        {motoristas.map((motorista) => (
          <li key={motorista.id}>
            <strong>{motorista.nome}</strong>
            <span>
              CPF {cpfProtegido(motorista.cpf)} · CNH{" "}
              {cnhProtegida(motorista.cnh)} · categoria {motorista.categoria}
            </span>
            <span>
              Validade{" "}
              {new Date(`${motorista.validadeCnh}T00:00:00`).toLocaleDateString(
                "pt-BR",
              )}
              {" · "}
              {rotulos[motorista.status]}
            </span>
            <span>{motorista.telefone}</span>
            <div className="acoes">
              <button
                type="button"
                disabled={ocupado}
                onClick={() => editar(motorista)}
              >
                Editar {motorista.nome}
              </button>
              {motorista.status === "INATIVO" && (
                <button
                  type="button"
                  className="perigo"
                  disabled={ocupado}
                  onClick={() => setConfirmarExclusao(motorista)}
                >
                  Excluir {motorista.nome}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {confirmarExclusao && (
        <div role="group" aria-label="Confirmar exclusão">
          <p>
            Excluir {confirmarExclusao.nome} definitivamente? Esta ação não pode
            ser desfeita. Motoristas com histórico não podem ser excluídos.
          </p>
          <button type="button" className="perigo" disabled={ocupado} onClick={excluir}>
            Confirmar exclusão
          </button>
          <button
            type="button"
            disabled={ocupado}
            onClick={() => setConfirmarExclusao(undefined)}
          >
            Cancelar exclusão
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
          disabled={ocupado || motoristas.length < 20}
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
