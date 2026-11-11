package br.com.nexfleet.bff.observability;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class CorrelationIdsTest {
  @Test
  void filtroMantemUuidValidoDuranteARequisicaoELimpaMdcAoFinal() throws Exception {
    String correlationId = UUID.randomUUID().toString();
    var request = new MockHttpServletRequest("GET", "/api/v1/ambiente");
    request.addHeader(CorrelationIds.HEADER, correlationId);
    var response = new MockHttpServletResponse();

    new CorrelationIdFilter().doFilter(request, response, (req, res) ->
        assertEquals(correlationId, MDC.get(CorrelationIds.MDC_KEY)));

    assertEquals(correlationId, response.getHeader(CorrelationIds.HEADER));
    assertNull(MDC.get(CorrelationIds.MDC_KEY));
  }

  @Test
  void clienteInternoPropagaCorrelationIdDoMdc() {
    String correlationId = UUID.randomUUID().toString();
    RestClient.Builder builder = CorrelationIds.propagate(
        RestClient.builder().baseUrl("http://servico-interno"));
    MockRestServiceServer servidor = MockRestServiceServer.bindTo(builder).build();
    RestClient client = builder.build();
    servidor.expect(once(), requestTo("http://servico-interno/teste"))
        .andExpect(header(CorrelationIds.HEADER, correlationId))
        .andRespond(withSuccess("ok", MediaType.TEXT_PLAIN));

    try (MDC.MDCCloseable ignored = MDC.putCloseable(CorrelationIds.MDC_KEY, correlationId)) {
      assertEquals("ok", client.get().uri("/teste").retrieve().body(String.class));
    }

    servidor.verify();
  }

  @Test
  void valorInvalidoNuncaEReutilizado() {
    String resolvido = CorrelationIds.resolve("nao-e-uuid");
    assertNotEquals("nao-e-uuid", resolvido);
    assertEquals(resolvido, UUID.fromString(resolvido).toString());
  }
}
