"""Servidor local do Planejamento financeiro (Python).

Uso: python _serve.py [porta]        (porta padrao: 8795)

Mesmo contrato do _serve.js - mantenha os dois em sincronia:
  GET  /api/estado          -> data/estado.json (204 se ainda nao existe)
  PUT  /api/estado          -> grava data/estado.json (escrita atomica)
  GET  /api/info            -> metadados
  GET  /api/backups         -> lista de snapshots
  GET  /api/backups/<nome>  -> conteudo de um snapshot

Escuta apenas em 127.0.0.1; aceita so cliente 127.0.0.1, Host
localhost/127.0.0.1:PORTA e, se houver Origin, exatamente http://localhost:PORTA.
config.json: {"pastaDados": "./data", "maxBackups": 10, "intervaloMinimoSnapshotMin": 0}
"""

from __future__ import annotations

import datetime as dt
import http.server
import json
import os
import re
import sys
import time
from typing import Any

RAIZ = os.path.dirname(os.path.abspath(__file__))
PORTA_PADRAO = 8795
MAX_CORPO = 200 * 1024 * 1024
NOME_SNAPSHOT = re.compile(r"^estado-\d{8}-\d{6}-\d{3}\.json$")
NEGADOS = {"config.json", "_serve.js", "_serve.py", "abrir.cmd", "tools", "tests"}

TIPOS = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".csv": "text/csv; charset=utf-8",
    ".wasm": "application/wasm",
    ".traineddata": "application/octet-stream",
    ".gz": "application/gzip",
    ".pdf": "application/pdf",
    ".bcmap": "application/octet-stream",
    ".pfb": "application/octet-stream",
    ".ttf": "font/ttf",
    ".woff2": "font/woff2",
}


def ler_config() -> dict[str, Any]:
    cfg: dict[str, Any] = {"pastaDados": "./data", "maxBackups": 10, "intervaloMinimoSnapshotMin": 0}
    try:
        with open(os.path.join(RAIZ, "config.json"), encoding="utf-8") as f:
            bruto = json.load(f)
        if isinstance(bruto.get("pastaDados"), str) and bruto["pastaDados"].strip():
            cfg["pastaDados"] = bruto["pastaDados"].strip()
        if isinstance(bruto.get("maxBackups"), (int, float)) and bruto["maxBackups"] >= 1:
            cfg["maxBackups"] = int(bruto["maxBackups"])
        if isinstance(bruto.get("intervaloMinimoSnapshotMin"), (int, float)) and bruto["intervaloMinimoSnapshotMin"] >= 0:
            cfg["intervaloMinimoSnapshotMin"] = float(bruto["intervaloMinimoSnapshotMin"])
    except (OSError, ValueError, AttributeError):
        pass  # sem config.json (ou invalido): usa os padroes
    return cfg


CONFIG = ler_config()
PASTA_DADOS = os.path.abspath(os.path.join(RAIZ, CONFIG["pastaDados"]))
PASTA_BACKUPS = os.path.join(PASTA_DADOS, "backups")
ARQ_ESTADO = os.path.join(PASTA_DADOS, "estado.json")
PORTA = PORTA_PADRAO


def dentro_de(pasta: str, alvo: str) -> bool:
    try:
        return os.path.commonpath([pasta, alvo]) == pasta
    except ValueError:
        return False


def iso(ts: float) -> str:
    return dt.datetime.fromtimestamp(ts, dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.") + f"{int(ts * 1000) % 1000:03d}Z"


def listar_snapshots() -> list[dict[str, Any]]:
    try:
        nomes = sorted((n for n in os.listdir(PASTA_BACKUPS) if NOME_SNAPSHOT.match(n)), reverse=True)
    except OSError:
        return []
    saida = []
    for n in nomes:
        st = os.stat(os.path.join(PASTA_BACKUPS, n))
        saida.append({"nome": n, "bytes": st.st_size, "data": iso(st.st_mtime)})
    return saida


def gravar_estado(corpo: bytes) -> dict[str, Any]:
    os.makedirs(PASTA_BACKUPS, exist_ok=True)
    tmp = ARQ_ESTADO + ".tmp"
    with open(tmp, "wb") as f:
        f.write(corpo)
    os.replace(tmp, ARQ_ESTADO)  # atomico

    snaps = listar_snapshots()
    recente = os.stat(os.path.join(PASTA_BACKUPS, snaps[0]["nome"])).st_mtime if snaps else 0
    if not recente or time.time() - recente >= CONFIG["intervaloMinimoSnapshotMin"] * 60:
        agora = dt.datetime.now()
        nome = "estado-" + agora.strftime("%Y%m%d-%H%M%S") + f"-{agora.microsecond // 1000:03d}.json"
        with open(os.path.join(PASTA_BACKUPS, nome), "wb") as f:
            f.write(corpo)
        snaps = listar_snapshots()
    for s in snaps[CONFIG["maxBackups"]:]:
        try:
            os.remove(os.path.join(PASTA_BACKUPS, s["nome"]))
        except OSError:
            pass
    return {"ok": True, "salvoEm": iso(time.time()), "bytes": len(corpo), "backups": min(len(snaps), CONFIG["maxBackups"])}


class Handler(http.server.SimpleHTTPRequestHandler):
    """Estaticos presos a RAIZ, sem cache, mais a API de dados."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=RAIZ, **kwargs)

    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, **TIPOS}

    def log_message(self, format: str, *args: Any) -> None:
        """Silencia o log por requisicao."""

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    # ---------- helpers ----------
    def _json(self, status: int, obj: Any) -> None:
        corpo = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def _bytes_json(self, buf: bytes) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(buf)))
        self.end_headers()
        self.wfile.write(buf)

    def _autorizado(self, escreve: bool) -> bool:
        if self.client_address[0] != "127.0.0.1":
            return False
        host = (self.headers.get("Host") or "").lower()
        if host not in (f"localhost:{PORTA}", f"127.0.0.1:{PORTA}"):
            return False
        origem = self.headers.get("Origin")
        if origem is None:
            return not escreve
        return origem == f"http://localhost:{PORTA}"

    # ---------- API ----------
    def _api(self, rota: str) -> None:
        if not self._autorizado(self.command != "GET"):
            self._json(403, {"erro": "acesso negado"})
            return

        if rota == "/api/estado" and self.command == "GET":
            try:
                with open(ARQ_ESTADO, "rb") as f:
                    self._bytes_json(f.read())
            except OSError:
                self.send_response(204)  # ainda sem arquivo
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
            return

        if rota == "/api/estado" and self.command == "PUT":
            if not (self.headers.get("Content-Type") or "").startswith("application/json"):
                self._json(415, {"erro": "use application/json"})
                return
            try:
                tamanho = int(self.headers.get("Content-Length") or "0")
            except ValueError:
                tamanho = -1
            if tamanho < 0 or tamanho > MAX_CORPO:
                self._json(413, {"erro": "corpo invalido ou grande demais"})
                return
            corpo = self.rfile.read(tamanho)
            try:
                obj = json.loads(corpo.decode("utf-8"))
                if not isinstance(obj, dict):
                    raise ValueError("raiz deve ser objeto")
            except (ValueError, UnicodeDecodeError):
                self._json(400, {"erro": "JSON invalido"})
                return
            try:
                self._json(200, gravar_estado(corpo))
            except OSError as e:
                self._json(500, {"erro": f"falha ao gravar: {e.errno}"})
            return

        if rota == "/api/info" and self.command == "GET":
            try:
                st = os.stat(ARQ_ESTADO)
            except OSError:
                st = None
            self._json(200, {
                "pastaDados": PASTA_DADOS,
                "existe": st is not None,
                "bytes": st.st_size if st else 0,
                "ultimoSalvamento": iso(st.st_mtime) if st else None,
                "backups": len(listar_snapshots()),
                "maxBackups": CONFIG["maxBackups"],
            })
            return

        if rota == "/api/backups" and self.command == "GET":
            self._json(200, listar_snapshots())
            return

        if rota.startswith("/api/backups/") and self.command == "GET":
            nome = rota[len("/api/backups/"):]
            if not NOME_SNAPSHOT.match(nome):
                self._json(400, {"erro": "nome invalido"})
                return
            try:
                with open(os.path.join(PASTA_BACKUPS, nome), "rb") as f:
                    self._bytes_json(f.read())
            except OSError:
                self._json(404, {"erro": "nao encontrado"})
            return

        self._json(404, {"erro": "rota desconhecida"})

    # ---------- despacho ----------
    def _negado(self) -> bool:
        caminho = os.path.abspath(os.path.join(RAIZ, "." + self.path.split("?")[0].replace("%20", " ")))
        if not dentro_de(RAIZ, caminho):
            return True
        if dentro_de(PASTA_DADOS, caminho):
            return True
        rel = os.path.relpath(caminho, RAIZ).split(os.sep)[0]
        return rel in NEGADOS

    def do_GET(self) -> None:  # noqa: N802
        rota = self.path.split("?")[0]
        if rota.startswith("/api/"):
            self._api(rota)
        elif self._negado():
            self.send_error(403)
        else:
            super().do_GET()

    def do_HEAD(self) -> None:  # noqa: N802
        if self._negado():
            self.send_error(403)
        else:
            super().do_HEAD()

    def do_PUT(self) -> None:  # noqa: N802
        rota = self.path.split("?")[0]
        if rota.startswith("/api/"):
            self._api(rota)
        else:
            self.send_error(405)

    def do_POST(self) -> None:  # noqa: N802
        self.send_error(405)

    def do_DELETE(self) -> None:  # noqa: N802
        self.send_error(405)


def main() -> int:
    global PORTA
    try:
        PORTA = int(sys.argv[1]) if len(sys.argv) > 1 else PORTA_PADRAO
    except ValueError:
        print(f"Porta invalida: {sys.argv[1]!r}", file=sys.stderr)
        return 2

    with http.server.ThreadingHTTPServer(("127.0.0.1", PORTA), Handler) as servidor:
        print(f"Servindo {RAIZ}")
        print(f"Dados em  {PASTA_DADOS}")
        print(f"http://localhost:{PORTA}/")
        print("Feche esta janela para parar.")
        try:
            servidor.serve_forever()
        except KeyboardInterrupt:
            print("\nEncerrado.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
