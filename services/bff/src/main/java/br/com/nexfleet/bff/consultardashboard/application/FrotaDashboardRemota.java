package br.com.nexfleet.bff.consultardashboard.application;

import java.util.List;
import java.util.UUID;

public interface FrotaDashboardRemota {
  record Veiculo(UUID id, String placa, String status) {}

  List<Veiculo> listarTodos(String token);
}
