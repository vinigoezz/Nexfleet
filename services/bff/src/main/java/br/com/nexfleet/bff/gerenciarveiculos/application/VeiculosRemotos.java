package br.com.nexfleet.bff.gerenciarveiculos.application;

import java.time.*;
import java.util.*;

public interface VeiculosRemotos {
  record Dados(
      UUID id,
      String placa,
      String marca,
      String modelo,
      int ano,
      String tipo,
      long quilometragem,
      String status,
      LocalDate dataAquisicao,
      Instant criadoEm,
      Instant atualizadoEm) {}

  record Entrada(
      String placa,
      String marca,
      String modelo,
      Integer ano,
      String tipo,
      Long quilometragem,
      String status,
      LocalDate dataAquisicao) {}

  List<Dados> listar(String token, String status, int pagina, int tamanho);

  Dados consultar(String token, UUID id);

  Dados criar(String token, Entrada entrada);

  Dados atualizar(String token, UUID id, Entrada entrada);

  void inativar(String token, UUID id);
}
