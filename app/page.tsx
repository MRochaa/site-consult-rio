"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, LogOut, Link, Users, FileText, Database, Download, Upload, AlertTriangle, LogIn } from "lucide-react"
import Image from "next/image"
import { FileCheck, ClipboardList, ExternalLink } from "lucide-react"
import { Label } from "@/components/ui/label"

interface User {
  id: string
  username: string
  role: "admin" | "user"
  name: string
}

interface LinkItem {
  id: string
  name: string
  subtitle: string
  url: string
  is_public: boolean
  icon: string
}

export default function DentalOfficeSystem() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [links, setLinks] = useState<LinkItem[]>([])
  const [loginForm, setLoginForm] = useState({ username: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentView, setCurrentView] = useState<"home" | "admin" | "users" | "links" | "settings" | "login">("home")
  const [siteTitle] = useState("Consultório Dr. Marcos Rocha")
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null)
  const [linkForm, setLinkForm] = useState({
    name: "",
    subtitle: "",
    url: "",
    isPublic: true,
    icon: "FileText",
  })
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    name: "",
    role: "user" as "admin" | "user",
    confirmPassword: "",
  })

  // Carregar dados iniciais
  useEffect(() => {
    checkAuth()
    fetchLinks()
  }, [])

  // Carregar usuários quando logado como admin
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers()
    }
  }, [currentUser])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth')
      const data = await response.json()
      if (data.user) {
        setCurrentUser(data.user)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    } finally {
      setIsInitialized(true)
    }
  }

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/links')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setLinks(data)
    } catch (error) {
      console.error('Error fetching links:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })

      const data = await response.json()
      
      if (!response.ok) {
        setLoginError(data.error || 'Erro ao fazer login')
        return
      }

      setCurrentUser(data.user)
      setLoginForm({ username: "", password: "" })
      setCurrentView("home")
      
      // Recarregar links após login
      fetchLinks()
      
      // Carregar usuários se for admin
      if (data.user.role === 'admin') {
        fetchUsers()
      }
    } catch (error) {
      setLoginError('Erro ao conectar com o servidor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' })
      setCurrentUser(null)
      setUsers([])
      setCurrentView("home")
      // Recarregar apenas links públicos
      fetchLinks()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const exportData = async () => {
    try {
      const response = await fetch('/api/backup')
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error)
      
      const dataStr = JSON.stringify(data, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement("a")
      link.href = url
      link.download = `dental-office-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert("Erro ao exportar dados. Tente novamente.")
    }
  }

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        if (confirm(
          `Importar backup de ${data.exportDate ? new Date(data.exportDate).toLocaleDateString() : "data desconhecida"}? Isso substituirá todos os dados atuais.`
        )) {
          const response = await fetch('/api/backup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })

          const result = await response.json()
          
          if (!response.ok) throw new Error(result.error)

          alert("Backup importado com sucesso!")
          setCurrentView("home")
          
          // Recarregar dados
          fetchLinks()
          if (currentUser?.role === 'admin') {
            fetchUsers()
          }
        }
      } catch (error) {
        alert("Erro ao importar backup: " + (error as Error).message)
      }
    }

    reader.onerror = () => {
      alert("Erro ao ler o arquivo")
    }

    reader.readAsText(file)
    event.target.value = ""
  }

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: linkForm.name,
          subtitle: linkForm.subtitle,
          url: linkForm.url,
          is_public: linkForm.isPublic,
          icon: linkForm.icon
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setLinkForm({ name: "", subtitle: "", url: "", isPublic: true, icon: "FileText" })
      fetchLinks()
    } catch (error) {
      alert("Erro ao adicionar link: " + (error as Error).message)
    }
  }

  const handleEditLink = (link: LinkItem) => {
    setEditingLink(link)
    setLinkForm({
      name: link.name,
      subtitle: link.subtitle,
      url: link.url,
      isPublic: link.is_public,
      icon: link.icon,
    })
  }

  const handleUpdateLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLink) return

    try {
      const response = await fetch('/api/links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingLink.id,
          name: linkForm.name,
          subtitle: linkForm.subtitle,
          url: linkForm.url,
          is_public: linkForm.isPublic,
          icon: linkForm.icon
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setEditingLink(null)
      setLinkForm({ name: "", subtitle: "", url: "", isPublic: true, icon: "FileText" })
      fetchLinks()
    } catch (error) {
      alert("Erro ao atualizar link: " + (error as Error).message)
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    if (confirm("Tem certeza que deseja excluir este link?")) {
      try {
        const response = await fetch(`/api/links?id=${linkId}`, {
          method: 'DELETE'
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error)

        fetchLinks()
      } catch (error) {
        alert("Erro ao excluir link: " + (error as Error).message)
      }
    }
  }

  const cancelEdit = () => {
    setEditingLink(null)
    setLinkForm({ name: "", subtitle: "", url: "", isPublic: true, icon: "FileText" })
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (userForm.password !== userForm.confirmPassword) {
      alert("As senhas não coincidem")
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userForm.username,
          password: userForm.password,
          name: userForm.name,
          role: userForm.role
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setUserForm({ username: "", password: "", confirmPassword: "", role: "user", name: "" })
      setCurrentView("users")
      fetchUsers()
    } catch (error) {
      alert("Erro ao criar usuário: " + (error as Error).message)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (userForm.password && userForm.password !== userForm.confirmPassword) {
      alert("As senhas não coincidem")
      return
    }

    if (editingUser) {
      try {
        const updates: any = {
          id: editingUser.id,
          username: userForm.username,
          name: userForm.name,
          role: userForm.role
        }

        if (userForm.password) {
          updates.password = userForm.password
        }

        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error)

        setEditingUser(null)
        setUserForm({ username: "", password: "", confirmPassword: "", role: "user", name: "" })
        setCurrentView("users")
        fetchUsers()
      } catch (error) {
        alert("Erro ao atualizar usuário: " + (error as Error).message)
      }
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (currentUser && currentUser.id === userId) {
      alert("Você não pode excluir sua própria conta!")
      return
    }

    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      try {
        const response = await fetch(`/api/users?id=${userId}`, {
          method: 'DELETE'
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error)

        fetchUsers()
      } catch (error) {
        alert("Erro ao excluir usuário: " + (error as Error).message)
      }
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserForm({
      username: user.username,
      password: "",
      name: user.name,
      role: user.role,
      confirmPassword: "",
    })
  }

  const cancelUserEdit = () => {
    setEditingUser(null)
    setUserForm({ username: "", password: "", name: "", role: "user", confirmPassword: "" })
  }

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "FileText":
        return <FileText className="h-5 w-5" />
      case "FileCheck":
        return <FileCheck className="h-5 w-5" />
      case "ClipboardList":
        return <ClipboardList className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const publicLinks = links.filter((link) => link.is_public)
  const privateLinks = links.filter((link) => !link.is_public)

  // Loading state
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c] flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  // Tela de Login
  if (currentView === "login" && !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img 
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/imagem_2025-08-29_174713093-msrQ9bJuiSdiyhTAjU8jANzDbENqSc.png" 
                  alt="Logo" 
                  className="h-20 w-auto"
                />
              </div>
              <CardTitle className="text-white text-2xl font-bold">Área Restrita</CardTitle>
              <CardDescription className="text-white/80">Faça login para acessar ferramentas administrativas</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="text-white/90 text-sm font-medium">Usuário</Label>
                  <Input
                    type="text"
                    placeholder="Digite seu usuário"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    required
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-amber-400/50"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label className="text-white/90 text-sm font-medium">Senha</Label>
                  <Input
                    type="password"
                    placeholder="Digite sua senha"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-amber-400/50"
                    disabled={isLoading}
                  />
                </div>
                {loginError && (
                  <div className="backdrop-blur-md bg-red-500/20 border border-red-400/30 rounded-xl p-3">
                    <p className="text-red-200 text-sm text-center">{loginError}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setCurrentView("home")}
                    variant="outline"
                    className="flex-1 backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20"
                    disabled={isLoading}
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold transition-all duration-200 shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Tela de Configurações
  if (currentView === "settings" && currentUser?.role === "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c]">
        <header className="backdrop-blur-md bg-white/10 border-b border-white/20 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <img 
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/imagem_2025-08-29_174713093-msrQ9bJuiSdiyhTAjU8jANzDbENqSc.png" 
                  alt="Logo" 
                  className="h-10 w-auto"
                />
                <h1 className="text-xl font-bold text-white">{siteTitle}</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-blue-200">Olá, {currentUser.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView("home")}
                  className="text-blue-200 hover:bg-white/10"
                >
                  Voltar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout} 
                  className="text-blue-200 hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Configurações do Sistema</h2>
              <p className="text-white/70">Gerencie configurações e dados do sistema</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div
                onClick={() => setCurrentView("links")}
                className="group bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <Link className="h-6 w-6 text-amber-400" />
                  <div>
                    <h3 className="font-semibold text-white">Gerenciar Links</h3>
                    <p className="text-sm text-white/70">Adicionar, editar e remover links</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setCurrentView("users")}
                className="group bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <Users className="h-6 w-6 text-amber-400" />
                  <div>
                    <h3 className="font-semibold text-white">Gerenciar Usuários</h3>
                    <p className="text-sm text-white/70">Adicionar e editar usuários</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Database className="h-5 w-5 mr-2 text-amber-400" />
                Backup e Restauração
              </h3>

              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-100">
                    <p className="font-medium mb-1">✅ Dados seguros no servidor:</p>
                    <ul className="space-y-1 text-green-200/90">
                      <li>• Os dados agora são salvos no banco de dados</li>
                      <li>• Sincronizados entre todos os usuários</li>
                      <li>• Persistentes mesmo ao limpar cache do navegador</li>
                      <li>• Faça backup regularmente para segurança extra</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  onClick={exportData}
                  className="flex items-center justify-center space-x-2 bg-green-600/80 hover:bg-green-600 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Fazer Backup</span>
                </button>

                <label className="flex items-center justify-center space-x-2 bg-blue-600/80 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span>Restaurar Backup</span>
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Estatísticas do Sistema</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">{links.length}</div>
                  <div className="text-sm text-white/70">Links Cadastrados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">{users.length}</div>
                  <div className="text-sm text-white/70">Usuários Ativos</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Tela de Gerenciar Links
  if (currentView === "links" && currentUser?.role === "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c]">
        <header className="backdrop-blur-md bg-white/10 border-b border-white/20 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <img 
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/imagem_2025-08-29_174713093-msrQ9bJuiSdiyhTAjU8jANzDbENqSc.png" 
                  alt="Logo" 
                  className="h-10 w-auto"
                />
                <h1 className="text-xl font-bold text-white">{siteTitle}</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-blue-200">Olá, {currentUser.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView("settings")}
                  className="text-blue-200 hover:bg-white/10"
                >
                  Voltar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout} 
                  className="text-blue-200 hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Gerenciar Links</h2>
            </div>

            <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">{editingLink ? "Editar Link" : "Adicionar Novo Link"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingLink ? handleUpdateLink : handleAddLink} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="linkName" className="text-white">
                        Nome do Link
                      </Label>
                      <Input
                        id="linkName"
                        type="text"
                        value={linkForm.name}
                        onChange={(e) => setLinkForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="backdrop-blur-sm bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-white/40"
                        placeholder="Ex: Ficha de Cadastro"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkSubtitle" className="text-white">
                        Subtítulo
                      </Label>
                      <Input
                        id="linkSubtitle"
                        type="text"
                        value={linkForm.subtitle}
                        onChange={(e) => setLinkForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                        className="backdrop-blur-sm bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-white/40"
                        placeholder="Ex: Anamnese"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="linkUrl" className="text-white">
                      URL
                    </Label>
                    <Input
                      id="linkUrl"
                      type="url"
                      value={linkForm.url}
                      onChange={(e) => setLinkForm((prev) => ({ ...prev, url: e.target.value }))}
                      className="backdrop-blur-sm bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-white/40"
                      placeholder="https://exemplo.com"
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="linkIcon" className="text-white">
                        Ícone
                      </Label>
                      <select
                        id="linkIcon"
                        value={linkForm.icon}
                        onChange={(e) => setLinkForm((prev) => ({ ...prev, icon: e.target.value }))}
                        className="w-full px-3 py-2 backdrop-blur-sm bg-white/10 border border-white/20 rounded-md focus:border-white/40 focus:outline-none text-white"
                      >
                        <option value="FileText" className="bg-[#1b2370] text-white">
                          Documento
                        </option>
                        <option value="FileCheck" className="bg-[#1b2370] text-white">
                          Contrato
                        </option>
                        <option value="ClipboardList" className="bg-[#1b2370] text-white">
                          Prontuário
                        </option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-white">Tipo de Acesso</Label>
                      <div className="flex items-center space-x-4 mt-2">
                        <label className="flex items-center text-white">
                          <input
                            type="radio"
                            name="access"
                            checked={linkForm.isPublic}
                            onChange={() => setLinkForm((prev) => ({ ...prev, isPublic: true }))}
                            className="mr-2"
                          />
                          Público
                        </label>
                        <label className="flex items-center text-white">
                          <input
                            type="radio"
                            name="access"
                            checked={!linkForm.isPublic}
                            onChange={() => setLinkForm((prev) => ({ ...prev, isPublic: false }))}
                            className="mr-2"
                          />
                          Restrito
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20"
                    >
                      {editingLink ? "Atualizar Link" : "Adicionar Link"}
                    </Button>
                    {editingLink && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEdit}
                        className="backdrop-blur-sm bg-white/5 border-white/20 text-white hover:bg-white/10"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white">Links Públicos ({publicLinks.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {publicLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-start justify-between p-3 backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {getIconComponent(link.icon)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white">{link.name}</p>
                          <p className="text-sm text-blue-200">{link.subtitle}</p>
                          <p className="text-xs text-blue-300 truncate">{link.url}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2 flex-shrink-0 ml-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditLink(link)}
                          className="backdrop-blur-sm bg-white/5 border-white/20 text-white hover:bg-white/10"
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteLink(link.id)}
                          className="backdrop-blur-sm bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                  {publicLinks.length === 0 && (
                    <p className="text-blue-200 text-center py-4">Nenhum link público cadastrado</p>
                  )}
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white">Links Restritos ({privateLinks.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {privateLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-start justify-between p-3 backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {getIconComponent(link.icon)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white">{link.name}</p>
                          <p className="text-sm text-blue-200">{link.subtitle}</p>
                          <p className="text-xs text-blue-300 truncate">{link.url}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2 flex-shrink-0 ml-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditLink(link)}
                          className="backdrop-blur-sm bg-white/5 border-white/20 text-white hover:bg-white/10"
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteLink(link.id)}
                          className="backdrop-blur-sm bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                  {privateLinks.length === 0 && (
                    <p className="text-blue-200 text-center py-4">Nenhum link restrito cadastrado</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Tela de Gerenciar Usuários
  if (currentView === "users" && currentUser?.role === "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c]">
        <header className="backdrop-blur-md bg-white/10 border-b border-white/20 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <img 
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/imagem_2025-08-29_174713093-msrQ9bJuiSdiyhTAjU8jANzDbENqSc.png" 
                  alt="Logo" 
                  className="h-10 w-auto"
                />
                <h1 className="text-xl font-bold text-white">{siteTitle}</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-blue-200">Olá, {currentUser.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView("settings")}
                  className="text-blue-200 hover:bg-white/10"
                >
                  Voltar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout} 
                  className="text-blue-200 hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Gerenciar Usuários</h2>
            </div>

            <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">
                  {editingUser ? "Editar Usuário" : "Adicionar Novo Usuário"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="userName" className="text-white">
                        Nome Completo
                      </Label>
                      <Input
                        id="userName"
                        type="text"
                        value={userForm.name}
                        onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="backdrop-blur-sm bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-white/40"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="userUsername" className="text-white">
                        Usuário
                      </Label>
                      <Input
                        id="userUsername"
                        type="text"
                        value={userForm.username}
                        onChange={(e) => setUserForm((prev) => ({ ...prev, username: e.target.value }))}
                        className="backdrop-blur-sm bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-white/40"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="userPassword" className="text-white">
                        Senha {editingUser && "(deixe em branco para manter)"}
                      </Label>
                      <Input
                        id="userPassword"
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                        className="backdrop-blur-sm bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-white/40"
                        required={!editingUser}
                      />
                    </div>
                    <div>
                      <Label htmlFor="userConfirmPassword" className="text-white">
                        Confirmar Senha
                      </Label>
                      <Input
                        id="userConfirmPassword"
                        type="password"
                        value={userForm.confirmPassword}
                        onChange={(e) => setUserForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        className="backdrop-blur-sm bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-white/40"
                        required={!editingUser || userForm.password !== ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="userRole" className="text-white">
                        Cargo
                      </Label>
                      <select
                        id="userRole"
                        value={userForm.role}
                        onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value as "admin" | "user" }))}
                        className="w-full px-3 py-2 backdrop-blur-sm bg-white/10 border border-white/20 rounded-md focus:border-white/40 focus:outline-none text-white"
                      >
                        <option value="user" className="bg-[#1b2370] text-white">
                          Usuário
                        </option>
                        <option value="admin" className="bg-[#1b2370] text-white">
                          Admin
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20"
                    >
                      {editingUser ? "Atualizar Usuário" : "Adicionar Usuário"}
                    </Button>
                    {editingUser && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelUserEdit}
                        className="backdrop-blur-sm bg-white/5 border-white/20 text-white hover:bg-white/10"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">Usuários Cadastrados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-white" />
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-sm text-blue-200">@{user.username}</p>
                        <p className="text-xs text-blue-300 capitalize">{user.role}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUser(user)}
                        className="backdrop-blur-sm bg-white/5 border-white/20 text-white hover:bg-white/10"
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={currentUser.id === user.id}
                        className={
                          currentUser.id === user.id
                            ? "backdrop-blur-sm bg-gray-500/20 border-gray-400/30 text-gray-300 opacity-50 cursor-not-allowed"
                            : "backdrop-blur-sm bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30"
                        }
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && <p className="text-blue-200 text-center py-4">Nenhum usuário cadastrado</p>}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  // Página Principal (sempre acessível)
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c]">
      <header className="backdrop-blur-md bg-white/10 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/imagem_2025-08-29_174713093-msrQ9bJuiSdiyhTAjU8jANzDbENqSc.png" 
                alt="Logo" 
                className="h-10 w-auto"
              />
              <h1 className="text-xl font-bold text-white">{siteTitle}</h1>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <>
                  <span className="text-sm text-blue-200">Olá, {currentUser.name}</span>
                  {currentUser.role === "admin" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentView("settings")}
                      className="text-blue-200 hover:bg-white/10"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout} 
                    className="text-blue-200 hover:bg-white/10"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Sair
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setCurrentView("login")}
                  className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Mensagem de boas-vindas */}
          <div className="backdrop-blur-md bg-white/10 rounded-lg border border-white/20 p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-2">
              {currentUser ? `Bem-vindo, ${currentUser.name}!` : "Bem-vindo ao Sistema Interno"}
            </h2>
            <p className="text-blue-200">
              {currentUser 
                ? `Acesso como: ${currentUser.role === "admin" ? "Administrador" : "Usuário"}`
                : "Acesse os formulários públicos ou faça login para mais recursos"}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Links Públicos (sempre visível) */}
            <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Área Pública
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Formulários disponíveis para pacientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {publicLinks.map((link) => (
                  <Button
                    key={link.id}
                    variant="outline"
                    className="w-full justify-start backdrop-blur-sm bg-white/5 border-white/20 hover:bg-white/10 text-white h-auto py-3"
                    onClick={() => window.open(link.url, "_blank")}
                  >
                    <div className="flex items-center w-full">
                      {getIconComponent(link.icon)}
                      <div className="ml-2 text-left flex-1">
                        <div className="font-medium text-white">{link.name}</div>
                        <div className="text-xs text-blue-200 opacity-80">{link.subtitle}</div>
                      </div>
                      <ExternalLink className="h-4 w-4 ml-auto text-blue-200" />
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Links Privados (visível apenas quando logado) */}
            {currentUser ? (
              <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Área Restrita
                  </CardTitle>
                  <CardDescription className="text-blue-200">
                    Ferramentas para funcionários autenticados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {privateLinks.map((link) => (
                    <Button
                      key={link.id}
                      variant="outline"
                      className="w-full justify-start backdrop-blur-sm bg-white/5 border-white/20 hover:bg-white/10 text-white h-auto py-3"
                      onClick={() => window.open(link.url, "_blank")}
                    >
                      <div className="flex items-center w-full">
                        {getIconComponent(link.icon)}
                        <div className="ml-2 text-left flex-1">
                          <div className="font-medium text-white">{link.name}</div>
                          <div className="text-xs text-blue-200 opacity-80">{link.subtitle}</div>
                        </div>
                        <ExternalLink className="h-4 w-4 ml-auto text-blue-200" />
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Área Restrita
                  </CardTitle>
                  <CardDescription className="text-blue-200">
                    Faça login para acessar ferramentas exclusivas
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <LogIn className="h-12 w-12 text-white/40 mb-4" />
                  <p className="text-white/60 mb-4 text-center">
                    Esta área contém ferramentas administrativas e formulários exclusivos para funcionários.
                  </p>
                  <Button
                    onClick={() => setCurrentView("login")}
                    className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Fazer Login
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Painel Admin (visível apenas para admins logados) */}
          {currentUser?.role === "admin" && (
            <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Ações Rápidas - Administrador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  <Button
                    variant="outline"
                    className="justify-start backdrop-blur-sm bg-white/5 border-white/20 hover:bg-white/10 text-white"
                    onClick={() => setCurrentView("links")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Gerenciar Links
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start backdrop-blur-sm bg-white/5 border-white/20 hover:bg-white/10 text-white"
                    onClick={() => setCurrentView("users")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Gerenciar Usuários
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start backdrop-blur-sm bg-white/5 border-white/20 hover:bg-white/10 text-white"
                    onClick={() => setCurrentView("settings")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
