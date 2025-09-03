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

// AUTO-INICIALIZAÇÃO PARA DEPLOY NO COOLIFY
const AUTO_INIT = true
const AUTO_ADMIN = {
  username: "admin",
  password: "MudeEstaSenha123!",
  name: "Administrador"
}

const hashPassword = async (password: string): Promise<string> => {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hash = await window.crypto.subtle.digest("SHA-256", data)
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  } else {
    const { createHash } = await import("crypto")
    return createHash("sha256").update(password).digest("hex")
  }
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

const MAX_ATTEMPTS = 5
const BLOCK_DURATION = 15 * 60 * 1000
const ATTEMPT_WINDOW = 5 * 60 * 1000

interface LoginAttempt {
  timestamp: number
  ip: string
  username: string
}

interface RateLimitData {
  attempts: LoginAttempt[]
  blockedUntil?: number
}

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

export default function DentalOfficeSystem() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [links, setLinks] = useState<LinkItem[]>(defaultLinks)
  const [loginForm, setLoginForm] = useState({ username: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentView, setCurrentView] = useState<"home" | "admin" | "users" | "links" | "settings" | "login">("home")
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

  // Auto-inicialização
  useEffect(() => {
    const initializeSystem = async () => {
      if (typeof window !== "undefined") {
        const savedUser = localStorage.getItem("currentUser")
        const savedUsers = localStorage.getItem("users")
        const savedLinks = localStorage.getItem("links")
        const initialized = localStorage.getItem("systemInitialized")

        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser))
        }

        if (savedUsers) {
          setUsers(JSON.parse(savedUsers))
        }

        if (savedLinks) {
          setLinks(JSON.parse(savedLinks))
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
        } else {
          setIsInitialized(true)
        }
      }
    }

    initializeSystem()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
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
          localStorage.setItem("currentUser", JSON.stringify(user))
          setLoginForm({ username: "", password: "" })
          setIsLoading(false)
          setCurrentView("home")
          return
        }
      }
    }

    addLoginAttempt(loginForm.username, false)
    setLoginError("Credenciais inválidas")
    setIsLoading(false)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem("currentUser")
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

  // Tela de Login (modal)
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

  // Lógica das telas administrativas (mantém como estava)
  if (currentUser && currentView === "settings" && currentUser.role === "admin") {
    // [Manter código de settings como estava]
    return null // Adicione o código de settings aqui
  }

  if (currentUser && currentView === "links" && currentUser.role === "admin") {
    // [Manter código de links como estava]
    return null // Adicione o código de links aqui
  }

  if (currentUser && currentView === "users" && currentUser.role === "admin") {
    // [Manter código de users como estava]
    return null // Adicione o código de users aqui
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
                      onClick={() => setCurrentView(currentView === "settings" ? "home" : "settings")}
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
