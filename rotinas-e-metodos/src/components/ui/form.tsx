import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const CONTROL =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted ' +
  'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50';

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  /** Aviso em vermelho. Não bloqueia a gravação: só chama a atenção. */
  warning?: ReactNode;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, warning, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-fg-muted">
        {label}
      </label>
      {children}
      {warning && <p className="text-xs text-red-600 dark:text-red-400">{warning}</p>}
      {!warning && hint && <p className="text-xs text-fg-muted">{hint}</p>}
    </div>
  );
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" className={`${CONTROL} ${className}`} {...props} />;
}

export function TextArea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} className={`${CONTROL} resize-y ${className}`} {...props} />;
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${CONTROL} ${className}`} {...props} />;
}

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: string | null;
  /** Recebe 'AAAA-MM-DD', ou null quando o campo é limpo. */
  onChange: (value: string | null) => void;
}

export function DateInput({ value, onChange, className = '', ...props }: DateInputProps) {
  return (
    <input
      type="date"
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value || null)}
      className={`${CONTROL} ${className}`}
      {...props}
    />
  );
}
