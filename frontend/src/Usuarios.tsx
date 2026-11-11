import { useEffect, useState, type FormEvent } from "react";
import {
  listarContas,
  salvarConta,
  desativarConta,
  excluirConta,
  ErroUsuarios,
  type Conta,
  type Perfil,
} from "./usuarios-api";
import { useFormValidation } from "./useFormValidation";

export function Usuarios({ token }: { token: string }) {
  const [contas, setContas] = useState<Conta[]>([]);
  const [pagina, setPagina] = useState(0);
  const [revisao, setRevisao] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [id, setId] = useState<string>();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<Perfil>("GESTOR_FROTA");
  const [ativo, setAtivo] = useState(true);
  const [confirmar, setConfirmar] = useState<Conta>();
  const [confirmarExclusao, setConfirmarExclusao] = useState<Conta>();
  const ocupado = carregando || salvando;
  const validacaoUsuario = useFormValidation("usuario-validacao");

  useEffect(() => {
    let atual = true;
    setCarregando(true);
    setErro("");
    setContas([]);
    listarContas(token, pagina)
      .then((data) => {
        if (atual) setContas(data);
      })
      .catch((error) => {
        if (atual)
          setErro(
            error instanceof ErroUsuarios
              ? error.message
              : "Falha de conexão. Tente novamente.",
          );
      })
      .finally(() => {
        if (atual) setCarregando(false);
      });
    return () => {
      atual = false;
    };
  }, [token, pagina, revisao]);

  function limpar() {
    setId(undefined);
    setEmail("");
    setSenha("");
    setPerfil("GESTOR_FROTA");
    setAtivo(true);
  }
  function falha(error: unknown) {
    setErro(
      error instanceof ErroUsuarios
        ? error.message
        : "Falha de conexão. Tente novamente.",
    );
  }
  async function salvar(event: FormEvent) {
    event.preventDefault();
    validacaoUsuario.clear();
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await salvarConta(
        token,
        { email, perfil, ...(id ? { ativo } : { senha }) },
        id,
      );
      setMensagem(id ? "Usuário atualizado." : "Usuário cadastrado.");
      limpar();
      setRevisao((value) => value + 1);
    } catch (error) {
      falha(error);
    } finally {
      setSenha("");
      setSalvando(false);
    }
  }
  async function desativar() {
    if (!confirmar) return;
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await desativarConta(token, confirmar.id);
      setMensagem("Usuário desativado; registro preservado.");
      setConfirmar(undefined);
      setRevisao((value) => value + 1);
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
      await excluirConta(token, confirmarExclusao.id);
      setMensagem(`Usuário ${confirmarExclusao.email} excluído.`);
      if (id === confirmarExclusao.id) limpar();
      setConfirmarExclusao(undefined);
      setRevisao((value) => value + 1);
    } catch (error) {
      setConfirmarExclusao(undefined);
      falha(error);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="usuarios-admin" aria-labelledby="usuarios-titulo">
      <h2 id="usuarios-titulo">Administração de usuários</h2>
      <p>
        Somente Administradores ativos podem consultar ou alterar estas contas.
      </p>
      {erro && <p className="alerta" role="alert">{erro}</p>}
      <p role="status">{carregando ? "Carregando usuários…" : mensagem}</p>
      <form
        className={validacaoUsuario.className("usuarios-form")}
        onSubmit={salvar}
        onInvalid={validacaoUsuario.onInvalid}
        onInput={validacaoUsuario.onInput}
        aria-describedby={validacaoUsuario.message ? validacaoUsuario.messageId : undefined}
      >
        <h3>{id ? "Editar usuário" : "Cadastrar usuário"}</h3>
        {validacaoUsuario.message && (
          <p
            id={validacaoUsuario.messageId}
            className="mensagem-validacao"
            role="alert"
          >
            {validacaoUsuario.message}
          </p>
        )}
        <label htmlFor="conta-email">E-mail do usuário</label>
        <input
          id="conta-email"
          type="email"
          required
          maxLength={254}
          autoComplete="off"
          disabled={ocupado}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {!id && (
          <>
            <label htmlFor="conta-senha">Senha inicial</label>
            <input
              id="conta-senha"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              disabled={ocupado}
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
            />
            <small>Mínimo de 12 caracteres; máximo de 72 bytes UTF-8.</small>
          </>
        )}
        <label htmlFor="conta-perfil">Perfil</label>
        <select
          id="conta-perfil"
          value={perfil}
          disabled={ocupado}
          onChange={(event) => setPerfil(event.target.value as Perfil)}
        >
          <option value="GESTOR_FROTA">Gestor de Frota</option>
          <option value="ADMINISTRADOR">Administrador</option>
        </select>
        {id && (
          <label>
            <input
              type="checkbox"
              checked={ativo}
              disabled={ocupado}
              onChange={(event) => setAtivo(event.target.checked)}
            />
            Usuário ativo
          </label>
        )}
        <button disabled={ocupado} type="submit">
          {salvando
            ? "Salvando…"
            : id
              ? "Salvar alterações"
              : "Cadastrar usuário"}
        </button>
        {id && (
          <button type="button" disabled={ocupado} onClick={limpar}>
            Cancelar edição
          </button>
        )}
      </form>
      {!carregando && contas.length === 0 && !erro && (
        <p>Nenhum usuário nesta página.</p>
      )}
      <ul>
        {contas.map((conta) => (
          <li key={conta.id}>
            <span>
              {conta.email} —{" "}
              {conta.perfil === "ADMINISTRADOR"
                ? "Administrador"
                : "Gestor de Frota"}{" "}
              — {conta.ativo ? "Ativo" : "Inativo"}
            </span>
            <button
              disabled={ocupado}
              onClick={() => {
                setId(conta.id);
                setEmail(conta.email);
                setPerfil(conta.perfil);
                setAtivo(conta.ativo);
                setSenha("");
              }}
            >
              Editar {conta.email}
            </button>
            {conta.ativo && (
              <button disabled={ocupado} onClick={() => setConfirmar(conta)}>
                Desativar {conta.email}
              </button>
            )}
            {!conta.ativo && (
              <button
                className="perigo"
                disabled={ocupado}
                onClick={() => {
                  setConfirmar(undefined);
                  setConfirmarExclusao(conta);
                }}
              >
                Excluir {conta.email}
              </button>
            )}
          </li>
        ))}
      </ul>
      {confirmar && (
        <div className="confirmacao-card" role="group" aria-label="Confirmar desativação">
          <p>Desativar {confirmar.email}? O registro será preservado.</p>
          <button disabled={ocupado} onClick={desativar}>
            Confirmar desativação
          </button>
          <button disabled={ocupado} onClick={() => setConfirmar(undefined)}>
            Cancelar desativação
          </button>
        </div>
      )}
      {confirmarExclusao && (
        <div className="confirmacao-card perigo" role="group" aria-label="Confirmar exclusão">
          <p>
            Excluir {confirmarExclusao.email} definitivamente? Esta ação não pode ser
            desfeita.
          </p>
          <button className="perigo" disabled={ocupado} onClick={excluir}>
            Confirmar exclusão
          </button>
          <button disabled={ocupado} onClick={() => setConfirmarExclusao(undefined)}>
            Cancelar exclusão
          </button>
        </div>
      )}
      <div className="acoes">
        <button
          disabled={ocupado || pagina === 0}
          onClick={() => setPagina((value) => value - 1)}
        >
          Página anterior
        </button>
        <span>Página {pagina + 1}</span>
        <button
          disabled={ocupado || contas.length < 20}
          onClick={() => setPagina((value) => value + 1)}
        >
          Próxima página
        </button>
        <button
          disabled={ocupado}
          onClick={() => setRevisao((value) => value + 1)}
        >
          Atualizar lista
        </button>
      </div>
    </section>
  );
}
