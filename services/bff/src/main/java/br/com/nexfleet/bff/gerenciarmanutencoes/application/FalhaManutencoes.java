package br.com.nexfleet.bff.gerenciarmanutencoes.application;

public class FalhaManutencoes extends RuntimeException {
  private final int status;
  public FalhaManutencoes(int status) {
    super(status == 503 ? "Serviço de operações indisponível." : "Não foi possível processar a manutenção.");
    this.status = status;
  }
  public int status() { return status; }
}
