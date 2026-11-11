package br.com.nexfleet.bff.consultardashboard.infrastructure;

import br.com.nexfleet.bff.consultardashboard.application.*;
import java.util.Set;
import org.springframework.web.client.*;
import org.springframework.web.client.RestClient;

public class HttpIndicadoresDashboard implements IndicadoresDashboardRemotos {
  private final RestClient client;

  public HttpIndicadoresDashboard(RestClient client) {
    this.client = client;
  }

  @Override
  public Dados consultar(String token) {
    try {
      var dados =
          client
              .get()
              .uri("/api/v1/indicadores/dashboard")
              .header("Authorization", token)
              .retrieve()
              .body(Dados.class);
      if (dados == null
          || dados.gastoAbastecimentos() == null
          || dados.gastoManutencoes() == null
          || dados.gastoTotal() == null
          || dados.proximasManutencoes() == null) throw new FalhaDashboard(503);
      return dados;
    } catch (RestClientResponseException error) {
      int status = error.getStatusCode().value();
      throw new FalhaDashboard(Set.of(401, 403).contains(status) ? status : 503);
    } catch (RestClientException error) {
      throw new FalhaDashboard(503);
    }
  }
}
