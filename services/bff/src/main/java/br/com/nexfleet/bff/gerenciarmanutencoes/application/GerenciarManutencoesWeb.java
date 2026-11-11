package br.com.nexfleet.bff.gerenciarmanutencoes.application;

import java.util.*;

public class GerenciarManutencoesWeb {
  private final ManutencoesRemotas manutencoes;
  public GerenciarManutencoesWeb(ManutencoesRemotas manutencoes) { this.manutencoes = manutencoes; }
  public List<ManutencoesRemotas.Dados> listar(
      String token, UUID veiculoId, int pagina, int tamanho) {
    return manutencoes.listar(bearer(token), veiculoId, pagina, tamanho);
  }
  public ManutencoesRemotas.Dados registrar(String token, ManutencoesRemotas.Entrada entrada) {
    return manutencoes.registrar(bearer(token), entrada);
  }
  private String bearer(String valor) {
    if (valor == null || valor.length() > 8192 || !valor.matches("Bearer [^\\s]+"))
      throw new FalhaManutencoes(401);
    return valor;
  }
}
