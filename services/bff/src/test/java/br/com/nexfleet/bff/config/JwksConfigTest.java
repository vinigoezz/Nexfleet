package br.com.nexfleet.bff.config;

import static org.junit.jupiter.api.Assertions.*;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.*;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.time.Instant;
import java.util.Date;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtException;

class JwksConfigTest {
  @Test
  void indisponibilidadeDeChavesNaoPermiteAutenticar() throws Exception {
    var calls = new AtomicInteger();
    var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext(
        "/.well-known/jwks.json",
        exchange -> {
          calls.incrementAndGet();
          exchange.sendResponseHeaders(503, -1);
          exchange.close();
        });
    server.start();
    try {
      var key = new RSAKeyGenerator(2048).keyID("unavailable-test").generate();
      var jwt =
          new SignedJWT(
              new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(key.getKeyID()).build(),
              new JWTClaimsSet.Builder()
                  .issuer("https://nexfleet.local/identidade")
                  .audience("nexfleet-api")
                  .subject("e2f6b588-00cf-45bc-927e-c4a08647dfde")
                  .expirationTime(Date.from(Instant.now().plusSeconds(900)))
                  .build());
      jwt.sign(new RSASSASigner(key));
      var decoder =
          new JwksConfig().jwtDecoder("http://127.0.0.1:" + server.getAddress().getPort());
      assertThrows(JwtException.class, () -> decoder.decode(jwt.serialize()));
      assertTrue(calls.get() > 0);
    } finally {
      server.stop(0);
    }
  }
}
