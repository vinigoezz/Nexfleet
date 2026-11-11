package br.com.nexfleet.bff.config;

import br.com.nexfleet.bff.gerenciarmotoristas.application.GerenciarMotoristasWeb;
import br.com.nexfleet.bff.gerenciarmotoristas.infrastructure.HttpMotoristas;
import br.com.nexfleet.bff.gerenciarveiculos.application.GerenciarVeiculosWeb;
import br.com.nexfleet.bff.gerenciarveiculos.infrastructure.HttpHistoricoOperacional;
import br.com.nexfleet.bff.gerenciarveiculos.infrastructure.HttpVeiculos;
import br.com.nexfleet.bff.gerenciarvinculos.application.GerenciarVinculosWeb;
import br.com.nexfleet.bff.gerenciarvinculos.infrastructure.HttpVinculos;
import br.com.nexfleet.bff.observability.CorrelationIds;
import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.*;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class FleetClientConfig {
  @Bean
  RestClient frotaRestClient(@Value("${services.frota.url}") String url) {
    var factory =
        new JdkClientHttpRequestFactory(
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build());
    factory.setReadTimeout(Duration.ofSeconds(5));
    return CorrelationIds.propagate(RestClient.builder())
        .baseUrl(url).requestFactory(factory).build();
  }

  @Bean
  GerenciarVeiculosWeb veiculosWeb(
      @Qualifier("frotaRestClient") RestClient client,
      @Qualifier("operacoesRestClient") RestClient operacoes) {
    return new GerenciarVeiculosWeb(
        new HttpVeiculos(client), new HttpHistoricoOperacional(operacoes));
  }

  @Bean
  GerenciarMotoristasWeb motoristasWeb(@Qualifier("frotaRestClient") RestClient client) {
    return new GerenciarMotoristasWeb(new HttpMotoristas(client));
  }

  @Bean
  GerenciarVinculosWeb vinculosWeb(@Qualifier("frotaRestClient") RestClient client) {
    return new GerenciarVinculosWeb(new HttpVinculos(client));
  }
}
