import { Button, Input, Label, Text, toast } from "@medusajs/ui"
import { useRef, useState } from "react"
import { enviarArquivo } from "./api"

type Props = {
  rotulo: string
  valor: string
  aoMudar: (url: string) => void
  /** Tipos aceitos pelo seletor de arquivo (ex.: "image/*", "video/mp4"). */
  aceita: string
  ajuda?: string
}

/** Campo de URL com botão para enviar um arquivo do computador (preenche a URL sozinho). */
export function CampoArquivo({ rotulo, valor, aoMudar, aceita, ajuda }: Props) {
  const seletor = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)

  const aoEscolher = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    e.target.value = ""
    if (!arquivo) return
    setEnviando(true)
    try {
      aoMudar(await enviarArquivo(arquivo))
      toast.success("Arquivo enviado")
    } catch (erro) {
      toast.error("Não foi possível enviar o arquivo", { description: (erro as Error).message })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-1">
      <Label>{rotulo}</Label>
      <div className="flex gap-x-2">
        <Input value={valor} onChange={(e) => aoMudar(e.target.value)} placeholder="https://... ou envie um arquivo" />
        <Button type="button" variant="secondary" isLoading={enviando} onClick={() => seletor.current?.click()}>
          Enviar arquivo
        </Button>
        <input ref={seletor} type="file" accept={aceita} className="hidden" onChange={aoEscolher} />
      </div>
      {ajuda ? <Text size="small" className="text-ui-fg-subtle">{ajuda}</Text> : null}
    </div>
  )
}
