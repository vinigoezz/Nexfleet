package br.com.nexfleet.bff;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import br.com.nexfleet.bff.gerenciarabastecimentos.application.*;
import br.com.nexfleet.bff.gerenciarabastecimentos.infrastructure.HttpAbastecimentos;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class HttpAbastecimentosTest {
  final RestClient.Builder builder = RestClient.builder().baseUrl("http://operacoes");
  final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
  final HttpAbastecimentos client = new HttpAbastecimentos(builder.build());
  final UUID veiculo = UUID.fromString("b176f1b1-bc54-4f22-9b2e-fb69469ab033");
  final UUID motorista = UUID.fromString("3ce0bdb7-f1de-47c2-baa3-7b99e343650c");
  final String dados = "{\"id\":\"1d4be0d1-4801-41e1-9c5f-9002b2fc6dcc\","
      + "\"veiculoId\":\"" + veiculo + "\",\"motoristaId\":\"" + motorista + "\","
      + "\"realizadoEm\":\"2026-11-05T14:00:00Z\",\"combustivel\":\"DIESEL\","
      + "\"litros\":42.50,\"valorTotal\":250.90,\"quilometragem\":12000,"
      + "\"criadoEm\":\"2026-11-05T15:00:00Z\"}";

  @Test
  void listaERegistraPreservandoBearerEContrato() {
    server.expect(requestTo("http://operacoes/api/v1/operacoes/abastecimentos?pagina=0&tamanho=20"))
        .andExpect(header("Authorization", "Bearer token"))
        .andRespond(withSuccess("[" + dados + "]", MediaType.APPLICATION_JSON));
    var entrada = new AbastecimentosRemotos.Entrada(veiculo, motorista,
        Instant.parse("2026-11-05T14:00:00Z"), "DIESEL",
        new BigDecimal("42.50"), new BigDecimal("250.90"), 12000L);
    server.expect(requestTo("http://operacoes/api/v1/operacoes/abastecimentos"))
        .andExpect(method(HttpMethod.POST))
        .andExpect(header("Authorization", "Bearer token"))
        .andRespond(withSuccess(dados, MediaType.APPLICATION_JSON));
    assertEquals(12000, client.listar("Bearer token", null, 0, 20).getFirst().quilometragem());
    assertEquals(veiculo, client.registrar("Bearer token", entrada).veiculoId());
    server.verify();
  }

  @Test
  void conservaErroDeValidacaoSemVazarRespostaInterna() {
    server.expect(anything()).andRespond(withStatus(HttpStatus.UNPROCESSABLE_ENTITY)
        .body("detalhe privado"));
    var erro = assertThrows(FalhaAbastecimentos.class,
        () -> client.listar("Bearer token", null, 0, 20));
    assertEquals(422, erro.status());
    assertFalse(erro.getMessage().contains("privado"));
  }
}
