export function expandirReceitas(receitas: any[]) {
  const resultado: any[] = [];

  receitas.forEach((receita) => {
    if (!receita.recorrente || !receita.mesAnoFim) {
      resultado.push({
        ...receita,
        dataProjecao: receita.mesAno,
        origemId: receita._id,
      });

      return;
    }

    const inicio = new Date(receita.mesAno);
    const fim = new Date(receita.mesAnoFim);

    let atual = new Date(inicio);

    while (atual <= fim) {
      resultado.push({
        ...receita,
        dataProjecao: new Date(atual),
        origemId: receita._id,
      });

      atual = new Date(
        Date.UTC(
          atual.getUTCFullYear(),
          atual.getUTCMonth() + 1,
          1
        )
      );
    }
  });

  return resultado;
}