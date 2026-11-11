package br.com.nexfleet.bff;

import static org.junit.jupiter.api.Assertions.*;

import br.com.nexfleet.bff.consultarambiente.api.AmbienteController;
import br.com.nexfleet.bff.consultarambiente.application.ConsultarAmbiente;
import org.junit.jupiter.api.Test;

class ConsultarAmbienteTest {
  @Test
  void agregaOsQuatroServicos() {
    var response = new AmbienteController(new ConsultarAmbiente(s -> true)).consultar();
    assertEquals(200, response.getStatusCode().value());
    assertEquals(4, response.getBody().services().size());
    assertEquals("UP", response.getBody().status());
  }

  @Test
  void falhaParcialNaoSeTornaSucesso() {
    var response =
        new AmbienteController(new ConsultarAmbiente(s -> !s.equals("frota"))).consultar();
    assertEquals(503, response.getStatusCode().value());
    assertEquals("DEGRADED", response.getBody().status());
    assertEquals(
        "DOWN",
        response.getBody().services().stream()
            .filter(s -> s.name().equals("frota"))
            .findFirst()
            .orElseThrow()
            .status());
    assertEquals(
        3, response.getBody().services().stream().filter(s -> s.status().equals("UP")).count());
  }
}
