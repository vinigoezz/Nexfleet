package br.com.nexfleet.bff.consultardashboard.api;

import br.com.nexfleet.bff.consultardashboard.application.*;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
public class DashboardWebController {
  private final ConsultarDashboardWeb dashboard;

  public DashboardWebController(ConsultarDashboardWeb dashboard) {
    this.dashboard = dashboard;
  }

  @GetMapping("/api/v1/dashboard")
  ResponseEntity<ConsultarDashboardWeb.Resultado> consultar(
      @RequestHeader(value = "Authorization", required = false) String token) {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noStore())
        .body(dashboard.consultar(token));
  }

  @ExceptionHandler(FalhaDashboard.class)
  ResponseEntity<Map<String, String>> falha(FalhaDashboard error) {
    return ResponseEntity.status(error.status())
        .cacheControl(CacheControl.noStore())
        .body(Map.of("message", error.getMessage()));
  }
}
