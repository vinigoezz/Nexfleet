import { useEffect, useState, type FormEvent } from "react";
import { MicrofrontendHost } from "./MicrofrontendHost";
import { Usuarios } from "./Usuarios";
import { remotes } from "./remotes";
import {
  AuthError,
  consultarUsuario,
  entrar,
  type Token,
  type Usuario,
} from "./auth";
import { useFormValidation } from "./useFormValidation";

type Sessao = Token & Usuario & { expiraEm: number };
type Mfe = keyof typeof remotes;

export function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false);
  const [mfeAtivo, setMfeAtivo] = useState<Mfe | null>(null);
  const [menuRecolhido, setMenuRecolhido] = useState(false);
  const [menuMovelAberto, setMenuMovelAberto] = useState(false);
  const validacaoLogin = useFormValidation("login-validacao");

  useEffect(() => {
    if (!sessao) return;
    const timer = window.setTimeout(
      () => {
        setSessao(null);
        setMensagem("Sessão expirada. Entre novamente.");
      },
      Math.max(0, sessao.expiraEm - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [sessao]);

  useEffect(() => {
    document.body.classList.toggle("nexfleet-autenticado", Boolean(sessao));
    return () => document.body.classList.remove("nexfleet-autenticado");
  }, [sessao]);

  async function login(event: FormEvent) {
    event.preventDefault();
    validacaoLogin.clear();
    setOcupado(true);
    setMensagem("");
    try {
      const inicio = Date.now();
      const token = await entrar(email, senha);
      const usuario = await consultarUsuario(token.accessToken);
      setSessao({
        ...token,
        ...usuario,
        expiraEm: inicio + token.expiresIn * 1000,
      });
      setMfeAtivo("painel");
      setMensagem("Login confirmado pelo serviço Identidade.");
    } catch (error) {
      setSessao(null);
      setMensagem(
        error instanceof AuthError
          ? error.message
          : "Não foi possível entrar. Confira sua conexão e tente novamente.",
      );
    } finally {
      setSenha("");
      setOcupado(false);
    }
  }

  async function verificarSessao() {
    if (!sessao) return;
    setOcupado(true);
    setMensagem("");
    const token = sessao.accessToken;
    try {
      await consultarUsuario(token);
      setMensagem("Sessão confirmada pelo serviço Identidade.");
    } catch (error) {
      if (error instanceof AuthError && error.status === 401) {
        setSessao(null);
        setMensagem("Sessão expirada ou inválida. Entre novamente.");
      } else {
        setMensagem("Não foi possível verificar a sessão. Tente novamente.");
      }
    } finally {
      setOcupado(false);
    }
  }

  function abrirMfe(id: Mfe) {
    setMfeAtivo(id);
    setMostrarUsuarios(false);
    setMenuMovelAberto(false);
  }

  function abrirUsuarios() {
    setMfeAtivo(null);
    setMostrarUsuarios(true);
    setMenuMovelAberto(false);
  }

  function sair() {
    setSessao(null);
    setMfeAtivo(null);
    setMostrarUsuarios(false);
    setMenuMovelAberto(false);
    setMensagem("Você saiu deste navegador.");
  }

  const rotulosMfe: Record<Mfe, { titulo: string; descricao: string; icone: string }> = {
    painel: {
      titulo: "Visão geral",
      descricao: "Indicadores financeiros e operacionais da sua frota.",
      icone: "▦",
    },
    frota: {
      titulo: "Frota",
      descricao: "Veículos, motoristas e vínculos em um só lugar.",
      icone: "◇",
    },
    operacoes: {
      titulo: "Operações",
      descricao: "Abastecimentos e manutenções da operação.",
      icone: "↗",
    },
  };

  if (!sessao) {
    return (
      <section aria-labelledby="titulo-login" className="auth-section">
        <div className="auth-copy">
          <span className="eyebrow">Acesso à plataforma</span>
          <h2>Entre e assuma o controle da sua frota.</h2>
          <p>
            Sua sessão é validada pelo serviço de Identidade e permanece somente
            na memória deste navegador.
          </p>
          <ul>
            <li><span aria-hidden="true">✓</span> Acesso por perfil</li>
            <li><span aria-hidden="true">✓</span> Token protegido em memória</li>
            <li><span aria-hidden="true">✓</span> Serviços isolados por domínio</li>
          </ul>
        </div>
        <div className="auth-card">
          <div className="auth-card-header">
            <span className="marca-simbolo" aria-hidden="true">N</span>
            <div>
              <span className="eyebrow">Bem-vindo de volta</span>
              <h2 id="titulo-login">Acesso ao NexFleet</h2>
            </div>
          </div>
          <form
            className={validacaoLogin.className("formulario-validavel")}
            onSubmit={login}
            onInvalid={validacaoLogin.onInvalid}
            onInput={validacaoLogin.onInput}
            aria-describedby={validacaoLogin.message ? validacaoLogin.messageId : undefined}
          >
            {validacaoLogin.message && (
              <p
                id={validacaoLogin.messageId}
                className="mensagem-validacao"
                role="alert"
              >
                {validacaoLogin.message}
              </p>
            )}
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              placeholder="voce@empresa.com.br"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={ocupado}
            />
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Digite sua senha"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              disabled={ocupado}
            />
            <button className="botao primario largura-total" disabled={ocupado} type="submit">
              {ocupado ? "Entrando…" : "Entrar"}
            </button>
          </form>
          <p className="auth-mensagem" role="status" aria-live="polite">{mensagem}</p>
          <small>Ambiente acadêmico. Ao atualizar a página, será necessário entrar novamente.</small>
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-shell" aria-label="Área autenticada do NexFleet">
      <a className="skip-link" href="#conteudo-principal">Pular para o conteúdo</a>
      {menuMovelAberto && (
        <button
          className="sidebar-overlay"
          aria-label="Fechar menu"
          onClick={() => setMenuMovelAberto(false)}
        />
      )}
      <aside
        className={`app-sidebar ${menuRecolhido ? "recolhido" : ""} ${menuMovelAberto ? "aberto" : ""}`}
        aria-label="Navegação principal"
      >
        <div className="sidebar-brand">
          <span className="marca-simbolo" aria-hidden="true">N</span>
          <span className="sidebar-brand-texto">Nex<span>Fleet</span></span>
        </div>
        <nav className="sidebar-nav" aria-label="Áreas do NexFleet">
          <span className="sidebar-grupo">Gestão</span>
          {(Object.entries(rotulosMfe) as [Mfe, (typeof rotulosMfe)[Mfe]][]).map(
            ([id, item]) => (
              <button
                key={id}
                className={mfeAtivo === id && !mostrarUsuarios ? "ativo" : ""}
                aria-pressed={mfeAtivo === id && !mostrarUsuarios}
                title={menuRecolhido ? item.titulo : undefined}
                onClick={() => abrirMfe(id)}
              >
                <span className="nav-icone" aria-hidden="true">{item.icone}</span>
                <span className="nav-texto">{item.titulo}</span>
              </button>
            ),
          )}
          {sessao.perfil === "ADMINISTRADOR" && (
            <button
              className={mostrarUsuarios ? "ativo" : ""}
              aria-pressed={mostrarUsuarios}
              title={menuRecolhido ? "Gerenciar usuários" : undefined}
              onClick={abrirUsuarios}
            >
              <span className="nav-icone" aria-hidden="true">◎</span>
              <span className="nav-texto">Gerenciar usuários</span>
            </button>
          )}
        </nav>
        <div className="sidebar-usuario">
          <span className="usuario-avatar" aria-hidden="true">{sessao.perfil === "ADMINISTRADOR" ? "AD" : "GF"}</span>
          <div className="usuario-dados">
            <strong>{sessao.perfil === "ADMINISTRADOR" ? "Administrador" : "Gestor de frota"}</strong>
            <span>Ambiente local</span>
          </div>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="topbar">
          <div className="topbar-inicio">
            <button
              className="icone-botao menu-desktop"
              aria-label={menuRecolhido ? "Expandir menu" : "Recolher menu"}
              onClick={() => setMenuRecolhido((valor) => !valor)}
            >
              ☰
            </button>
            <button
              className="icone-botao menu-mobile"
              aria-label="Abrir menu"
              onClick={() => setMenuMovelAberto(true)}
            >
              ☰
            </button>
            <div>
              <span className="topbar-contexto">Transportadora Atlântico</span>
              <strong>NexFleet</strong>
            </div>
          </div>
          <div className="topbar-acoes">
            <span className="online-badge"><span aria-hidden="true" />Serviços conectados</span>
            <button className="botao fantasma" disabled={ocupado} onClick={verificarSessao}>
              Verificar sessão
            </button>
            <button className="botao sair" disabled={ocupado} onClick={sair}>Sair</button>
          </div>
        </header>

        <main className="workspace-content" id="conteudo-principal">
          <div className="page-heading">
            <div>
              <span className="eyebrow">NexFleet / Gestão</span>
              <h1>{mostrarUsuarios ? "Usuários" : mfeAtivo ? rotulosMfe[mfeAtivo].titulo : "NexFleet"}</h1>
              <p>{mostrarUsuarios ? "Perfis, permissões e situação das contas." : mfeAtivo ? rotulosMfe[mfeAtivo].descricao : "Selecione uma área no menu."}</p>
            </div>
            <span className="perfil-badge">{sessao.perfil === "ADMINISTRADOR" ? "Administrador" : "Gestor de frota"}</span>
          </div>
          <p className="sr-only">Usuário autenticado: {sessao.id}</p>
          {mfeAtivo && !mostrarUsuarios && (
            <MicrofrontendHost
              key={`${mfeAtivo}-${sessao.accessToken}`}
              nome={mfeAtivo}
              url={remotes[mfeAtivo]}
              props={{
                token: sessao.accessToken,
                perfil: sessao.perfil ?? "GESTOR_FROTA",
              }}
            />
          )}
          {sessao.perfil === "ADMINISTRADOR" && mostrarUsuarios && (
            <Usuarios key={sessao.accessToken} token={sessao.accessToken} />
          )}
          {mensagem && <p className="toast-status" role="status" aria-live="polite">{mensagem}</p>}
        </main>
      </div>
    </section>
  );
}
