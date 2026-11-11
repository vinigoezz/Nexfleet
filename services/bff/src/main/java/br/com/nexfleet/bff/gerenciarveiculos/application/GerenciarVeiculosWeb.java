package br.com.nexfleet.bff.gerenciarveiculos.application;

import java.util.*;

public class GerenciarVeiculosWeb {
  private final VeiculosRemotos veiculos;
  private final HistoricoOperacional historico;

  public GerenciarVeiculosWeb(VeiculosRemotos veiculos, HistoricoOperacional historico) {
    this.veiculos = veiculos;
    this.historico = historico;
  }

  public List<VeiculosRemotos.Dados> listar(
      String token, String status, int pagina, int tamanho) {
    return veiculos.listar(bearer(token), status, pagina, tamanho);
  }

  public VeiculosRemotos.Dados consultar(String token, UUID id) {
    return veiculos.consultar(bearer(token), id);
  }

  public VeiculosRemotos.Dados criar(String token, VeiculosRemotos.Entrada entrada) {
    return veiculos.criar(bearer(token), entrada);
  }

  public VeiculosRemotos.Dados atualizar(
      String token, UUID id, VeiculosRemotos.Entrada entrada) {
    return veiculos.atualizar(bearer(token), id, entrada);
  }

  public void inativar(String token, UUID id) {
    veiculos.inativar(bearer(token), id);
  }

  /**
   * Exclusão definitiva (ADR 0038). O BFF confirma em Operações que não há manutenções; o Frota
   * confirma que o veículo está inativo e sem vínculos (todo abastecimento exige vínculo).
   */
  public void excluir(String token, UUID id) {
    var bearer = bearer(token);
    if (historico.possuiManutencoes(bearer, id))
      throw new FalhaVeiculos(
          409, "O veículo possui histórico e não pode ser excluído. Mantenha-o inativo.");
    veiculos.excluir(bearer, id);
  }

  private String bearer(String value) {
    if (value == null || value.length() > 8192 || !value.matches("Bearer [^\\s]+"))
      throw new FalhaVeiculos(401);
    return value;
  }
}
