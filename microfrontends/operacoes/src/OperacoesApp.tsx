import { useEffect, useState, type FormEvent } from "react";
import { ErroAbastecimento, listarAbastecimentos, listarVinculosAtivos,
  registrarAbastecimento, type Abastecimento, type Vinculo } from "./abastecimentos-api";
import { ErroManutencao, listarManutencoes, listarVeiculosAtivos,
  registrarManutencao, type Manutencao, type Veiculo } from "./manutencoes-api";
import { useFormValidation } from "./useFormValidation";

function dataHoraLocal() {
  const agora = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000);
  return agora.toISOString().slice(0, 16);
}
function dataLocal() { return dataHoraLocal().slice(0, 10); }

export function OperacoesApp({ token }: { token: string; perfil: string }) {
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [historico, setHistorico] = useState<Abastecimento[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [vinculoId, setVinculoId] = useState("");
  const [realizadoEm, setRealizadoEm] = useState(dataHoraLocal);
  const [combustivel, setCombustivel] = useState("DIESEL");
  const [litros, setLitros] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [quilometragem, setQuilometragem] = useState("");
  const [veiculoManutencao, setVeiculoManutencao] = useState("");
  const [tipo, setTipo] = useState("PREVENTIVA");
  const [dataManutencao, setDataManutencao] = useState(dataLocal);
  const [kmManutencao, setKmManutencao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [oficina, setOficina] = useState("");
  const [valorManutencao, setValorManutencao] = useState("");
  const [proximaManutencao, setProximaManutencao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [revisao, setRevisao] = useState(0);
  const validacaoAbastecimento = useFormValidation("abastecimento-validacao");
  const validacaoManutencao = useFormValidation("manutencao-validacao");

  useEffect(() => {
    let atual = true;
    setCarregando(true);
    Promise.all([listarVinculosAtivos(token), listarAbastecimentos(token),
      listarVeiculosAtivos(token), listarManutencoes(token)])
      .then(([ativos, abastecimentos, frota, historicoManutencao]) => {
        if (!atual) return;
        setVinculos(ativos); setHistorico(abastecimentos);
        setVeiculos(frota); setManutencoes(historicoManutencao);
      })
      .catch((error) => atual && falha(error))
      .finally(() => atual && setCarregando(false));
    return () => { atual = false; };
  }, [token, revisao]);

  function falha(error: unknown) {
    setErro(error instanceof ErroAbastecimento || error instanceof ErroManutencao
      ? error.message : "Falha de conexão. Tente novamente.");
  }

  async function registrarAbastecimentoForm(event: FormEvent) {
    event.preventDefault();
    validacaoAbastecimento.clear();
    const vinculo = vinculos.find((item) => item.id === vinculoId);
    if (!vinculo) return;
    setSalvando(true); setErro(""); setMensagem("");
    try {
      await registrarAbastecimento(token, { veiculoId: vinculo.veiculoId,
        motoristaId: vinculo.motoristaId, realizadoEm: new Date(realizadoEm).toISOString(),
        combustivel, litros: Number(litros), valorTotal: Number(valorTotal),
        quilometragem: Number(quilometragem) });
      setMensagem("Abastecimento registrado e evento salvo na outbox.");
      setLitros(""); setValorTotal(""); setQuilometragem("");
      setRevisao((valor) => valor + 1);
    } catch (error) { falha(error); } finally { setSalvando(false); }
  }

  async function registrarManutencaoForm(event: FormEvent) {
    event.preventDefault();
    validacaoManutencao.clear();
    setSalvando(true); setErro(""); setMensagem("");
    try {
      await registrarManutencao(token, { veiculoId: veiculoManutencao, tipo,
        realizadaEm: dataManutencao, quilometragem: Number(kmManutencao), descricao,
        oficina, valor: Number(valorManutencao),
        proximaManutencao: proximaManutencao || null });
      setMensagem("Manutenção registrada e evento salvo na outbox.");
      setKmManutencao(""); setDescricao(""); setOficina(""); setValorManutencao("");
      setProximaManutencao(""); setRevisao((valor) => valor + 1);
    } catch (error) { falha(error); } finally { setSalvando(false); }
  }

  return <div className="mfe-area">
    <header className="mfe-cabecalho">
      <div>
        <p className="mfe-etiqueta">Rotina operacional</p>
        <h2>Operações</h2>
        <p>Registre abastecimentos e manutenções preservando o histórico operacional.</p>
      </div>
      <span className="mfe-status">Dados sincronizados</span>
    </header>
    {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
    <p role="status">{carregando ? "Carregando operações…" : mensagem}</p>
    <div className="formularios-operacao">
      <form
        onSubmit={registrarAbastecimentoForm}
        onInvalid={validacaoAbastecimento.onInvalid}
        onInput={validacaoAbastecimento.onInput}
        className={validacaoAbastecimento.className("formulario-operacao")}
        aria-describedby={validacaoAbastecimento.message ? validacaoAbastecimento.messageId : undefined}
      >
        <h3>Novo abastecimento</h3>
        {validacaoAbastecimento.message && <p id={validacaoAbastecimento.messageId} className="mensagem-validacao" role="alert">{validacaoAbastecimento.message}</p>}
        <label htmlFor="operacao-vinculo">Veículo e motorista</label>
        <select id="operacao-vinculo" required value={vinculoId} onChange={(e) => setVinculoId(e.target.value)}><option value="">Selecione um vínculo ativo</option>{vinculos.map((item) => <option key={item.id} value={item.id}>{item.veiculoPlaca} · {item.motoristaNome}</option>)}</select>
        <label htmlFor="operacao-data">Data e hora</label><input id="operacao-data" type="datetime-local" required value={realizadoEm} onChange={(e) => setRealizadoEm(e.target.value)} />
        <label htmlFor="operacao-combustivel">Combustível</label><select id="operacao-combustivel" value={combustivel} onChange={(e) => setCombustivel(e.target.value)}><option>DIESEL</option><option>GASOLINA</option><option>ETANOL</option><option>GNV</option></select>
        <label htmlFor="operacao-litros">Litros</label><input id="operacao-litros" type="number" min="0.01" step="0.01" required value={litros} onChange={(e) => setLitros(e.target.value)} />
        <label htmlFor="operacao-valor">Valor total</label><input id="operacao-valor" type="number" min="0.01" step="0.01" required value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} />
        <label htmlFor="operacao-km">Quilometragem</label><input id="operacao-km" type="number" min="1" step="1" required value={quilometragem} onChange={(e) => setQuilometragem(e.target.value)} />
        <button type="submit" disabled={carregando || salvando || vinculos.length === 0}>{salvando ? "Registrando…" : "Registrar abastecimento"}</button>
      </form>
      <form
        onSubmit={registrarManutencaoForm}
        onInvalid={validacaoManutencao.onInvalid}
        onInput={validacaoManutencao.onInput}
        className={validacaoManutencao.className("formulario-operacao")}
        aria-describedby={validacaoManutencao.message ? validacaoManutencao.messageId : undefined}
      >
        <h3>Nova manutenção</h3>
        {validacaoManutencao.message && <p id={validacaoManutencao.messageId} className="mensagem-validacao" role="alert">{validacaoManutencao.message}</p>}
        <label htmlFor="manutencao-veiculo">Veículo</label><select id="manutencao-veiculo" required value={veiculoManutencao} onChange={(e) => setVeiculoManutencao(e.target.value)}><option value="">Selecione um veículo ativo</option>{veiculos.map((item) => <option key={item.id} value={item.id}>{item.placa} · {item.modelo}</option>)}</select>
        <label htmlFor="manutencao-tipo">Tipo</label><select id="manutencao-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="PREVENTIVA">Preventiva</option><option value="CORRETIVA">Corretiva</option><option value="REVISAO">Revisão</option><option value="TROCA_OLEO">Troca de óleo</option><option value="TROCA_PNEUS">Troca de pneus</option><option value="OUTROS">Outros</option></select>
        <label htmlFor="manutencao-data">Data</label><input id="manutencao-data" type="date" required value={dataManutencao} onChange={(e) => setDataManutencao(e.target.value)} />
        <label htmlFor="manutencao-km">Quilometragem</label><input id="manutencao-km" type="number" min="0" step="1" required value={kmManutencao} onChange={(e) => setKmManutencao(e.target.value)} />
        <label htmlFor="manutencao-descricao">Descrição</label><input id="manutencao-descricao" maxLength={500} required value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        <label htmlFor="manutencao-oficina">Oficina</label><input id="manutencao-oficina" maxLength={150} required value={oficina} onChange={(e) => setOficina(e.target.value)} />
        <label htmlFor="manutencao-valor">Valor</label><input id="manutencao-valor" type="number" min="0" step="0.01" required value={valorManutencao} onChange={(e) => setValorManutencao(e.target.value)} />
        <label htmlFor="manutencao-proxima">Próxima manutenção (opcional)</label><input id="manutencao-proxima" type="date" value={proximaManutencao} onChange={(e) => setProximaManutencao(e.target.value)} />
        <button type="submit" disabled={carregando || salvando || veiculos.length === 0}>{salvando ? "Registrando…" : "Registrar manutenção"}</button>
      </form>
    </div>
    <section className="historico-card" aria-labelledby="historico-abastecimentos"><h3 id="historico-abastecimentos">Histórico de abastecimentos</h3>{!carregando && historico.length === 0 && <p className="estado-vazio">Nenhum abastecimento registrado.</p>}<ul className="lista-operacoes">{historico.map((item) => <li key={item.id}><strong>{item.combustivel} · {item.litros.toFixed(2)} L</strong><span>{item.quilometragem.toLocaleString("pt-BR")} km</span><span>{item.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span><span>{new Date(item.realizadoEm).toLocaleString("pt-BR")}</span></li>)}</ul></section>
    <section className="historico-card" aria-labelledby="historico-manutencoes"><h3 id="historico-manutencoes">Histórico de manutenções</h3>{!carregando && manutencoes.length === 0 && <p className="estado-vazio">Nenhuma manutenção registrada.</p>}<ul className="lista-operacoes">{manutencoes.map((item) => <li key={item.id}><strong>{item.tipo.replaceAll("_", " ")}</strong><span>{item.descricao}</span><span>{item.oficina}</span><span>{item.quilometragem.toLocaleString("pt-BR")} km</span><span>{item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span><span>{new Date(`${item.realizadaEm}T12:00:00`).toLocaleDateString("pt-BR")}</span></li>)}</ul></section>
  </div>;
}
