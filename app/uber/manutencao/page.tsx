"use client";

import PageHeader from "@/components/PageHeader/PageHeader";
import { Wrench, Plus, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useRouter,
  useSearchParams
} from "next/navigation";
import { formatDateBR } from "@/utils/formatDate";

interface Manutencao {
  _id: string;
  data: string;
  tipo: string;
  valor: number;
  km: number;
  status: string;
  kmAtualVeiculo?: number;
  proximaData?: string | null;
  proximaKm?: number | null;
}

export default function ManutencaoUber() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  /* =========================
    POPUP KM ATUAL
 ========================= */

  const [showKmModal, setShowKmModal] =
    useState(false);

  const [kmAtualVeiculo, setKmAtualVeiculo] =
    useState("");

  const [kmTemp, setKmTemp] =
    useState("");

  const [formData, setFormData] = useState({
    data: "",
    tipo: "",
    valor: "",
    km: "",
    status: "Concluída",
    proximaData: "",
    proximaKm: "",
  });

  const [filterType, setFilterType] = useState<
    "day" | "month" | "year"
  >("month");

  const [selectedMonth, setSelectedMonth] = useState("05-2026");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState("2026-05-31");

  /* =========================================================
     BUSCAR DADOS DO BANCO
  ========================================================= */

  useEffect(() => {
    fetchManutencoes();

    // BUSCA KM SEMPRE
    carregarKmAtual();

    // ABRE MODAL SOMENTE PELA SIDEBAR
    const openKmModal =
      searchParams.get("openKmModal");

    if (openKmModal === "true") {
      setShowKmModal(true);
    }

  }, [searchParams]);

  async function carregarKmAtual() {
    try {
      const response = await fetch(
        "/api/uber/manutencao/km-atual"
      );

      const data = await response.json();

      if (data.success) {
        const km =
          data.kmAtualVeiculo || 0;

        setKmAtualVeiculo(
          km.toString()
        );

        setKmTemp(
          km.toString()
        );
      }

    } catch (error) {
      console.error(error);
    }
  }

  async function confirmarKmAtual() {
    try {
      const response = await fetch(
        "/api/uber/manutencao/km-atual",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            kmAtualVeiculo: Number(kmTemp),
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message || "Erro ao salvar KM"
        );
      }

      setKmAtualVeiculo(kmTemp);

      setShowKmModal(false);

    } catch (error) {
      console.error(error);

      alert("Erro ao salvar KM atual");
    }
  }

  async function fetchManutencoes() {
    try {
      setLoading(true);

      const response = await fetch("/api/uber/manutencao");

      const data = await response.json();

      if (data.success) {
        setManutencoes(data.manutencoes || []);
      }
    } catch (error) {
      console.error("Erro ao buscar manutenções:", error);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     FILTROS
  ========================================================= */

  const manutencoesFiltradas = manutencoes.filter((item) => {
    const data = new Date(item.data);

    if (filterType === "month") {
      const [mes, ano] = selectedMonth.split("-");

      return (
        data.getMonth() + 1 === Number(mes) &&
        data.getFullYear() === Number(ano)
      );
    }

    if (filterType === "year") {
      return data.getFullYear() === Number(selectedYear);
    }

    if (filterType === "day") {
      const inicio = new Date(startDate);
      const fim = new Date(endDate);

      inicio.setHours(0, 0, 0, 0);
      fim.setHours(23, 59, 59, 999);

      return data >= inicio && data <= fim;
    }

    return true;
  });

  /* =========================================================
     CÁLCULOS DINÂMICOS
  ========================================================= */

  const totalGasto = manutencoesFiltradas.reduce(
    (acc, m) => acc + Number(m.valor || 0),
    0
  );

  const totalManutencoes = manutencoesFiltradas.length;

  const mediaManutencao = totalManutencoes
    ? totalGasto / totalManutencoes
    : 0;

  // Calcular km máximo (atual) do carro
  const kmAtual = Number(kmAtualVeiculo || 0);
  const proximas = manutencoes.filter((m) => {
    const hoje = new Date();

    const umMesAFrente = new Date();
    umMesAFrente.setMonth(umMesAFrente.getMonth() + 1);

    // Alerta por data
    const alertaPorData =
      m.proximaData &&
      new Date(m.proximaData) <= umMesAFrente &&
      new Date(m.proximaData) >= hoje;

    // Alerta por KM
    const alertaPorKm =
      m.proximaKm &&
      Number(m.proximaKm) > kmAtual &&
      Number(m.proximaKm) - kmAtual <= 2000;

    return alertaPorData || alertaPorKm;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Manutenção"
          description="Controle de despesas com manutenção do veículo"
        />

        <button
          onClick={() => router.push("/uber/manutencao/novo")}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5" />
          Registrar Manutenção
        </button>
      </div>

      {/* FILTROS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filterType"
                value="month"
                checked={filterType === "month"}
                onChange={() => setFilterType("month")}
                className="h-4 w-4 cursor-pointer"
              />

              <span className="text-sm font-medium text-slate-700">
                Por Mês
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filterType"
                value="year"
                checked={filterType === "year"}
                onChange={() => setFilterType("year")}
                className="h-4 w-4 cursor-pointer"
              />

              <span className="text-sm font-medium text-slate-700">
                Por Ano
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filterType"
                value="day"
                checked={filterType === "day"}
                onChange={() => setFilterType("day")}
                className="h-4 w-4 cursor-pointer"
              />

              <span className="text-sm font-medium text-slate-700">
                Por Período
              </span>
            </label>
          </div>

          {filterType === "month" ? (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="05-2026">Maio 2026</option>
              <option value="04-2026">Abril 2026</option>
              <option value="03-2026">Março 2026</option>
            </select>
          ) : filterType === "year" ? (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-slate-500">
            Carregando manutenções...
          </p>
        </div>
      ) : (
        <>
          {/* ALERTAS */}
          {proximas.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600" />

                <div>
                  <h3 className="font-semibold text-yellow-900">
                    ⚠️ Manutenções Próximas do Prazo
                  </h3>
                  <p className="text-xs text-yellow-700 mt-1">
                    Manutenções com menos de 1 mês para o prazo ou menos de 2000 km
                  </p>

                  <ul className="mt-2 space-y-2">
                    {proximas.map((manut) => {
                      const hoje = new Date();
                      const umMesAFrente = new Date();
                      umMesAFrente.setMonth(umMesAFrente.getMonth() + 1);

                      const alertaPorData =
                        manut.proximaData &&
                        new Date(manut.proximaData) <= umMesAFrente &&
                        new Date(manut.proximaData) >= hoje;

                      const alertaPorKm =

                        manut.proximaKm &&
                        Number(manut.proximaKm) > kmAtual &&
                        Number(manut.proximaKm) - kmAtual <= 2000;

                      return (
                        <li
                          key={manut._id}
                          className="flex items-start justify-between gap-3 rounded bg-white/50 p-2 text-sm text-yellow-800"
                        >
                          <div>
                            <strong>{manut.tipo}</strong>

                            <div className="ml-4 mt-1 space-y-1">
                              {alertaPorData && manut.proximaData && (
                                <div className="font-semibold text-yellow-900">
                                  ⚠️ 📅 Data próxima:{" "}
                                  {manut.proximaData
                                    ? formatDateBR(manut.proximaData)
                                    : ""}
                                </div>
                              )}

                              {alertaPorKm && manut.proximaKm && (
                                <div className="font-semibold text-yellow-900">
                                  ⚠️ 🔧 KM próximo:{" "}
                                  {Number(
                                    manut.proximaKm
                                  ).toLocaleString("pt-BR")}{" "}
                                  km

                                  <span className="ml-2 text-xs">
                                    (faltam{" "}
                                    {(
                                      Number(manut.proximaKm) -
                                      kmAtual
                                    ).toLocaleString("pt-BR")}{" "}
                                    km)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/uber/manutencao/${manut._id}`
                              )
                            }
                            className="rounded-lg p-2 text-yellow-700 transition hover:bg-yellow-100 hover:text-yellow-900"
                          >
                            🔍
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* CARDS */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* TOTAL GASTO */}
            <div className="group rounded-lg p-6 transition-all duration-200 border-2 border-red-500 bg-gradient-to-br from-red-50 to-rose-50 shadow-lg hover:-translate-y-2 hover:shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-red-700 font-semibold">
                  Total Gasto
                </h3>

                <Wrench className="h-5 w-5 text-red-600" />
              </div>

              <p className="text-2xl font-bold text-slate-900">
                R${" "}
                {totalGasto.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>

              <p className="mt-2 text-xs text-slate-600">
                Período selecionado
              </p>
            </div>

            {/* TOTAL SERVIÇOS */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-600">
                  Total de Serviços
                </h3>

                <Wrench className="h-5 w-5 text-blue-500" />
              </div>

              <p className="text-2xl font-bold text-slate-900">
                {totalManutencoes}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Serviços realizados no período
              </p>
            </div>

            {/* MÉDIA */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-600">
                  Média por Serviço
                </h3>

                <Wrench className="h-5 w-5 text-purple-500" />
              </div>

              <p className="text-2xl font-bold text-slate-900">
                R${" "}
                {mediaManutencao.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Média de custo por manutenção
              </p>
            </div>

            {/* KM ATUAL */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-600">
                  KM Atual
                </h3>

                <Wrench className="h-5 w-5 text-emerald-500" />
              </div>

              <p className="text-2xl font-bold text-slate-900">
                {kmAtual.toLocaleString("pt-BR")} km
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Última quilometragem registrada
              </p>
            </div>
          </div>

          {/* TABELA */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Histórico de Manutenções
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                      Data
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                      Tipo de Serviço
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                      KM
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                      Próxima Manutenção
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                      Status
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-600">
                      Valor
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {manutencoesFiltradas.length > 0 ? (
                    manutencoesFiltradas.map((manut) => {
                      const dataFormatada = formatDateBR(manut.data);

                      return (
                        <tr
                          key={manut._id}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 text-sm text-slate-900">
                            {dataFormatada}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {manut.tipo}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {Number(manut.km || 0).toLocaleString("pt-BR")} km
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            <div className="space-y-1">
                              {manut.proximaData && (
                                <div>📅 {new Date(manut.proximaData).toLocaleDateString("pt-BR")}</div>
                              )}
                              {manut.proximaKm && (
                                <div>🔧 {Number(manut.proximaKm).toLocaleString("pt-BR")} km</div>
                              )}
                              {!manut.proximaData && !manut.proximaKm && (
                                <div>—</div>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                              {manut.status}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right text-sm font-semibold text-red-600">
                            R${" "}
                            {Number(manut.valor).toLocaleString(
                              "pt-BR",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-sm text-slate-500"
                      >
                        Nenhuma manutenção encontrada para o período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {/* MODAL KM ATUAL */}
      {showKmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <h2 className="text-xl font-bold text-slate-900">
              KM Atual do Veículo
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Informe a quilometragem atual do veículo.
            </p>

            {Number(kmAtualVeiculo) > 0 && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm text-blue-700">
                  Último KM informado:
                </p>

                <p className="text-lg font-bold text-blue-900">
                  {Number(kmAtualVeiculo).toLocaleString("pt-BR")} km
                </p>
              </div>
            )}

            <div className="mt-5 space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Quilometragem atual
              </label>

              <input
                type="number"
                value={kmTemp}
                onChange={(e) =>
                  setKmTemp(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2"
                placeholder="Digite o KM atual"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() => {
                  setKmTemp(kmAtualVeiculo);
                  confirmarKmAtual();
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
              >
                Manter Último KM
              </button>

              <button
                type="button"
                onClick={confirmarKmAtual}
                className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
              >
                Confirmar
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}