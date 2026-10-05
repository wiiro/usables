// Teste de fumaça: confere que as rotas principais respondem como esperado.
// Uso: SITE_URL=http://localhost:3000 npm run smoke   (site e backend precisam estar no ar)
const BASE = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

const ESPERADO = [
  ["/", 200], ["/loja", 200], ["/loja?categoria=brincos", 200], ["/loja?q=colar", 200],
  ["/loja/ensaio-colar-exemplo-03", 200], ["/loja/nao-existe", 404],
  ["/materioteca", 200], ["/manifesto", 200], ["/processo", 200], ["/cuidados", 200],
  ["/contato", 200], ["/envio", 200], ["/trocas-e-devolucoes", 200],
  ["/termos-de-uso", 200], ["/politica-de-privacidade", 200],
  ["/carrinho", 200], ["/conta/entrar", 200], ["/conta/criar", 200],
  ["/robots.txt", 200], ["/sitemap.xml", 200], ["/api/carrinho/contagem", 200],
  // Áreas protegidas: sem login, redirecionam (checkout sem carrinho; conta sem sessão).
  ["/checkout", 307], ["/conta", 307], ["/conta/pedidos", 307], ["/conta/favoritos", 307], ["/conta/exportar", 307],
];

let falhas = 0;
for (const [caminho, status] of ESPERADO) {
  try {
    const r = await fetch(BASE + caminho, { redirect: "manual", signal: AbortSignal.timeout(20000) });
    const ok = r.status === status;
    if (!ok) falhas++;
    console.log(`${ok ? "OK  " : "FALHA"} ${String(r.status).padEnd(4)} (esperado ${status}) ${caminho}`);
  } catch (erro) {
    falhas++;
    console.log(`FALHA erro de rede em ${caminho}: ${erro.message}`);
  }
}
console.log(falhas === 0 ? `\nTudo certo (${ESPERADO.length} rotas).` : `\n${falhas} falha(s).`);
process.exit(falhas === 0 ? 0 : 1);
