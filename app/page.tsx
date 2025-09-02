"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, LogOut, Link, Users, FileText, Database, Download, Upload, AlertTriangle } from "lucide-react"
import Image from "next/image"
import { FileCheck, ClipboardList, ExternalLink } from "lucide-react"
import { Label } from "@/components/ui/label"

// AUTO-INICIALIZAÇÃO PARA DEPLOY NO COOLIFY
// O sistema criará automaticamente um usuário admin na primeira execução
const AUTO_INIT = true
const AUTO_ADMIN = {
  username: "admin",
  password: "MudeEstaSenha123!",
  name: "Administrador"
}

const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

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

const defaultUsers: User[] = []

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

interface LoginAttempt {
  timestamp: number
  ip: string
  username: string
}

interface RateLimitData {
  attempts: LoginAttempt[]
  blockedUntil?: number
}

const MAX_ATTEMPTS = 5
const BLOCK_DURATION = 15 * 60 * 1000
const ATTEMPT_WINDOW = 5 * 60 * 1000

const getRateLimitData = (): RateLimitData => {
  if (typeof window === "undefined") return { attempts: [] }
  const stored = localStorage.getItem("rateLimitData")
  return stored ? JSON.parse(stored) : { attempts: [] }
}

const setRateLimitData = (data: RateLimitData) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("rateLimitData", JSON.stringify(data))
  }
}

const isBlocked = (): { blocked: boolean; remainingTime?: number } => {
  const data = getRateLimitData()
  if (data.blockedUntil && Date.now() < data.blockedUntil) {
    return { blocked: true, remainingTime: data.blockedUntil - Date.now() }
  }
  return { blocked: false }
}

const addLoginAttempt = (username: string, success: boolean) => {
  const data = getRateLimitData()
  const now = Date.now()

  data.attempts = data.attempts.filter((attempt) => now - attempt.timestamp < ATTEMPT_WINDOW)

  if (!success) {
    data.attempts.push({
      timestamp: now,
      ip: "local",
      username,
    })

    const recentAttempts = data.attempts.filter((attempt) => now - attempt.timestamp < ATTEMPT_WINDOW)

    if (recentAttempts.length >= MAX_ATTEMPTS) {
      data.blockedUntil = now + BLOCK_DURATION
    }
  } else {
    data.attempts = []
    delete data.blockedUntil
  }

  setRateLimitData(data)
}

const formatTime = (ms: number): string => {
  const minutes = Math.ceil(ms / (1000 * 60))
  return `${minutes} minuto${minutes !== 1 ? "s" : ""}`
}

const isProduction = process.env.NODE_ENV === "production"

const handleError = (error: Error, context: string) => {
  if (!isProduction) {
    console.error(`[${context}]`, error)
  }
}

export default function DentalOfficeSystem() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [initForm, setInitForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
  })
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>(defaultUsers)
  const [links, setLinks] = useState<LinkItem[]>(defaultLinks)
  const [loginForm, setLoginForm] = useState({ username: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentView, setCurrentView] = useState<"home" | "admin" | "users" | "links" | "settings">("home")
  const [siteTitle, setSiteTitle] = useState("Consultório Dr. Marcos Rocha")
  const [logoUrl, setLogoUrl] = useState("/dental-office-logo.png")
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

  // Auto-inicialização para produção/Coolify
  useEffect(() => {
    const initializeSystem = async () => {
      if (typeof window !== "undefined") {
        const savedUser = localStorage.getItem("currentUser")
        const savedUsers = localStorage.getItem("users")
        const initialized = localStorage.getItem("systemInitialized")

        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser))
        }

        if (savedUsers) {
          setUsers(JSON.parse(savedUsers))
        } else {
          setUsers(defaultUsers)
        }

        // AUTO-INICIALIZAÇÃO PARA COOLIFY
        if (AUTO_INIT && !initialized) {
          console.log("🚀 Sistema inicializando automaticamente...")
          
          const hashedPassword = await hashPassword(AUTO_ADMIN.password)
          const adminUser: User = {
            id: "1",
            username: AUTO_ADMIN.username,
            password: hashedPassword,
            role: "admin",
            name: AUTO_ADMIN.name,
          }

          const newUsers = [adminUser]
          setUsers(newUsers)
          setIsInitialized(true)
          
          localStorage.setItem("users", JSON.stringify(newUsers))
          localStorage.setItem("systemInitialized", "true")
          
          console.log("✅ Sistema inicializado com sucesso!")
          console.log("📌 Use admin / MudeEstaSenha123! para fazer login")
        } else {
          setIsInitialized(initialized === "true")
        }
      }
    }

    initializeSystem()
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

  const exportData = () => {
    try {
      const data = {
        users: users,
        links: links,
        siteTitle: siteTitle,
        logoUrl: logoUrl,
        exportDate: new Date().toISOString(),
        version: "1.0",
      }

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
      handleError(error as Error, "Export")
      alert("Erro ao exportar dados. Tente novamente.")
    }
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        if (!data.users || !Array.isArray(data.users)) {
          alert("Arquivo de backup inválido: dados de usuários não encontrados")
          return
        }

        if (!data.links || !Array.isArray(data.links)) {
          alert("Arquivo de backup inválido: dados de links não encontrados")
          return
        }

        if (
          confirm(
            `Importar backup de ${data.exportDate ? new Date(data.exportDate).toLocaleDateString() : "data desconhecida"}? Isso substituirá todos os dados atuais.`,
          )
        ) {
          setUsers(data.users)
          setLinks(data.links)
          setSiteTitle(data.siteTitle || "Sistema Interno - Dr. Marcos Rocha")
          setLogoUrl(
            data.logoUrl ||
              "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/imagem_2025-08-29_174713093-msrQ9bJuiSdiyhTAjU8jANzDbENqSc.png",
          )

          if (typeof window !== "undefined") {
            localStorage.setItem("users", JSON.stringify(data.users))
            localStorage.setItem("links", JSON.stringify(data.links))
            localStorage.setItem("siteTitle", data.siteTitle || "Sistema Interno - Dr. Marcos Rocha")
            localStorage.setItem(
              "logoUrl",
              data.logoUrl ||
                "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/imagem_2025-08-29_174713093-msrQ9bJuiSdiyhTAjU8jANzDbENqSc.png",
            )
          }

          alert("Backup importado com sucesso!")
          setCurrentView("home")
        }
      } catch (error) {
        handleError(error as Error, "Import")
        alert("Erro ao importar backup: arquivo inválido")
      }
    }

    reader.onerror = () => {
      handleError(new Error("File read error"), "Import")
      alert("Erro ao ler o arquivo")
    }

    event.target.value = ""
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoginError("")

      const blockStatus = isBlocked()
      if (blockStatus.blocked) {
        const remainingTime = formatTime(blockStatus.remainingTime!)
        setLoginError(`Muitas tentativas falhadas. Tente novamente em ${remainingTime}.`)
        return
      }

      setIsLoading(true)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      for (const user of users) {
        if (user.username === loginForm.username) {
          const isValid = await verifyPassword(loginForm.password, user.password)
          if (isValid) {
            addLoginAttempt(loginForm.username, true)
            setCurrentUser(user)
            if (typeof window !== "undefined") {
              localStorage.setItem("currentUser", JSON.stringify(user))
            }
            setLoginForm({ username: "", password: "" })
            setIsLoading(false)
            return
          }
        }
      }

      addLoginAttempt(loginForm.username, false)
      setLoginError("Credenciais inválidas")
      setIsLoading(false)
    } catch (error) {
      handleError(error as Error, "Login")
      alert("Erro interno. Tente novamente.")
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (userForm.password !== userForm.confirmPassword) {
      alert("As senhas não coincidem")
      return
    }

    if (users.some((u) => u.username === userForm.username)) {
      alert("Nome de usuário já existe")
      return
    }

    const hashedPassword = await hashPassword(userForm.password)

    const newUser: User = {
      id: Date.now().toString(),
      username: userForm.username,
      password: hashedPassword,
      role: userForm.role as "admin" | "user",
      name: userForm.name,
    }

    const updatedUsers = [...users, newUser]
    setUsers(updatedUsers)
    if (typeof window !== "undefined") {
      localStorage.setItem("users", JSON.stringify(updatedUsers))
    }

    setUserForm({ username: "", password: "", confirmPassword: "", role: "user", name: "" })
    setCurrentView("users")
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (userForm.password && userForm.password !== userForm.confirmPassword) {
      alert("As senhas não coincidem")
      return
    }

    if (editingUser) {
      const updatedPassword = userForm.password ? await hashPassword(userForm.password) : editingUser.password

      const updatedUser: User = {
        ...editingUser,
        username: userForm.username,
        password: updatedPassword,
        role: userForm.role as "admin" | "user",
        name: userForm.name,
      }

      const updatedUsers = users.map((u) => (u.id === editingUser.id ? updatedUser : u))
      setUsers(updatedUsers)

      if (currentUser?.id === editingUser.id) {
        setCurrentUser(updatedUser)
        if (typeof window !== "undefined") {
          localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        }
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("users", JSON.stringify(updatedUsers))
      }

      setEditingUser(null)
      setUserForm({ username: "", password: "", confirmPassword: "", role: "user", name: "" })
      setCurrentView("users")
    }
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
    setUserForm({ username: "", password: "", name: "", role: "user", confirmPassword: "" })
  }

  const handleInitialization = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (initForm.password !== initForm.confirmPassword) {
        alert("As senhas não coincidem")
        return
      }

      if (initForm.password.length < 8) {
        alert("A senha deve ter pelo menos 8 caracteres")
        return
      }

      const hashedPassword = await hashPassword(initForm.password)

      const adminUser: User = {
        id: "1",
        username: initForm.username,
        password: hashedPassword,
        role: "admin",
        name: initForm.name,
      }

      const newUsers = [adminUser]
      setUsers(newUsers)
      setCurrentUser(adminUser)
      setIsInitialized(true)

      if (typeof window !== "undefined") {
        localStorage.setItem("users", JSON.stringify(newUsers))
        localStorage.setItem("currentUser", JSON.stringify(adminUser))
        localStorage.setItem("systemInitialized", "true")
      }

      setInitForm({ username: "", password: "", confirmPassword: "", name: "" })
    } catch (error) {
      console.error("Erro na inicialização:", error)
      alert("Erro ao inicializar o sistema. Tente novamente.")
    } finally {
      setIsLoading(false)
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

  // Não mostra tela de inicialização se AUTO_INIT está ativo
  if (!isInitialized && !AUTO_INIT) {
    return (
      <div className="min-h-screen bg-[#1b2370] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img src={logoUrl || "/placeholder.svg"} alt="Dr. Marcos Rocha Logo" className="h-20 w-auto" />
              </div>
              <CardTitle className="text-white text-2xl font-bold">Configuração Inicial</CardTitle>
              <CardDescription className="text-white/80">Configure o usuário administrador do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInitialization} className="space-y-4">
                <div>
                  <Label className="text-white/90 text-sm font-medium">Nome Completo</Label>
                  <Input
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={initForm.name}
                    onChange={(e) => setInitForm({ ...initForm, name: e.target.value })}
                    required
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-amber-400/50"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label className="text-white/90 text-sm font-medium">Nome de Usuário</Label>
                  <Input
                    type="text"
                    placeholder="Digite o nome de usuário"
                    value={initForm.username}
                    onChange={(e) => setInitForm({ ...initForm, username: e.target.value })}
                    required
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-amber-400/50"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label className="text-white/90 text-sm font-medium">Senha</Label>
                  <Input
                    type="password"
                    placeholder="Senha (mínimo 8 caracteres)"
                    value={initForm.password}
                    onChange={(e) => setInitForm({ ...initForm, password: e.target.value })}
                    required
                    minLength={8}
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-amber-400/50"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label className="text-white/90 text-sm font-medium">Confirmar Senha</Label>
                  <Input
                    type="password"
                    placeholder="Confirme a senha"
                    value={initForm.confirmPassword}
                    onChange={(e) => setInitForm({ ...initForm, confirmPassword: e.target.value })}
                    required
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-amber-400/50"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 transition-all duration-200 shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Inicializando..." : "Inicializar Sistema"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#1b2370] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8 shadow-2xl">
            <div className="text-center mb-8">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/imagem_2025-08-29_174713093-msrQ9bJuiSdiyhTAjU8jANzDbENqSc.png"
                alt="Logo"
                className="w-20 h-20 mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold text-white mb-2">Sistema Interno</h1>
              <p className="text-white/80">Dr. Marcos Rocha - Cirurgião Dentista</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Usuário</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent"
                  placeholder="Digite seu usuário"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Senha</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent"
                  placeholder="Digite sua senha"
                  required
                  disabled={isLoading}
                />
              </div>

              {loginError && (
                <div className="backdrop-blur-md bg-red-500/20 border border-red-400/30 rounded-xl p-3">
                  <p className="text-red-200 text-sm text-center">{loginError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
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

        {currentView === "settings" && currentUser?.role === "admin" && (
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

              <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-100">
                    <p className="font-medium mb-1">Importante sobre os dados:</p>
                    <ul className="space-y-1 text-amber-200/90">
                      <li>• Os dados são salvos localmente no navegador</li>
                      <li>• Podem ser perdidos ao limpar cache ou trocar de dispositivo</li>
                      <li>• Faça backup regularmente para não perder informações</li>
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
                        Senha
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
                        required={!editingUser}
                      />
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
