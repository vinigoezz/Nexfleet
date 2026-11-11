package br.com.nexfleet.bff.gerenciarveiculos.application;

public class FalhaVeiculos extends RuntimeException {
  private final int status;

  public FalhaVeiculos(int status) {
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
      case 404 -> "Veículo não encontrado.";
      case 409 -> "Já existe um veículo com essa placa.";
      case 422 -> "Revise os dados informados para o veículo.";
      default -> "O serviço Frota está indisponível. Tente novamente.";
    };
  }
}
