"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { formatarPreco } from "@/lib/format";
import { UFS } from "@/lib/validacao";
import { finalizarCompra, type EstadoCheckout } from "./actions";

type Opcao = { id: string; nome: string; precoCentavos: number };
type Props = {
  emailInicial: string;
  inicial: { nome: string; sobrenome: string; telefone: string };
  opcoesEnvio: Opcao[];
  envioInicial: string | null;
  subtotalCentavos: number;
  descontoCentavos: number;
};

const CAMPO = "w-full border border-tinta/30 bg-white px-3 py-2";

function Campo({ id, rotulo, v, ...resto }: { id: string; rotulo: string; v?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm">{rotulo}</label>
      <input id={id} name={id} defaultValue={v} className={CAMPO} {...resto} />
    </div>
  );
}

export function CheckoutForm({ emailInicial, inicial, opcoesEnvio, envioInicial, subtotalCentavos, descontoCentavos }: Props) {
  const [estado, acao, pendente] = useActionState<EstadoCheckout, FormData>(finalizarCompra, {});
  const [envio, setEnvio] = useState(estado.valores?.envio ?? envioInicial ?? opcoesEnvio[0]?.id ?? "");
  const frete = opcoesEnvio.find((o) => o.id === envio)?.precoCentavos ?? 0;
  const total = subtotalCentavos - descontoCentavos + frete;
  const v = estado.valores ?? {};

  return (
    <form action={acao} className="grid gap-10 md:grid-cols-[1fr_320px]" noValidate>
      <div className="space-y-8">
        {estado.erro ? <p role="alert" className="border-l-2 border-terracota pl-3 text-sm">{estado.erro}</p> : null}

        <fieldset className="space-y-4">
          <legend className="font-titulo text-sm font-bold uppercase tracking-widest">Contato</legend>
          <Campo id="email" rotulo="E-mail" type="email" autoComplete="email" required v={v.email ?? emailInicial} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="nome" rotulo="Nome" autoComplete="given-name" required v={v.nome ?? inicial.nome} />
            <Campo id="sobrenome" rotulo="Sobrenome" autoComplete="family-name" required v={v.sobrenome ?? inicial.sobrenome} />
          </div>
          <Campo id="telefone" rotulo="Telefone com DDD" type="tel" autoComplete="tel" inputMode="tel" required v={v.telefone ?? inicial.telefone} />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-titulo text-sm font-bold uppercase tracking-widest">Entrega</legend>
          <Campo id="cep" rotulo="CEP" autoComplete="postal-code" inputMode="numeric" maxLength={9} required v={v.cep} />
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <Campo id="rua" rotulo="Rua" autoComplete="address-line1" required v={v.rua} />
            <Campo id="numero" rotulo="Número" required v={v.numero} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="complemento" rotulo="Complemento (opcional)" v={v.complemento} />
            <Campo id="bairro" rotulo="Bairro" required v={v.bairro} />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <Campo id="cidade" rotulo="Cidade" autoComplete="address-level2" required v={v.cidade} />
            <div>
              <label htmlFor="uf" className="mb-1 block text-sm">UF</label>
              <select id="uf" name="uf" defaultValue={v.uf ?? ""} required className={CAMPO}>
                <option value="" disabled>--</option>
                {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-titulo text-sm font-bold uppercase tracking-widest">Envio</legend>
          {opcoesEnvio.length === 0 ? <p>Nenhuma forma de envio disponível.</p> : null}
          {opcoesEnvio.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-center justify-between border border-tinta/20 px-3 py-3 has-[:checked]:border-terracota">
              <span className="flex items-center gap-3">
                <input type="radio" name="envio" value={o.id} checked={envio === o.id} onChange={() => setEnvio(o.id)} required />
                {o.nome}
              </span>
              <span>{formatarPreco(o.precoCentavos)}</span>
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend className="font-titulo text-sm font-bold uppercase tracking-widest">Pagamento</legend>
          <p className="mt-3 border border-tinta/20 px-3 py-3 text-sm">
            Ambiente de teste: o pedido é registrado sem cobrança. Pix e cartão (Mercado Pago) entram na próxima etapa.
          </p>
        </fieldset>
      </div>

      <aside aria-label="Resumo do pedido" className="h-fit space-y-2 border border-tinta/15 p-5 md:sticky md:top-6">
        <h2 className="font-titulo text-sm font-bold uppercase tracking-widest">Resumo</h2>
        <div className="flex justify-between"><span>Subtotal</span><span>{formatarPreco(subtotalCentavos)}</span></div>
        {descontoCentavos > 0 ? (
          <div className="flex justify-between"><span>Desconto</span><span>- {formatarPreco(descontoCentavos)}</span></div>
        ) : null}
        <div className="flex justify-between"><span>Frete</span><span>{formatarPreco(frete)}</span></div>
        <div className="flex justify-between border-t border-tinta/15 pt-2 font-bold"><span>Total</span><span>{formatarPreco(total)}</span></div>
        <button
          type="submit"
          disabled={pendente || opcoesEnvio.length === 0}
          className="mt-4 w-full border border-terracota bg-terracota px-5 py-3 uppercase tracking-widest text-white hover:bg-terracota-vivo disabled:opacity-50"
        >
          {pendente ? "Enviando..." : "Concluir pedido"}
        </button>
        <p className="pt-2 text-xs text-tinta/60">
          Ao concluir, você concorda com os <Link href="/termos-de-uso" className="underline">termos de uso</Link> e a{" "}
          <Link href="/politica-de-privacidade" className="underline">política de privacidade</Link>.
        </p>
      </aside>
    </form>
  );
}
