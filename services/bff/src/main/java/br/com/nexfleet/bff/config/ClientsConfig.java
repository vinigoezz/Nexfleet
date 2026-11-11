package br.com.nexfleet.bff.config;

import br.com.nexfleet.bff.consultarambiente.application.ConsultarAmbiente;
import br.com.nexfleet.bff.consultarambiente.infrastructure.HttpConsultarStatus;
import br.com.nexfleet.bff.observability.CorrelationIds;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class ClientsConfig {
  @Bean
  ConsultarAmbiente consultarAmbiente(Environment env) {
    var http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
    var factory = new JdkClientHttpRequestFactory(http);
    factory.setReadTimeout(Duration.ofSeconds(3));
    var clients = new LinkedHashMap<String, RestClient>();
    for (var service : List.of("identidade", "frota", "operacoes", "indicadores")) {
      clients.put(
          service,
          CorrelationIds.propagate(RestClient.builder())
              .requestFactory(factory)
              .baseUrl(env.getRequiredProperty("services." + service + ".url"))
              .build());
    }
    return new ConsultarAmbiente(new HttpConsultarStatus(clients));
  }
}
