This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Investimentos

O módulo de carteira registra compras e vendas por usuário e calcula quantidade em aberto, preço médio ponderado, custo, resultado realizado e rentabilidade. O preço médio reduz proporcionalmente quando uma venda é registrada. O câmbio de cada operação estrangeira deve ser informado em BRL por unidade da moeda.

Ao digitar um ticker, a carteira consulta Yahoo Finance para preencher automaticamente nome e setor de ações, FIIs, ETFs e BDRs; para cripto, usa CoinGecko para nome e categoria. A moeda também é sugerida quando identificada pela bolsa. Se a fonte não reconhecer o ticker, os campos podem ser preenchidos manualmente.

As cotações de ações, FIIs, ETFs e BDRs são consultadas no endpoint público do Yahoo Finance; ativos B3 cadastrados em BRL recebem o sufixo `.SA`. Criptomoedas suportadas são consultadas pela API pública CoinGecko (BTC, ETH, SOL, XRP, BNB, ADA, DOGE, TRX, AVAX, DOT, LINK, LTC, USDT e USDC). Renda fixa usa preço atual informado pelo usuário. O câmbio atual de moedas estrangeiras é consultado no Yahoo Finance.

Essas fontes públicas podem atrasar, limitar ou indisponibilizar consultas e não oferecem SLA nem feed profissional em tempo real. A carteira atualiza cotações a cada 60 segundos enquanto a página está aberta, informa ativos sem preço e não inclui série histórica de patrimônio.
