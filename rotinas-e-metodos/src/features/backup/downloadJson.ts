/** Baixa um JSON como arquivo, pelo próprio navegador (nada sai da máquina). */
export function downloadJson(fileName: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  // Libera a memória depois que o navegador já começou o download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
