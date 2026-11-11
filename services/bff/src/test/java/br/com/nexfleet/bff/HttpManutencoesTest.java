package br.com.nexfleet.bff;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import br.com.nexfleet.bff.gerenciarmanutencoes.application.*;
import br.com.nexfleet.bff.gerenciarmanutencoes.infrastructure.HttpManutencoes;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class HttpManutencoesTest {
  final RestClient.Builder builder = RestClient.builder().baseUrl("http://operacoes");
  final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
  final HttpManutencoes client = new HttpManutencoes(builder.build());
  final UUID veiculo = UUID.randomUUID();
  final String dados = "{\"id\":\"" + UUID.randomUUID() + "\",\"veiculoId\":\"" + veiculo
      + "\",\"tipo\":\"PREVENTIVA\",\"realizadaEm\":\"2026-11-06\","
      + "\"quilometragem\":15000,\"descricao\":\"Revisão\",\"oficina\":\"Central\","
      + "\"valor\":450.00,\"proximaManutencao\":\"2026-12-06\","
      + "\"criadoEm\":\"2026-11-06T12:00:00Z\"}";

  @Test
  void listaERegistraPreservandoContrato() {
    server.expect(requestTo("http://operacoes/api/v1/operacoes/manutencoes?pagina=0&tamanho=20"))
        .andExpect(header("Authorization", "Bearer token"))
        .andRespond(withSuccess("[" + dados + "]", MediaType.APPLICATION_JSON));
    server.expect(requestTo("http://operacoes/api/v1/operacoes/manutencoes"))
        .andExpect(method(HttpMethod.POST)).andExpect(header("Authorization", "Bearer token"))
        .andRespond(withSuccess(dados, MediaType.APPLICATION_JSON));
    var entrada = new ManutencoesRemotas.Entrada(veiculo, "PREVENTIVA",
        LocalDate.of(2026, 11, 6), 15000L, "Revisão", "Central",
        new BigDecimal("450.00"), LocalDate.of(2026, 12, 6));
    assertEquals("PREVENTIVA", client.listar("Bearer token", null, 0, 20).getFirst().tipo());
    assertEquals(veiculo, client.registrar("Bearer token", entrada).veiculoId());
    server.verify();
  }

  @Test
  void conservaErroDeValidacaoSemVazarRespostaInterna() {
    server.expect(anything()).andRespond(withStatus(HttpStatus.UNPROCESSABLE_ENTITY)
        .body("detalhe privado"));
    var erro = assertThrows(FalhaManutencoes.class,
        () -> client.listar("Bearer token", null, 0, 20));
    assertEquals(422, erro.status());
    assertFalse(erro.getMessage().contains("privado"));
  }
}
