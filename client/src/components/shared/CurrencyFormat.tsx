interface CurrencyFormatProps {
  value: number | string;
  className?: string;
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CurrencyFormat({ value, className = "" }: CurrencyFormatProps) {
  return <span className={className}>{formatCurrency(value)}</span>;
}
