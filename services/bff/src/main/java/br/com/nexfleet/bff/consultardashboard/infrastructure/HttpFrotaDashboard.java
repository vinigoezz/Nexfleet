package br.com.nexfleet.bff.consultardashboard.infrastructure;

import br.com.nexfleet.bff.consultardashboard.application.*;
import java.util.*;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.*;
import org.springframework.web.client.RestClient;

public class HttpFrotaDashboard implements FrotaDashboardRemota {
  private static final int TAMANHO_PAGINA = 100;
  private static final int LIMITE_PAGINAS = 1000;
  private static final Set<String> STATUS =
      Set.of("DISPONIVEL", "EM_USO", "EM_MANUTENCAO", "INATIVO");
  private final RestClient client;

  public HttpFrotaDashboard(RestClient client) {
    this.client = client;
  }

  @Override
  public List<Veiculo> listarTodos(String token) {
    try {
      var todos = new ArrayList<Veiculo>();
      for (int pagina = 0; pagina < LIMITE_PAGINAS; pagina++) {
        int paginaAtual = pagina;
        var resposta =
            client
                .get()
                .uri(
                    builder ->
                        builder
                            .path("/api/v1/frota/veiculos")
                            .queryParam("pagina", paginaAtual)
                            .queryParam("tamanho", TAMANHO_PAGINA)
                            .build())
                .header("Authorization", token)
                .retrieve()
                .body(new ParameterizedTypeReference<List<Veiculo>>() {});
        if (resposta == null) throw new FalhaDashboard(503);
        resposta.forEach(this::validar);
        todos.addAll(resposta);
        if (resposta.size() < TAMANHO_PAGINA) return List.copyOf(todos);
      }
      throw new FalhaDashboard(503);
    } catch (RestClientResponseException error) {
      int status = error.getStatusCode().value();
      throw new FalhaDashboard(Set.of(401, 403).contains(status) ? status : 503);
    } catch (RestClientException error) {
      throw new FalhaDashboard(503);
    }
  }

  private void validar(Veiculo veiculo) {
    if (veiculo == null
        || veiculo.id() == null
        || veiculo.placa() == null
        || veiculo.placa().isBlank()
        || !STATUS.contains(veiculo.status())) throw new FalhaDashboard(503);
  }
}
