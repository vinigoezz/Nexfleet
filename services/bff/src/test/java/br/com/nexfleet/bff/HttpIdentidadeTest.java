package br.com.nexfleet.bff;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import br.com.nexfleet.bff.autenticar.application.*;
import br.com.nexfleet.bff.autenticar.infrastructure.HttpIdentidade;
import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class HttpIdentidadeTest {
  final RestClient.Builder builder = RestClient.builder().baseUrl("http://identidade");
  final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
  final HttpIdentidade client = new HttpIdentidade(builder.build());

  @Test
  void loginEnviaJsonAoServicoCorreto() {
    server
        .expect(requestTo("http://identidade/api/v1/identidade/login"))
        .andExpect(method(HttpMethod.POST))
        .andExpect(content().json("{\"email\":\"teste@example.com\",\"senha\":\"senha\"}"))
        .andRespond(
            withSuccess(
                "{\"accessToken\":\"token\",\"tokenType\":\"Bearer\",\"expiresIn\":900}",
                MediaType.APPLICATION_JSON));
    assertEquals(
        "token",
        client.login(new Identidade.Credenciais("teste@example.com", "senha")).accessToken());
    server.verify();
  }

  @Test
  void meEncaminhaBearerSemCompartilharChaveDeAssinatura() {
    server
        .expect(requestTo("http://identidade/api/v1/identidade/me"))
        .andExpect(header("Authorization", "Bearer token"))
        .andRespond(
            withSuccess(
                "{\"id\":\"e2f6b588-00cf-45bc-927e-c4a08647dfde\"}", MediaType.APPLICATION_JSON));
    assertNotNull(client.me("Bearer token"));
    server.verify();
  }

  @Test
  void loginInvalidoMantem401SemVazarRespostaInterna() {
    server
        .expect(anything())
        .andRespond(withStatus(HttpStatus.UNAUTHORIZED).body("detalhe privado"));
    var erro =
        assertThrows(
            FalhaAutenticacao.class, () -> client.login(new Identidade.Credenciais("e", "s")));
    assertEquals(401, erro.status());
    assertFalse(erro.getMessage().contains("privado"));
  }

  @Test
  void indisponibilidadeOuRespostaInvalidaVira503() {
    server.expect(anything()).andRespond(withServerError());
    assertEquals(
        503, assertThrows(FalhaAutenticacao.class, () -> client.me("Bearer token")).status());
  }

  @Test
  void tokenSemCamposObrigatoriosNaoEhAceito() {
    server.expect(anything()).andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));
    assertEquals(
        503,
        assertThrows(
                FalhaAutenticacao.class, () -> client.login(new Identidade.Credenciais("e", "s")))
            .status());
  }
}
