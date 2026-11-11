package br.com.nexfleet.bff.gerenciarusuarios.infrastructure;

import br.com.nexfleet.bff.gerenciarusuarios.application.*;
import java.util.*;
import java.util.function.Supplier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.*;

public class HttpUsuarios implements UsuariosRemotos {
  private static final String PATH = "/api/v1/identidade/usuarios";
  private final RestClient client;

  public HttpUsuarios(RestClient client) {
    this.client = client;
  }

  @Override
  public List<Dados> listar(String token, int pagina, int tamanho) {
    return chamada(
        () -> {
          var lista =
              client
                  .get()
                  .uri(PATH + "?pagina={pagina}&tamanho={tamanho}", pagina, tamanho)
                  .header("Authorization", token)
                  .retrieve()
                  .body(new ParameterizedTypeReference<List<Dados>>() {});
          if (lista == null) throw new FalhaUsuarios(503);
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
  public Dados criar(String token, Criar entrada) {
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
  public Dados atualizar(String token, UUID id, Atualizar entrada) {
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
  public void desativar(String token, UUID id) {
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
        || dados.email() == null
        || dados.email().isBlank()
        || !("ADMINISTRADOR".equals(dados.perfil()) || "GESTOR_FROTA".equals(dados.perfil())))
      throw new FalhaUsuarios(503);
    return dados;
  }

  private <T> T chamada(Supplier<T> request) {
    try {
      return request.get();
    } catch (RestClientResponseException e) {
      int status = e.getStatusCode().value();
      throw new FalhaUsuarios(Set.of(400, 401, 403, 404, 409, 422).contains(status) ? status : 503);
    } catch (RestClientException e) {
      throw new FalhaUsuarios(503);
    }
  }
}
