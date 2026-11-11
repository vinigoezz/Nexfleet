package br.com.nexfleet.bff.gerenciarvinculos.application;

import java.time.Instant;
import java.util.*;

public interface VinculosRemotos {
  record Dados(
      UUID id,
      UUID veiculoId,
      String veiculoPlaca,
      UUID motoristaId,
      String motoristaNome,
      Instant inicio,
      Instant fim,
      Instant criadoEm,
      Instant atualizadoEm) {}

  record Entrada(UUID veiculoId, UUID motoristaId) {}

  List<Dados> listar(String token, UUID veiculoId, int pagina, int tamanho);

  Dados criar(String token, Entrada entrada);

  Dados encerrar(String token, UUID id);
}
