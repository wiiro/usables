const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata centavos inteiros como moeda BRL. Evita ponto flutuante em preços. */
export function formatarPreco(centavos: number): string {
  if (!Number.isFinite(centavos) || centavos < 0) {
    throw new RangeError("centavos deve ser um número finito e não negativo");
  }
  return brl.format(centavos / 100);
}
