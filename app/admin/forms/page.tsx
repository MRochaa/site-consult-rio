"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Edit, Eye, Copy, FileText, Download, ArrowLeft, ArrowUp, ArrowDown, X, Palette } from "lucide-react"
import { useRouter } from "next/navigation"
import { AuthClient } from "@/lib/auth-client"
import { Palette } from "lucide-react"

interface FieldOption {
  id: string
  value: string
}

export default function FormsAdminPage() {
  const router = useRouter()
  const [forms, setForms] = useState<any[]>([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingForm, setEditingForm] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    slug: "",
    fields: [] as any[]
  })
  
  // Estado melhorado para campo atual
  const [currentField, setCurrentField] = useState({
    type: "text",
    label: "",
    name: "",
    required: false,
    placeholder: "",
    options: [] as FieldOption[],
    multipleChoice: false, // Para checkboxes
    condition: null as any
  })
  
  const [newOption, setNewOption] = useState("")
  const [showFieldPreview, setShowFieldPreview] = useState(true)

  useEffect(() => {
    checkAuthAndFetchForms()
  }, [])

  const checkAuthAndFetchForms = async () => {
    try {
      const authResponse = await AuthClient.fetchWithAuth('/api/auth', {
        method: 'GET'
      })
      
      if (!authResponse.ok) {
        setIsAuthenticated(false)
        setError("Erro ao verificar autenticação")
        setIsLoading(false)
        return
      }

      const authData = await authResponse.json()
      
      if (!authData.user) {
        setIsAuthenticated(false)
        setError("Você precisa fazer login para acessar esta página")
        setIsLoading(false)
        return
      }

      if (authData.user.role !== 'admin') {
        setIsAuthenticated(false)
        setError(`Apenas administradores podem acessar esta página. Seu perfil: ${authData.user.role}`)
        setIsLoading(false)
        return
      }

      setCurrentUser(authData.user)
      setIsAuthenticated(true)
      
      const formsResponse = await AuthClient.fetchWithAuth('/api/forms', {
        method: 'GET'
      })
      
      if (!formsResponse.ok) {
        if (formsResponse.status === 401) {
          setIsAuthenticated(false)
          setError("Sessão expirada. Por favor, faça login novamente.")
        } else {
          const errorData = await formsResponse.json()
          setError(errorData.error || "Erro ao carregar formulários")
        }
        setForms([])
      } else {
        const formsData = await formsResponse.json()
        if (Array.isArray(formsData)) {
          setForms(formsData)
        } else {
          setForms([])
        }
      }
    } catch (error) {
      console.error('Error completo:', error)
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
      
      const response = await AuthClient.fetchWithAuth(url, {
        method,
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

  // Adicionar nova opção para campos com múltiplas opções
  const addOption = () => {
    if (!newOption.trim()) return
    
    const option: FieldOption = {
      id: Date.now().toString(),
      value: newOption.trim()
    }
    
    setCurrentField({
      ...currentField,
      options: [...currentField.options, option]
    })
    setNewOption("")
  }

  // Remover opção
  const removeOption = (optionId: string) => {
    setCurrentField({
      ...currentField,
      options: currentField.options.filter(o => o.id !== optionId)
    })
  }

  // Mover opção para cima
  const moveOptionUp = (index: number) => {
    if (index === 0) return
    const newOptions = [...currentField.options]
    const temp = newOptions[index]
    newOptions[index] = newOptions[index - 1]
    newOptions[index - 1] = temp
    setCurrentField({ ...currentField, options: newOptions })
  }

  // Mover opção para baixo
  const moveOptionDown = (index: number) => {
    if (index === currentField.options.length - 1) return
    const newOptions = [...currentField.options]
    const temp = newOptions[index]
    newOptions[index] = newOptions[index + 1]
    newOptions[index + 1] = temp
    setCurrentField({ ...currentField, options: newOptions })
  }

  // Adicionar campo ao formulário
  const addField = () => {
    const field = {
      id: Date.now().toString(),
      type: currentField.type,
      label: currentField.label,
      name: currentField.name || currentField.label.toLowerCase().replace(/\s+/g, '_'),
      required: currentField.required,
      placeholder: currentField.placeholder,
      options: currentField.type === 'select' || currentField.type === 'radio' || currentField.type === 'checkbox'
        ? currentField.options.map(o => o.value)
        : undefined,
      multipleChoice: currentField.type === 'checkbox' ? currentField.multipleChoice : undefined,
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
      options: [],
      multipleChoice: false,
      condition: null
    })
    setNewOption("")
  }

  const removeField = (fieldId: string) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter(f => f.id !== fieldId)
    })
  }

  const exportSubmissions = async (formId: string) => {
    try {
      const response = await AuthClient.fetchWithAuth(`/api/forms/${formId}/submissions`)
      
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

  // Renderizar preview do campo
  const renderFieldPreview = () => {
    if (!currentField.label) return <p className="text-gray-400">Configure o campo para ver a preview</p>

    switch (currentField.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
      case 'date':
        return (
          <div className="space-y-2">
            <Label>
              {currentField.label} {currentField.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              type={currentField.type}
              placeholder={currentField.placeholder || `Digite ${currentField.label.toLowerCase()}`}
              disabled
            />
          </div>
        )

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label>
              {currentField.label} {currentField.required && <span className="text-red-500">*</span>}
            </Label>
            <textarea
              className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-gray-50"
              placeholder={currentField.placeholder || `Digite ${currentField.label.toLowerCase()}`}
              disabled
            />
          </div>
        )

      case 'select':
        return (
          <div className="space-y-2">
            <Label>
              {currentField.label} {currentField.required && <span className="text-red-500">*</span>}
            </Label>
            <select className="w-full px-3 py-2 border rounded-md" disabled>
              <option>Selecione...</option>
              {currentField.options.map((option) => (
                <option key={option.id} value={option.value}>{option.value}</option>
              ))}
            </select>
          </div>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            <Label>{currentField.label} {currentField.required && <span className="text-red-500">*</span>}</Label>
            {currentField.options.length === 0 ? (
              <p className="text-sm text-gray-400">Adicione opções para este campo</p>
            ) : (
              <div className="space-y-2">
                {currentField.options.map((option) => (
                  <label key={option.id} className="flex items-center space-x-2">
                    <input type="radio" name="preview" disabled />
                    <span>{option.value}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            <Label>{currentField.label} {currentField.required && <span className="text-red-500">*</span>}</Label>
            {currentField.options.length === 0 ? (
              <label className="flex items-center space-x-2">
                <input type="checkbox" disabled />
                <span>{currentField.label}</span>
              </label>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {currentField.multipleChoice ? "Múltipla seleção permitida" : "Seleção única"}
                </p>
                {currentField.options.map((option) => (
                  <label key={option.id} className="flex items-center space-x-2">
                    <input type="checkbox" disabled />
                    <span>{option.value}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )

      case 'signature':
        return (
          <div className="space-y-2">
            <Label>{currentField.label} {currentField.required && <span className="text-red-500">*</span>}</Label>
            <div className="border-2 border-gray-300 rounded-lg bg-white h-32 flex items-center justify-center text-gray-400">
              Área de Assinatura
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Se estiver carregando
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c] flex items-center justify-center">
        <div className="text-white text-xl">Verificando autenticação...</div>
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
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela de criação/edição de formulário
  if (showBuilder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c] p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="backdrop-blur-md bg-white/95">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingForm ? 'Editar' : 'Criar'} Formulário</CardTitle>
              <span className="text-sm text-gray-600">Logado como: {currentUser?.name}</span>
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

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Configuração do campo */}
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Configurar Campo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Tipo de Campo</Label>
                        <select
                          className="w-full px-3 py-2 border rounded-md"
                          value={currentField.type}
                          onChange={(e) => setCurrentField({...currentField, type: e.target.value, options: []})}
                        >
                          <option value="text">Texto</option>
                          <option value="email">Email</option>
                          <option value="tel">Telefone</option>
                          <option value="number">Número</option>
                          <option value="date">Data</option>
                          <option value="textarea">Texto Longo</option>
                          <option value="select">Lista Suspensa</option>
                          <option value="radio">Seleção Única</option>
                          <option value="checkbox">Múltipla Escolha</option>
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
                    </div>

                    <div>
                      <Label>Nome do Campo (para sistema)</Label>
                      <Input
                        value={currentField.name}
                        onChange={(e) => setCurrentField({...currentField, name: e.target.value})}
                        placeholder="Ex: nome_completo"
                      />
                    </div>

                    {(currentField.type === 'text' || currentField.type === 'email' || 
                      currentField.type === 'tel' || currentField.type === 'number' || 
                      currentField.type === 'textarea') && (
                      <div>
                        <Label>Placeholder</Label>
                        <Input
                          value={currentField.placeholder}
                          onChange={(e) => setCurrentField({...currentField, placeholder: e.target.value})}
                          placeholder="Texto de ajuda no campo"
                        />
                      </div>
                    )}

                    {/* Gerenciamento de opções para campos com múltiplas escolhas */}
                    {(currentField.type === 'select' || currentField.type === 'radio' || currentField.type === 'checkbox') && (
                      <div className="space-y-3">
                        <Label>Opções</Label>
                        
                        {currentField.type === 'checkbox' && (
                          <div className="flex items-center space-x-2 mb-2">
                            <input
                              type="checkbox"
                              checked={currentField.multipleChoice}
                              onChange={(e) => setCurrentField({...currentField, multipleChoice: e.target.checked})}
                            />
                            <span className="text-sm">Permitir múltiplas seleções</span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Input
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            placeholder="Digite uma opção"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                          />
                          <Button
                            type="button"
                            onClick={addOption}
                            size="sm"
                            disabled={!newOption.trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {currentField.options.length > 0 && (
                          <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                            {currentField.options.map((option, index) => (
                              <div key={option.id} className="flex items-center gap-2 bg-white p-2 rounded">
                                <span className="flex-1">{option.value}</span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => moveOptionUp(index)}
                                  disabled={index === 0}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => moveOptionDown(index)}
                                  disabled={index === currentField.options.length - 1}
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeOption(option.id)}
                                >
                                  <X className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
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

                    <Button 
                      onClick={addField} 
                      disabled={!currentField.label}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Campo ao Formulário
                    </Button>
                  </CardContent>
                </Card>

                {/* Preview do campo */}
                <Card className="bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Preview do Campo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white p-4 rounded-lg border">
                      {renderFieldPreview()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Campos adicionados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Campos do Formulário</CardTitle>
                </CardHeader>
                <CardContent>
                  {formData.fields.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nenhum campo adicionado ainda</p>
                  ) : (
                    <div className="space-y-2">
                      {formData.fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-gray-500 font-mono text-sm">{index + 1}</span>
                            <div>
                              <p className="font-medium">{field.label}</p>
                              <p className="text-sm text-gray-500">
                                {field.type}
                                {field.required && " • Obrigatório"}
                                {field.options && ` • ${field.options.length} opções`}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeField(field.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ações */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateForm} 
                  disabled={!formData.title || !formData.slug || formData.fields.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
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
          <div>
            <h1 className="text-2xl font-bold text-white">Gerenciar Formulários</h1>
            <p className="text-white/60 text-sm">Logado como: {currentUser?.name}</p>
          </div>
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
                         <Button
    size="sm"
    variant="outline"
    onClick={() => router.push(`/admin/forms/builder/${form.id}`)}
    className="backdrop-blur-sm bg-white/5 border-white/20 text-white hover:bg-white/10"
  >
    <Palette className="h-4 w-4" />
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
