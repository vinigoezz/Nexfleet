package br.com.nexfleet.bff;

import static org.junit.jupiter.api.Assertions.*;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.*;
import com.nimbusds.jose.jwk.*;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.*;
import com.sun.net.httpserver.HttpServer;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("jwt-rsa")
class RsaAuthHttpTest {
  static final String USER = "e2f6b588-00cf-45bc-927e-c4a08647dfde";
  static final RSAKey KEY = key("test-key");
  static final AtomicInteger consultations = new AtomicInteger();
  static final AtomicInteger jwksRequests = new AtomicInteger();
  static final HttpServer identity = start();
  @LocalServerPort int port;

  static RSAKey key(String id) {
    try {
      return new RSAKeyGenerator(2048).keyID(id).generate();
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  static HttpServer start() {
    try {
      var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
      server.createContext(
          "/.well-known/jwks.json",
          exchange -> {
            jwksRequests.incrementAndGet();
            var bytes = new JWKSet(KEY.toPublicJWK()).toString().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, bytes.length);
            try (var stream = exchange.getResponseBody()) {
              stream.write(bytes);
            }
          });
      server.createContext(
          "/api/v1/identidade/me",
          exchange -> {
            consultations.incrementAndGet();
            var bytes = ("{\"id\":\"" + USER + "\"}").getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, bytes.length);
            try (var stream = exchange.getResponseBody()) {
              stream.write(bytes);
            }
          });
      server.createContext(
          "/api/v1/identidade/login",
          exchange -> {
            byte[] bytes =
                "{\"message\":\"Credenciais inválidas.\"}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(401, bytes.length);
            try (var stream = exchange.getResponseBody()) {
              stream.write(bytes);
            }
          });
      server.start();
      return server;
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  @DynamicPropertySource
  static void properties(DynamicPropertyRegistry registry) {
    registry.add(
        "services.identidade.url", () -> "http://127.0.0.1:" + identity.getAddress().getPort());
  }

  @AfterAll
  static void stop() {
    identity.stop(0);
  }

  JWTClaimsSet.Builder claims() {
    return new JWTClaimsSet.Builder()
        .issuer("https://nexfleet.local/identidade")
        .audience("nexfleet-api")
        .subject(USER)
        .issueTime(Date.from(Instant.now()))
        .expirationTime(Date.from(Instant.now().plusSeconds(900)));
  }

  String token(RSAKey key, JWTClaimsSet claims) throws Exception {
    var jwt =
        new SignedJWT(
            new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(key.getKeyID()).build(), claims);
    jwt.sign(new RSASSASigner(key));
    return jwt.serialize();
  }

  HttpResponse<String> me(String token) throws Exception {
    var request =
        HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/v1/auth/me"));
    if (token != null) request.header("Authorization", "Bearer " + token);
    return HttpClient.newHttpClient().send(request.build(), HttpResponse.BodyHandlers.ofString());
  }

  void denied(String token) throws Exception {
    int before = consultations.get();
    assertEquals(401, me(token).statusCode());
    assertEquals(before, consultations.get(), "Token recusado não pode alcançar a API de sessão");
  }

  @Test
  void validaPelaChavePublicaEEncaminhaSessaoSemCookie() throws Exception {
    int before = consultations.get();
    var response = me(token(KEY, claims().build()));
    assertEquals(200, response.statusCode());
    assertTrue(response.body().contains(USER));
    assertTrue(response.headers().allValues("Set-Cookie").isEmpty());
    assertEquals(before + 1, consultations.get());
    assertTrue(jwksRequests.get() > 0);
  }

  @Test
  void recusaAusenteEMalformadoAntesDoEncaminhamento() throws Exception {
    denied(null);
    denied("invalido");
  }

  @Test
  void recusaAssinaturaFalsaMesmoComKidConhecido() throws Exception {
    denied(token(key(KEY.getKeyID()), claims().build()));
  }

  @Test
  void recusaKidDesconhecido() throws Exception {
    denied(token(key("unknown"), claims().build()));
  }

  @Test
  void recusaEmissorAudienciaEExpiracaoInvalidos() throws Exception {
    denied(token(KEY, claims().issuer("outro").build()));
    denied(token(KEY, claims().audience("outra").build()));
    denied(token(KEY, claims().expirationTime(Date.from(Instant.now().minusSeconds(120))).build()));
    denied(token(KEY, claims().expirationTime(null).build()));
    denied(token(KEY, claims().audience((String) null).build()));
  }

  @Test
  void naoAceitaHmacNoModoRsa() throws Exception {
    byte[] secret = new byte[32];
    new java.security.SecureRandom().nextBytes(secret);
    var jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims().build());
    jwt.sign(new MACSigner(secret));
    denied(jwt.serialize());
  }

  @Test
  void loginContinuaPublicoSemCsrf() throws Exception {
    var request =
        HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/v1/auth/login"))
            .header("Content-Type", "application/json")
            .POST(
                HttpRequest.BodyPublishers.ofString(
                    "{\"email\":\"teste@example.com\",\"senha\":\"errada\"}"))
            .build();
    var response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
    assertEquals(401, response.statusCode());
    assertTrue(response.body().contains("Credenciais"));
  }
}
