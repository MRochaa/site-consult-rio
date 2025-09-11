"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormStyleEditor } from "@/components/form-style-editor"
import { FormLayoutEditor } from "@/components/form-layout-editor"
import { AuthClient } from "@/lib/auth-client"
import { 
  ArrowLeft, Save, Eye, Monitor, Tablet, Smartphone, 
  Plus, Trash2, ArrowUp, ArrowDown, Settings, Palette,
  FileText, X, Edit2, Check, Layout
} from "lucide-react"

interface FieldOption {
  id: string
  value: string
  isEditing?: boolean // Para controlar edição inline
}

interface FieldPosition {
  row: number
  col: number
  width: number // 1-12 (sistema de grid de 12 colunas)
  height?: number // altura em linhas do grid
}

interface FormField {
  id: string
  type: string
  label: string
  name: string
  required?: boolean
  placeholder?: string
  options?: string[]
  multipleChoice?: boolean
  position?: FieldPosition
  optionsLayout?: 'vertical' | 'horizontal' | 'grid'
  optionsColumns?: number
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
    style: {},
    layout: 'single' // Adicionar controle de layout
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [activeTab, setActiveTab] = useState('fields') // Tab ativa: 'fields', 'layout' ou 'style'
  
  // Estados para adicionar campos
  const [currentField, setCurrentField] = useState({
    type: "text",
    label: "",
    name: "",
    required: false,
    placeholder: "",
    options: [] as FieldOption[],
    multipleChoice: false,
    optionsLayout: 'vertical' as 'vertical' | 'horizontal' | 'grid',
    optionsColumns: 2,
  })
  const [newOption, setNewOption] = useState("")
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null) // Para editar campo existente
  
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
        style: data.style || {},
        layout: data.style?.layout || 'single'
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
          style: { ...form.style, layout: form.layout } // Incluir layout no style
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
      value: newOption.trim(),
      isEditing: false
    }
    
    setCurrentField({
      ...currentField,
      options: [...currentField.options, option]
    })
    setNewOption("")
  }

  // Função para editar uma opção existente
  const startEditOption = (optionId: string) => {
    setCurrentField({
      ...currentField,
      options: currentField.options.map(o => ({
        ...o,
        isEditing: o.id === optionId
      }))
    })
  }

  // Função para salvar edição de opção
  const saveOptionEdit = (optionId: string, newValue: string) => {
    setCurrentField({
      ...currentField,
      options: currentField.options.map(o => 
        o.id === optionId 
          ? { ...o, value: newValue, isEditing: false }
          : o
      )
    })
  }

  // Função para cancelar edição de opção
  const cancelOptionEdit = (optionId: string) => {
    setCurrentField({
      ...currentField,
      options: currentField.options.map(o => ({
        ...o,
        isEditing: false
      }))
    })
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

  // Adicionar ou atualizar campo
  const addOrUpdateField = () => {
    if (!currentField.label) {
      alert('O campo precisa ter um label')
      return
    }

    const field: FormField = {
      id: editingFieldId || Date.now().toString(),
      type: currentField.type,
      label: currentField.label,
      name: currentField.name || currentField.label.toLowerCase().replace(/\s+/g, '_'),
      required: currentField.required,
      placeholder: currentField.placeholder,
      options: currentField.type === 'select' || currentField.type === 'radio' || currentField.type === 'checkbox'
        ? currentField.options.map(o => o.value)
        : undefined,
      multipleChoice: currentField.type === 'checkbox' ? currentField.multipleChoice : undefined,
      optionsLayout: ['select', 'radio', 'checkbox'].includes(currentField.type) 
        ? currentField.optionsLayout 
        : undefined,
      optionsColumns: currentField.optionsLayout === 'grid' ? currentField.optionsColumns : undefined
    }

    if (editingFieldId) {
      // Atualizar campo existente
      setForm({
        ...form,
        fields: form.fields.map((f: FormField) => 
          f.id === editingFieldId ? { ...f, ...field } : f
        )
      })
      setEditingFieldId(null)
    } else {
      // Adicionar novo campo
      // Calcular posição baseada no layout
      let position: FieldPosition
      const fieldCount = form.fields.length
      
      if (form.layout === 'single') {
        position = { row: fieldCount, col: 0, width: 12 }
      } else if (form.layout === 'two-column') {
        position = {
          row: Math.floor(fieldCount / 2),
          col: (fieldCount % 2) * 6,
          width: 6
        }
      } else {
        // Layout personalizado - adicionar no final
        position = { row: fieldCount, col: 0, width: 12 }
      }
      
      setForm({
        ...form,
        fields: [...form.fields, { ...field, position }]
      })
    }

    // Limpar campo atual
    setCurrentField({
      type: "text",
      label: "",
      name: "",
      required: false,
      placeholder: "",
      options: [],
      multipleChoice: false,
      optionsLayout: 'vertical',
      optionsColumns: 2
    })
    setNewOption("")
  }
// Função para iniciar edição de um campo existente
  const startEditField = (field: FormField) => {
    setEditingFieldId(field.id)
    setCurrentField({
      type: field.type,
      label: field.label,
      name: field.name || '',
      required: field.required || false,
      placeholder: field.placeholder || '',
      options: field.options?.map((opt, index) => ({
        id: `opt-${index}`,
        value: opt,
        isEditing: false
      })) || [],
      multipleChoice: field.multipleChoice || false,
      optionsLayout: field.optionsLayout || 'vertical',
      optionsColumns: field.optionsColumns || 2
    })
    setActiveTab('fields') // Mudar para aba de campos
  }

  // Cancelar edição
  const cancelEdit = () => {
    setEditingFieldId(null)
    setCurrentField({
      type: "text",
      label: "",
      name: "",
      required: false,
      placeholder: "",
      options: [],
      multipleChoice: false,
      optionsLayout: 'vertical',
      optionsColumns: 2
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

  // Função para atualizar um campo específico
  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setForm({
      ...form,
      fields: form.fields.map((f: FormField) => 
        f.id === fieldId ? { ...f, ...updates } : f
      )
    })
  }

  // Função para reordenar campos
  const reorderFields = (newFields: FormField[]) => {
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

  // Renderizar preview do formulário com suporte aos layouts
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

    // Renderizar campos com base no layout
    const renderFields = () => {
      if (form.fields.length === 0) {
        return (
          <p className="text-gray-400 text-center py-8">
            Adicione campos na aba "Campos" para visualizar aqui
          </p>
        )
      }

      // Para layout personalizado, usar posições absolutas
      if (form.layout === 'custom') {
        return (
          <div className="relative min-h-[300px]">
            {form.fields.map((field: FormField) => {
              const position = field.position || { row: 0, col: 0, width: 12 }
              return (
                <div
                  key={field.id}
                  className="absolute"
                  style={{
                    top: `${position.row * 80}px`,
                    left: `${(position.col / 12) * 100}%`,
                    width: `${(position.width / 12) * 100}%`,
                    paddingRight: '8px'
                  }}
                >
                  {renderFieldPreview(field, fieldStyle)}
                </div>
              )
            })}
          </div>
        )
      }

      // Para layouts de grade (single/two-column)
      const gridClass = form.layout === 'two-column' ? 'grid grid-cols-2 gap-4' : 'space-y-4'
      
      return (
        <div className={gridClass}>
          {form.fields.map((field: FormField) => (
            <div key={field.id}>
              {renderFieldPreview(field, fieldStyle)}
            </div>
          ))}
        </div>
      )
    }

    // Função auxiliar para renderizar preview de campo individual
    const renderFieldPreview = (field: FormField, fieldStyle: any) => {
      const optionsClass = field.optionsLayout === 'horizontal' 
        ? 'flex flex-wrap gap-4' 
        : field.optionsLayout === 'grid'
        ? `grid grid-cols-${field.optionsColumns || 2} gap-2`
        : 'space-y-2'

      return (
        <div>
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
            <div className={optionsClass}>
              {field.options?.map((opt: string) => (
                <label key={opt} className="flex items-center space-x-2">
                  <input type={field.type} disabled />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          ) : field.type === 'signature' ? (
            <div style={fieldStyle} className="w-full h-32 flex items-center justify-center text-gray-400">
              Área de Assinatura
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
      )
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
        
        {renderFields()}
        
        <button style={buttonStyle} className="w-full font-medium mt-6">
          Enviar Formulário
        </button>
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

            {/* Tabs para Campos, Layout e Estilos */}
            <Card>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full rounded-t-lg rounded-b-none">
                    <TabsTrigger value="fields" className="flex-1">
                      <Settings className="h-4 w-4 mr-2" />
                      Campos
                    </TabsTrigger>
                    <TabsTrigger value="layout" className="flex-1">
                      <Layout className="h-4 w-4 mr-2" />
                      Layout
                    </TabsTrigger>
                    <TabsTrigger value="style" className="flex-1">
                      <Palette className="h-4 w-4 mr-2" />
                      Estilo
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab de Campos */}
                  <TabsContent value="fields" className="p-6 space-y-4">
                    {/* Adicionar ou editar campo */}
                    <div className="space-y-4 border-b pb-4">
                      <h3 className="font-semibold">
                        {editingFieldId ? 'Editar Campo' : 'Adicionar Campo'}
                      </h3>
                      
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

                          {/* Layout das opções */}
                          <div className="flex gap-2">
                            <select
                              className="px-3 py-2 border rounded-md text-sm"
                              value={currentField.optionsLayout}
                              onChange={(e) => setCurrentField({
                                ...currentField, 
                                optionsLayout: e.target.value as 'vertical' | 'horizontal' | 'grid'
                              })}
                            >
                              <option value="vertical">Layout Vertical</option>
                              <option value="horizontal">Layout Horizontal</option>
                              <option value="grid">Layout Grid</option>
                            </select>
                            
                            {currentField.optionsLayout === 'grid' && (
                              <Input
                                type="number"
                                min="2"
                                max="4"
                                value={currentField.optionsColumns}
                                onChange={(e) => setCurrentField({
                                  ...currentField,
                                  optionsColumns: parseInt(e.target.value) || 2
                                })}
                                placeholder="Colunas"
                                className="w-24"
                              />
                            )}
                          </div>

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
                            <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                              {currentField.options.map((option, index) => (
                                <div key={option.id} className="flex items-center gap-2 bg-white p-2 rounded">
                                  {option.isEditing ? (
                                    <>
                                      <Input
                                        defaultValue={option.value}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault()
                                            saveOptionEdit(option.id, (e.target as HTMLInputElement).value)
                                          }
                                        }}
                                        className="flex-1 h-8"
                                        autoFocus
                                      />
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          const input = e.currentTarget.parentElement?.querySelector('input')
                                          if (input) saveOptionEdit(option.id, input.value)
                                        }}
                                      >
                                        <Check className="h-3 w-3 text-green-600" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => cancelOptionEdit(option.id)}
                                      >
                                        <X className="h-3 w-3 text-red-500" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="flex-1">{option.value}</span>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => startEditOption(option.id)}
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
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
                                    </>
                                  )}
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

                      <div className="flex gap-2">
                        <Button 
                          onClick={addOrUpdateField} 
                          disabled={!currentField.label}
                          className="flex-1"
                        >
                          {editingFieldId ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Atualizar Campo
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Campo ao Formulário
                            </>
                          )}
                        </Button>
                        {editingFieldId && (
                          <Button
                            onClick={cancelEdit}
                            variant="outline"
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
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
                                    {field.optionsLayout && field.optionsLayout !== 'vertical' && ` • ${field.optionsLayout}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditField(field)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
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

                  {/* Tab de Layout */}
                  <TabsContent value="layout" className="p-6">
                    <FormLayoutEditor
                      fields={form.fields}
                      layout={form.layout}
                      onUpdateField={updateField}
                      onUpdateLayout={(layout) => setForm({...form, layout})}
                      onReorderFields={reorderFields}
                    />
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
