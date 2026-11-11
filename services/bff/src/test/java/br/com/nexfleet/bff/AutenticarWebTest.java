package br.com.nexfleet.bff;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import br.com.nexfleet.bff.autenticar.api.AuthController;
import br.com.nexfleet.bff.autenticar.application.*;
import org.junit.jupiter.api.Test;

class AutenticarWebTest {
  final Identidade identidade = mock(Identidade.class);
  final AutenticarWeb caso = new AutenticarWeb(identidade);

  @Test
  void rejeitaCredenciaisVaziasSemChamarServico() {
    assertEquals(
        400,
        assertThrows(
                FalhaAutenticacao.class, () -> caso.login(new Identidade.Credenciais("", "senha")))
            .status());
    verifyNoInteractions(identidade);
  }

  @Test
  void rejeitaBearerAusenteOuMalformado() {
    for (String header : new String[] {null, "", "Basic abc", "Bearer ", "Bearer abc def"}) {
      assertEquals(401, assertThrows(FalhaAutenticacao.class, () -> caso.me(header)).status());
    }
    verifyNoInteractions(identidade);
  }

  @Test
  void delegaValidacaoAIdentidadeERetornaSemCache() {
    var usuario = new Identidade.Usuario("id");
    when(identidade.me("Bearer token")).thenReturn(usuario);
    var response = new AuthController(caso).me("Bearer token");
    assertEquals(usuario, response.getBody());
    assertEquals("no-store", response.getHeaders().getCacheControl());
  }

  @Test
  void loginNaoRegistraOuExpoeCredenciaisEmToString() {
    var credenciais = new Identidade.Credenciais("teste@example.com", "segredo");
    when(identidade.login(credenciais)).thenReturn(new Identidade.Token("token", "Bearer", 900));
    assertEquals("token", caso.login(credenciais).accessToken());
    assertFalse(credenciais.toString().contains("segredo"));
  }
}
