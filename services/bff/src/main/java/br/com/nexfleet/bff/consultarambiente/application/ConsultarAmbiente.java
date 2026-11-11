package br.com.nexfleet.bff.consultarambiente.application;

import java.util.List;

public final class ConsultarAmbiente {
  private final ConsultarStatus consulta;

  public ConsultarAmbiente(ConsultarStatus consulta) {
    this.consulta = consulta;
  }

  public Resultado executar() {
    var servicos =
        List.of("identidade", "frota", "operacoes", "indicadores").stream()
            .map(nome -> new Servico(nome, consulta.disponivel(nome) ? "UP" : "DOWN"))
            .toList();
    boolean pronto = servicos.stream().allMatch(s -> "UP".equals(s.status()));
    return new Resultado("NexFleet", "sprint-0", pronto ? "UP" : "DEGRADED", servicos);
  }

  public record Servico(String name, String status) {}

  public record Resultado(
      String application, String stage, String status, List<Servico> services) {}
}
