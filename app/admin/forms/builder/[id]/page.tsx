"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormStyleEditor } from "@/components/form-style-editor"
import { AuthClient } from "@/lib/auth-client"
import { ArrowLeft, Save, Eye, Monitor, Tablet, Smartphone } from "lucide-react"

export default function FormBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.id as string
  
  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [formStyle, setFormStyle] = useState<any>({})
  
  useEffect(() => {
    if (formId !== 'new') {
      fetchForm()
    } else {
      setForm({
        title: '',
        description: '',
        slug: '',
        fields: [],
        style: {}
      })
      setLoading(false)
    }
  }, [formId])

  const fetchForm = async () => {
    try {
      const response = await AuthClient.fetchWithAuth(`/api/forms/${formId}`)
      if (!response.ok) throw new Error('Erro ao carregar formulário')
      
      const data = await response.json()
      setForm(data)
      setFormStyle(data.style || {})
    } catch (error) {
      console.error(error)
      alert('Erro ao carregar formulário')
      router.push('/admin/forms')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const method = formId === 'new' ? 'POST' : 'PUT'
      const url = formId === 'new' ? '/api/forms' : `/api/forms/${formId}`
      
      const response = await AuthClient.fetchWithAuth(url, {
        method,
        body: JSON.stringify({
          ...form,
          style: formStyle
        })
      })
      
      if (!response.ok) throw new Error('Erro ao salvar formulário')
      
      if (formId === 'new') {
        const data = await response.json()
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

  const getPreviewWidth = () => {
    switch (previewDevice) {
      case 'mobile': return 'max-w-sm'
      case 'tablet': return 'max-w-2xl'
      default: return 'max-w-full'
    }
  }

  const renderPreview = () => {
    const containerStyle: any = {
      backgroundColor: formStyle.backgroundColor || '#ffffff',
      backgroundImage: formStyle.backgroundGradient ? formStyle.backgroundGradient : formStyle.backgroundImage || 'none',
      fontFamily: formStyle.fontFamily || 'system-ui',
      padding: formStyle.containerPadding || '1.5rem',
      borderRadius: formStyle.containerBorderRadius || '0.5rem',
      boxShadow: formStyle.containerShadow || 'none',
    }

    const headingStyle: any = {
      color: formStyle.headingColor || '#111827',
      fontSize: formStyle.headingSize || '2rem',
      textAlign: formStyle.headingAlign || 'left',
    }

    const descriptionStyle: any = {
      color: formStyle.descriptionColor || '#6b7280',
      fontSize: formStyle.descriptionSize || '1rem',
    }

    const buttonStyle: any = {
      backgroundColor: formStyle.buttonBackgroundColor || '#3b82f6',
      color: formStyle.buttonTextColor || '#ffffff',
      borderRadius: formStyle.buttonBorderRadius || '0.375rem',
      padding: formStyle.buttonPadding || '0.5rem 1rem',
      fontSize: formStyle.buttonFontSize || '1rem',
    }

    const fieldStyle: any = {
      backgroundColor: formStyle.fieldBackgroundColor || '#ffffff',
      borderColor: formStyle.fieldBorderColor || '#d1d5db',
      borderWidth: formStyle.fieldBorderWidth || '1px',
      borderRadius: formStyle.fieldBorderRadius || '0.375rem',
      color: formStyle.fieldTextColor || '#111827',
      fontSize: formStyle.fieldTextSize || '1rem',
      height: formStyle.fieldHeight || 'auto',
      padding: formStyle.fieldPadding || '0.5rem 1rem',
    }

    return (
      <div style={containerStyle} className={`${getPreviewWidth()} mx-auto transition-all`}>
        <h1 style={headingStyle} className="font-bold mb-2">
          {form?.title || 'Título do Formulário'}
        </h1>
        {form?.description && (
          <p style={descriptionStyle} className="mb-6">
            {form.description}
          </p>
        )}
        
        <div className="space-y-4" style={{ gap: formStyle.fieldSpacing }}>
          {/* Preview de campos exemplo */}
          <div>
            <label className="block mb-1" style={{ color: formStyle.headingColor }}>
              Nome Completo
            </label>
            <input
              type="text"
              placeholder="Digite seu nome"
              style={fieldStyle}
              className="w-full border"
              disabled
            />
          </div>
          
          <div>
            <label className="block mb-1" style={{ color: formStyle.headingColor }}>
              Email
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              style={fieldStyle}
              className="w-full border"
              disabled
            />
          </div>
          
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
                onClick={() => window.open(`/${form?.slug}`, '_blank')}
                disabled={!form?.slug}
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form?.title || !form?.slug}
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
          {/* Editor de Estilos */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Formulário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={form?.title || ''}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                    placeholder="Ex: Formulário de Contato"
                  />
                </div>
                <div>
                  <Label>URL (slug)</Label>
                  <Input
                    value={form?.slug || ''}
                    onChange={(e) => setForm({...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    placeholder="ex: formulario-contato"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={form?.description || ''}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    placeholder="Descrição opcional"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personalização Visual</CardTitle>
              </CardHeader>
              <CardContent>
                <FormStyleEditor
                  style={formStyle}
                  onChange={setFormStyle}
                />
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
                <div className="border rounded-lg p-4 bg-gray-100 min-h-[500px]">
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
