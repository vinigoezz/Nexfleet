package br.com.nexfleet.bff.gerenciarveiculos.api;

import br.com.nexfleet.bff.gerenciarveiculos.application.*;
import java.net.URI;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/veiculos")
public class VeiculosWebController {
  private final GerenciarVeiculosWeb veiculos;

  public VeiculosWebController(GerenciarVeiculosWeb veiculos) {
    this.veiculos = veiculos;
  }

  @GetMapping
  public ResponseEntity<List<VeiculosRemotos.Dados>> listar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "0") int pagina,
      @RequestParam(defaultValue = "20") int tamanho) {
    return semCache(veiculos.listar(token, status, pagina, tamanho));
  }

  @GetMapping("/{id}")
  public ResponseEntity<VeiculosRemotos.Dados> consultar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @PathVariable UUID id) {
    return semCache(veiculos.consultar(token, id));
  }

  @PostMapping
  public ResponseEntity<VeiculosRemotos.Dados> criar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @RequestBody VeiculosRemotos.Entrada entrada) {
    var novo = veiculos.criar(token, entrada);
    return ResponseEntity.created(URI.create("/api/v1/veiculos/" + novo.id()))
        .cacheControl(CacheControl.noStore())
        .body(novo);
  }

  @PutMapping("/{id}")
  public ResponseEntity<VeiculosRemotos.Dados> atualizar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @PathVariable UUID id,
      @RequestBody VeiculosRemotos.Entrada entrada) {
    return semCache(veiculos.atualizar(token, id, entrada));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> inativar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @PathVariable UUID id) {
    veiculos.inativar(token, id);
    return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
  }

  @DeleteMapping("/{id}/definitivo")
  public ResponseEntity<Void> excluir(
      @RequestHeader(value = "Authorization", required = false) String token,
      @PathVariable UUID id) {
    veiculos.excluir(token, id);
    return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
  }

  private <T> ResponseEntity<T> semCache(T body) {
    return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);
  }

  @ExceptionHandler(FalhaVeiculos.class)
  public ResponseEntity<Map<String, String>> falha(FalhaVeiculos error) {
    return ResponseEntity.status(error.status())
        .cacheControl(CacheControl.noStore())
        .body(Map.of("message", error.getMessage()));
  }
}
