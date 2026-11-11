package br.com.nexfleet.bff.gerenciarmanutencoes.infrastructure;

import br.com.nexfleet.bff.gerenciarmanutencoes.application.*;
import java.util.*;
import java.util.function.Supplier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.*;

public class HttpManutencoes implements ManutencoesRemotas {
  private static final String PATH = "/api/v1/operacoes/manutencoes";
  private final RestClient client;
  public HttpManutencoes(RestClient client) { this.client = client; }

  @Override
  public List<Dados> listar(String token, UUID veiculoId, int pagina, int tamanho) {
    return chamada(() -> {
      var lista = client.get().uri(builder -> {
        var uri = builder.path(PATH).queryParam("pagina", pagina).queryParam("tamanho", tamanho);
        if (veiculoId != null) uri.queryParam("veiculoId", veiculoId);
        return uri.build();
      }).header("Authorization", token).retrieve()
          .body(new ParameterizedTypeReference<List<Dados>>() {});
      if (lista == null) throw new FalhaManutencoes(503);
      lista.forEach(this::validar);
      return lista;
    });
  }

  @Override
  public Dados registrar(String token, Entrada entrada) {
    return chamada(() -> validar(client.post().uri(PATH).header("Authorization", token)
        .body(entrada).retrieve().body(Dados.class)));
  }

  private Dados validar(Dados dados) {
    if (dados == null || dados.id() == null || dados.veiculoId() == null || dados.tipo() == null
        || dados.realizadaEm() == null || dados.descricao() == null || dados.oficina() == null
        || dados.valor() == null || dados.criadoEm() == null)
      throw new FalhaManutencoes(503);
    return dados;
  }

  private <T> T chamada(Supplier<T> request) {
    try { return request.get(); }
    catch (RestClientResponseException erro) {
      int status = erro.getStatusCode().value();
      throw new FalhaManutencoes(Set.of(400,401,403,404,409,422).contains(status) ? status : 503);
    } catch (RestClientException erro) { throw new FalhaManutencoes(503); }
  }
}
