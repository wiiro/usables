import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Swatch } from "@medusajs/icons"
import { Badge, Button, Container, Drawer, Heading, Input, Label, Switch, Table, Text, Textarea, Toaster, toast, usePrompt } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { api } from "../../lib/api"
import { CampoArquivo } from "../../lib/CampoArquivo"

type Material = {
  id: string
  nome: string
  slug: string
  descricao: string | null
  ingredientes: string | null
  origem: string | null
  imagem_url: string | null
  ordem: number
  ativo: boolean
}

type Formulario = {
  nome: string
  descricao: string
  ingredientes: string
  origem: string
  imagem_url: string
  ordem: string
  ativo: boolean
}

const VAZIO: Formulario = { nome: "", descricao: "", ingredientes: "", origem: "", imagem_url: "", ordem: "0", ativo: true }

const paraFormulario = (m: Material): Formulario => ({
  nome: m.nome,
  descricao: m.descricao ?? "",
  ingredientes: m.ingredientes ?? "",
  origem: m.origem ?? "",
  imagem_url: m.imagem_url ?? "",
  ordem: String(m.ordem),
  ativo: m.ativo,
})

const MateriotecaPage = () => {
  const [materiais, setMateriais] = useState<Material[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aberto, setAberto] = useState(false)
  const [editando, setEditando] = useState<Material | null>(null)
  const [form, setForm] = useState<Formulario>(VAZIO)
  const [salvando, setSalvando] = useState(false)
  const confirmar = usePrompt()

  const carregar = useCallback(async () => {
    try {
      setMateriais((await api<{ materiais: Material[] }>("/admin/materiais")).materiais)
    } catch (erro) {
      toast.error("Não foi possível carregar os materiais", { description: (erro as Error).message })
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const abrir = (m: Material | null) => {
    setEditando(m)
    setForm(m ? paraFormulario(m) : VAZIO)
    setAberto(true)
  }

  const salvar = async () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome do material")
      return
    }
    setSalvando(true)
    const corpo = {
      nome: form.nome,
      descricao: form.descricao,
      ingredientes: form.ingredientes,
      origem: form.origem,
      imagem_url: form.imagem_url,
      ordem: Number.parseInt(form.ordem, 10) || 0,
      ativo: form.ativo,
    }
    try {
      if (editando) await api(`/admin/materiais/${editando.id}`, { method: "POST", body: JSON.stringify(corpo) })
      else await api("/admin/materiais", { method: "POST", body: JSON.stringify(corpo) })
      toast.success(editando ? "Material atualizado" : "Material criado")
      setAberto(false)
      await carregar()
    } catch (erro) {
      toast.error("Não foi possível salvar", { description: (erro as Error).message })
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (m: Material) => {
    const ok = await confirmar({
      title: "Excluir material",
      description: `Excluir "${m.nome}"? Ele deixa de aparecer no site.`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
    })
    if (!ok) return
    try {
      await api(`/admin/materiais/${m.id}`, { method: "DELETE" })
      toast.success("Material excluído")
      await carregar()
    } catch (erro) {
      toast.error("Não foi possível excluir", { description: (erro as Error).message })
    }
  }

  const campo = (k: keyof Formulario) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <Container className="divide-y p-0">
      <Toaster />
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Materioteca</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Biomateriais que aparecem na página Materioteca do site. Para ligar uma peça a um material, preencha o campo
            &quot;material&quot; no metadata da peça com o identificador (slug) do material.
          </Text>
        </div>
        <Button onClick={() => abrir(null)}>Novo material</Button>
      </div>

      <div className="px-6 py-4">
        {carregando ? <Text>Carregando...</Text> : null}
        {!carregando && materiais.length === 0 ? <Text>Nenhum material cadastrado ainda.</Text> : null}
        {materiais.length > 0 ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Ordem</Table.HeaderCell>
                <Table.HeaderCell>Nome</Table.HeaderCell>
                <Table.HeaderCell>Identificador</Table.HeaderCell>
                <Table.HeaderCell>Situação</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {materiais.map((m) => (
                <Table.Row key={m.id}>
                  <Table.Cell>{m.ordem}</Table.Cell>
                  <Table.Cell>{m.nome}</Table.Cell>
                  <Table.Cell>{m.slug}</Table.Cell>
                  <Table.Cell>
                    <Badge color={m.ativo ? "green" : "grey"}>{m.ativo ? "No site" : "Oculto"}</Badge>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <Button size="small" variant="secondary" onClick={() => abrir(m)}>Editar</Button>{" "}
                    <Button size="small" variant="danger" onClick={() => void excluir(m)}>Excluir</Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : null}
      </div>

      <Drawer open={aberto} onOpenChange={setAberto}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>{editando ? "Editar material" : "Novo material"}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
            <div className="flex flex-col gap-y-1">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={campo("nome")} />
            </div>
            <div className="flex flex-col gap-y-1">
              <Label>Descrição</Label>
              <Textarea rows={4} value={form.descricao} onChange={campo("descricao")} />
            </div>
            <div className="flex flex-col gap-y-1">
              <Label>Ingredientes</Label>
              <Textarea rows={3} value={form.ingredientes} onChange={campo("ingredientes")} />
            </div>
            <div className="flex flex-col gap-y-1">
              <Label>Origem</Label>
              <Input value={form.origem} onChange={campo("origem")} />
            </div>
            <CampoArquivo
              rotulo="Imagem"
              aceita="image/*"
              valor={form.imagem_url}
              aoMudar={(url) => setForm((f) => ({ ...f, imagem_url: url }))}
            />
            <div className="flex flex-col gap-y-1">
              <Label>Ordem na página (menor aparece primeiro)</Label>
              <Input type="number" min={0} value={form.ordem} onChange={campo("ordem")} />
            </div>
            <div className="flex items-center gap-x-2">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))} />
              <Label>Mostrar no site</Label>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button variant="secondary" onClick={() => setAberto(false)}>Cancelar</Button>
            <Button isLoading={salvando} onClick={() => void salvar()}>Salvar</Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Materioteca", icon: Swatch })

export default MateriotecaPage
