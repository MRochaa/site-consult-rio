"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormStyleEditor } from "@/components/form-style-editor"
import { AuthClient } from "@/lib/auth-client"
import { 
  ArrowLeft, Save, Eye, Monitor, Tablet, Smartphone, 
  Plus, Trash2, ArrowUp, ArrowDown, Settings, Palette,
  FileText, X 
} from "lucide-react"

interface FieldOption {
  id: string
  value: string
}

export default function FormBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.id as string
  
  // Estados do formulário
  const [form, setForm] = useState<any>({
    title: '',
    description: '',
    slug: '',
    fields: [],
    style: {}
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [activeTab, setActiveTab] = useState('fields') // Tab ativa: 'fields' ou 'style'
  
  // Estados para adicionar campos
  const [currentField, setCurrentField] = useState({
    type: "text",
    label: "",
    name: "",
    required: false,
    placeholder: "",
    options: [] as FieldOption[],
    multipleChoice: false,
  })
  const [newOption, setNewOption] = useState("")
  
  useEffect(() => {
    if (formId !== 'new') {
      fetchForm()
    } else {
      setLoading(false)
    }
  }, [formId])

  // Buscar formulário existente
  const fetchForm = async () => {
    try {
      const response = await AuthClient.fetchWithAuth(`/api/forms/${formId}`)
      if (!response.ok) throw new Error('Erro ao carregar formulário')
      
      const data = await response.json()
      setForm({
        title: data.title || '',
        description: data.description || '',
        slug: data.slug || '',
        fields: data.fields || [],
        style: data.style || {}
      })
    } catch (error) {
      console.error(error)
      alert('Erro ao carregar formulário')
      router.push('/admin/forms')
    } finally {
      setLoading(false)
    }
  }

  // Salvar formulário
  const handleSave = async () => {
    if (!form.title || !form.slug) {
      alert('Título e URL são obrigatórios')
      return
    }

    setSaving(true)
    try {
      const method = formId === 'new' ? 'POST' : 'PUT'
      const url = formId === 'new' ? '/api/forms' : `/api/forms/${formId}`
      
      const response = await AuthClient.fetchWithAuth(url, {
        method,
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          slug: form.slug,
          fields: form.fields,
          style: form.style // IMPORTANTE: Enviar o estilo junto
        })
      })
      
      if (!response.ok) throw new Error('Erro ao salvar formulário')
      
      if (formId === 'new') {
        const data = await response.json()
        alert('Formulário criado com sucesso!')
        router.push(`/admin/forms/builder/${data.id}`)
      } else {
        alert('Formulário salvo com sucesso!')
      }
    } catch (error) {
      console.error(error)
      alert('Erro ao salvar formulário')
    } finally {
      setSaving(false)
    }
  }

  // Funções para gerenciar opções de campos
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

  const removeOption = (optionId: string) => {
    setCurrentField({
      ...currentField,
      options: currentField.options.filter(o => o.id !== optionId)
    })
  }

  const moveOptionUp = (index: number) => {
    if (index === 0) return
    const newOptions = [...currentField.options]
    const temp = newOptions[index]
    newOptions[index] = newOptions[index - 1]
    newOptions[index - 1] = temp
    setCurrentField({ ...currentField, options: newOptions })
  }

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
    if (!currentField.label) {
      alert('O campo precisa ter um label')
      return
    }

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
      multipleChoice: currentField.type === 'checkbox' ? currentField.multipleChoice : undefined
    }

    setForm({
      ...form,
      fields: [...form.fields, field]
    })

    // Limpar campo atual
    setCurrentField({
      type: "text",
      label: "",
      name: "",
      required: false,
      placeholder: "",
      options: [],
      multipleChoice: false
    })
    setNewOption("")
  }

  // Remover campo
  const removeField = (fieldId: string) => {
    setForm({
      ...form,
      fields: form.fields.filter((f: any) => f.id !== fieldId)
    })
  }

  // Mover campo para cima
  const moveFieldUp = (index: number) => {
    if (index === 0) return
    const newFields = [...form.fields]
    const temp = newFields[index]
    newFields[index] = newFields[index - 1]
    newFields[index - 1] = temp
    setForm({ ...form, fields: newFields })
  }

  // Mover campo para baixo
  const moveFieldDown = (index: number) => {
    if (index === form.fields.length - 1) return
    const newFields = [...form.fields]
    const temp = newFields[index]
    newFields[index] = newFields[index + 1]
    newFields[index + 1] = temp
    setForm({ ...form, fields: newFields })
  }

  // Obter largura do preview
  const getPreviewWidth = () => {
    switch (previewDevice) {
      case 'mobile': return 'max-w-sm'
      case 'tablet': return 'max-w-2xl'
      default: return 'max-w-full'
    }
  }

  // Renderizar preview do formulário
  const renderPreview = () => {
    const containerStyle: any = {
      backgroundColor: form.style?.backgroundColor || '#ffffff',
      backgroundImage: form.style?.backgroundGradient ? form.style.backgroundGradient : form.style?.backgroundImage || 'none',
      fontFamily: form.style?.fontFamily || 'system-ui',
      padding: form.style?.containerPadding || '1.5rem',
      borderRadius: form.style?.containerBorderRadius || '0.5rem',
      boxShadow: form.style?.containerShadow || 'none',
    }

    const headingStyle: any = {
      color: form.style?.headingColor || '#111827',
      fontSize: form.style?.headingSize || '2rem',
      textAlign: form.style?.headingAlign || 'left',
    }

    const descriptionStyle: any = {
      color: form.style?.descriptionColor || '#6b7280',
      fontSize: form.style?.descriptionSize || '1rem',
    }

    const buttonStyle: any = {
      backgroundColor: form.style?.buttonBackgroundColor || '#3b82f6',
      color: form.style?.buttonTextColor || '#ffffff',
      borderRadius: form.style?.buttonBorderRadius || '0.375rem',
      padding: form.style?.buttonPadding || '0.5rem 1rem',
      fontSize: form.style?.buttonFontSize || '1rem',
    }

    const fieldStyle: any = {
      backgroundColor: form.style?.fieldBackgroundColor || '#ffffff',
      borderColor: form.style?.fieldBorderColor || '#d1d5db',
      borderWidth: form.style?.fieldBorderWidth || '1px',
      borderRadius: form.style?.fieldBorderRadius || '0.375rem',
      borderStyle: 'solid',
      color: form.style?.fieldTextColor || '#111827',
      fontSize: form.style?.fieldTextSize || '1rem',
      padding: form.style?.fieldPadding || '0.5rem 1rem',
    }

    return (
      <div style={containerStyle} className={`${getPreviewWidth()} mx-auto transition-all`}>
        <h1 style={headingStyle} className="font-bold mb-2">
          {form.title || 'Título do Formulário'}
        </h1>
        {form.description && (
          <p style={descriptionStyle} className="mb-6">
            {form.description}
          </p>
        )}
        
        <div className="space-y-4">
          {/* Preview dos campos reais */}
          {form.fields.length > 0 ? (
            form.fields.map((field: any) => (
              <div key={field.id}>
                <label className="block mb-1" style={{ color: form.style?.headingColor }}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    placeholder={field.placeholder}
                    style={fieldStyle}
                    className="w-full min-h-[100px]"
                    disabled
                  />
                ) : field.type === 'select' ? (
                  <select style={fieldStyle} className="w-full" disabled>
                    <option>Selecione...</option>
                    {field.options?.map((opt: string) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'radio' || field.type === 'checkbox' ? (
                  <div className="space-y-2">
                    {field.options?.map((opt: string) => (
                      <label key={opt} className="flex items-center space-x-2">
                        <input type={field.type} disabled />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    style={fieldStyle}
                    className="w-full"
                    disabled
                  />
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-8">
              Adicione campos na aba "Campos" para visualizar aqui
            </p>
          )}
          
          <button style={buttonStyle} className="w-full font-medium">
            Enviar Formulário
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/forms')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-xl font-bold">
                {formId === 'new' ? 'Criar Formulário' : 'Editar Formulário'}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/${form.slug}`, '_blank')}
                disabled={!form.slug}
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.title || !form.slug}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Painel de Edição */}
          <div className="space-y-4">
            {/* Informações básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Formulário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                    placeholder="Ex: Formulário de Contato"
                  />
                </div>
                <div>
                  <Label>URL (slug)</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    placeholder="ex: formulario-contato"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    placeholder="Descrição opcional"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tabs para Campos e Estilos */}
            <Card>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full rounded-t-lg rounded-b-none">
                    <TabsTrigger value="fields" className="flex-1">
                      <Settings className="h-4 w-4 mr-2" />
                      Campos
                    </TabsTrigger>
                    <TabsTrigger value="style" className="flex-1">
                      <Palette className="h-4 w-4 mr-2" />
                      Personalização
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab de Campos */}
                  <TabsContent value="fields" className="p-6 space-y-4">
                    {/* Adicionar novo campo */}
                    <div className="space-y-4 border-b pb-4">
                      <h3 className="font-semibold">Adicionar Campo</h3>
                      
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

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label>Nome do Campo (sistema)</Label>
                          <Input
                            value={currentField.name}
                            onChange={(e) => setCurrentField({...currentField, name: e.target.value})}
                            placeholder="Ex: nome_completo"
                          />
                        </div>
                        <div>
                          <Label>Placeholder</Label>
                          <Input
                            value={currentField.placeholder}
                            onChange={(e) => setCurrentField({...currentField, placeholder: e.target.value})}
                            placeholder="Texto de ajuda"
                            disabled={currentField.type === 'select' || currentField.type === 'radio' || currentField.type === 'checkbox'}
                          />
                        </div>
                      </div>

                      {/* Opções para select, radio, checkbox */}
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
                            <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
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
                    </div>

                    {/* Lista de campos adicionados */}
                    <div className="space-y-2">
                      <h3 className="font-semibold">Campos do Formulário</h3>
                      {form.fields.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">Nenhum campo adicionado</p>
                      ) : (
                        <div className="space-y-2">
                          {form.fields.map((field: any, index: number) => (
                            <div
                              key={field.id}
                              className="flex items-center justify-between p-3 border rounded-lg bg-white"
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
                              <div className="flex items-center space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => moveFieldUp(index)}
                                  disabled={index === 0}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => moveFieldDown(index)}
                                  disabled={index === form.fields.length - 1}
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeField(field.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab de Personalização */}
                  <TabsContent value="style" className="p-6">
                    <FormStyleEditor
                      style={form.style}
                      onChange={(newStyle) => setForm({...form, style: newStyle})}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Preview</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                      onClick={() => setPreviewDevice('desktop')}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                      onClick={() => setPreviewDevice('tablet')}
                    >
                      <Tablet className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                      onClick={() => setPreviewDevice('mobile')}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-gray-100 min-h-[500px] overflow-auto">
                  {renderPreview()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
