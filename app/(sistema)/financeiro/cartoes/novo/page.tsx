"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function NovoCartaoPage() {
    const router = useRouter();
    const [nome, setNome] = useState("");
    const [vencimentoDia, setVencimentoDia] = useState<number>(1);
    const [limite, setLimite] = useState<number | "">("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        
        try {
            const res = await fetch("/api/financeiro/cartoes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nome,
                    vencimentoDia,
                    limite: limite || null,
                }),
            });

            if (!res.ok) {
                throw new Error();
            }

            toast.success("Cartão criado com sucesso!");

            setTimeout(() => {
                router.push("/financeiro/cartoes");
                router.refresh(); // opcional, mas ajuda a atualizar lista
            }, 1500);


        } catch (err) {
            toast.error("Erro ao criar cartão");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Novo Cartão"
                description="Cadastre um cartão de crédito e defina o vencimento"
            />

            {/* CONTAINER CENTRAL */}
            <div className="flex justify-center">
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-sm p-8 space-y-6"
                >
                    {/* HEADER DO FORM */}
                    <div className="border-b pb-4">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Informações do cartão
                        </h2>
                        <p className="text-sm text-slate-500">
                            Preencha os dados abaixo para cadastrar o cartão
                        </p>
                    </div>

                    {/* GRID CAMPOS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* NOME */}
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">
                                Nome do cartão
                            </label>
                            <input
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Ex: Nubank, Itaú, Bradesco..."
                                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* VENCIMENTO */}
                        <div>
                            <label className="text-sm font-medium text-slate-700">
                                Dia do vencimento
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={31}
                                value={vencimentoDia}
                                onChange={(e) =>
                                    setVencimentoDia(Number(e.target.value))
                                }
                                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <p className="text-xs text-slate-400 mt-1">
                                Ex: 5, 10, 20...
                            </p>
                        </div>

                        {/* LIMITE */}
                        <div>
                            <label className="text-sm font-medium text-slate-700">
                                Limite (opcional)
                            </label>
                            <input
                                type="number"
                                value={limite}
                                onChange={(e) =>
                                    setLimite(
                                        e.target.value
                                            ? Number(e.target.value)
                                            : ""
                                    )
                                }
                                placeholder="Ex: 5000"
                                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* BOTÕES */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => history.back()}
                            className="px-5 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? "Salvando..." : "Salvar cartão"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}