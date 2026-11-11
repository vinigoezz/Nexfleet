package br.com.nexfleet.bff.config;

import br.com.nexfleet.bff.autenticar.application.AutenticarWeb;
import br.com.nexfleet.bff.autenticar.infrastructure.HttpIdentidade;
import br.com.nexfleet.bff.gerenciarusuarios.application.GerenciarUsuariosWeb;
import br.com.nexfleet.bff.gerenciarusuarios.infrastructure.HttpUsuarios;
import br.com.nexfleet.bff.observability.CorrelationIds;
import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class AuthClientConfig {
  @Bean
  GerenciarUsuariosWeb usuariosWeb(@Value("${services.identidade.url}") String url) {
    return new GerenciarUsuariosWeb(new HttpUsuarios(identidadeClient(url)));
  }

  @Bean
  AutenticarWeb autenticarWeb(@Value("${services.identidade.url}") String url) {
    return new AutenticarWeb(new HttpIdentidade(identidadeClient(url)));
  }

  private RestClient identidadeClient(String url) {
    var factory =
        new JdkClientHttpRequestFactory(
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build());
    factory.setReadTimeout(Duration.ofSeconds(5));
    return CorrelationIds.propagate(RestClient.builder())
        .baseUrl(url).requestFactory(factory).build();
  }
}
