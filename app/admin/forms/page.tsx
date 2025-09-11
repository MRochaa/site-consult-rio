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
            {/* IMPORTANTE: Botão para criar novo formulário agora redireciona para o builder */}
            <Button 
              onClick={() => router.push('/admin/forms/builder/new')}
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
              {/* IMPORTANTE: Este botão também redireciona para o builder */}
              <Button 
                onClick={() => router.push('/admin/forms/builder/new')}
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
                    <span className="truncate">{form.title}</span>
                    <FileText className="h-5 w-5 text-white/40 flex-shrink-0" />
                  </CardTitle>
                  <CardDescription className="text-white/70">/{form.slug}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-white/60">
                      {form.fields?.length || 0} campos
                      {form.style && " • Personalizado"}
                    </p>
                    
                    {/* Botões de ação organizados em duas linhas */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Linha 1: Ações de visualização */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/${form.slug}`, '_blank')}
                        className="backdrop-blur-sm bg-white/5 border-white/20 text-white hover:bg-white/10"
                        title="Visualizar formulário"
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
                        title="Copiar link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportSubmissions(form.id)}
                        className="backdrop-blur-sm bg-white/5 border-white/20 text-white hover:bg-white/10"
                        title="Exportar submissões"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      {/* Linha 2: Ações de edição */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/forms/builder/${form.id}`)}
                        className="backdrop-blur-sm bg-white/5 border-white/20 text-white hover:bg-white/10"
                        title="Editar campos e estrutura"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/forms/builder/${form.id}?tab=style`)}
                        className="backdrop-blur-sm bg-white/5 border-white/20 text-white hover:bg-white/10"
                        title="Personalizar visual"
                      >
                        <Palette className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteForm(form.id)}
                        className="backdrop-blur-sm bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30"
                        title="Excluir formulário"
                      >
                        <Trash2 className="h-4 w-4" />
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
