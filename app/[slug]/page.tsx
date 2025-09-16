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

  // Renderizar um campo individual com estilos aplicados
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
          <div key={field.id} className="space-y-2 w-full">
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
          <div key={field.id} className="space-y-2 w-full">
            <Label htmlFor={field.id} style={labelStyle}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <textarea
              id={field.id}
              className="w-full min-h-[100px] resize-vertical"
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
          <div key={field.id} className="space-y-2 w-full">
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
          <div key={field.id} className="space-y-2 w-full">
            <Label style={labelStyle}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <div className={getOptionsClass(field)}>
              {field.options?.map((option) => (
                <label key={option} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={field.name}
                    value={option}
                    required={field.required}
                    checked={formData[field.name] === option}
                    onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                    className="cursor-pointer"
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
            <div key={field.id} className="space-y-2 w-full">
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
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
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
                      className="cursor-pointer"
                    />
                    <span style={{ color: formStyle.fieldTextColor || '#000000' }}>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          )
        } else {
          return (
            <div key={field.id} className="space-y-2 w-full">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  required={field.required}
                  checked={formData[field.name] || false}
                  onChange={(e) => setFormData({...formData, [field.name]: e.target.checked})}
                  className="cursor-pointer"
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
          <div key={field.id} className="space-y-2 w-full">
            <Label style={labelStyle}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            {!formData[field.name] ? (
              <div className="w-full">
                <SignaturePad onSave={(sig) => setFormData({...formData, [field.name]: sig})} />
              </div>
            ) : (
              <div className="space-y-2">
                <img 
                  src={formData[field.name]} 
                  alt="Assinatura" 
                  className="border rounded p-2 bg-white max-w-full h-auto"
                  style={{ maxHeight: '200px' }}
                />
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

  // Renderizar campos com CSS Grid nativo para layout customizado
  const renderFields = () => {
    if (!form?.fields || form.fields.length === 0) {
      return (
        <p className="text-gray-400 text-center py-8">
          Nenhum campo disponível neste formulário
        </p>
      )
    }

    const layout = formStyle?.layout || 'single'
    
    // Para layout customizado com CSS Grid nativo
    if (layout === 'custom') {
      // Filtrar apenas campos visíveis
      const visibleFields = form.fields.filter((f: FormField) => shouldShowField(f))
      
      if (visibleFields.length === 0) {
        return null
      }
      
      // Organizar campos por linha para CSS Grid
      const fieldsByRow: { [key: number]: FormField[] } = {}
      let maxRow = 0
      
      visibleFields.forEach((field: FormField) => {
        const row = field.position?.row || 0
        if (!fieldsByRow[row]) {
          fieldsByRow[row] = []
        }
        fieldsByRow[row].push(field)
        maxRow = Math.max(maxRow, row)
      })
      
      // Renderizar usando CSS Grid real
      return (
        <div className="w-full space-y-4">
          {Array.from({ length: maxRow + 1 }, (_, rowIndex) => {
            const rowFields = fieldsByRow[rowIndex] || []
            if (rowFields.length === 0) return null
            
            // Ordenar campos pela coluna
            rowFields.sort((a, b)
