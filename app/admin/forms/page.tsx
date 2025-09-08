"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Edit, Eye, Copy, FileText, Download, ArrowLeft, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"

export default function FormsAdminPage() {
  const router = useRouter()
  const [forms, setForms] = useState<any[]>([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingForm, setEditingForm] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    slug: "",
    fields: [] as any[]
  })
  const [currentField, setCurrentField] = useState({
    type: "text",
    label: "",
    name: "",
    required: false,
    placeholder: "",
    options: "",
    condition: null as any
  })

  useEffect(() => {
    checkAuthAndFetchForms()
  }, [])

  const checkAuthAndFetchForms = async () => {
    try {
      // Primeiro verificar se está autenticado
      const authResponse = await fetch('/api/auth')
      const authData = await authResponse.json()
      
      if (!authData.user || authData.user.role !== 'admin') {
        setIsAuthenticated(false)
        setError("Você precisa estar logado como administrador para acessar esta página")
        setIsLoading(false)
        return
      }

      setIsAuthenticated(true)
      
      // Se autenticado, buscar formulários
      const formsResponse = await fetch('/api/forms')
      const formsData = await formsResponse.json()
      
      if (!formsResponse.ok) {
        setError(formsData.error || "Erro ao carregar formulários")
        setForms([])
      } else if (Array.isArray(formsData)) {
        setForms(formsData)
      } else {
        setForms([])
      }
    } catch (error) {
      console.error('Error:', error)
      setError("Erro ao conectar com o servidor")
      setForms([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateForm = async () => {
    try {
      const method = editingForm ? 'PUT' : 'POST'
      const url = editingForm ? `/api/forms/${editingForm.id}` : '/api/forms'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar formulário')
      }

      setShowBuilder(false)
      setEditingForm(null)
      setFormData({ title: "", description: "", slug: "", fields: [] })
      checkAuthAndFetchForms()
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar formulário')
    }
  }

  const addField = () => {
    const field = {
      id: Date.now().toString(),
      type: currentField.type,
      label: currentField.label,
      name: currentField.name || currentField.label.toLowerCase().replace(/\s+/g, '_'),
      required: currentField.required,
      placeholder: currentField.placeholder,
      options: currentField.type === 'select' || currentField.type === 'radio' 
        ? currentField.options.split(',').map(o => o.trim()).filter(Boolean)
        : undefined,
      condition: currentField.condition
    }

    setFormData({
      ...formData,
      fields: [...formData.fields, field]
    })

    // Limpar campo atual
    setCurrentField({
      type: "text",
      label: "",
      name: "",
      required: false,
      placeholder: "",
      options: "",
      condition: null
    })
  }

  const removeField = (fieldId: string) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter(f => f.id !== fieldId)
    })
  }

  const exportSubmissions = async (formId: string) => {
    try {
      const response = await fetch(`/api/forms/${formId}/submissions`)
      if (!response.ok) {
        throw new Error('Erro ao exportar submissões')
      }
      const data = await response.json()
      
      const dataStr = JSON.stringify(data, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement("a")
      link.href = url
      link.download = `submissions-${formId}-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      alert(error.message || "Erro ao exportar submissões")
    }
  }

  // Se estiver carregando
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c] flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  // Se não estiver autenticado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c] flex items-center justify-center p-4">
        <Card className="max-w-md w-full backdrop-blur-md bg-white/10 border border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl">Acesso Restrito</CardTitle>
            <CardDescription className="text-white/70">
              {error || "Você precisa estar logado como administrador"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
            <Button
              onClick={() => router.push('/?login=true')}
              className="w-full bg-amber-500/80 hover:bg-amber-500 text-white"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela de criação/edição de formulário
  if (showBuilder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c] p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="backdrop-blur-md bg-white/95">
            <CardHeader>
              <CardTitle>{editingForm ? 'Editar' : 'Criar'} Formulário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações do formulário */}
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Título do Formulário</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Prontuário Médico"
                  />
                </div>
                <div>
                  <Label>URL (slug)</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    placeholder="Ex: prontuario"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descrição opcional"
                  />
                </div>
              </div>

              {/* Adicionar campo */}
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg">Adicionar Campo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label>Tipo de Campo</Label>
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={currentField.type}
                        onChange={(e) => setCurrentField({...currentField, type: e.target.value})}
                      >
                        <option value="text">Texto</option>
                        <option value="email">Email</option>
                        <option value="tel">Telefone</option>
                        <option value="number">Número</option>
                        <option value="date">Data</option>
                        <option value="textarea">Texto Longo</option>
                        <option value="select">Seleção</option>
                        <option value="radio">Múltipla Escolha</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="signature">Assinatura</option>
                      </select>
                    </div>
                    <div>
                      <Label>Label</Label>
                      <Input
                        value={currentField.label}
                        onChange={(e) => setCurrentField({...currentField, label: e.target.value})}
                        placeholder="Ex: Nome Completo"
                      />
                    </div>
                    <div>
                      <Label>Nome do Campo</Label>
                      <Input
                        value={currentField.name}
                        onChange={(e) => setCurrentField({...currentField, name: e.target.value})}
                        placeholder="Ex: nome_completo"
                      />
                    </div>
                  </div>

                  {(currentField.type === 'select' || currentField.type === 'radio') && (
                    <div>
                      <Label>Opções (separadas por vírgula)</Label>
                      <Input
                        value={currentField.options}
                        onChange={(e) => setCurrentField({...currentField, options: e.target.value})}
                        placeholder="Ex: Sim, Não, Talvez"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={currentField.required}
                        onChange={(e) => setCurrentField({...currentField, required: e.target.checked})}
                      />
                      <span>Campo Obrigatório</span>
                    </label>
                  </div>

                  <Button onClick={addField} disabled={!currentField.label}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Campo
                  </Button>
                </CardContent>
              </Card>

              {/* Campos adicionados */}
              <div className="space-y-2">
                <h3 className="font-semibold">Campos do Formulário</h3>
                {formData.fields.length === 0 ? (
                  <p className="text-gray-500">Nenhum campo adicionado</p>
                ) : (
                  formData.fields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{field.label}</span>
                        <span className="text-sm text-gray-500 ml-2">({field.type})</span>
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeField(field.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <Button onClick={handleCreateForm} disabled={!formData.title || !formData.slug}>
                  {editingForm ? 'Atualizar' : 'Criar'} Formulário
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBuilder(false)
                    setEditingForm(null)
                    setFormData({ title: "", description: "", slug: "", fields: [] })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Tela principal - Lista de formulários
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Gerenciar Formulários</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
              className="backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button 
              onClick={() => setShowBuilder(true)}
              className="bg-amber-500/80 hover:bg-amber-500 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Formulário
            </Button>
          </div>
        </div>

        {forms.length === 0 ? (
          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/70">Nenhum formulário cadastrado ainda.</p>
              <Button 
                onClick={() => setShowBuilder(true)}
                className="mt-4 bg-amber-500/80 hover:bg-amber-500 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Formulário
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <Card key={form.id} className="backdrop-blur-md bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-white">
                    <span>{form.title}</span>
                    <FileText className="h-5 w-5 text-white/40" />
                  </CardTitle>
                  <CardDescription className="text-white/70">/{form.slug}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-white/60">
                      {form.fields?.length || 0} campos
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/${form.slug}`, '_blank')}
                        className="backdrop-blur-sm bg-white/5 border-white/20 text-white hover:bg-white/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/${form.slug}`)
                          alert('Link copiado!')
                        }}
                        className="backdrop-blur-sm bg-white/5 border-white/20 text-white hover:bg-white/10"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportSubmissions(form.id)}
                        className="backdrop-blur-sm bg-white/5 border-white/20 text-white hover:bg-white/10"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingForm(form)
                          setFormData(form)
                          setShowBuilder(true)
                        }}
                        className="backdrop-blur-sm bg-white/5 border-white/20 text-white hover:bg-white/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
