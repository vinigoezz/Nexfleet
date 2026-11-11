package br.com.nexfleet.bff.consultardashboard.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface IndicadoresDashboardRemotos {
  record ProximaManutencao(UUID veiculoId, String tipo, LocalDate data) {}

  record Dados(
      BigDecimal gastoAbastecimentos,
      BigDecimal gastoManutencoes,
      BigDecimal gastoTotal,
      long quantidadeAbastecimentos,
      long quantidadeManutencoes,
      List<ProximaManutencao> proximasManutencoes) {}

  Dados consultar(String token);
}
