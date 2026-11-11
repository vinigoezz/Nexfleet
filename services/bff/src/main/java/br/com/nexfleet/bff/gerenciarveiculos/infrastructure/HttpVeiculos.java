package br.com.nexfleet.bff.gerenciarveiculos.infrastructure;

import br.com.nexfleet.bff.gerenciarveiculos.application.*;
import java.util.*;
import java.util.function.Supplier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.*;

public class HttpVeiculos implements VeiculosRemotos {
  private static final String PATH = "/api/v1/frota/veiculos";
  private static final Set<String> STATUS =
      Set.of("DISPONIVEL", "EM_USO", "EM_MANUTENCAO", "INATIVO");
  private final RestClient client;

  public HttpVeiculos(RestClient client) {
    this.client = client;
  }

  @Override
  public List<Dados> listar(String token, String status, int pagina, int tamanho) {
    return chamada(
        () -> {
          var lista =
              client
                  .get()
                  .uri(
                      builder -> {
                        var uri =
                            builder
                                .path(PATH)
                                .queryParam("pagina", pagina)
                                .queryParam("tamanho", tamanho);
                        if (status != null && !status.isBlank()) uri.queryParam("status", status);
                        return uri.build();
                      })
                  .header("Authorization", token)
                  .retrieve()
                  .body(new ParameterizedTypeReference<List<Dados>>() {});
          if (lista == null) throw new FalhaVeiculos(503);
          lista.forEach(this::validar);
          return lista;
        });
  }

  @Override
  public Dados consultar(String token, UUID id) {
    return chamada(
        () ->
            validar(
                client
                    .get()
                    .uri(PATH + "/{id}", id)
                    .header("Authorization", token)
                    .retrieve()
                    .body(Dados.class)));
  }

  @Override
  public Dados criar(String token, Entrada entrada) {
    return chamada(
        () ->
            validar(
                client
                    .post()
                    .uri(PATH)
                    .header("Authorization", token)
                    .body(entrada)
                    .retrieve()
                    .body(Dados.class)));
  }

  @Override
  public Dados atualizar(String token, UUID id, Entrada entrada) {
    return chamada(
        () ->
            validar(
                client
                    .put()
                    .uri(PATH + "/{id}", id)
                    .header("Authorization", token)
                    .body(entrada)
                    .retrieve()
                    .body(Dados.class)));
  }

  @Override
  public void inativar(String token, UUID id) {
    chamada(
        () ->
            client
                .delete()
                .uri(PATH + "/{id}", id)
                .header("Authorization", token)
                .retrieve()
                .toBodilessEntity());
  }

  private Dados validar(Dados dados) {
    if (dados == null
        || dados.id() == null
        || dados.placa() == null
        || dados.placa().isBlank()
        || dados.dataAquisicao() == null
        || !STATUS.contains(dados.status())) throw new FalhaVeiculos(503);
    return dados;
  }

  private <T> T chamada(Supplier<T> request) {
    try {
      return request.get();
    } catch (RestClientResponseException e) {
      int status = e.getStatusCode().value();
      throw new FalhaVeiculos(Set.of(400, 401, 403, 404, 409, 422).contains(status) ? status : 503);
    } catch (RestClientException e) {
      throw new FalhaVeiculos(503);
    }
  }
}
