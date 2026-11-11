package br.com.nexfleet.bff.gerenciarveiculos.infrastructure;

import br.com.nexfleet.bff.gerenciarveiculos.application.*;
import java.util.*;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.*;

public class HttpHistoricoOperacional implements HistoricoOperacional {
  private static final String PATH = "/api/v1/operacoes/manutencoes";
  private final RestClient client;

  public HttpHistoricoOperacional(RestClient client) {
    this.client = client;
  }

  @Override
  public boolean possuiManutencoes(String token, UUID veiculoId) {
    try {
      var lista =
          client
              .get()
              .uri(
                  builder ->
                      builder
                          .path(PATH)
                          .queryParam("veiculoId", veiculoId)
                          .queryParam("pagina", 0)
                          .queryParam("tamanho", 1)
                          .build())
              .header("Authorization", token)
              .retrieve()
              .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {});
      if (lista == null) throw indisponivel();
      return !lista.isEmpty();
    } catch (RestClientResponseException e) {
      int status = e.getStatusCode().value();
      if (status == 401 || status == 403) throw new FalhaVeiculos(status);
      throw indisponivel();
    } catch (RestClientException e) {
      throw indisponivel();
    }
  }

  // Sem confirmar a ausência de histórico, a exclusão não acontece.
  private static FalhaVeiculos indisponivel() {
    return new FalhaVeiculos(
        503, "Não foi possível verificar o histórico do veículo. Tente novamente.");
  }
}
