package br.com.nexfleet.bff.config;

import br.com.nexfleet.bff.consultardashboard.application.ConsultarDashboardWeb;
import br.com.nexfleet.bff.consultardashboard.infrastructure.*;
import br.com.nexfleet.bff.observability.CorrelationIds;
import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.beans.factory.annotation.*;
import org.springframework.context.annotation.*;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class DashboardClientConfig {
  @Bean
  RestClient indicadoresRestClient(@Value("${services.indicadores.url}") String url) {
    var factory =
        new JdkClientHttpRequestFactory(
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build());
    factory.setReadTimeout(Duration.ofSeconds(5));
    return CorrelationIds.propagate(RestClient.builder())
        .baseUrl(url).requestFactory(factory).build();
  }

  @Bean
  ConsultarDashboardWeb dashboardWeb(
      @Qualifier("indicadoresRestClient") RestClient indicadores,
      @Qualifier("frotaRestClient") RestClient frota) {
    return new ConsultarDashboardWeb(
        new HttpIndicadoresDashboard(indicadores), new HttpFrotaDashboard(frota));
  }
}
