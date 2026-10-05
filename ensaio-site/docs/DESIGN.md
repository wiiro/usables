# Design

Fonte: PDF "marca-pronta-versão1" (2024), moodboards e referências (Grace Ling, Agathe Sorlet, Nayu).

## Cores (tokens em `src/app/globals.css`)

| Token | Hex | Uso |
|---|---|---|
| `papel` | `#FFFFFF` | **Fundo padrão** (todas as referências usam fundo branco) |
| `areia` | `#EFE5D8` | Apoio pontual (texto sobre terracota, superfícies suaves) |
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
4. Grade de 6 pilares clicáveis (Biomateriais, Materioteca, Processo, Sustentabilidade, Manifesto, Comunidade) em **colagem assimétrica, sem espaço entre os quadrados e de ponta a ponta**, como nas referências Agathe Sorlet e Nayu. Desktop: 12 colunas, 2 linhas de alturas diferentes (spans 5/4/3 e 3/5/4); mobile: 2 colunas. Ver `LAYOUT` em `PillarsGrid.tsx`.
5. Instagram (manual) e rodapé com WhatsApp opcional (`NEXT_PUBLIC_WHATSAPP_NUMERO`).

## Estética

Fotografia fria e surreal, colagem, papel vegetal e manteiga, bordas retas, muito ar, sem sombras pesadas. Símbolo: arcos e pontos terracota (`public/brand/simbolo.png`).

## Acessibilidade

Link "Ir para o conteúdo", foco visível, `prefers-reduced-motion` respeitado, busca acessível por teclado, imagens placeholder com `aria-label`.

## Placeholders de mídia (até haver material real)

Baseados no segundo moodboard (cosmos e gravura científica): Júpiter, Lua, gravuras de Saturno, ondas concêntricas, estrela de oito pontas e disco com figura humana.

- **Vídeo da abertura**: `src/components/home/HeroAnimado.tsx` é uma animação em loop (SVG + CSS), não um arquivo de vídeo, sobre fundo escuro: ondas concêntricas "respirando", estrela cintilando, Lua e Júpiter à deriva. Em desenvolvimento aparece o selo "vídeo simulado (placeholder)". Para usar o vídeo real: colocar o arquivo em `public/` e passar `videoSrc="/arquivo.mp4"` (e `posterSrc`) ao `<Hero />` em `src/app/page.tsx`. Recomendado: mp4 H.264 comprimido, até 3 a 5 MB, sem áudio.
- **Imagens**: `src/components/ui/PlaceholderArt.tsx` gera as 6 composições em SVG. É usado em cards de produto, página de produto, pilares, Instagram e Materioteca. A prop `variante` (0 a 5) escolhe a composição; sem ela, vem do `seed`. Produtos com foto cadastrada no Medusa (campo `thumbnail`) mostram a foto no lugar da arte.
- Animações respeitam `prefers-reduced-motion` (ficam paradas).
