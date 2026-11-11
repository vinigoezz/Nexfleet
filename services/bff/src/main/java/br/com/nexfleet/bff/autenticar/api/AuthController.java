package br.com.nexfleet.bff.autenticar.api;

import br.com.nexfleet.bff.autenticar.application.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
  private final AutenticarWeb autenticar;

  public AuthController(AutenticarWeb autenticar) {
    this.autenticar = autenticar;
  }

  @PostMapping("/login")
  public ResponseEntity<Identidade.Token> login(@RequestBody Identidade.Credenciais credenciais) {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noStore())
        .body(autenticar.login(credenciais));
  }

  @GetMapping("/me")
  public ResponseEntity<Identidade.Usuario> me(
      @RequestHeader(value = "Authorization", required = false) String authorization) {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noStore())
        .body(autenticar.me(authorization));
  }

  @ExceptionHandler(FalhaAutenticacao.class)
  public ResponseEntity<Erro> falha(FalhaAutenticacao error) {
    return ResponseEntity.status(error.status())
        .cacheControl(CacheControl.noStore())
        .body(new Erro(error.getMessage()));
  }

  public record Erro(String message) {}
}
