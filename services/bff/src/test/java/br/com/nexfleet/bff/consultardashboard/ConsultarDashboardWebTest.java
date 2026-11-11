package br.com.nexfleet.bff.consultardashboard;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import br.com.nexfleet.bff.consultardashboard.application.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ConsultarDashboardWebTest {
  @Test
  void combinaCustosComSituacaoDaFrotaSemMisturarBancos() {
    var indicadores = mock(IndicadoresDashboardRemotos.class);
    var frota = mock(FrotaDashboardRemota.class);
    var veiculo = UUID.randomUUID();
    when(indicadores.consultar("Bearer token"))
        .thenReturn(
            new IndicadoresDashboardRemotos.Dados(
                new BigDecimal("100.00"),
                new BigDecimal("50.00"),
                new BigDecimal("150.00"),
                2,
                1,
                List.of(
                    new IndicadoresDashboardRemotos.ProximaManutencao(
                        veiculo, "PREVENTIVA", LocalDate.of(2026, 12, 6)))));
    when(frota.listarTodos("Bearer token"))
        .thenReturn(
            List.of(
                new FrotaDashboardRemota.Veiculo(veiculo, "ABC1D23", "EM_MANUTENCAO"),
                new FrotaDashboardRemota.Veiculo(UUID.randomUUID(), "XYZ9K87", "DISPONIVEL")));

    var resultado = new ConsultarDashboardWeb(indicadores, frota).consultar("Bearer token");

    assertEquals(2, resultado.totalVeiculos());
    assertEquals(1, resultado.veiculosDisponiveis());
    assertEquals(1, resultado.veiculosEmManutencao());
    assertEquals("ABC1D23", resultado.proximasManutencoes().getFirst().placa());
  }

  @Test
  void recusaTokenAusenteAntesDeChamarServicos() {
    var indicadores = mock(IndicadoresDashboardRemotos.class);
    var frota = mock(FrotaDashboardRemota.class);
    assertEquals(
        401,
        assertThrows(
                FalhaDashboard.class,
                () -> new ConsultarDashboardWeb(indicadores, frota).consultar(null))
            .status());
    verifyNoInteractions(indicadores, frota);
  }
}
