package br.com.nexfleet.bff;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import br.com.nexfleet.bff.gerenciarveiculos.application.*;
import br.com.nexfleet.bff.gerenciarveiculos.infrastructure.HttpVeiculos;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class HttpVeiculosTest {
  final RestClient.Builder builder = RestClient.builder().baseUrl("http://frota");
  final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
  final HttpVeiculos client = new HttpVeiculos(builder.build());
  final UUID id = UUID.fromString("b176f1b1-bc54-4f22-9b2e-fb69469ab033");
  final String dados =
      "{\"id\":\"b176f1b1-bc54-4f22-9b2e-fb69469ab033\",\"placa\":\"ABC1D23\","
          + "\"marca\":\"Volkswagen\",\"modelo\":\"Delivery\",\"ano\":2025,\"tipo\":\"Caminhão\","
          + "\"quilometragem\":1200,\"status\":\"DISPONIVEL\",\"dataAquisicao\":\"2026-01-15\","
          + "\"criadoEm\":\"2026-10-23T12:00:00Z\",\"atualizadoEm\":\"2026-10-23T12:00:00Z\"}";

  @Test
  void listaEncaminhaFiltroPaginacaoEBearer() {
    server
        .expect(
            requestTo(
                "http://frota/api/v1/frota/veiculos?pagina=1&tamanho=20&status=DISPONIVEL"))
        .andExpect(header("Authorization", "Bearer token"))
        .andRespond(withSuccess("[" + dados + "]", MediaType.APPLICATION_JSON));
    assertEquals(id, client.listar("Bearer token", "DISPONIVEL", 1, 20).getFirst().id());
    server.verify();
  }

  @Test
  void criaAtualizaEInativaComContratoCorreto() {
    var entrada =
        new VeiculosRemotos.Entrada(
            "ABC1D23", "Volkswagen", "Delivery", 2025, "Caminhão", 1200L,
            "DISPONIVEL", LocalDate.parse("2026-01-15"));
    server.expect(requestTo("http://frota/api/v1/frota/veiculos"))
        .andExpect(method(HttpMethod.POST)).andExpect(header("Authorization", "Bearer token"))
        .andRespond(withSuccess(dados, MediaType.APPLICATION_JSON));
    server.expect(requestTo("http://frota/api/v1/frota/veiculos/" + id))
        .andExpect(method(HttpMethod.PUT)).andRespond(withSuccess(dados, MediaType.APPLICATION_JSON));
    server.expect(requestTo("http://frota/api/v1/frota/veiculos/" + id))
        .andExpect(method(HttpMethod.DELETE)).andRespond(withStatus(HttpStatus.NO_CONTENT));
    assertEquals(id, client.criar("Bearer token", entrada).id());
    assertEquals(id, client.atualizar("Bearer token", id, entrada).id());
    client.inativar("Bearer token", id);
    server.verify();
  }

  @Test
  void conservaConflitoSemVazarRespostaInterna() {
    server.expect(anything()).andRespond(withStatus(HttpStatus.CONFLICT).body("detalhe privado"));
    var falha = assertThrows(FalhaVeiculos.class, () -> client.consultar("Bearer token", id));
    assertEquals(409, falha.status());
    assertFalse(falha.getMessage().contains("privado"));
  }

  @Test
  void rejeitaBearerAusenteAntesDaRede() {
    var port = mock(VeiculosRemotos.class);
    var web = new GerenciarVeiculosWeb(port, mock(HistoricoOperacional.class));
    assertEquals(401, assertThrows(FalhaVeiculos.class, () -> web.listar(null, null, 0, 20)).status());
    verifyNoInteractions(port);
  }

  @Test
  void exclusaoUsaRotaDefinitivaETraduzConflitoEmHistorico() {
    server.expect(requestTo("http://frota/api/v1/frota/veiculos/" + id + "/definitivo"))
        .andExpect(method(HttpMethod.DELETE)).andRespond(withStatus(HttpStatus.NO_CONTENT));
    server.expect(requestTo("http://frota/api/v1/frota/veiculos/" + id + "/definitivo"))
        .andRespond(withStatus(HttpStatus.CONFLICT));
    server.expect(requestTo("http://frota/api/v1/frota/veiculos/" + id + "/definitivo"))
        .andRespond(withStatus(HttpStatusCode.valueOf(422)));
    client.excluir("Bearer token", id);
    var conflito = assertThrows(FalhaVeiculos.class, () -> client.excluir("Bearer token", id));
    assertEquals(409, conflito.status());
    assertTrue(conflito.getMessage().contains("histórico"));
    var ativo = assertThrows(FalhaVeiculos.class, () -> client.excluir("Bearer token", id));
    assertEquals(422, ativo.status());
    assertTrue(ativo.getMessage().contains("Inative"));
    server.verify();
  }

  @Test
  void naoExcluiVeiculoComManutencoes() {
    var port = mock(VeiculosRemotos.class);
    var historico = mock(HistoricoOperacional.class);
    when(historico.possuiManutencoes("Bearer token", id)).thenReturn(true, false);
    var web = new GerenciarVeiculosWeb(port, historico);
    assertEquals(409, assertThrows(FalhaVeiculos.class, () -> web.excluir("Bearer token", id)).status());
    verify(port, never()).excluir(any(), any());
    web.excluir("Bearer token", id);
    verify(port).excluir("Bearer token", id);
  }

  @Test
  void historicoConsultaManutencoesDoVeiculoEFalhaFechada() {
    var opsBuilder = RestClient.builder().baseUrl("http://operacoes");
    var ops = MockRestServiceServer.bindTo(opsBuilder).build();
    var historico =
        new br.com.nexfleet.bff.gerenciarveiculos.infrastructure.HttpHistoricoOperacional(
            opsBuilder.build());
    ops.expect(
            requestTo(
                "http://operacoes/api/v1/operacoes/manutencoes?veiculoId=" + id
                    + "&pagina=0&tamanho=1"))
        .andExpect(header("Authorization", "Bearer token"))
        .andRespond(withSuccess("[{\"id\":\"x\"}]", MediaType.APPLICATION_JSON));
    ops.expect(anything()).andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));
    ops.expect(anything()).andRespond(withServerError());
    assertTrue(historico.possuiManutencoes("Bearer token", id));
    assertFalse(historico.possuiManutencoes("Bearer token", id));
    assertEquals(
        503,
        assertThrows(FalhaVeiculos.class, () -> historico.possuiManutencoes("Bearer token", id))
            .status());
    ops.verify();
  }
}
