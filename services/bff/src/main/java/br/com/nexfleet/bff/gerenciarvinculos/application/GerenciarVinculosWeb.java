package br.com.nexfleet.bff.gerenciarvinculos.application;

import java.util.*;

public class GerenciarVinculosWeb {
  private final VinculosRemotos vinculos;

  public GerenciarVinculosWeb(VinculosRemotos vinculos) {
    this.vinculos = vinculos;
  }

  public List<VinculosRemotos.Dados> listar(
      String token, UUID veiculoId, int pagina, int tamanho) {
    return vinculos.listar(bearer(token), veiculoId, pagina, tamanho);
  }

  public VinculosRemotos.Dados criar(String token, VinculosRemotos.Entrada entrada) {
    return vinculos.criar(bearer(token), entrada);
  }

  public VinculosRemotos.Dados encerrar(String token, UUID id) {
    return vinculos.encerrar(bearer(token), id);
  }

  private String bearer(String valor) {
    if (valor == null || valor.length() > 8192 || !valor.matches("Bearer [^\\s]+"))
      throw new FalhaVinculos(401);
    return valor;
  }
}
