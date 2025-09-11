"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Eye, Copy, FileText, Download, ArrowLeft, Palette, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { AuthClient } from "@/lib/auth-client"

export default function FormsAdminPage() {
  const router = useRouter()
  const [forms, setForms] = useState<any[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    checkAuthAndFetchForms()
  }, [])

  const checkAuthAndFetchForms = async () => {
    try {
      // Verificar autenticação
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
      
      // Buscar formulários
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

  // Função para exportar submissões
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

  // Função para deletar formulário
  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Tem certeza que deseja excluir este formulário? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await AuthClient.fetchWithAuth(`/api/forms/${formId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir formulário')
      }

      // Recarregar lista de formulários
      checkAuthAndFetchForms()
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir formulário')
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
      <div
