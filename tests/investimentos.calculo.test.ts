import assert from "node:assert/strict";
import test from "node:test";
import { calcularPosicoes, type OperacaoCarteira } from "../lib/investimentos/calculoCarteira";

function operation(overrides: Partial<OperacaoCarteira>): OperacaoCarteira {
  return {
    ticker: "ATIVO",
    nome: "Ativo de teste",
    tipoAtivo: "ACAO",
    setor: "Tecnologia",
    lado: "COMPRA",
    quantidade: 1,
    precoUnitario: 100,
    taxas: 0,
    moeda: "BRL",
    cambio: 1,
    dataOperacao: "2026-01-01",
    ...overrides,
  };
}

test("calcula preço médio ponderado e resultado após venda parcial", () => {
  const result = calcularPosicoes([
    operation({ quantidade: 10, precoUnitario: 100, taxas: 10 }),
    operation({ quantidade: 10, precoUnitario: 120, dataOperacao: "2026-02-01" }),
    operation({
      lado: "VENDA",
      quantidade: 5,
      precoUnitario: 130,
      taxas: 5,
      dataOperacao: "2026-03-01",
    }),
  ]);

  assert.equal(result.positions[0].quantidade, 15);
  assert.equal(result.positions[0].custoNativo, 1657.5);
  assert.equal(result.positions[0].custoBRL, 1657.5);
  assert.equal(result.lucroRealizadoBRL, 92.5);
});

test("usa o câmbio da operação ao calcular custo e lucro de ativos estrangeiros", () => {
  const result = calcularPosicoes([
    operation({
      ticker: "FOREIGN",
      moeda: "USD",
      cambio: 5,
      quantidade: 2,
      precoUnitario: 10,
    }),
    operation({
      ticker: "FOREIGN",
      moeda: "USD",
      cambio: 5.5,
      lado: "VENDA",
      quantidade: 1,
      precoUnitario: 12,
      taxas: 1,
      dataOperacao: "2026-02-01",
    }),
  ]);

  assert.equal(result.positions[0].quantidade, 1);
  assert.equal(result.positions[0].custoNativo, 10);
  assert.equal(result.positions[0].custoBRL, 50);
  assert.equal(result.lucroRealizadoBRL, 10.5);
});

test("rejeita venda acima da quantidade disponível", () => {
  assert.throws(
    () =>
      calcularPosicoes([
        operation({ quantidade: 1 }),
        operation({ lado: "VENDA", quantidade: 2, dataOperacao: "2026-02-01" }),
      ]),
    /excede a quantidade disponível/
  );
});
