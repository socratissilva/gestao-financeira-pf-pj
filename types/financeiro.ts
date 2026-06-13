export type Despesa = {
    _id?: string;
    valor: number | string;
    cartao?: string;
    cartaoId?: string;
    nomeCartao?: string;
    vencimentoDia?: number;
    formaPagamento: string;
    mesAno?: string;
    dataVencimento?: string;
};