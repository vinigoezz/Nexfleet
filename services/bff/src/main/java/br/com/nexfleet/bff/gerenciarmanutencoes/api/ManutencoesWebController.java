package br.com.nexfleet.bff.gerenciarmanutencoes.api;

import br.com.nexfleet.bff.gerenciarmanutencoes.application.*;
import java.net.URI;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/manutencoes")
public class ManutencoesWebController {
  private final GerenciarManutencoesWeb manutencoes;
  public ManutencoesWebController(GerenciarManutencoesWeb manutencoes) { this.manutencoes = manutencoes; }

  @GetMapping
  public ResponseEntity<List<ManutencoesRemotas.Dados>> listar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @RequestParam(required = false) UUID veiculoId,
      @RequestParam(defaultValue = "0") int pagina,
      @RequestParam(defaultValue = "20") int tamanho) {
    return ResponseEntity.ok().cacheControl(CacheControl.noStore())
        .body(manutencoes.listar(token, veiculoId, pagina, tamanho));
  }

  @PostMapping
  public ResponseEntity<ManutencoesRemotas.Dados> registrar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @RequestBody ManutencoesRemotas.Entrada entrada) {
    var novo = manutencoes.registrar(token, entrada);
    return ResponseEntity.created(URI.create("/api/v1/manutencoes/" + novo.id()))
        .cacheControl(CacheControl.noStore()).body(novo);
  }

  @ExceptionHandler(FalhaManutencoes.class)
  public ResponseEntity<Map<String, String>> falha(FalhaManutencoes erro) {
    return ResponseEntity.status(erro.status()).cacheControl(CacheControl.noStore())
        .body(Map.of("message", erro.getMessage()));
  }
}
