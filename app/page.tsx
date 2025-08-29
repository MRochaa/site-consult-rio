"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ExternalLink, LogOut, Settings, Users, FileText, ClipboardList, FileCheck } from "lucide-react"
import Image from "next/image"

interface User {
  id: string
  username: string
  password: string
  role: "admin" | "user"
  name: string
}

interface LinkItem {
  id: string
  name: string
  subtitle: string
  url: string
  isPublic: boolean
  icon: string
}

const defaultUsers: User[] = [
  {
    id: "1",
    username: "MRocha",
    password: "Marcos2810@",
    role: "admin",
    name: "Dr. Marcos Rocha",
  },
]

const defaultLinks: LinkItem[] = [
  {
    id: "1",
    name: "Ficha de Cadastro",
    subtitle: "Anamnese",
    url: "https://form.jotform.com/251813725963059",
    isPublic: true,
    icon: "FileText",
  },
  {
    id: "2",
    name: "Cadastro de novos clientes",
    subtitle: "Preenchimento de Contrato",
    url: "https://n8n.drmarcosrocha.com/form/9e8ed6ec-f5e9-4e6c-a42c-31e6f9473e9e",
    isPublic: true,
    icon: "FileCheck",
  },
  {
    id: "3",
    name: "Aquisição de contrato de serviços odontológicos",
    subtitle: "Criação de Prontuários",
    url: "https://form.jotform.com/251894751611057",
    isPublic: true,
    icon: "ClipboardList",
  },
  {
    id: "4",
    name: "Exclusivo para os dentistas",
    subtitle: "Buscar Prontuários",
    url: "https://n8n.drmarcosrocha.com/form/5190a59c-251d-443c-b532-9454b6e01545",
    isPublic: false,
    icon: "FileText",
  },
  {
    id: "5",
    name: "Buscar ficha de prontuário do cliente",
    subtitle: "Atualizar Contrato",
    url: "https://n8n.drmarcosrocha.com/form/80660c9b-d65c-4807-9863-8cb4c090f982",
    isPublic: false,
    icon: "FileCheck",
  },
  {
    id: "6",
    name: "Atualizar contrato antigo para contrato com carnê",
    subtitle: "Atualizar contrato antigo para contrato com carnê",
    url: "https://n8n.drmarcosrocha.com/form/80660c9b-d65c-4807-9863-8cb4c090f982",
    isPublic: false,
    icon: "FileCheck",
  },
]

export default function DentalOfficeSystem() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>(defaultUsers)
  const [links, setLinks] = useState<LinkItem[]>(defaultLinks)
  const [loginForm, setLoginForm] = useState({ username: "", password: "" })
  const [currentView, setCurrentView] = useState<"home" | "admin" | "users" | "links" | "settings">("home")
  const [siteTitle, setSiteTitle] = useState("Consultório Dr. Marcos Rocha")
  const [logoUrl, setLogoUrl] = useState(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/imagem_2025-08-29_174713093-msrQ9bJuiSdiyhTAjU8jANzDbENqSc.png",
  )
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
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("currentUser")
      const savedUsers = localStorage.getItem("users")
      const savedLinks = localStorage.getItem("links")
      const savedTitle = localStorage.getItem("siteTitle")
      const savedLogo = localStorage.getItem("logoUrl")

      if (savedUser) setCurrentUser(JSON.parse(savedUser))
      if (savedUsers) setUsers(JSON.parse(savedUsers))
      if (savedLinks) setLinks(JSON.parse(savedLinks))
      if (savedTitle) setSiteTitle(savedTitle)
      if (savedLogo) setLogoUrl(savedLogo)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("users", JSON.stringify(users))
    }
  }, [users])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("links", JSON.stringify(links))
    }
  }, [links])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("siteTitle", siteTitle)
    }
  }, [siteTitle])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("logoUrl", logoUrl)
    }
  }, [logoUrl])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const user = users.find((u) => u.username === loginForm.username && u.password === loginForm.password)
    if (user) {
      setCurrentUser(user)
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(user))
      }
      setLoginForm({ username: "", password: "" })
    } else {
      alert("Credenciais inválidas")
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser")
    }
    setCurrentView("home")
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

  const publicLinks = links.filter((link) => link.isPublic)
  const privateLinks = links.filter((link) => !link.isPublic)

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault()
    const newLink: LinkItem = {
      id: Date.now().toString(),
      name: linkForm.name,
      subtitle: linkForm.subtitle,
      url: linkForm.url,
      isPublic: linkForm.isPublic,
      icon: linkForm.icon,
    }
    setLinks([...links, newLink])
    setLinkForm({ name: "", subtitle: "", url: "", isPublic: true, icon: "FileText" })
  }

  const handleEditLink = (link: LinkItem) => {
    setEditingLink(link)
    setLinkForm({
      name: link.name,
      subtitle: link.subtitle,
      url: link.url,
      isPublic: link.isPublic,
      icon: link.icon,
    })
  }

  const handleUpdateLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLink) return

    setLinks(
      links.map((link) =>
        link.id === editingLink.id
          ? {
              ...link,
              name: linkForm.name,
              subtitle: linkForm.subtitle,
              url: linkForm.url,
              isPublic: linkForm.isPublic,
              icon: linkForm.icon,
            }
          : link,
      ),
    )
    setEditingLink(null)
    setLinkForm({ name: "", subtitle: "", url: "", isPublic: true, icon: "FileText" })
  }

  const handleDeleteLink = (linkId: string) => {
    if (confirm("Tem certeza que deseja excluir este link?")) {
      setLinks(links.filter((link) => link.id !== linkId))
    }
  }

  const cancelEdit = () => {
    setEditingLink(null)
    setLinkForm({ name: "", subtitle: "", url: "", isPublic: true, icon: "FileText" })
  }

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()

    if (users.some((user) => user.username === userForm.username)) {
      alert("Nome de usuário já existe!")
      return
    }

    const newUser: User = {
      id: Date.now().toString(),
      username: userForm.username,
      password: userForm.password,
      name: userForm.name,
      role: userForm.role,
    }
    setUsers([...users, newUser])
    setUserForm({ username: "", password: "", name: "", role: "user" })
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserForm({
      username: user.username,
      password: user.password,
      name: user.name,
      role: user.role,
    })
  }

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    if (users.some((user) => user.username === userForm.username && user.id !== editingUser.id)) {
      alert("Nome de usuário já existe!")
      return
    }

    setUsers(
      users.map((user) =>
        user.id === editingUser.id
          ? {
              ...user,
              username: userForm.username,
              password: userForm.password,
              name: userForm.name,
              role: userForm.role,
            }
          : user,
      ),
    )

    if (currentUser && currentUser.id === editingUser.id) {
      const updatedUser = {
        ...currentUser,
        username: userForm.username,
        password: userForm.password,
        name: userForm.name,
        role: userForm.role,
      }
      setCurrentUser(updatedUser)
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      }
    }

    setEditingUser(null)
    setUserForm({ username: "", password: "", name: "", role: "user" })
  }

  const handleDeleteUser = (userId: string) => {
    if (currentUser && currentUser.id === userId) {
      alert("Você não pode excluir sua própria conta!")
      return
    }

    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      setUsers(users.filter((user) => user.id !== userId))
    }
  }

  const cancelUserEdit = () => {
    setEditingUser(null)
    setUserForm({ username: "", password: "", name: "", role: "user" })
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c] flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Image src={logoUrl || "/placeholder.svg"} alt="Logo" width={120} height={120} className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">{siteTitle}</h1>
            <p className="text-blue-200">Sistema Interno de Gestão</p>
          </div>

          <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Área Pública</CardTitle>
              <CardDescription className="text-blue-200">Acesso livre para pacientes</CardDescription>
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

          <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Área Restrita</CardTitle>
              <CardDescription className="text-blue-200">Login para funcionários</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-white">
                    Usuário
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                    className="backdrop-blur-sm bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-white/40"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-white">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="backdrop-blur-sm bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-white/40"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20"
                >
                  Entrar
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b2370] to-[#0f1a5c]">
      <header className="backdrop-blur-md bg-white/10 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Image src={logoUrl || "/placeholder.svg"} alt="Logo" width={40} height={40} />
              <h1 className="text-xl font-bold text-white">{siteTitle}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-blue-200">Olá, {currentUser.name}</span>
              {currentUser.role === "admin" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView(currentView === "settings" ? "home" : "settings")}
                  className="text-blue-200 hover:bg-white/10"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-blue-200 hover:bg-white/10">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === "home" && (
          <div className="space-y-6">
            <div className="backdrop-blur-md bg-white/10 rounded-lg border border-white/20 p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo, {currentUser.name}!</h2>
                  <p className="text-blue-200">
                    Acesso como: <span className="font-semibold capitalize text-white">{currentUser.role}</span>
                  </p>
                  <p className="text-sm text-blue-300 mt-1">
                    Sistema interno de gestão -{" "}
                    {new Date().toLocaleDateString("pt-BR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-200">
                    <p>Links públicos: {publicLinks.length}</p>
                    <p>Links restritos: {privateLinks.length}</p>
                    {currentUser.role === "admin" && <p>Usuários cadastrados: {users.length}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Área Pública
                  </CardTitle>
                  <CardDescription className="text-blue-200">Links disponíveis para pacientes</CardDescription>
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
            </div>

            {currentUser.role === "admin" && (
              <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Ações Rápidas - Administrador
                  </CardTitle>
                  <CardDescription className="text-blue-200">Acesso rápido às funções administrativas</CardDescription>
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
        )}

        {currentView === "settings" && currentUser.role === "admin" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Configurações do Sistema</h2>
              <Button
                variant="outline"
                onClick={() => setCurrentView("home")}
                className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/20 text-white"
              >
                Voltar ao Início
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Gerenciar Links
                  </CardTitle>
                  <CardDescription className="text-blue-200">
                    Adicionar, editar e remover links do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-blue-200">
                    <p>• Links públicos: {publicLinks.length}</p>
                    <p>• Links restritos: {privateLinks.length}</p>
                  </div>
                  <Button
                    className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20"
                    onClick={() => setCurrentView("links")}
                  >
                    Gerenciar Links
                  </Button>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Gerenciar Usuários
                  </CardTitle>
                  <CardDescription className="text-blue-200">
                    Adicionar, editar e remover usuários do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-blue-200">
                    <p>• Total de usuários: {users.length}</p>
                    <p>• Administradores: {users.filter((u) => u.role === "admin").length}</p>
                  </div>
                  <Button
                    className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20"
                    onClick={() => setCurrentView("users")}
                  >
                    Gerenciar Usuários
                  </Button>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Personalização
                  </CardTitle>
                  <CardDescription className="text-blue-200">Personalizar título e logo do sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start backdrop-blur-sm bg-white/5 border-white/20 hover:bg-white/10 text-white"
                      onClick={() => {
                        const newTitle = prompt("Novo título do site:", siteTitle)
                        if (newTitle) setSiteTitle(newTitle)
                      }}
                    >
                      Alterar Título
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start backdrop-blur-sm bg-white/5 border-white/20 hover:bg-white/10 text-white"
                      onClick={() => {
                        const newLogo = prompt("Nova URL do logo:", logoUrl)
                        if (newLogo) setLogoUrl(newLogo)
                      }}
                    >
                      Alterar Logo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">Estatísticas do Sistema</CardTitle>
                <CardDescription className="text-blue-200">Visão geral do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg">
                    <div className="text-2xl font-bold text-white">{publicLinks.length}</div>
                    <div className="text-sm text-blue-200">Links Públicos</div>
                  </div>
                  <div className="text-center p-4 backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg">
                    <div className="text-2xl font-bold text-white">{privateLinks.length}</div>
                    <div className="text-sm text-blue-200">Links Restritos</div>
                  </div>
                  <div className="text-center p-4 backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg">
                    <div className="text-2xl font-bold text-white">{users.length}</div>
                    <div className="text-sm text-blue-200">Usuários Totais</div>
                  </div>
                  <div className="text-center p-4 backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg">
                    <div className="text-2xl font-bold text-white">
                      {users.filter((u) => u.role === "admin").length}
                    </div>
                    <div className="text-sm text-blue-200">Administradores</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === "links" && currentUser.role === "admin" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Gerenciar Links</h2>
              <Button
                variant="outline"
                onClick={() => setCurrentView("settings")}
                className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/20 text-white"
              >
                Voltar
              </Button>
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
        )}

        {currentView === "users" && currentUser.role === "admin" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Gerenciar Usuários</h2>
              <Button
                variant="outline"
                onClick={() => setCurrentView("settings")}
                className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/20 text-white"
              >
                Voltar
              </Button>
            </div>

            <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">
                  {editingUser ? "Editar Usuário" : "Adicionar Novo Usuário"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="space-y-4">
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
                        Senha
                      </Label>
                      <Input
                        id="userPassword"
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                        className="backdrop-blur-sm bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-white/40"
                        required
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
                        <option value="admin" className="bg-[#1b2370] text-white">
                          Admin
                        </option>
                        <option value="user" className="bg-[#1b2370] text-white">
                          Usuário
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

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white">Usuários</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 mr-2" />
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-sm text-blue-200">{user.username}</p>
                          <p className="text-xs text-blue-300 truncate max-w-xs">{user.role}</p>
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
                          className="backdrop-blur-sm bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30"
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
          </div>
        )}
      </main>
    </div>
  )
}
