package br.com.nexfleet.bff.gerenciarmotoristas.application;

import java.time.*;
import java.util.*;

public interface MotoristasRemotos {
  record Dados(
      UUID id,
      String nome,
      String cpf,
      String cnh,
      String categoria,
      LocalDate validadeCnh,
      String telefone,
      String status,
      Instant criadoEm,
      Instant atualizadoEm) {}

  record Entrada(
      String nome,
      String cpf,
      String cnh,
      String categoria,
      LocalDate validadeCnh,
      String telefone,
      String status) {}

  List<Dados> listar(String token, String status, int pagina, int tamanho);

  Dados consultar(String token, UUID id);

  Dados criar(String token, Entrada entrada);

  Dados atualizar(String token, UUID id, Entrada entrada);

  void excluir(String token, UUID id);
}
