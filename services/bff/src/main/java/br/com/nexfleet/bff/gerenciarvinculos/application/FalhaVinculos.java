package br.com.nexfleet.bff.gerenciarvinculos.application;

public class FalhaVinculos extends RuntimeException {
  private final int status;

  public FalhaVinculos(int status) {
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
      case 404 -> "Veículo, motorista ou vínculo não encontrado.";
      case 409 -> "O veículo já possui vínculo ativo ou o vínculo já foi encerrado.";
      case 400, 422 -> "Não foi possível criar o vínculo com os dados informados.";
      default -> "Serviço Frota indisponível.";
    };
  }
}
