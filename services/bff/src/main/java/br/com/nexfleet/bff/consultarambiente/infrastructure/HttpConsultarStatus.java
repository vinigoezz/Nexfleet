package br.com.nexfleet.bff.consultarambiente.infrastructure;

import br.com.nexfleet.bff.consultarambiente.application.ConsultarStatus;
import java.util.Map;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

public final class HttpConsultarStatus implements ConsultarStatus {
  private final Map<String, RestClient> clients;

  public HttpConsultarStatus(Map<String, RestClient> clients) {
    this.clients = Map.copyOf(clients);
  }

  @Override
  public boolean disponivel(String servico) {
    var client = clients.get(servico);
    if (client == null) return false;
    try {
      var result =
          client.get().uri("/api/v1/" + servico + "/info").retrieve().body(StatusResponse.class);
      return result != null && servico.equals(result.service()) && "UP".equals(result.status());
    } catch (RestClientException exception) {
      return false;
    }
  }

  public record StatusResponse(String service, String status) {}
}
