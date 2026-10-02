import { Check } from 'lucide-react';
import { ITEM_COLORS } from '../../domain/colors';

interface ColorPickerProps {
  id?: string;
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ id, label, value, onChange }: ColorPickerProps) {
  return (
    <div id={id} role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {ITEM_COLORS.map((color) => {
        const selected = color.value.toLowerCase() === value.toLowerCase();
        return (
          <button
            key={color.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={color.name}
            title={color.name}
            onClick={() => onChange(color.value)}
            className={[
              'flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-surface transition',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              selected ? 'ring-2 ring-fg' : 'hover:scale-110',
            ].join(' ')}
            style={{ backgroundColor: color.value }}
          >
            {selected && <Check className="size-4 text-white" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}
