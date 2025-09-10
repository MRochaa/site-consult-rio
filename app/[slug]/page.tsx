"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SignaturePad } from "@/components/signature-pad"
import { CheckCircle } from "lucide-react"

interface FormField {
  id: string
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'signature'
  label: string
  name: string
  required?: boolean
  placeholder?: string
  options?: string[] // Para select, radio, checkbox
  condition?: {
    field: string // ID do campo que controla este
    operator: 'equals' | 'not_equals' | 'contains'
    value: string
  }
}

export default function PublicFormPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [form, setForm] = useState<any>(null)
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
        signature: formData.signature || null // Pega a assinatura do formData
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

  const renderField = (field: FormField) => {
    if (!shouldShowField(field)) return null

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              required={field.required}
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
            />
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <textarea
              id={field.id}
              className="w-full min-h-[100px] px-3 py-2 border rounded-md"
              placeholder={field.placeholder}
              required={field.required}
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
            />
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <select
              id={field.id}
              className="w-full px-3 py-2 border rounded-md"
              required={field.required}
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
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
            <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
            <div className="space-y-2">
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
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                required={field.required}
                checked={formData[field.name] || false}
                onChange={(e) => setFormData({...formData, [field.name]: e.target.checked})}
              />
              <span>{field.label} {field.required && <span className="text-red-500">*</span>}</span>
            </label>
          </div>
        )

      case 'signature':
        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c] py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Card className="backdrop-blur-md bg-white/95">
          <CardHeader>
            <CardTitle>{form?.title}</CardTitle>
            {form?.description && <CardDescription>{form.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {form?.fields?.map((field: FormField) => renderField(field))}
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Enviando..." : "Enviar Formulário"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
