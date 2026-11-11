package br.com.nexfleet.bff.gerenciarabastecimentos.application;

import java.util.*;

public class GerenciarAbastecimentosWeb {
  private final AbastecimentosRemotos abastecimentos;
  public GerenciarAbastecimentosWeb(AbastecimentosRemotos abastecimentos) {
    this.abastecimentos = abastecimentos;
  }
  public List<AbastecimentosRemotos.Dados> listar(
      String token, UUID veiculoId, int pagina, int tamanho) {
    return abastecimentos.listar(bearer(token), veiculoId, pagina, tamanho);
  }
  public AbastecimentosRemotos.Dados registrar(
      String token, AbastecimentosRemotos.Entrada entrada) {
    return abastecimentos.registrar(bearer(token), entrada);
  }
  private String bearer(String valor) {
    if (valor == null || valor.length() > 8192 || !valor.matches("Bearer [^\\s]+"))
      throw new FalhaAbastecimentos(401);
    return valor;
  }
}
