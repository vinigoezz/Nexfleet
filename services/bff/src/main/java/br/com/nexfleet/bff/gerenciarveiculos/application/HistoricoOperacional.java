package br.com.nexfleet.bff.gerenciarveiculos.application;

import java.util.UUID;

/**
 * Consulta ao serviço Operações usada antes da exclusão definitiva de um veículo (ADR 0038).
 * Abastecimentos exigem vínculo e são cobertos pela checagem de vínculos do Frota; manutenções
 * não exigem vínculo e por isso são verificadas aqui.
 */
public interface HistoricoOperacional {
  boolean possuiManutencoes(String token, UUID veiculoId);
}
