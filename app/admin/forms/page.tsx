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
      <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c] flex items
