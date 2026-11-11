package br.com.nexfleet.bff.autenticar.application;

public class FalhaAutenticacao extends RuntimeException {
  private final int status;

  public FalhaAutenticacao(int status) {
    super(
        switch (status) {
          case 400 -> "Informe e-mail e senha válidos.";
          case 401 -> "Credenciais ou sessão inválidas.";
          default -> "Serviço de identidade indisponível.";
        });
    this.status = status;
  }

  public int status() {
    return status;
  }
}
