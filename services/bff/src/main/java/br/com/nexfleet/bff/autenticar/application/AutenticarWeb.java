package br.com.nexfleet.bff.autenticar.application;

import java.nio.charset.StandardCharsets;

public class AutenticarWeb {
  private final Identidade identidade;

  public AutenticarWeb(Identidade identidade) {
    this.identidade = identidade;
  }

  public Identidade.Token login(Identidade.Credenciais credenciais) {
    if (credenciais == null
        || credenciais.email() == null
        || credenciais.email().isBlank()
        || credenciais.email().length() > 254
        || credenciais.senha() == null
        || credenciais.senha().isEmpty()
        || credenciais.senha().getBytes(StandardCharsets.UTF_8).length > 72) {
      throw new FalhaAutenticacao(400);
    }
    return identidade.login(credenciais);
  }

  public Identidade.Usuario me(String authorization) {
    if (authorization == null
        || !authorization.startsWith("Bearer ")
        || authorization.length() > 8192
        || authorization.length() <= 7
        || authorization.substring(7).chars().anyMatch(Character::isWhitespace)) {
      throw new FalhaAutenticacao(401);
    }
    return identidade.me(authorization);
  }
}
