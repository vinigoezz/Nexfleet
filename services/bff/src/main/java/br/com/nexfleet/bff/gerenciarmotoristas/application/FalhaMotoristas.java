package br.com.nexfleet.bff.gerenciarmotoristas.application;

public class FalhaMotoristas extends RuntimeException {
  private final int status;

  public FalhaMotoristas(int status) {
    super(mensagem(status));
    this.status = status;
  }

  public int status() {
    return status;
  }

  private static String mensagem(int status) {
    return switch (status) {
      case 401 -> "Sessão ausente ou inválida.";
      case 403 -> "Seu perfil não pode acessar a Frota.";
      case 404 -> "Motorista não encontrado.";
      case 409 -> "CPF ou CNH já cadastrado.";
      case 400, 422 -> "Dados do motorista inválidos.";
      default -> "Serviço Frota indisponível.";
    };
  }
}
