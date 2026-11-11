package br.com.nexfleet.bff.gerenciarabastecimentos.infrastructure;

import br.com.nexfleet.bff.gerenciarabastecimentos.application.*;
import java.util.*;
import java.util.function.Supplier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.*;

public class HttpAbastecimentos implements AbastecimentosRemotos {
  private static final String PATH = "/api/v1/operacoes/abastecimentos";
  private final RestClient client;
  public HttpAbastecimentos(RestClient client) { this.client = client; }

  @Override
  public List<Dados> listar(String token, UUID veiculoId, int pagina, int tamanho) {
    return chamada(() -> {
      var lista = client.get().uri(builder -> {
        var uri = builder.path(PATH).queryParam("pagina", pagina).queryParam("tamanho", tamanho);
        if (veiculoId != null) uri.queryParam("veiculoId", veiculoId);
        return uri.build();
      }).header("Authorization", token).retrieve()
          .body(new ParameterizedTypeReference<List<Dados>>() {});
      if (lista == null) throw new FalhaAbastecimentos(503);
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
    if (dados == null || dados.id() == null || dados.veiculoId() == null
        || dados.motoristaId() == null || dados.realizadoEm() == null
        || dados.combustivel() == null || dados.litros() == null
        || dados.valorTotal() == null || dados.criadoEm() == null)
      throw new FalhaAbastecimentos(503);
    return dados;
  }

  private <T> T chamada(Supplier<T> request) {
    try { return request.get(); }
    catch (RestClientResponseException error) {
      int status = error.getStatusCode().value();
      throw new FalhaAbastecimentos(Set.of(400,401,403,404,409,422).contains(status) ? status : 503);
    } catch (RestClientException error) { throw new FalhaAbastecimentos(503); }
  }
}
