package br.com.nexfleet.bff;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import br.com.nexfleet.bff.consultarambiente.infrastructure.HttpConsultarStatus;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class HttpConsultarStatusTest {
  @Test
  void usaContratoPublicoDoServico() {
    var builder = RestClient.builder().baseUrl("http://frota");
    var server = MockRestServiceServer.bindTo(builder).build();
    server
        .expect(requestTo("http://frota/api/v1/frota/info"))
        .andRespond(
            withSuccess("{\"service\":\"frota\",\"status\":\"UP\"}", MediaType.APPLICATION_JSON));
    assertTrue(new HttpConsultarStatus(Map.of("frota", builder.build())).disponivel("frota"));
    server.verify();
  }

  @Test
  void upstreamComErroEhIndisponivel() {
    var builder = RestClient.builder().baseUrl("http://frota");
    var server = MockRestServiceServer.bindTo(builder).build();
    server.expect(requestTo("http://frota/api/v1/frota/info")).andRespond(withServerError());
    assertFalse(new HttpConsultarStatus(Map.of("frota", builder.build())).disponivel("frota"));
    server.verify();
  }

  @Test
  void respostaDeOutroServicoNaoEhAceita() {
    var builder = RestClient.builder().baseUrl("http://frota");
    var server = MockRestServiceServer.bindTo(builder).build();
    server
        .expect(requestTo("http://frota/api/v1/frota/info"))
        .andRespond(
            withSuccess(
                "{\"service\":\"operacoes\",\"status\":\"UP\"}", MediaType.APPLICATION_JSON));
    assertFalse(new HttpConsultarStatus(Map.of("frota", builder.build())).disponivel("frota"));
  }
}
