package br.com.nexfleet.bff.gerenciarusuarios.application;

import java.util.List;
import java.util.UUID;

public class GerenciarUsuariosWeb {
  private final UsuariosRemotos usuarios;

  public GerenciarUsuariosWeb(UsuariosRemotos usuarios) {
    this.usuarios = usuarios;
  }

  public List<UsuariosRemotos.Dados> listar(String token, int pagina, int tamanho) {
    return usuarios.listar(bearer(token), pagina, tamanho);
  }

  public UsuariosRemotos.Dados consultar(String token, UUID id) {
    return usuarios.consultar(bearer(token), id);
  }

  public UsuariosRemotos.Dados criar(String token, UsuariosRemotos.Criar entrada) {
    return usuarios.criar(bearer(token), entrada);
  }

  public UsuariosRemotos.Dados atualizar(String token, UUID id, UsuariosRemotos.Atualizar entrada) {
    return usuarios.atualizar(bearer(token), id, entrada);
  }

  public void desativar(String token, UUID id) {
    usuarios.desativar(bearer(token), id);
  }

  private String bearer(String value) {
    if (value == null || value.length() > 8192 || !value.matches("Bearer [^\\s]+"))
      throw new FalhaUsuarios(401);
    return value;
  }
}
