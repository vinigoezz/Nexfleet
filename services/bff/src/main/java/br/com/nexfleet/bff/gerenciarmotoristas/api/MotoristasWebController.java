package br.com.nexfleet.bff.gerenciarmotoristas.api;

import br.com.nexfleet.bff.gerenciarmotoristas.application.*;
import java.net.URI;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/motoristas")
public class MotoristasWebController {
  private final GerenciarMotoristasWeb motoristas;

  public MotoristasWebController(GerenciarMotoristasWeb motoristas) {
    this.motoristas = motoristas;
  }

  @GetMapping
  public ResponseEntity<List<MotoristasRemotos.Dados>> listar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "0") int pagina,
      @RequestParam(defaultValue = "20") int tamanho) {
    return semCache(motoristas.listar(token, status, pagina, tamanho));
  }

  @GetMapping("/{id}")
  public ResponseEntity<MotoristasRemotos.Dados> consultar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @PathVariable UUID id) {
    return semCache(motoristas.consultar(token, id));
  }

  @PostMapping
  public ResponseEntity<MotoristasRemotos.Dados> criar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @RequestBody MotoristasRemotos.Entrada entrada) {
    var novo = motoristas.criar(token, entrada);
    return ResponseEntity.created(URI.create("/api/v1/motoristas/" + novo.id()))
        .cacheControl(CacheControl.noStore())
        .body(novo);
  }

  @PutMapping("/{id}")
  public ResponseEntity<MotoristasRemotos.Dados> atualizar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @PathVariable UUID id,
      @RequestBody MotoristasRemotos.Entrada entrada) {
    return semCache(motoristas.atualizar(token, id, entrada));
  }

  @DeleteMapping("/{id}/definitivo")
  public ResponseEntity<Void> excluir(
      @RequestHeader(value = "Authorization", required = false) String token,
      @PathVariable UUID id) {
    motoristas.excluir(token, id);
    return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
  }

  private <T> ResponseEntity<T> semCache(T body) {
    return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);
  }

  @ExceptionHandler(FalhaMotoristas.class)
  public ResponseEntity<Map<String, String>> falha(FalhaMotoristas error) {
    return ResponseEntity.status(error.status())
        .cacheControl(CacheControl.noStore())
        .body(Map.of("message", error.getMessage()));
  }
}
