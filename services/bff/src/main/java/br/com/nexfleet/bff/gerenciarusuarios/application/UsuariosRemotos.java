package br.com.nexfleet.bff.gerenciarusuarios.application;

import java.util.List;
import java.util.UUID;

public interface UsuariosRemotos {
  record Dados(UUID id, String email, String perfil, boolean ativo) {}

  record Criar(String email, String senha, String perfil) {
    @Override
    public String toString() {
      return "CriarUsuario[redigido]";
    }
  }

  record Atualizar(String email, String perfil, Boolean ativo) {}

  List<Dados> listar(String bearer, int pagina, int tamanho);

  Dados consultar(String bearer, UUID id);

  Dados criar(String bearer, Criar entrada);

  Dados atualizar(String bearer, UUID id, Atualizar entrada);

  void desativar(String bearer, UUID id);

  void excluir(String bearer, UUID id);
}
