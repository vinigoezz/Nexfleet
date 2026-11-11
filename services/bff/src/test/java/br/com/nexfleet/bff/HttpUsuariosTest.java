package br.com.nexfleet.bff;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import br.com.nexfleet.bff.gerenciarusuarios.application.*;
import br.com.nexfleet.bff.gerenciarusuarios.infrastructure.HttpUsuarios;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class HttpUsuariosTest {
  final RestClient.Builder builder = RestClient.builder().baseUrl("http://identidade");
  final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
  final HttpUsuarios client = new HttpUsuarios(builder.build());
  final UUID id = UUID.fromString("e2f6b588-00cf-45bc-927e-c4a08647dfde");
  final String dados =
      "{\"id\":\"e2f6b588-00cf-45bc-927e-c4a08647dfde\",\"email\":\"novo@example.com\",\"perfil\":\"GESTOR_FROTA\",\"ativo\":true}";

  @Test
  void listaEncaminhaPaginacaoEBearer() {
    server
        .expect(requestTo("http://identidade/api/v1/identidade/usuarios?pagina=1&tamanho=20"))
        .andExpect(header("Authorization", "Bearer token"))
        .andRespond(withSuccess("[" + dados + "]", MediaType.APPLICATION_JSON));
    assertEquals(id, client.listar("Bearer token", 1, 20).getFirst().id());
    server.verify();
  }

  @Test
  void cadastroEEdicaoUsamVerbosEContratosCorretos() {
    server
        .expect(requestTo("http://identidade/api/v1/identidade/usuarios"))
        .andExpect(method(HttpMethod.POST))
        .andExpect(header("Authorization", "Bearer token"))
        .andExpect(
            content()
                .json(
                    "{\"email\":\"novo@example.com\",\"senha\":\"senha-nova-segura\",\"perfil\":\"GESTOR_FROTA\"}"))
        .andRespond(withSuccess(dados, MediaType.APPLICATION_JSON));
    server
        .expect(requestTo("http://identidade/api/v1/identidade/usuarios/" + id))
        .andExpect(method(HttpMethod.PUT))
        .andExpect(header("Authorization", "Bearer token"))
        .andExpect(
            content()
                .json(
                    "{\"email\":\"novo@example.com\",\"perfil\":\"GESTOR_FROTA\",\"ativo\":true}"))
        .andRespond(withSuccess(dados, MediaType.APPLICATION_JSON));
    assertEquals(
        id,
        client
            .criar(
                "Bearer token",
                new UsuariosRemotos.Criar("novo@example.com", "senha-nova-segura", "GESTOR_FROTA"))
            .id());
    assertEquals(
        id,
        client
            .atualizar(
                "Bearer token",
                id,
                new UsuariosRemotos.Atualizar("novo@example.com", "GESTOR_FROTA", true))
            .id());
    server.verify();
  }

  @Test
  void desativaPreservandoBearer() {
    server
        .expect(requestTo("http://identidade/api/v1/identidade/usuarios/" + id))
        .andExpect(method(HttpMethod.DELETE))
        .andExpect(header("Authorization", "Bearer token"))
        .andRespond(withStatus(HttpStatus.NO_CONTENT));
    client.desativar("Bearer token", id);
    server.verify();
  }

  @Test
  void naoVazaErroInternoEConserva403() {
    server.expect(anything()).andRespond(withStatus(HttpStatus.FORBIDDEN).body("detalhe privado"));
    var failure = assertThrows(FalhaUsuarios.class, () -> client.consultar("Bearer token", id));
    assertEquals(403, failure.status());
    assertFalse(failure.getMessage().contains("privado"));
  }

  @Test
  void semBearerNaoChamaServico() {
    var port = mock(UsuariosRemotos.class);
    var web = new GerenciarUsuariosWeb(port);
    assertEquals(401, assertThrows(FalhaUsuarios.class, () -> web.listar(null, 0, 20)).status());
    assertThrows(FalhaUsuarios.class, () -> web.desativar("Bearer ", id));
    verifyNoInteractions(port);
  }
}
