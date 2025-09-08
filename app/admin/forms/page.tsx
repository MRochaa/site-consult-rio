"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Edit, Eye, Copy, FileText, Download } from "lucide-react"
import { useRouter } from "next/navigation"

export default function FormsAdminPage() {
  const router = useRouter()
  const [forms, setForms] = useState<any[]>([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingForm, setEditingForm] = useState<any>(null)
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
    fetchForms()
  }, [])

  const fetchForms = async () => {
    try {
      const response = await fetch('/api/forms')
      const data = await response.json()
      setForms(data)
    } catch (error) {
      console.error('Error fetching forms:', error)
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

      if (!response.ok) throw new Error('Erro ao salvar formulário')

      setShowBuilder(false)
      setEditingForm(null)
      setFormData({ title: "", description: "", slug: "", fields: [] })
      fetchForms()
    } catch (error) {
      alert('Erro ao salvar formulário')
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
    } catch (error) {
      alert("Erro ao exportar submissões")
    }
  }

  if (showBuilder) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Card>
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

                  {/* Condição */}
                  <div className="border-t pt-4">
                    <Label>Exibição Condicional (opcional)</Label>
                    <div className="grid gap-2 md:grid-cols-3 mt-2">
                      <select
                        className="px-3 py-2 border rounded-md"
                        onChange={(e) => {
                          const fieldId = e.target.value
                          setCurrentField({
                            ...currentField,
                            condition: fieldId ? { field: fieldId, operator: 'equals', value: '' } : null
                          })
                        }}
                      >
                        <option value="">Sem condição</option>
                        {formData.fields.map(f => (
                          <option key={f.id} value={f.name}>{f.label}</option>
                        ))}
                      </select>
                      
                      {currentField.condition && (
                        <>
                          <select
                            className="px-3 py-2 border rounded-md"
                            value={currentField.condition.operator}
                            onChange={(e) => setCurrentField({
                              ...currentField,
                              condition: {...currentField.condition, operator: e.target.value}
                            })}
                          >
                            <option value="equals">Igual a</option>
                            <option value="not_equals">Diferente de</option>
                            <option value="contains">Contém</option>
                          </select>
                          <Input
                            placeholder="Valor"
                            value={currentField.condition.value}
                            onChange={(e) => setCurrentField({
                              ...currentField,
                              condition: {...currentField.condition, value: e.target.value}
                            })}
                          />
                        </>
                      )}
                    </div>
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
                        {field.condition && (
                          <span className="text-sm text-blue-500 ml-2">[Condicional]</span>
                        )}
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gerenciar Formulários</h1>
          <Button onClick={() => setShowBuilder(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Formulário
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card key={form.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{form.title}</span>
                  <FileText className="h-5 w-5 text-gray-400" />
                </CardTitle>
                <CardDescription>/{form.slug}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {form.fields?.length || 0} campos
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/${form.slug}`, '_blank')}
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
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportSubmissions(form.id)}
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
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
