package br.com.nexfleet.bff.consultardashboard.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

public class ConsultarDashboardWeb {
  private final IndicadoresDashboardRemotos indicadores;
  private final FrotaDashboardRemota frota;

  public ConsultarDashboardWeb(
      IndicadoresDashboardRemotos indicadores, FrotaDashboardRemota frota) {
    this.indicadores = indicadores;
    this.frota = frota;
  }

  public Resultado consultar(String token) {
    String bearer = bearer(token);
    var financeiro = indicadores.consultar(bearer);
    var veiculos = frota.listarTodos(bearer);
    var placas =
        veiculos.stream()
            .collect(
                Collectors.toMap(
                    FrotaDashboardRemota.Veiculo::id,
                    FrotaDashboardRemota.Veiculo::placa));
    var proximas =
        financeiro.proximasManutencoes().stream()
            .map(
                item ->
                    new ProximaManutencao(
                        item.veiculoId(),
                        placas.getOrDefault(item.veiculoId(), item.veiculoId().toString()),
                        item.tipo(),
                        item.data()))
            .toList();

    return new Resultado(
        financeiro.gastoAbastecimentos(),
        financeiro.gastoManutencoes(),
        financeiro.gastoTotal(),
        financeiro.quantidadeAbastecimentos(),
        financeiro.quantidadeManutencoes(),
        veiculos.size(),
        contar(veiculos, "DISPONIVEL"),
        contar(veiculos, "EM_USO"),
        contar(veiculos, "EM_MANUTENCAO"),
        contar(veiculos, "INATIVO"),
        proximas);
  }

  private long contar(List<FrotaDashboardRemota.Veiculo> veiculos, String status) {
    return veiculos.stream().filter(veiculo -> status.equals(veiculo.status())).count();
  }

  private String bearer(String token) {
    if (token == null || !token.startsWith("Bearer ") || token.length() <= 7)
      throw new FalhaDashboard(401);
    return token;
  }

  public record ProximaManutencao(UUID veiculoId, String placa, String tipo, LocalDate data) {}

  public record Resultado(
      BigDecimal gastoAbastecimentos,
      BigDecimal gastoManutencoes,
      BigDecimal gastoTotal,
      long quantidadeAbastecimentos,
      long quantidadeManutencoes,
      long totalVeiculos,
      long veiculosDisponiveis,
      long veiculosEmUso,
      long veiculosEmManutencao,
      long veiculosInativos,
      List<ProximaManutencao> proximasManutencoes) {}
}
