"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SignaturePad } from "@/components/signature-pad"
import { CheckCircle } from "lucide-react"

interface FieldPosition {
  row: number
  col: number
  width: number
  height?: number
}

interface FormField {
  id: string
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'signature'
  label: string
  name: string
  required?: boolean
  placeholder?: string
  options?: string[]
  multipleChoice?: boolean
  condition?: {
    field: string
    operator: 'equals' | 'not_equals' | 'contains'
    value: string
  }
  position?: FieldPosition
  optionsLayout?: 'vertical' | 'horizontal' | 'grid'
  optionsColumns?: number
}

export default function PublicFormPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [form, setForm] = useState<any>(null)
  const [formStyle, setFormStyle] = useState<any>({}) 
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchForm()
  }, [slug])

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/public/${slug}`)
      if (!response.ok) {
        setError("Formulário não encontrado")
        return
      }
      const data = await response.json()
      setForm(data)
      setFormStyle(data.style || {})
    } catch (err) {
      setError("Erro ao carregar formulário")
    } finally {
      setLoading(false)
    }
  }

  const shouldShowField = (field: FormField): boolean => {
    if (!field.condition) return true
    
    const conditionValue = formData[field.condition.field]
    
    switch (field.condition.operator) {
      case 'equals':
        return conditionValue === field.condition.value
      case 'not_equals':
        return conditionValue !== field.condition.value
      case 'contains':
        return conditionValue?.includes(field.condition.value)
      default:
        return true
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const response = await fetch(`/api/forms/public/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: formData,
          signature: formData.signature || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao enviar formulário')
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Função para determinar classe CSS do layout de opções
  const getOptionsClass = (field: FormField) => {
    if (field.optionsLayout === 'horizontal') {
      return 'flex flex-wrap gap-4'
    } else if (field.optionsLayout === 'grid') {
      const cols = field.optionsColumns || 2
      switch (cols) {
        case 2: return 'grid grid-cols-2 gap-2'
        case 3: return 'grid grid-cols-3 gap-2'
        case 4: return 'grid grid-cols-4 gap-2'
        default: return 'grid grid-cols-2 gap-2'
      }
    }
    return 'space-y-2'
  }

  // Renderizar um campo individual com estilos aplicados corretamente
  const renderField = (field: FormField) => {
    if (!shouldShowField(field)) return null

    // Estilos do campo baseados na personalização
    const fieldStyle: React.CSSProperties = {
      backgroundColor: formStyle.fieldBackgroundColor || '#ffffff',
      borderColor: formStyle.fieldBorderColor || '#d1d5db',
      borderWidth: formStyle.fieldBorderWidth || '1px',
      borderStyle: 'solid',
      borderRadius: formStyle.fieldBorderRadius || '0.375rem',
      color: formStyle.fieldTextColor || '#000000',
      fontSize: formStyle.fieldTextSize || '1rem',
      height: field.type === 'textarea' ? 'auto' : (formStyle.fieldHeight || 'auto'),
      padding: formStyle.fieldPadding || '0.5rem',
    }

    // Estilo para labels
    const labelStyle: React.CSSProperties = {
      color: formStyle.headingColor || '#000000',
      fontSize: formStyle.labelSize || '0.875rem',
      fontWeight: formStyle.labelWeight || '500',
    }

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} style={labelStyle}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              required={field.required}
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
              style={fieldStyle}
              className="w-full"
            />
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} style={labelStyle}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <textarea
              id={field.id}
              className="w-full min-h-[100px]"
              placeholder={field.placeholder}
              required={field.required}
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
              style={fieldStyle}
            />
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} style={labelStyle}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <select
              id={field.id}
              className="w-full"
              required={field.required}
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
              style={fieldStyle}
            >
              <option value="">Selecione...</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <Label style={labelStyle}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <div className={getOptionsClass(field)}>
              {field.options?.map((option) => (
                <label key={option} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={field.name}
                    value={option}
                    required={field.required}
                    checked={formData[field.name] === option}
                    onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                  />
                  <span style={{ color: formStyle.fieldTextColor || '#000000' }}>{option}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'checkbox':
        if (field.options && field.options.length > 0) {
          return (
            <div key={field.id} className="space-y-2">
              <Label style={labelStyle}>
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </Label>
              {field.multipleChoice && (
                <p className="text-sm" style={{ color: formStyle.descriptionColor || '#666666' }}>
                  Selecione uma ou mais opções
                </p>
              )}
              <div className={getOptionsClass(field)}>
                {field.options.map((option: string) => (
                  <label key={option} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={option}
                      checked={Array.isArray(formData[field.name]) 
                        ? formData[field.name].includes(option)
                        : formData[field.name] === option}
                      onChange={(e) => {
                        if (field.multipleChoice) {
                          const currentValues = Array.isArray(formData[field.name]) 
                            ? formData[field.name] 
                            : []
                          
                          if (e.target.checked) {
                            setFormData({
                              ...formData, 
                              [field.name]: [...currentValues, option]
                            })
                          } else {
                            setFormData({
                              ...formData, 
                              [field.name]: currentValues.filter((v: string) => v !== option)
                            })
                          }
                        } else {
                          setFormData({
                            ...formData, 
                            [field.name]: e.target.checked ? option : ''
                          })
                        }
                      }}
                    />
                    <span style={{ color: formStyle.fieldTextColor || '#000000' }}>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          )
        } else {
          return (
            <div key={field.id} className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  required={field.required}
                  checked={formData[field.name] || false}
                  onChange={(e) => setFormData({...formData, [field.name]: e.target.checked})}
                />
                <span style={labelStyle}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </span>
              </label>
            </div>
          )
        }

      case 'signature':
        return (
          <div key={field.id} className="space-y-2">
            <Label style={labelStyle}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            {!formData[field.name] ? (
              <SignaturePad onSave={(sig) => setFormData({...formData, [field.name]: sig})} />
            ) : (
              <div className="space-y-2">
                <img src={formData[field.name]} alt="Assinatura" className="border rounded p-2 bg-white" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({...formData, [field.name]: ""})}
                >
                  Refazer Assinatura
                </Button>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  // Renderizar campos com layouts responsivos e sem sobreposição
  const renderFields = () => {
    if (!form?.fields || form.fields.length === 0) {
      return (
        <p className="text-gray-400 text-center py-8">
          Nenhum campo disponível neste formulário
        </p>
      )
    }

    const layout = formStyle?.layout || 'single'
    
    if (layout === 'two-column') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {form.fields.map((field: FormField) => {
            if (!shouldShowField(field)) return null
            return (
              <div key={field.id}>
                {renderField(field)}
              </div>
            )
          })}
        </div>
      )
    }
    
    // Layout padrão (uma coluna) ou custom sem posicionamento absoluto
    return (
      <div className="space-y-6">
        {form.fields.map((field: FormField) => {
          if (!shouldShowField(field)) return null
          return renderField(field)
        })}
      </div>
    )
  }

  // Estados de carregamento e erro
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c] flex items-center justify-center">
        <div className="text-white">Carregando formulário...</div>
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c] flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Formulário Enviado!</h2>
              <p className="text-gray-600">Obrigado por preencher o formulário.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Verificar se deve mostrar container
  const showContainer = formStyle.showContainer !== false

  // Aplicar estilos de fundo corretamente
  const containerStyle: React.CSSProperties = {
    backgroundColor: formStyle.backgroundColor || '#ffffff',
    backgroundImage: formStyle.backgroundGradient 
      ? formStyle.backgroundGradient 
      : formStyle.backgroundImage 
        ? formStyle.backgroundImage 
        : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    fontFamily: formStyle.fontFamily || 'system-ui',
    minHeight: '100vh',
    padding: showContainer ? (formStyle.containerMargin || '2rem 1rem') : '2rem 1rem',
  }

  // Estilo do card - apenas quando showContainer é true
  const cardStyle: React.CSSProperties = showContainer ? {
    backgroundColor: formStyle.containerBackgroundColor || 'rgba(255, 255, 255, 0.95)',
    padding: formStyle.containerPadding || '1.5rem',
    borderRadius: formStyle.containerBorderRadius || '0.5rem',
    boxShadow: formStyle.containerShadow || '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    opacity: formStyle.containerOpacity || 0.95,
  } : {
    padding: formStyle.containerPadding || '1.5rem',
  }

  const headingStyle: React.CSSProperties = {
    color: formStyle.headingColor || '#111827',
    fontSize: formStyle.headingSize || '2rem',
    textAlign: formStyle.headingAlign as any || 'left',
    fontWeight: 'bold',
  }

  const descriptionStyle: React.CSSProperties = {
    color: formStyle.descriptionColor || '#6b7280',
    fontSize: formStyle.descriptionSize || '1rem',
  }

  const buttonStyle: React.CSSProperties = {
    backgroundColor: formStyle.buttonBackgroundColor || '#3b82f6',
    color: formStyle.buttonTextColor || '#ffffff',
    borderRadius: formStyle.buttonBorderRadius || '0.375rem',
    padding: formStyle.buttonPadding || '0.75rem 1.5rem',
    fontSize: formStyle.buttonFontSize || '1rem',
    fontWeight: '500',
    width: '100%',
    border: 'none',
    cursor: submitting ? 'not-allowed' : 'pointer',
    opacity: submitting ? 0.5 : 1,
  }

  // Renderização principal com estilos aplicados
  return (
    <div style={containerStyle}>
      <div className="max-w-3xl mx-auto">
        {showContainer ? (
          <div style={cardStyle}>
            {/* Header do formulário */}
            <div className="mb-6">
              <h1 style={headingStyle}>{form?.title || 'Formulário'}</h1>
              {form?.description && (
                <p style={descriptionStyle} className="mt-2">
                  {form.description}
                </p>
              )}
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit}>
              {renderFields()}
              
              {/* Mensagem de erro */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mt-6">
                  {error}
                </div>
              )}

              {/* Botão de envio */}
              <button
                type="submit"
                style={buttonStyle}
                disabled={submitting}
                className="mt-6 transition-opacity hover:opacity-90"
              >
                {submitting ? "Enviando..." : "Enviar Formulário"}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Sem container - campos direto no fundo */}
            <div className="mb-6">
              <h1 style={headingStyle}>{form?.title || 'Formulário'}</h1>
              {form?.description && (
                <p style={descriptionStyle} className="mt-2">
                  {form.description}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              {renderFields()}
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mt-6">
                  {error}
                </div>
              )}

              <button
                type="submit"
                style={buttonStyle}
                disabled={submitting}
                className="mt-6 transition-opacity hover:opacity-90"
              >
                {submitting ? "Enviando..." : "Enviar Formulário"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
