"""Servidor estatico minimo do Guia de Tarefas.

Uso: python _serve.py [porta]

Serve SEMPRE o diretorio deste arquivo, nunca um caminho recebido de fora,
e escuta apenas em 127.0.0.1 (nao expoe a pasta na rede).

Envia Cache-Control: no-store porque dois documentos diferentes servidos na
mesma porta compartilham as mesmas URLs (localhost:PORTA/state.js). Sem isso
o navegador reaproveita o state.js de um documento no outro, e o DOC_ID
errado faz um sobrescrever o localStorage do outro.
"""

from __future__ import annotations

import http.server
import os
import sys
from typing import Any

RAIZ = os.path.dirname(os.path.abspath(__file__))
PORTA_PADRAO = 8778


class Handler(http.server.SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler preso a RAIZ e sem cache."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=RAIZ, **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, format: str, *args: Any) -> None:
        """Silencia o log por requisicao — a janela mostra so o essencial."""


def main() -> int:
    try:
        porta = int(sys.argv[1]) if len(sys.argv) > 1 else PORTA_PADRAO
    except ValueError:
        print(f"Porta invalida: {sys.argv[1]!r}", file=sys.stderr)
        return 2

    with http.server.ThreadingHTTPServer(("127.0.0.1", porta), Handler) as servidor:
        print(f"Servindo {RAIZ}")
        print(f"http://localhost:{porta}/")
        print("Feche esta janela para parar.")
        try:
            servidor.serve_forever()
        except KeyboardInterrupt:
            print("\nEncerrado.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
