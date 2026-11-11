package br.com.nexfleet.bff.config;

import br.com.nexfleet.bff.gerenciarabastecimentos.application.GerenciarAbastecimentosWeb;
import br.com.nexfleet.bff.gerenciarabastecimentos.infrastructure.HttpAbastecimentos;
import br.com.nexfleet.bff.gerenciarmanutencoes.application.GerenciarManutencoesWeb;
import br.com.nexfleet.bff.gerenciarmanutencoes.infrastructure.HttpManutencoes;
import br.com.nexfleet.bff.observability.CorrelationIds;
import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.*;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class OperationsClientConfig {
  @Bean
  RestClient operacoesRestClient(@Value("${services.operacoes.url}") String url) {
    var factory = new JdkClientHttpRequestFactory(
        HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build());
    factory.setReadTimeout(Duration.ofSeconds(5));
    return CorrelationIds.propagate(RestClient.builder())
        .baseUrl(url).requestFactory(factory).build();
  }
  @Bean
  GerenciarAbastecimentosWeb abastecimentosWeb(
      @Qualifier("operacoesRestClient") RestClient operacoesRestClient) {
    return new GerenciarAbastecimentosWeb(new HttpAbastecimentos(operacoesRestClient));
  }
  @Bean
  GerenciarManutencoesWeb manutencoesWeb(
      @Qualifier("operacoesRestClient") RestClient operacoesRestClient) {
    return new GerenciarManutencoesWeb(new HttpManutencoes(operacoesRestClient));
  }
}
