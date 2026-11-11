package br.com.nexfleet.bff.autenticar.infrastructure;

import br.com.nexfleet.bff.autenticar.application.*;
import java.util.UUID;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

public class HttpIdentidade implements Identidade {
  private final RestClient client;

  public HttpIdentidade(RestClient client) {
    this.client = client;
  }

  @Override
  public Token login(Credenciais credenciais) {
    try {
      var token =
          client
              .post()
              .uri("/api/v1/identidade/login")
              .body(credenciais)
              .retrieve()
              .body(Token.class);
      if (token == null
          || token.accessToken() == null
          || token.accessToken().isBlank()
          || !"Bearer".equals(token.tokenType())
          || token.expiresIn() <= 0
          || token.expiresIn() > 900) throw new FalhaAutenticacao(503);
      return token;
    } catch (RestClientResponseException error) {
      throw new FalhaAutenticacao(error.getStatusCode().value() == 401 ? 401 : 503);
    } catch (RestClientException error) {
      throw new FalhaAutenticacao(503);
    }
  }

  @Override
  public Usuario me(String authorization) {
    try {
      var usuario =
          client
              .get()
              .uri("/api/v1/identidade/me")
              .header("Authorization", authorization)
              .retrieve()
              .body(Usuario.class);
      if (usuario == null || usuario.id() == null) throw new FalhaAutenticacao(503);
      UUID.fromString(usuario.id());
      if (usuario.perfil() != null
          && !java.util.Set.of("ADMINISTRADOR", "GESTOR_FROTA").contains(usuario.perfil()))
        throw new FalhaAutenticacao(503);
      return usuario;
    } catch (RestClientResponseException error) {
      throw new FalhaAutenticacao(error.getStatusCode().value() == 401 ? 401 : 503);
    } catch (RestClientException | IllegalArgumentException error) {
      throw new FalhaAutenticacao(503);
    }
  }
}
