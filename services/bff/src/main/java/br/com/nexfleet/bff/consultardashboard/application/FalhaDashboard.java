package br.com.nexfleet.bff.consultardashboard.application;

public class FalhaDashboard extends RuntimeException {
  private final int status;

  public FalhaDashboard(int status) {
    super(status == 401 ? "Autenticação necessária." : "Não foi possível consultar o dashboard.");
    this.status = status;
  }

  public int status() {
    return status;
  }
}
