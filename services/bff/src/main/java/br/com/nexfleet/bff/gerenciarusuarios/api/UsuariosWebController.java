package br.com.nexfleet.bff.gerenciarusuarios.api;

import br.com.nexfleet.bff.gerenciarusuarios.application.*;
import java.net.URI;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuariosWebController {
  private final GerenciarUsuariosWeb usuarios;

  public UsuariosWebController(GerenciarUsuariosWeb usuarios) {
    this.usuarios = usuarios;
  }

  @GetMapping
  public ResponseEntity<List<UsuariosRemotos.Dados>> listar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @RequestParam(defaultValue = "0") int pagina,
      @RequestParam(defaultValue = "20") int tamanho) {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noStore())
        .body(usuarios.listar(token, pagina, tamanho));
  }

  @GetMapping("/{id}")
  public ResponseEntity<UsuariosRemotos.Dados> consultar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @PathVariable UUID id) {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noStore())
        .body(usuarios.consultar(token, id));
  }

  @PostMapping
  public ResponseEntity<UsuariosRemotos.Dados> criar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @RequestBody UsuariosRemotos.Criar entrada) {
    var novo = usuarios.criar(token, entrada);
    return ResponseEntity.created(URI.create("/api/v1/usuarios/" + novo.id()))
        .cacheControl(CacheControl.noStore())
        .body(novo);
  }

  @PutMapping("/{id}")
  public ResponseEntity<UsuariosRemotos.Dados> atualizar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @PathVariable UUID id,
      @RequestBody UsuariosRemotos.Atualizar entrada) {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noStore())
        .body(usuarios.atualizar(token, id, entrada));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> desativar(
      @RequestHeader(value = "Authorization", required = false) String token,
      @PathVariable UUID id) {
    usuarios.desativar(token, id);
    return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
  }

  @DeleteMapping("/{id}/definitivo")
  public ResponseEntity<Void> excluir(
      @RequestHeader(value = "Authorization", required = false) String token,
      @PathVariable UUID id) {
    usuarios.excluir(token, id);
    return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
  }

  @ExceptionHandler(FalhaUsuarios.class)
  public ResponseEntity<Map<String, String>> falha(FalhaUsuarios error) {
    return ResponseEntity.status(error.status())
        .cacheControl(CacheControl.noStore())
        .body(Map.of("message", error.getMessage()));
  }
}
