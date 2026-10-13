//constants/categorias-despesas.ts

export const CATEGORIAS_DESPESA = [
    { value: "MORADIA", label: "Moradia" },
    { value: "ALIMENTACAO", label: "Alimentação" },
    { value: "TRANSPORTE", label: "Transporte" },
    { value: "SAUDE", label: "Saúde" },
    { value: "EDUCACAO", label: "Educação" },
    { value: "LAZER", label: "Lazer" },
    { value: "ASSINATURAS", label: "Assinaturas" },
    { value: "IMPOSTOS", label: "Impostos" },
    { value: "KELECHI", label: "Kelechi" },
    { value: "INVESTIMENTOS", label: "Investimentos" },
    { value: "VIAGEM", label: "Viagem-Hospedagem" },
    { value: "VESTUARIO", label: "Vestuário" },
    { value: "VIAGEM_TRANSPORTE", label: "Viagem-Transporte" },
    { value: "VIAGEM_ALIMENTACAO", label: "Viagem-Alimentação" },
    { value: "VIAGEM_EXTRAS", label: "Viagem-Extras" },
    { value: "OUTROS", label: "Outros" },
];

export const CATEGORIAS_DESPESA_LABEL = Object.fromEntries(
    CATEGORIAS_DESPESA.map((item) => [
        item.value,
        item.label,
    ])
);