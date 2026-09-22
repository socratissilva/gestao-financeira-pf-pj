"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { ArrowLeft, Database, FileSpreadsheet, UploadCloud } from "lucide-react";

interface AtivoRow {
  [key: string]: string | number | undefined;
}

const STORAGE_KEY = "preco-teto-base-dados";
const EXPECTED_COLUMNS = [
  "TICKER",
  "PRECO",
  "DY",
  "P/L",
  "P/VP",
  "P/ATIVOS",
  "MARGEM BRUTA",
  "MARGEM EBIT",
  "MARG. LIQUIDA",
  "P/EBIT",
  "EV/EBIT",
  "DIVIDA LIQUIDA / EBIT",
  "DIV. LIQ. / PATRI.",
  "PSR",
  "P/CAP. GIRO",
  "P. AT CIR. LIQ.",
  "LIQ. CORRENTE",
  "ROE",
  "ROA",
  "ROIC",
  "PATRIMONIO / ATIVOS",
  "PASSIVOS / ATIVOS",
  "GIRO ATIVOS",
  "CAGR RECEITAS 5 ANOS",
  "CAGR LUCROS 5 ANOS",
  "LIQUIDEZ MEDIA DIARIA",
  "VPA",
  "LPA",
  "PEG Ratio",
  "VALOR DE MERCADO",
];

const normalizeHeader = (value: string) => value.trim().replace(/\s+/g, " ").toUpperCase();

function normalizeExcelValue(value: unknown): string | number | undefined {
  if (value === null || value === undefined || value === "") return "";

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toString().replace(".", ",");
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (/^[-+]?\d+(?:\.\d+)?(?:,\d+)?$/.test(trimmed)) {
      if (trimmed.includes(",")) {
        return trimmed;
      }

      if (trimmed.includes(".")) {
        return trimmed.replace(".", ",");
      }

      return trimmed;
    }

    if (/^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(trimmed)) {
      return trimmed.replace(/\./g, "").replace(",", ".").replace(/\./g, ",");
    }

    if (/^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(trimmed)) {
      return trimmed.replace(/\./g, "").replace(",", ".");
    }

    return trimmed;
  }

  return String(value);
}

export default function BaseDadosPrecoTetoPage() {
  const [rows, setRows] = useState<AtivoRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { fileName?: string; rows?: AtivoRow[]; columns?: string[] };
      if (parsed.rows && parsed.columns) {
        setRows(parsed.rows);
        setColumns(parsed.columns);
        setFileName(parsed.fileName || "arquivo.xlsx");
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const summary = useMemo(() => {
    return {
      ativos: rows.length,
      colunas: columns.length,
    };
  }, [rows, columns]);

  function persistData(nextRows: AtivoRow[], nextColumns: string[], nextFileName: string) {
    setRows(nextRows);
    setColumns(nextColumns);
    setFileName(nextFileName);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        rows: nextRows,
        columns: nextColumns,
        fileName: nextFileName,
      })
    );
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsed = XLSX.utils.sheet_to_json<AtivoRow>(sheet, {
        defval: "",
        raw: false,
      });

      if (!parsed.length) {
        throw new Error("A planilha está vazia ou não contém linhas válidas.");
      }

      const rawColumns = Object.keys(parsed[0] ?? {});
      const normalizedColumns = rawColumns.map((column) => normalizeHeader(column));
      const missingColumns = EXPECTED_COLUMNS.filter(
        (expectedColumn) => !normalizedColumns.includes(normalizeHeader(expectedColumn))
      );

      if (missingColumns.length) {
        throw new Error(
          `Planilha incompleta. Faltam as colunas: ${missingColumns.join(", ")}.`
        );
      }

      const orderedColumns = EXPECTED_COLUMNS.filter((expectedColumn) =>
        normalizedColumns.includes(normalizeHeader(expectedColumn))
      );
      const additionalColumns = normalizedColumns.filter(
        (column) => !orderedColumns.includes(column)
      );

      const normalizedRows = parsed.map((row) => {
        const normalizedRow: AtivoRow = {};

        Object.entries(row).forEach(([key, value]) => {
          const normalizedKey = normalizeHeader(key);
          if (normalizedKey) {
            normalizedRow[normalizedKey] = normalizeExcelValue(value);
          }
        });

        return [...orderedColumns, ...additionalColumns].reduce<AtivoRow>((acc, column) => {
          const normalizedColumn = normalizeHeader(column);
          acc[column] = normalizedRow[normalizedColumn] ?? "";
          return acc;
        }, {});
      });

      persistData(normalizedRows, orderedColumns, file.name);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível ler o arquivo. Verifique se ele é um Excel válido."
      );
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  function clearData() {
    setRows([]);
    setColumns([]);
    setFileName("");
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/investimentos/preco-teto"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            aria-label="Voltar para preço teto"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Investimentos</p>
            <h1 className="text-3xl font-bold text-slate-900">Base de Dados</h1>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">Arquivo</p>
            <Database className="text-slate-600" size={18} />
          </div>
          <p className="text-xl font-bold text-slate-900">{fileName || "Nenhum arquivo"}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">Linhas</p>
            <FileSpreadsheet className="text-slate-600" size={18} />
          </div>
          <p className="text-xl font-bold text-slate-900">{summary.ativos}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">Colunas</p>
            <UploadCloud className="text-slate-600" size={18} />
          </div>
          <p className="text-xl font-bold text-slate-900">{summary.colunas}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Importar planilha de ativos</h2>
            <p className="mt-1 text-sm text-slate-500">
              Faça upload de um arquivo Excel com vários ativos, indicadores e colunas para servir como base de dados do módulo.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
            <UploadCloud size={17} />
            {loading ? "Carregando..." : "Selecionar arquivo"}
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}
      </section>

      {columns.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Estrutura da tabela</h3>
              <p className="text-sm text-slate-500">Colunas exigidas para a base de dados do módulo</p>
            </div>

            <button
              type="button"
              onClick={clearData}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Limpar dados
            </button>
          </div>

          <div className="p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              {EXPECTED_COLUMNS.map((column) => (
                <span
                  key={column}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    columns.includes(column)
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {column}
                </span>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {columns.map((column) => (
                      <th key={column} className="border-b border-slate-200 px-3 py-2 font-semibold">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 6).map((row, index) => (
                    <tr key={`${fileName}-${index}`} className="odd:bg-white even:bg-slate-50">
                      {columns.map((column) => (
                        <td key={`${column}-${index}`} className="border-b border-slate-200 px-3 py-2">
                          {row[column] ?? "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
