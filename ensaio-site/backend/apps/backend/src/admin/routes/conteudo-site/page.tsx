import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Newspaper } from "@medusajs/icons"
import { Button, Container, Heading, Input, Label, Text, Textarea, Toaster, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { api } from "../../lib/api"
import { CampoArquivo } from "../../lib/CampoArquivo"

type Form = {
  hero_video_url: string
  hero_poster_url: string
  instagram_usuario: string
  instagram_url: string
  instagram_imagens: string
}

const VAZIO: Form = { hero_video_url: "", hero_poster_url: "", instagram_usuario: "", instagram_url: "", instagram_imagens: "" }

const ConteudoSitePage = () => {
  const [form, setForm] = useState<Form>(VAZIO)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    api<{ conteudo: Record<string, unknown> }>("/admin/conteudo")
      .then(({ conteudo }) =>
        setForm({
          hero_video_url: String(conteudo.hero_video_url ?? ""),
          hero_poster_url: String(conteudo.hero_poster_url ?? ""),
          instagram_usuario: String(conteudo.instagram_usuario ?? ""),
          instagram_url: String(conteudo.instagram_url ?? ""),
          instagram_imagens: Array.isArray(conteudo.instagram_imagens) ? conteudo.instagram_imagens.join("\n") : "",
        }),
      )
      .catch((erro: Error) => toast.error("Não foi possível carregar", { description: erro.message }))
      .finally(() => setCarregando(false))
  }, [])

  const salvar = async () => {
    setSalvando(true)
    try {
      await api("/admin/conteudo", {
        method: "POST",
        body: JSON.stringify({
          hero_video_url: form.hero_video_url.trim(),
          hero_poster_url: form.hero_poster_url.trim(),
          instagram_usuario: form.instagram_usuario.trim(),
          instagram_url: form.instagram_url.trim(),
          instagram_imagens: form.instagram_imagens.split("\n").map((l) => l.trim()).filter(Boolean),
        }),
      })
      toast.success("Conteúdo salvo", { description: "O site atualiza em até 1 minuto." })
    } catch (erro) {
      toast.error("Não foi possível salvar", { description: (erro as Error).message })
    } finally {
      setSalvando(false)
    }
  }

  const campo = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <Container className="divide-y p-0">
      <Toaster />
      <div className="px-6 py-4">
        <Heading>Conteúdo do site</Heading>
        <Text size="small" className="text-ui-fg-subtle">Abertura da home e Instagram do rodapé. Deixe em branco para usar o padrão.</Text>
      </div>
      {carregando ? (
        <div className="px-6 py-4"><Text>Carregando...</Text></div>
      ) : (
        <div className="flex flex-col gap-y-6 px-6 py-4">
          <div className="flex flex-col gap-y-4">
            <Heading level="h2">Abertura (vídeo da home)</Heading>
            <CampoArquivo
              rotulo="Vídeo"
              aceita="video/mp4,video/webm"
              valor={form.hero_video_url}
              aoMudar={(url) => setForm((f) => ({ ...f, hero_video_url: url }))}
              ajuda="Use um vídeo curto, sem áudio, em mp4 (até uns 5 MB). Sem vídeo, o site mostra a animação padrão."
            />
            <CampoArquivo
              rotulo="Imagem de capa do vídeo (aparece enquanto carrega)"
              aceita="image/*"
              valor={form.hero_poster_url}
              aoMudar={(url) => setForm((f) => ({ ...f, hero_poster_url: url }))}
            />
          </div>
          <div className="flex flex-col gap-y-4">
            <Heading level="h2">Instagram</Heading>
            <div className="flex flex-col gap-y-1">
              <Label>Usuário (ex.: @ensaio)</Label>
              <Input value={form.instagram_usuario} onChange={campo("instagram_usuario")} />
            </div>
            <div className="flex flex-col gap-y-1">
              <Label>Endereço do perfil</Label>
              <Input value={form.instagram_url} onChange={campo("instagram_url")} placeholder="https://www.instagram.com/seuperfil" />
            </div>
            <div className="flex flex-col gap-y-1">
              <Label>Endereços das imagens (uma por linha, até 12)</Label>
              <Textarea rows={6} value={form.instagram_imagens} onChange={campo("instagram_imagens")} />
              <Text size="small" className="text-ui-fg-subtle">
                Para enviar uma foto: abra a Materioteca, use &quot;Enviar arquivo&quot;, copie o endereço gerado e cole aqui.
              </Text>
            </div>
          </div>
          <div><Button isLoading={salvando} onClick={() => void salvar()}>Salvar</Button></div>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Conteúdo do site", icon: Newspaper })

export default ConteudoSitePage
