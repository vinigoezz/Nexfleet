package br.com.nexfleet.bff.consultarambiente.api;

import br.com.nexfleet.bff.consultarambiente.application.ConsultarAmbiente;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AmbienteController {
  private final ConsultarAmbiente consulta;

  public AmbienteController(ConsultarAmbiente consulta) {
    this.consulta = consulta;
  }

  @GetMapping("/api/v1/ambiente")
  public ResponseEntity<ConsultarAmbiente.Resultado> consultar() {
    var result = consulta.executar();
    return ResponseEntity.status("UP".equals(result.status()) ? 200 : 503).body(result);
  }
}
