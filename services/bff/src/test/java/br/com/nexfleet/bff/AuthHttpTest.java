package br.com.nexfleet.bff;

import static org.junit.jupiter.api.Assertions.*;

import com.sun.net.httpserver.HttpServer;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AuthHttpTest {
  private static final AtomicInteger chamadas = new AtomicInteger();
  private static final HttpServer upstream = start();
  @LocalServerPort int port;

  static HttpServer start() {
    try {
      var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
      server.createContext(
          "/api/v1/identidade/login",
          exchange -> {
            chamadas.incrementAndGet();
            String input =
                new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            boolean valido = input.contains("senha-correta");
            String output =
                valido
                    ? "{\"accessToken\":\"token-teste\",\"tokenType\":\"Bearer\",\"expiresIn\":900}"
                    : "{\"message\":\"detalhe privado\"}";
            byte[] body = output.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(valido ? 200 : 401, body.length);
            try (var stream = exchange.getResponseBody()) {
              stream.write(body);
            }
          });
      server.createContext(
          "/api/v1/identidade/me",
          exchange -> {
            chamadas.incrementAndGet();
            boolean valido =
                "Bearer token-teste".equals(exchange.getRequestHeaders().getFirst("Authorization"));
            byte[] body =
                "{\"id\":\"e2f6b588-00cf-45bc-927e-c4a08647dfde\"}"
                    .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(valido ? 200 : 401, body.length);
            try (var stream = exchange.getResponseBody()) {
              stream.write(body);
            }
          });
      server.start();
      server.createContext(
          "/api/v1/identidade/usuarios",
          exchange -> {
            chamadas.incrementAndGet();
            byte[] body = "detalhe privado".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(403, body.length);
            try (var stream = exchange.getResponseBody()) {
              stream.write(body);
            }
          });
      return server;
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  @DynamicPropertySource
  static void properties(DynamicPropertyRegistry registry) {
    registry.add(
        "services.identidade.url", () -> "http://127.0.0.1:" + upstream.getAddress().getPort());
  }

  @AfterAll
  static void stop() {
    upstream.stop(0);
  }

  HttpResponse<String> request(String path, String body, String authorization) throws Exception {
    var builder = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path));
    if (body != null)
      builder
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(body));
    if (authorization != null) builder.header("Authorization", authorization);
    return HttpClient.newHttpClient().send(builder.build(), HttpResponse.BodyHandlers.ofString());
  }

  @Test
  void loginPublicoRetornaTokenSemCacheOuCookie() throws Exception {
    var response =
        request(
            "/api/v1/auth/login",
            "{\"email\":\"teste@example.com\",\"senha\":\"senha-correta\"}",
            null);
    assertEquals(200, response.statusCode());
    assertTrue(response.body().contains("token-teste"));
    assertEquals("no-store", response.headers().firstValue("Cache-Control").orElseThrow());
    assertTrue(response.headers().allValues("Set-Cookie").isEmpty());
  }

  @Test
  void loginErradoNaoExpoeMensagemPrivada() throws Exception {
    var response =
        request(
            "/api/v1/auth/login", "{\"email\":\"teste@example.com\",\"senha\":\"errada\"}", null);
    assertEquals(401, response.statusCode());
    assertFalse(response.body().contains("privado"));
  }

  @Test
  void semBearerNaoChamaServicoEComBearerConfirmaUsuario() throws Exception {
    int antes = chamadas.get();
    assertEquals(401, request("/api/v1/auth/me", null, null).statusCode());
    assertEquals(antes, chamadas.get());
    var response = request("/api/v1/auth/me", null, "Bearer token-teste");
    assertEquals(200, response.statusCode());
    assertTrue(response.body().contains("e2f6b588"));
    assertEquals(401, request("/api/v1/auth/me", null, "Bearer errado").statusCode());
  }

  @Test
  void cadastroSemToken401ERecusaAdministrativaPreservadaSemCsrf() throws Exception {
    var body =
        "{\"email\":\"novo@example.com\",\"senha\":\"senha-nova-segura\",\"perfil\":\"GESTOR_FROTA\"}";
    int antes = chamadas.get();
    assertEquals(401, request("/api/v1/usuarios", body, null).statusCode());
    assertEquals(antes, chamadas.get());
    var response = request("/api/v1/usuarios", body, "Bearer token-teste");
    assertEquals(403, response.statusCode());
    assertEquals(antes + 1, chamadas.get());
    assertFalse(response.body().contains("privado"));
    assertTrue(response.body().contains("Administrador"));
  }
}
