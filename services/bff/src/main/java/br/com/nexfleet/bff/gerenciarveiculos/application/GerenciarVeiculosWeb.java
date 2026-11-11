package br.com.nexfleet.bff.gerenciarveiculos.application;

import java.util.*;

public class GerenciarVeiculosWeb {
  private final VeiculosRemotos veiculos;

  public GerenciarVeiculosWeb(VeiculosRemotos veiculos) {
    this.veiculos = veiculos;
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

  private String bearer(String value) {
    if (value == null || value.length() > 8192 || !value.matches("Bearer [^\\s]+"))
      throw new FalhaVeiculos(401);
    return value;
  }
}
