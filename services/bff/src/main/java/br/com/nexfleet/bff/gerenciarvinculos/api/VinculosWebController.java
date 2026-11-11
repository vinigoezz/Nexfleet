package br.com.nexfleet.bff.gerenciarvinculos.api;

import br.com.nexfleet.bff.gerenciarvinculos.application.*;
import java.net.URI;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/vinculos")
public class VinculosWebController {
  private final GerenciarVinculosWeb vinculos;

  public VinculosWebController(GerenciarVinculosWeb vinculos) {
    this.vinculos = vinculos;
  }

  @GetMapping
  public ResponseEntity<List<VinculosRemotos.Dados>> listar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @RequestParam(required = false) UUID veiculoId,
      @RequestParam(defaultValue = "0") int pagina,
      @RequestParam(defaultValue = "20") int tamanho) {
    return semCache(vinculos.listar(token, veiculoId, pagina, tamanho));
  }

  @PostMapping
  public ResponseEntity<VinculosRemotos.Dados> criar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @RequestBody VinculosRemotos.Entrada entrada) {
    var novo = vinculos.criar(token, entrada);
    return ResponseEntity.created(URI.create("/api/v1/vinculos/" + novo.id()))
        .cacheControl(CacheControl.noStore())
        .body(novo);
  }

  @PutMapping("/{id}/encerramento")
  public ResponseEntity<VinculosRemotos.Dados> encerrar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @PathVariable UUID id) {
    return semCache(vinculos.encerrar(token, id));
  }

  private <T> ResponseEntity<T> semCache(T body) {
    return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);
  }

  @ExceptionHandler(FalhaVinculos.class)
  public ResponseEntity<Map<String, String>> falha(FalhaVinculos error) {
    return ResponseEntity.status(error.status())
        .cacheControl(CacheControl.noStore())
        .body(Map.of("message", error.getMessage()));
  }
}
