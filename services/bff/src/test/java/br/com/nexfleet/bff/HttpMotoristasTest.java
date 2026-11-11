package br.com.nexfleet.bff;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import br.com.nexfleet.bff.gerenciarmotoristas.application.*;
import br.com.nexfleet.bff.gerenciarmotoristas.infrastructure.HttpMotoristas;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class HttpMotoristasTest {
  final RestClient.Builder builder = RestClient.builder().baseUrl("http://frota");
  final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
  final HttpMotoristas client = new HttpMotoristas(builder.build());
  final UUID id = UUID.fromString("3ce0bdb7-f1de-47c2-baa3-7b99e343650c");
  final String dados =
      "{\"id\":\"3ce0bdb7-f1de-47c2-baa3-7b99e343650c\",\"nome\":\"Ana Silva\","
          + "\"cpf\":\"12345678901\",\"cnh\":\"98765432100\",\"categoria\":\"D\","
          + "\"validadeCnh\":\"2028-06-30\",\"telefone\":\"41999990000\",\"status\":\"ATIVO\","
          + "\"criadoEm\":\"2026-10-23T12:00:00Z\",\"atualizadoEm\":\"2026-10-23T12:00:00Z\"}";

  @Test
  void listaEncaminhaFiltroPaginacaoEBearer() {
    server
        .expect(
            requestTo("http://frota/api/v1/frota/motoristas?pagina=1&tamanho=20&status=ATIVO"))
        .andExpect(header("Authorization", "Bearer token"))
        .andRespond(withSuccess("[" + dados + "]", MediaType.APPLICATION_JSON));
    assertEquals(id, client.listar("Bearer token", "ATIVO", 1, 20).getFirst().id());
    server.verify();
  }

  @Test
  void criaEAtualizaComContratoCorreto() {
    var entrada =
        new MotoristasRemotos.Entrada(
            "Ana Silva", "12345678901", "98765432100", "D",
            LocalDate.parse("2028-06-30"), "41999990000", "ATIVO");
    server.expect(requestTo("http://frota/api/v1/frota/motoristas"))
        .andExpect(method(HttpMethod.POST))
        .andExpect(header("Authorization", "Bearer token"))
        .andRespond(withSuccess(dados, MediaType.APPLICATION_JSON));
    server.expect(requestTo("http://frota/api/v1/frota/motoristas/" + id))
        .andExpect(method(HttpMethod.PUT))
        .andRespond(withSuccess(dados, MediaType.APPLICATION_JSON));
    assertEquals(id, client.criar("Bearer token", entrada).id());
    assertEquals(id, client.atualizar("Bearer token", id, entrada).id());
    server.verify();
  }

  @Test
  void conservaConflitoSemVazarRespostaInterna() {
    server.expect(anything()).andRespond(withStatus(HttpStatus.CONFLICT).body("detalhe privado"));
    var falha = assertThrows(FalhaMotoristas.class, () -> client.consultar("Bearer token", id));
    assertEquals(409, falha.status());
    assertFalse(falha.getMessage().contains("privado"));
  }

  @Test
  void rejeitaBearerAusenteAntesDaRede() {
    var port = mock(MotoristasRemotos.class);
    var web = new GerenciarMotoristasWeb(port);
    assertEquals(
        401,
        assertThrows(FalhaMotoristas.class, () -> web.listar(null, null, 0, 20)).status());
    verifyNoInteractions(port);
  }
}
