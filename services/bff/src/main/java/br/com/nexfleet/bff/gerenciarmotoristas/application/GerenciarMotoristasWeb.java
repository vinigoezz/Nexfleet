package br.com.nexfleet.bff.gerenciarmotoristas.application;

import java.util.*;

public class GerenciarMotoristasWeb {
  private final MotoristasRemotos motoristas;

  public GerenciarMotoristasWeb(MotoristasRemotos motoristas) {
    this.motoristas = motoristas;
  }

  public List<MotoristasRemotos.Dados> listar(
      String token, String status, int pagina, int tamanho) {
    return motoristas.listar(bearer(token), status, pagina, tamanho);
  }

  public MotoristasRemotos.Dados consultar(String token, UUID id) {
    return motoristas.consultar(bearer(token), id);
  }

  public MotoristasRemotos.Dados criar(String token, MotoristasRemotos.Entrada entrada) {
    return motoristas.criar(bearer(token), entrada);
  }

  public MotoristasRemotos.Dados atualizar(
      String token, UUID id, MotoristasRemotos.Entrada entrada) {
    return motoristas.atualizar(bearer(token), id, entrada);
  }

  private String bearer(String value) {
    if (value == null || value.length() > 8192 || !value.matches("Bearer [^\\s]+"))
      throw new FalhaMotoristas(401);
    return value;
  }
}
