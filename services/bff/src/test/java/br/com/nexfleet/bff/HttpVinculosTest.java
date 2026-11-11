package br.com.nexfleet.bff;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import br.com.nexfleet.bff.gerenciarvinculos.application.*;
import br.com.nexfleet.bff.gerenciarvinculos.infrastructure.HttpVinculos;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class HttpVinculosTest {
  final RestClient.Builder builder = RestClient.builder().baseUrl("http://frota");
  final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
  final HttpVinculos client = new HttpVinculos(builder.build());
  final UUID id = UUID.fromString("1d4be0d1-4801-41e1-9c5f-9002b2fc6dcc");
  final UUID veiculoId = UUID.fromString("b176f1b1-bc54-4f22-9b2e-fb69469ab033");
  final UUID motoristaId = UUID.fromString("3ce0bdb7-f1de-47c2-baa3-7b99e343650c");
  final String dados =
      "{\"id\":\"1d4be0d1-4801-41e1-9c5f-9002b2fc6dcc\","
          + "\"veiculoId\":\"b176f1b1-bc54-4f22-9b2e-fb69469ab033\",\"veiculoPlaca\":\"ABC1D23\","
          + "\"motoristaId\":\"3ce0bdb7-f1de-47c2-baa3-7b99e343650c\",\"motoristaNome\":\"Ana Silva\","
          + "\"inicio\":\"2026-10-23T15:00:00Z\",\"fim\":null,"
          + "\"criadoEm\":\"2026-10-23T15:00:00Z\",\"atualizadoEm\":\"2026-10-23T15:00:00Z\"}";

  @Test
  void listaEncaminhaFiltroPaginacaoEBearer() {
    server
        .expect(
            requestTo(
                "http://frota/api/v1/frota/vinculos?pagina=1&tamanho=20&veiculoId=" + veiculoId))
        .andExpect(header("Authorization", "Bearer token"))
        .andRespond(withSuccess("[" + dados + "]", MediaType.APPLICATION_JSON));
    assertEquals(id, client.listar("Bearer token", veiculoId, 1, 20).getFirst().id());
    server.verify();
  }

  @Test
  void criaEEncerraComContratoCorreto() {
    var entrada = new VinculosRemotos.Entrada(veiculoId, motoristaId);
    server.expect(requestTo("http://frota/api/v1/frota/vinculos"))
        .andExpect(method(HttpMethod.POST))
        .andExpect(header("Authorization", "Bearer token"))
        .andRespond(withSuccess(dados, MediaType.APPLICATION_JSON));
    server.expect(requestTo("http://frota/api/v1/frota/vinculos/" + id + "/encerramento"))
        .andExpect(method(HttpMethod.PUT))
        .andRespond(withSuccess(dados.replace("\"fim\":null", "\"fim\":\"2026-10-23T16:00:00Z\""), MediaType.APPLICATION_JSON));
    assertEquals(id, client.criar("Bearer token", entrada).id());
    assertNotNull(client.encerrar("Bearer token", id).fim());
    server.verify();
  }

  @Test
  void conservaConflitoSemVazarRespostaInterna() {
    server.expect(anything()).andRespond(withStatus(HttpStatus.CONFLICT).body("detalhe privado"));
    var falha =
        assertThrows(FalhaVinculos.class, () -> client.listar("Bearer token", null, 0, 20));
    assertEquals(409, falha.status());
    assertFalse(falha.getMessage().contains("privado"));
  }

  @Test
  void rejeitaBearerAusenteAntesDaRede() {
    var port = mock(VinculosRemotos.class);
    var web = new GerenciarVinculosWeb(port);
    assertEquals(
        401,
        assertThrows(FalhaVinculos.class, () -> web.listar(null, null, 0, 20)).status());
    verifyNoInteractions(port);
  }
}
