import type { ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Obrigatório: é o nome do botão para o leitor de tela e a dica ao passar o mouse. */
  label: string;
}

/** Botão só com ícone (editar, excluir…). */
export function IconButton({ label, className = '', ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`rounded-md p-1.5 text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg ${className}`}
      {...props}
    />
  );
}
