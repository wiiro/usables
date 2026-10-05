# Design

Fonte: PDF "marca-pronta-versão1" (2024), moodboards e referências (Grace Ling, Agathe Sorlet, Nayu).

## Cores (tokens em `src/app/globals.css`)

| Token | Hex | Uso |
|---|---|---|
| `areia` | `#EFE5D8` | Fundo padrão |
| `gelo` | `#EDF4F3` | Campos, seções, hover |
| `agua` | `#C6DBD8` | Blocos de apoio |
| `terracota` | `#933815` | Destaque, logo, links em hover |
| `terracota-vivo` | `#A03100` | Estado hover de botões |
| `ouro` | `#BA9600` | Reservado para detalhes pontuais |
| `tinta` | `#2A1B14` | Texto. **Escolha de implementação** (não está no PDF); revisar com a marca |

Verificar contraste WCAG AA antes de usar uma combinação nova (terracota sobre areia atende para texto normal).

## Tipografia (tudo monoespaçado)

| Papel | Marca | Em uso hoje |
|---|---|---|
| Títulos | Geometry Soft Pro Bold N | Space Mono (substituta livre) |
| Corpo | Ubuntu Mono | Ubuntu Mono |
| Destaques | Telegrama | Space Mono (substituta livre) |

Trocar quando a licença web for confirmada: ajustar `layout.tsx` e `--font-titulo`.

## Layout da home

1. Header não fixo, logo centralizado, nav à esquerda, ícones à direita. Busca aparece no hover/foco do logo (desktop) ou na lupa (mobile).
2. Abertura em tela cheia (vídeo mudo ou poster).
3. Faixa horizontal de peças com setas e scroll-snap.
4. Grade de 6 pilares clicáveis: Biomateriais, Materioteca, Processo, Sustentabilidade, Manifesto, Comunidade.
5. Instagram (manual) e rodapé com WhatsApp opcional (`NEXT_PUBLIC_WHATSAPP_NUMERO`).

## Estética

Fotografia fria e surreal, colagem, papel vegetal e manteiga, bordas retas, muito ar, sem sombras pesadas. Símbolo: arcos e pontos terracota (`public/brand/simbolo.png`).

## Acessibilidade

Link "Ir para o conteúdo", foco visível, `prefers-reduced-motion` respeitado, busca acessível por teclado, imagens placeholder com `aria-label`.

## Placeholders de mídia (até haver material real)

- **Vídeo da abertura**: `src/components/home/HeroAnimado.tsx` é uma animação em loop (SVG + CSS), não um arquivo de vídeo: esferas sobre a água, arco do símbolo girando, brilhos. Em desenvolvimento aparece o selo "vídeo simulado (placeholder)". Para usar o vídeo real: colocar o arquivo em `public/` e passar `videoSrc="/arquivo.mp4"` (e `posterSrc`) ao `<Hero />` em `src/app/page.tsx`. Recomendado: mp4 H.264 comprimido, até 3 a 5 MB, sem áudio.
- **Imagens**: `src/components/ui/PlaceholderArt.tsx` gera artes em SVG (arcos, pontos, esferas) nas cores da marca. É usado em cards de produto, página de produto, pilares, Instagram e Materioteca. Produtos com foto cadastrada no Medusa (campo `thumbnail`) mostram a foto no lugar da arte.
- Animações respeitam `prefers-reduced-motion` (ficam paradas).
