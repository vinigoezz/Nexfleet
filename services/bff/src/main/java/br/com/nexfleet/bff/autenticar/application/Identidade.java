package br.com.nexfleet.bff.autenticar.application;

public interface Identidade {
  Token login(Credenciais credenciais);

  Usuario me(String authorization);

  record Credenciais(String email, String senha) {
    @Override
    public String toString() {
      return "Credenciais[redigido]";
    }
  }

  record Token(String accessToken, String tokenType, long expiresIn) {
    @Override
    public String toString() {
      return "Token[redigido]";
    }
  }

  record Usuario(String id, String perfil) {
    public Usuario(String id) {
      this(id, null);
    }
  }
}
