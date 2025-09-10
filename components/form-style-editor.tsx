"use client"

import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Palette, Type, Layout, Image, Settings2, Sparkles } from 'lucide-react'

interface FormStyleEditorProps {
  style: any
  onChange: (style: any) => void
  onApplyTheme?: (theme: string) => void
}

export function FormStyleEditor({ style, onChange, onApplyTheme }: FormStyleEditorProps) {
  const [activeTab, setActiveTab] = useState('theme')

  const themes = [
    { 
      id: 'default', 
      name: 'Padrão', 
      preview: 'bg-white text-gray-900',
      style: {
        theme: 'default',
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui',
        headingColor: '#111827',
        buttonBackgroundColor: '#3b82f6',
        buttonTextColor: '#ffffff'
      }
    },
    { 
      id: 'modern', 
      name: 'Moderno', 
      preview: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white',
      style: {
        theme: 'modern',
        backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'Inter, sans-serif',
        headingColor: '#ffffff',
        buttonBackgroundColor: '#ec4899',
        buttonTextColor: '#ffffff',
        containerBorderRadius: '1rem',
        containerShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }
    },
    { 
      id: 'minimal', 
      name: 'Minimalista', 
      preview: 'bg-gray-50 text-gray-800',
      style: {
        theme: 'minimal',
        backgroundColor: '#f9fafb',
        fontFamily: 'Helvetica, Arial, sans-serif',
        headingColor: '#1f2937',
        buttonBackgroundColor: '#111827',
        buttonTextColor: '#ffffff',
        containerBorderRadius: '0',
        fieldBorderRadius: '0'
      }
    },
    { 
      id: 'dark', 
      name: 'Escuro', 
      preview: 'bg-gray-900 text-gray-100',
      style: {
        theme: 'dark',
        backgroundColor: '#111827',
        fontFamily: 'system-ui',
        headingColor: '#f9fafb',
        descriptionColor: '#d1d5db',
        buttonBackgroundColor: '#6366f1',
        buttonTextColor: '#ffffff',
        fieldBackgroundColor: '#1f2937',
        fieldTextColor: '#f9fafb',
        fieldBorderColor: '#374151'
      }
    },
    { 
      id: 'colorful', 
      name: 'Colorido', 
      preview: 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white',
      style: {
        theme: 'colorful',
        backgroundGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        fontFamily: 'Comic Sans MS, cursive',
        headingColor: '#ffffff',
        buttonBackgroundColor: '#10b981',
        buttonTextColor: '#ffffff',
        containerBorderRadius: '2rem',
        fieldBorderRadius: '9999px'
      }
    }
  ]

  const fonts = [
    'system-ui',
    'Arial, sans-serif',
    'Helvetica, sans-serif',
    'Georgia, serif',
    'Times New Roman, serif',
    'Courier New, monospace',
    'Inter, sans-serif',
    'Roboto, sans-serif',
    'Open Sans, sans-serif',
    'Montserrat, sans-serif',
    'Playfair Display, serif',
    'Comic Sans MS, cursive'
  ]

  const updateStyle = (key: string, value: any) => {
    onChange({
      ...style,
      [key]: value
    })
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="theme" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Temas
          </TabsTrigger>
          <TabsTrigger value="colors" className="text-xs">
            <Palette className="h-3 w-3 mr-1" />
            Cores
          </TabsTrigger>
          <TabsTrigger value="typography" className="text-xs">
            <Type className="h-3 w-3 mr-1" />
            Texto
          </TabsTrigger>
          <TabsTrigger value="layout" className="text-xs">
            <Layout className="h-3 w-3 mr-1" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="background" className="text-xs">
            <Image className="h-3 w-3 mr-1" />
            Fundo
          </TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">
            <Settings2 className="h-3 w-3 mr-1" />
            Avançado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="theme" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  onChange(theme.style)
                  if (onApplyTheme) onApplyTheme(theme.id)
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  style.theme === theme.id ? 'border-blue-500' : 'border-gray-200'
                }`}
              >
                <div className={`h-20 rounded mb-2 ${theme.preview}`} />
                <p className="text-sm font-medium">{theme.name}</p>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cor do Título</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={style.headingColor || '#000000'}
                  onChange={(e) => updateStyle('headingColor', e.target.value)}
                  className="w-16 h-9 p-1"
                />
                <Input
                  type="text"
                  value={style.headingColor || '#000000'}
                  onChange={(e) => updateStyle('headingColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>Cor da Descrição</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={style.descriptionColor || '#666666'}
                  onChange={(e) => updateStyle('descriptionColor', e.target.value)}
                  className="w-16 h-9 p-1"
                />
                <Input
                  type="text"
                  value={style.descriptionColor || '#666666'}
                  onChange={(e) => updateStyle('descriptionColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>Cor do Botão</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={style.buttonBackgroundColor || '#3b82f6'}
                  onChange={(e) => updateStyle('buttonBackgroundColor', e.target.value)}
                  className="w-16 h-9 p-1"
                />
                <Input
                  type="text"
                  value={style.buttonBackgroundColor || '#3b82f6'}
                  onChange={(e) => updateStyle('buttonBackgroundColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>Texto do Botão</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={style.buttonTextColor || '#ffffff'}
                  onChange={(e) => updateStyle('buttonTextColor', e.target.value)}
                  className="w-16 h-9 p-1"
                />
                <Input
                  type="text"
                  value={style.buttonTextColor || '#ffffff'}
                  onChange={(e) => updateStyle('buttonTextColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>Fundo do Campo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={style.fieldBackgroundColor || '#ffffff'}
                  onChange={(e) => updateStyle('fieldBackgroundColor', e.target.value)}
                  className="w-16 h-9 p-1"
                />
                <Input
                  type="text"
                  value={style.fieldBackgroundColor || '#ffffff'}
                  onChange={(e) => updateStyle('fieldBackgroundColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>Borda do Campo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={style.fieldBorderColor || '#d1d5db'}
                  onChange={(e) => updateStyle('fieldBorderColor', e.target.value)}
                  className="w-16 h-9 p-1"
                />
                <Input
                  type="text"
                  value={style.fieldBorderColor || '#d1d5db'}
                  onChange={(e) => updateStyle('fieldBorderColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <div>
            <Label>Fonte Principal</Label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={style.fontFamily || 'system-ui'}
              onChange={(e) => updateStyle('fontFamily', e.target.value)}
            >
              {fonts.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font.split(',')[0]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tamanho do Título</Label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={style.headingSize || '2rem'}
                onChange={(e) => updateStyle('headingSize', e.target.value)}
              >
                <option value="1.5rem">Pequeno</option>
                <option value="2rem">Médio</option>
                <option value="2.5rem">Grande</option>
                <option value="3rem">Extra Grande</option>
              </select>
            </div>

            <div>
              <Label>Alinhamento do Título</Label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={style.headingAlign || 'left'}
                onChange={(e) => updateStyle('headingAlign', e.target.value)}
              >
                <option value="left">Esquerda</option>
                <option value="center">Centro</option>
                <option value="right">Direita</option>
              </select>
            </div>

            <div>
              <Label>Tamanho da Descrição</Label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={style.descriptionSize || '1rem'}
                onChange={(e) => updateStyle('descriptionSize', e.target.value)}
              >
                <option value="0.875rem">Pequeno</option>
                <option value="1rem">Médio</option>
                <option value="1.125rem">Grande</option>
              </select>
            </div>

            <div>
              <Label>Tamanho do Texto dos Campos</Label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={style.fieldTextSize || '1rem'}
                onChange={(e) => updateStyle('fieldTextSize', e.target.value)}
              >
                <option value="0.875rem">Pequeno</option>
                <option value="1rem">Médio</option>
                <option value="1.125rem">Grande</option>
              </select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <div>
            <Label>Layout dos Campos</Label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={style.layout || 'single'}
              onChange={(e) => updateStyle('layout', e.target.value)}
            >
              <option value="single">Uma Coluna</option>
              <option value="two-column">Duas Colunas</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Largura do Container</Label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={style.containerWidth || '100%'}
                onChange={(e) => updateStyle('containerWidth', e.target.value)}
              >
                <option value="100%">Largura Total</option>
                <option value="max-w-2xl">Pequeno</option>
                <option value="max-w-4xl">Médio</option>
                <option value="max-w-6xl">Grande</option>
              </select>
            </div>

            <div>
              <Label>Espaçamento do Container</Label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={style.containerPadding || '1.5rem'}
                onChange={(e) => updateStyle('containerPadding', e.target.value)}
              >
                <option value="0">Sem Espaçamento</option>
                <option value="1rem">Pequeno</option>
                <option value="1.5rem">Médio</option>
                <option value="2rem">Grande</option>
                <option value="3rem">Extra Grande</option>
              </select>
            </div>

            <div>
              <Label>Cantos Arredondados</Label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={style.containerBorderRadius || '0.5rem'}
                onChange={(e) => updateStyle('containerBorderRadius', e.target.value)}
              >
                <option value="0">Reto</option>
                <option value="0.25rem">Sutil</option>
                <option value="0.5rem">Médio</option>
                <option value="1rem">Grande</option>
                <option value="2rem">Extra Grande</option>
              </select>
            </div>

            <div>
              <Label>Espaçamento entre Campos</Label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={style.fieldSpacing || '1rem'}
                onChange={(e) => updateStyle('fieldSpacing', e.target.value)}
              >
                <option value="0.5rem">Compacto</option>
                <option value="1rem">Normal</option>
                <option value="1.5rem">Espaçoso</option>
                <option value="2rem">Muito Espaçoso</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Sombra do Container</Label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={style.containerShadow || 'none'}
              onChange={(e) => updateStyle('containerShadow', e.target.value)}
            >
              <option value="none">Sem Sombra</option>
              <option value="0 1px 3px rgba(0,0,0,0.12)">Sutil</option>
              <option value="0 4px 6px rgba(0,0,0,0.1)">Pequena</option>
              <option value="0 10px 15px rgba(0,0,0,0.1)">Média</option>
              <option value="0 20px 25px rgba(0,0,0,0.1)">Grande</option>
            </select>
          </div>
        </TabsContent>

        <TabsContent value="background" className="space-y-4">
          <div>
            <Label>Tipo de Fundo</Label>
            <select
              className="w-full px-3 py-2 border rounded-md mb-4"
              value={style.backgroundGradient ? 'gradient' : style.backgroundImage ? 'image' : 'color'}
              onChange={(e) => {
                if (e.target.value === 'color') {
                  updateStyle('backgroundGradient', null)
                  updateStyle('backgroundImage', null)
                } else if (e.target.value === 'gradient') {
                  updateStyle('backgroundImage', null)
                  updateStyle('backgroundGradient', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
                } else {
                  updateStyle('backgroundGradient', null)
                  updateStyle('backgroundImage', 'url(https://example.com/bg.jpg)')
                }
              }}
            >
              <option value="color">Cor Sólida</option>
              <option value="gradient">Gradiente</option>
              <option value="image">Imagem</option>
            </select>
          </div>

          {!style.backgroundGradient && !style.backgroundImage && (
            <div>
              <Label>Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={style.backgroundColor || '#ffffff'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="w-16 h-9 p-1"
                />
                <Input
                  type="text"
                  value={style.backgroundColor || '#ffffff'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          )}

          {style.backgroundGradient && (
            <div>
              <Label>CSS do Gradiente</Label>
              <Input
                type="text"
                value={style.backgroundGradient}
                onChange={(e) => updateStyle('backgroundGradient', e.target.value)}
                placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              />
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button
                  onClick={() => updateStyle('backgroundGradient', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')}
                  className="h-20 rounded bg-gradient-to-br from-purple-500 to-pink-500"
                />
                <button
                  onClick={() => updateStyle('backgroundGradient', 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)')}
                  className="h-20 rounded bg-gradient-to-br from-pink-400 to-red-500"
                />
                <button
                  onClick={() => updateStyle('backgroundGradient', 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)')}
                  className="h-20 rounded bg-gradient-to-br from-blue-400 to-cyan-400"
                />
              </div>
            </div>
          )}

          {style.backgroundImage && (
            <div>
              <Label>URL da Imagem</Label>
              <Input
                type="text"
                value={style.backgroundImage?.replace('url(', '').replace(')', '')}
                onChange={(e) => updateStyle('backgroundImage', `url(${e.target.value})`)}
                placeholder="https://example.com/background.jpg"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div>
            <Label>CSS Personalizado</Label>
            <textarea
              className="w-full h-32 px-3 py-2 border rounded-md font-mono text-xs"
              placeholder="/* Adicione CSS personalizado aqui */"
              value={style.customCss || ''}
              onChange={(e) => updateStyle('customCss', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Altura dos Campos</Label>
              <Input
                type="text"
                value={style.fieldHeight || '2.5rem'}
                onChange={(e) => updateStyle('fieldHeight', e.target.value)}
                placeholder="2.5rem"
              />
            </div>

            <div>
              <Label>Padding dos Campos</Label>
              <Input
                type="text"
                value={style.fieldPadding || '0.5rem 1rem'}
                onChange={(e) => updateStyle('fieldPadding', e.target.value)}
                placeholder="0.5rem 1rem"
              />
            </div>

            <div>
              <Label>Largura da Borda</Label>
              <Input
                type="text"
                value={style.fieldBorderWidth || '1px'}
                onChange={(e) => updateStyle('fieldBorderWidth', e.target.value)}
                placeholder="1px"
              />
            </div>

            <div>
              <Label>Arredondamento dos Campos</Label>
              <Input
                type="text"
                value={style.fieldBorderRadius || '0.375rem'}
                onChange={(e) => updateStyle('fieldBorderRadius', e.target.value)}
                placeholder="0.375rem"
              />
            </div>
          </div>

          <div>
            <Label>Hover do Botão</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={style.buttonHoverColor || '#2563eb'}
                onChange={(e) => updateStyle('buttonHoverColor', e.target.value)}
                className="w-16 h-9 p-1"
              />
              <Input
                type="text"
                value={style.buttonHoverColor || '#2563eb'}
                onChange={(e) => updateStyle('buttonHoverColor', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
