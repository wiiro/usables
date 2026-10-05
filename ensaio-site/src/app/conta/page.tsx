import type { Metadata } from "next";
import Link from "next/link";
import { exigirCliente } from "@/lib/conta";
import { UFS } from "@/lib/validacao";
import {
  adicionarEnderecoAcao,
  excluirContaAcao,
  removerEnderecoAcao,
  sairAcao,
  salvarDadosAcao,
} from "./actions";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false } };
export const dynamic = "force-dynamic";

const MENSAGENS: Record<string, string> = {
  "ok:dados": "Dados atualizados.",
  "ok:endereco": "Endereço adicionado.",
  "erro:dados": "Confira nome, sobrenome e telefone (com DDD).",
  "erro:endereco": "Confira os dados do endereço.",
  "erro:exclusao": "Para excluir, digite EXCLUIR no campo de confirmação.",
};

const CAMPO = "w-full border border-tinta/30 bg-white px-3 py-2";
const BOTAO = "border border-tinta px-4 py-2 uppercase tracking-widest hover:bg-tinta hover:text-white";

type Props = { searchParams: Promise<{ ok?: string; erro?: string }> };

export default async function Conta({ searchParams }: Props) {
  const { ok, erro } = await searchParams;
  const cliente = await exigirCliente();
  const aviso = (ok && MENSAGENS[`ok:${ok}`]) || (erro && MENSAGENS[`erro:${erro}`]) || undefined;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-titulo text-3xl font-bold">Olá{cliente.nome ? `, ${cliente.nome}` : ""}</h1>
        <form action={sairAcao}><button type="submit" className="text-sm underline underline-offset-4 hover:text-terracota">Sair</button></form>
      </div>
      <nav aria-label="Conta" className="mt-4 flex gap-6 text-sm uppercase tracking-widest">
        <Link href="/conta/pedidos" className="hover:text-terracota">Pedidos</Link>
        <Link href="/conta/favoritos" className="hover:text-terracota">Favoritos</Link>
      </nav>
      {aviso ? <p role="status" className="mt-6 border-l-2 border-terracota pl-3 text-sm">{aviso}</p> : null}

      <section aria-label="Dados" className="mt-10">
        <h2 className="font-titulo text-sm font-bold uppercase tracking-widest">Meus dados</h2>
        <form action={salvarDadosAcao} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nome" className="mb-1 block text-sm">Nome</label>
            <input id="nome" name="nome" defaultValue={cliente.nome} className={CAMPO} required />
          </div>
          <div>
            <label htmlFor="sobrenome" className="mb-1 block text-sm">Sobrenome</label>
            <input id="sobrenome" name="sobrenome" defaultValue={cliente.sobrenome} className={CAMPO} required />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm">E-mail</label>
            <input id="email" value={cliente.email} readOnly className={`${CAMPO} bg-tinta/5`} />
          </div>
          <div>
            <label htmlFor="telefone" className="mb-1 block text-sm">Telefone com DDD</label>
            <input id="telefone" name="telefone" defaultValue={cliente.telefone} type="tel" className={CAMPO} />
          </div>
          <div className="sm:col-span-2"><button type="submit" className={BOTAO}>Salvar</button></div>
        </form>
      </section>

      <section aria-label="Endereços" className="mt-12">
        <h2 className="font-titulo text-sm font-bold uppercase tracking-widest">Endereços</h2>
        {cliente.enderecos.length === 0 ? <p className="mt-3 text-sm">Nenhum endereço salvo.</p> : null}
        <ul className="mt-3 space-y-3">
          {cliente.enderecos.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-4 border border-tinta/15 p-3 text-sm">
              <span>{e.nome}<br />{e.rua}{e.complemento ? ` (${e.complemento})` : ""}<br />{e.cidade}/{e.uf} - {e.cep}</span>
              <form action={removerEnderecoAcao}>
                <input type="hidden" name="id" value={e.id} />
                <button type="submit" className="underline underline-offset-4 hover:text-terracota">Remover</button>
              </form>
            </li>
          ))}
        </ul>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm underline underline-offset-4">Adicionar endereço</summary>
          <form action={adicionarEnderecoAcao} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input name="nome" placeholder="Nome" aria-label="Nome" className={CAMPO} required />
            <input name="sobrenome" placeholder="Sobrenome" aria-label="Sobrenome" className={CAMPO} required />
            <input name="cep" placeholder="CEP" aria-label="CEP" inputMode="numeric" maxLength={9} className={CAMPO} required />
            <input name="rua" placeholder="Rua" aria-label="Rua" className={CAMPO} required />
            <input name="numero" placeholder="Número" aria-label="Número" className={CAMPO} required />
            <input name="complemento" placeholder="Complemento (opcional)" aria-label="Complemento" className={CAMPO} />
            <input name="bairro" placeholder="Bairro" aria-label="Bairro" className={CAMPO} required />
            <input name="cidade" placeholder="Cidade" aria-label="Cidade" className={CAMPO} required />
            <select name="uf" aria-label="UF" defaultValue="" className={CAMPO} required>
              <option value="" disabled>UF</option>
              {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
            <div className="sm:col-span-2"><button type="submit" className={BOTAO}>Salvar endereço</button></div>
          </form>
        </details>
      </section>

      <section aria-label="Privacidade" className="mt-12 border-t border-tinta/15 pt-8">
        <h2 className="font-titulo text-sm font-bold uppercase tracking-widest">Privacidade e seus dados (LGPD)</h2>
        <p className="mt-3 text-sm">
          Você pode baixar uma cópia dos seus dados ou excluir sua conta. Detalhes na{" "}
          <Link href="/politica-de-privacidade" className="underline">política de privacidade</Link>.
        </p>
        <p className="mt-4">
          <a href="/conta/exportar" download className={`${BOTAO} inline-block`}>Baixar meus dados (JSON)</a>
        </p>
        <form action={excluirContaAcao} className="mt-8 space-y-3 border border-terracota/40 p-4">
          <p className="text-sm">
            <strong>Excluir minha conta.</strong> Seu cadastro, endereços e favoritos são apagados e você perde o acesso.
            Os pedidos já feitos são mantidos por exigência legal e fiscal, apenas com os dados da compra (como e-mail e endereço de entrega) e sem vínculo com a sua conta. Não dá para desfazer.
          </p>
          <label htmlFor="confirmacao" className="block text-sm">Digite EXCLUIR para confirmar</label>
          <input id="confirmacao" name="confirmacao" autoComplete="off" className={CAMPO} />
          <button type="submit" className="border border-terracota px-4 py-2 uppercase tracking-widest text-terracota hover:bg-terracota hover:text-white">
            Excluir minha conta
          </button>
        </form>
      </section>
    </div>
  );
}
