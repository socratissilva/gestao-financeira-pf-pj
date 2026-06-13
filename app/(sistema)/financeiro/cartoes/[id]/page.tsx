"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import toast from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Toast } from "react-hot-toast";

export default function EditarCartaoPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [nome, setNome] = useState("");
    const [vencimentoDia, setVencimentoDia] = useState<number>(1);
    const [limite, setLimite] = useState<number | "">("");
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // 🔥 Buscar cartão ao abrir tela
    useEffect(() => {
        async function loadCartao() {
            try {
                const res = await fetch(`/api/financeiro/cartoes/${id}`);
                const data = await res.json();

                setNome(data.nome);
                setVencimentoDia(data.vencimentoDia);
                setLimite(data.limite ?? "");
            } catch (err) {
                toast.error("Erro ao carregar cartão");
            } finally {
                setLoadingData(false);
            }
        }

        if (id) loadCartao();
    }, [id]);

    async function handleDelete() {
        const toastId = toast(
            (t) => (
                <div className="flex flex-col gap-3">
                    <span className="text-sm font-medium text-slate-800">
                        Tem certeza que deseja excluir este cartão?
                    </span>

                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="px-3 py-1 text-xs rounded-md border border-slate-300 hover:bg-slate-50"
                        >
                            Cancelar
                        </button>

                        <button
                            onClick={async () => {
                                toast.dismiss(t.id);

                                const loadingToast = toast.loading("Excluindo cartão...");

                                try {
                                    const res = await fetch(`/api/financeiro/cartoes/${id}`, {
                                        method: "DELETE",
                                    });

                                    if (!res.ok) throw new Error();

                                    toast.success("Cartão excluído com sucesso!", {
                                        id: loadingToast,
                                    });

                                    router.push("/financeiro/cartoes");
                                    router.refresh();
                                } catch (err) {
                                    toast.error("Erro ao excluir cartão", {
                                        id: loadingToast,
                                    });
                                }
                            }}
                            className="px-3 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700"
                        >
                            Excluir
                        </button>
                    </div>
                </div>
            ),
            {
                duration: Infinity,
            }
        );

        return toastId;
    }

    // 🔥 Atualizar cartão
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/financeiro/cartoes/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nome,
                    vencimentoDia,
                    limite: limite || null,
                }),
            });

            if (!res.ok) throw new Error();

            toast.success("Cartão atualizado com sucesso!");

            setTimeout(() => {
                router.push("/financeiro/cartoes");
                router.refresh();
            }, 1200);

        } catch (err) {
            toast.error("Erro ao atualizar cartão");
        } finally {
            setLoading(false);
        }
    }

    if (loadingData) {
        return (
            <div className="p-6 text-slate-500">
                Carregando cartão...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Editar Cartão"
                description="Altere os dados do cartão de crédito"
            />

            <div className="flex justify-center">
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-sm p-8 space-y-6"
                >
                    <div className="border-b pb-4">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Informações do cartão
                        </h2>
                        <p className="text-sm text-slate-500">
                            Atualize os dados abaixo
                        </p>
                    </div>

                    {/* GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* NOME */}
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">
                                Nome do cartão
                            </label>
                            <input
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
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
                                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                required
                            />
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
                                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* BOTÕES */}
                    <div className="flex justify-between gap-3 pt-4 border-t">

                        {/* LIXEIRA */}
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                        </button>

                        {/* AÇÕES DIREITA */}
                        <div className="flex gap-3">
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
                                {loading ? "Salvando..." : "Salvar alterações"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}