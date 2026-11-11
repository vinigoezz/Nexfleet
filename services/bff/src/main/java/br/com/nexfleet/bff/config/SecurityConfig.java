package br.com.nexfleet.bff.config;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
  @Bean
  SecurityFilterChain securityFilterChain(
      HttpSecurity http, Environment environment, ObjectProvider<JwtDecoder> decoders)
      throws Exception {
    boolean rsa = environment.acceptsProfiles(Profiles.of("jwt-rsa"));
    if (rsa) {
      // Sem decoder, o perfil falha ao iniciar: nunca volta silenciosamente ao modo legado.
      var decoder = decoders.getObject();
      http.oauth2ResourceServer(resource -> resource.jwt(jwt -> jwt.decoder(decoder)));
    }
    return http.csrf(
            csrf ->
                csrf.ignoringRequestMatchers(
                    "/api/v1/auth/login",
                    "/api/v1/usuarios",
                    "/api/v1/usuarios/*",
                    "/api/v1/veiculos",
                    "/api/v1/veiculos/*",
                    "/api/v1/motoristas",
                    "/api/v1/motoristas/*",
                    "/api/v1/vinculos",
                    "/api/v1/vinculos/*/encerramento",
                    "/api/v1/abastecimentos",
                    "/api/v1/manutencoes"))
        .sessionManagement(
            session ->
                session.sessionCreationPolicy(
                    org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            auth -> {
              auth.requestMatchers(
                      HttpMethod.GET,
                      "/actuator/health",
                      "/actuator/health/**",
                      "/actuator/prometheus",
                      "/api/v1/ambiente")
                  .permitAll()
                  .requestMatchers(HttpMethod.POST, "/api/v1/auth/login")
                  .permitAll();
              var session = auth.requestMatchers(HttpMethod.GET, "/api/v1/auth/me");
              if (rsa) session.authenticated();
              else session.permitAll(); // Legado: validação delegada a Identidade.
              var users = auth.requestMatchers("/api/v1/usuarios", "/api/v1/usuarios/*");
              if (rsa) users.authenticated();
              else
                users
                    .permitAll(); // Identidade aplica autorização administrativa em ambos os modos.
              var fleet = auth.requestMatchers("/api/v1/veiculos", "/api/v1/veiculos/*");
              if (rsa) fleet.authenticated();
              else fleet.denyAll(); // Frota valida JWT assimétrico diretamente.
              var drivers =
                  auth.requestMatchers("/api/v1/motoristas", "/api/v1/motoristas/*");
              if (rsa) drivers.authenticated();
              else drivers.denyAll();
              var links =
                  auth.requestMatchers("/api/v1/vinculos", "/api/v1/vinculos/*/encerramento");
              if (rsa) links.authenticated();
              else links.denyAll();
              var operations = auth.requestMatchers("/api/v1/abastecimentos");
              if (rsa) operations.authenticated();
              else operations.denyAll();
              var maintenance = auth.requestMatchers("/api/v1/manutencoes");
              if (rsa) maintenance.authenticated();
              else maintenance.denyAll();
              var dashboard = auth.requestMatchers(HttpMethod.GET, "/api/v1/dashboard");
              if (rsa) dashboard.authenticated();
              else dashboard.denyAll();
              auth.anyRequest().denyAll();
            })
        .build();
  }
}
