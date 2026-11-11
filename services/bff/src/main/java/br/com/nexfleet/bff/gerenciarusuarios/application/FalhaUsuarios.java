package br.com.nexfleet.bff.gerenciarusuarios.application;

public class FalhaUsuarios extends RuntimeException {
  private final int status;

  public FalhaUsuarios(int status) {
    this(
        status,
        switch (status) {
          case 400, 422 -> "Confira os campos informados.";
          case 401 -> "Sessão inválida. Entre novamente.";
          case 403 -> "Acesso exclusivo de Administrador ativo.";
          case 404 -> "Usuário não encontrado.";
          case 409 -> "E-mail já cadastrado.";
          default -> "Serviço de usuários indisponível. Tente novamente.";
        });
  }

  public FalhaUsuarios(int status, String mensagem) {
    super(mensagem);
    this.status = status;
  }

  public int status() {
    return status;
  }
}
