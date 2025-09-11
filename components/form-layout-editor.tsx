"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  Move, Maximize2, Grid, Columns, Square, 
  AlignLeft, AlignCenter, AlignRight,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight
} from 'lucide-react'

interface FieldPosition {
  row: number
  col: number
  width: number // 1-12 (sistema de grid de 12 colunas)
  height?: number // altura em linhas do grid
}

interface FormField {
  id: string
  type: string
  label: string
  name: string
  required?: boolean
  placeholder?: string
  options?: string[]
  multipleChoice?: boolean
  position?: FieldPosition
  optionsLayout?: 'vertical' | 'horizontal' | 'grid'
  optionsColumns?: number
}

interface FormLayoutEditorProps {
  fields: FormField[]
  layout: 'single' | 'two-column' | 'custom'
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void
  onUpdateLayout: (layout: 'single' | 'two-column' | 'custom') => void
  onReorderFields: (fields: FormField[]) => void
}

export function FormLayoutEditor({ 
  fields, 
  layout, 
  onUpdateField, 
  onUpdateLayout,
  onReorderFields 
}: FormLayoutEditorProps) {
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [draggedField, setDraggedField] = useState<string | null>(null)
  const [gridPreview, setGridPreview] = useState<boolean>(false)
  const gridRef = useRef<HTMLDivElement>(null)

  // Aplicar layout automático quando mudar de tipo
  useEffect(() => {
    if (layout === 'single') {
      // Layout de coluna única - todos os campos ocupam largura total
      const updatedFields = fields.map((field, index) => ({
        ...field,
        position: {
          row: index,
          col: 0,
          width: 12
        }
      }))
      onReorderFields(updatedFields)
    } else if (layout === 'two-column') {
      // Layout de duas colunas - campos alternados
      const updatedFields = fields.map((field, index) => ({
        ...field,
        position: {
          row: Math.floor(index / 2),
          col: (index % 2) * 6,
          width: 6
        }
      }))
      onReorderFields(updatedFields)
    }
    // Para 'custom', mantém as posições atuais
  }, [layout])

  // Função para atualizar posição de um campo
  const updateFieldPosition = (fieldId: string, position: FieldPosition) => {
    onUpdateField(fieldId, { position })
  }

  // Função para mover campo no grid
  const moveField = (fieldId: string, direction: 'up' | 'down' | 'left' | 'right') => {
    const field = fields.find(f => f.id === fieldId)
    if (!field || !field.position) return

    const newPosition = { ...field.position }
    
    switch (direction) {
      case 'up':
        if (newPosition.row > 0) newPosition.row--
        break
      case 'down':
        newPosition.row++
        break
      case 'left':
        if (newPosition.col > 0) newPosition.col--
        break
      case 'right':
        if (newPosition.col + newPosition.width < 12) newPosition.col++
        break
    }

    updateFieldPosition(fieldId, newPosition)
  }

  // Função para redimensionar campo
  const resizeField = (fieldId: string, newWidth: number) => {
    const field = fields.find(f => f.id === fieldId)
    if (!field || !field.position) return

    // Garante que o campo não ultrapasse o grid
    const maxWidth = 12 - field.position.col
    const width = Math.min(Math.max(1, newWidth), maxWidth)

    updateFieldPosition(fieldId, { ...field.position, width })
  }

  // Função para drag and drop
  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedField(fieldId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault()
    
    if (!draggedField || draggedField === targetFieldId) return

    const draggedIndex = fields.findIndex(f => f.id === draggedField)
    const targetIndex = fields.findIndex(f => f.id === targetFieldId)
    
    if (draggedIndex === -1 || targetIndex === -1) return

    // Reordenar campos
    const newFields = [...fields]
    const [removed] = newFields.splice(draggedIndex, 1)
    newFields.splice(targetIndex, 0, removed)
    
    // Recalcular posições baseado no layout
    if (layout === 'single') {
      newFields.forEach((field, index) => {
        field.position = { row: index, col: 0, width: 12 }
      })
    } else if (layout === 'two-column') {
      newFields.forEach((field, index) => {
        field.position = {
          row: Math.floor(index / 2),
          col: (index % 2) * 6,
          width: 6
        }
      })
    }
    
    onReorderFields(newFields)
    setDraggedField(null)
  }

  // Renderizar controles de opções para campos de múltipla escolha
  const renderOptionsControls = (field: FormField) => {
    if (!['select', 'radio', 'checkbox'].includes(field.type)) return null

    return (
      <div className="border-t pt-3 mt-3 space-y-3">
        <Label className="text-xs font-semibold">Layout das Opções</Label>
        
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onUpdateField(field.id, { optionsLayout: 'vertical' })}
            className={`p-2 border rounded text-xs ${
              (field.optionsLayout || 'vertical') === 'vertical' 
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'hover:bg-gray-50'
            }`}
          >
            <AlignLeft className="h-3 w-3 mx-auto mb-1" />
            Vertical
          </button>
          <button
            onClick={() => onUpdateField(field.id, { optionsLayout: 'horizontal' })}
            className={`p-2 border rounded text-xs ${
              field.optionsLayout === 'horizontal' 
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'hover:bg-gray-50'
            }`}
          >
            <Columns className="h-3 w-3 mx-auto mb-1" />
            Horizontal
          </button>
          <button
            onClick={() => onUpdateField(field.id, { optionsLayout: 'grid' })}
            className={`p-2 border rounded text-xs ${
              field.optionsLayout === 'grid' 
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'hover:bg-gray-50'
            }`}
          >
            <Grid className="h-3 w-3 mx-auto mb-1" />
            Grid
          </button>
        </div>

        {field.optionsLayout === 'grid' && (
          <div>
            <Label className="text-xs">Colunas do Grid</Label>
            <Input
              type="number"
              min="2"
              max="4"
              value={field.optionsColumns || 2}
              onChange={(e) => onUpdateField(field.id, { 
                optionsColumns: parseInt(e.target.value) || 2 
              })}
              className="h-8"
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Seletor de tipo de layout */}
      <div className="flex gap-2 p-3 bg-gray-50 rounded-lg">
        <button
          onClick={() => onUpdateLayout('single')}
          className={`flex-1 py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors ${
            layout === 'single' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white border hover:bg-gray-50'
          }`}
        >
          <Square className="h-4 w-4" />
          <span className="text-sm font-medium">Uma Coluna</span>
        </button>
        <button
          onClick={() => onUpdateLayout('two-column')}
          className={`flex-1 py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors ${
            layout === 'two-column' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white border hover:bg-gray-50'
          }`}
        >
          <Columns className="h-4 w-4" />
          <span className="text-sm font-medium">Duas Colunas</span>
        </button>
        <button
          onClick={() => onUpdateLayout('custom')}
          className={`flex-1 py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors ${
            layout === 'custom' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white border hover:bg-gray-50'
          }`}
        >
          <Grid className="h-4 w-4" />
          <span className="text-sm font-medium">Personalizado</span>
        </button>
      </div>

      {/* Preview e controles do layout */}
      {layout === 'custom' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-semibold">Editor de Layout Personalizado</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setGridPreview(!gridPreview)}
            >
              <Grid className="h-3 w-3 mr-1" />
              {gridPreview ? 'Ocultar' : 'Mostrar'} Grid
            </Button>
          </div>

          {/* Grid visual para layout personalizado */}
          <div 
            ref={gridRef}
            className={`relative min-h-[400px] border-2 border-dashed rounded-lg p-4 ${
              gridPreview ? 'bg-gray-50' : 'bg-white'
            }`}
            style={{
              backgroundImage: gridPreview 
                ? 'repeating-linear-gradient(0deg, transparent, transparent 39px, #e5e7eb 39px, #e5e7eb 40px), repeating-linear-gradient(90deg, transparent, transparent 8.25%, #e5e7eb 8.25%, #e5e7eb 8.33%)'
                : 'none'
            }}
          >
            {fields.map((field) => {
              const position = field.position || { row: 0, col: 0, width: 12 }
              return (
                <div
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, field.id)}
                  onDragOver={(e) => handleDragOver(e, field.id)}
                  onDrop={(e) => handleDrop(e, field.id)}
                  onClick={() => setSelectedField(field.id)}
                  className={`absolute transition-all cursor-move border-2 rounded-lg p-3 bg-white ${
                    selectedField === field.id 
                      ? 'border-blue-500 shadow-lg z-10' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{
                    top: `${position.row * 60}px`,
                    left: `${(position.col / 12) * 100}%`,
                    width: `${(position.width / 12) * 100}%`,
                    minHeight: '50px'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Move className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-medium">{field.label}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {position.width}/12
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {field.type} {field.required && '• Obrigatório'}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Controles do campo selecionado */}
          {selectedField && (
            <Card className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm">
                  Editar: {fields.find(f => f.id === selectedField)?.label}
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedField(null)}
                >
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Controles de posição */}
                <div className="space-y-2">
                  <Label className="text-xs">Posição</Label>
                  <div className="grid grid-cols-3 gap-1">
                    <div />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveField(selectedField, 'up')}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <div />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveField(selectedField, 'left')}
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </Button>
                    <div className="text-xs text-center py-2">
                      {fields.find(f => f.id === selectedField)?.position?.row || 0},
                      {fields.find(f => f.id === selectedField)?.position?.col || 0}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveField(selectedField, 'right')}
                    >
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                    <div />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveField(selectedField, 'down')}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <div />
                  </div>
                </div>

                {/* Controle de largura */}
                <div className="space-y-2">
                  <Label className="text-xs">Largura (colunas)</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={fields.find(f => f.id === selectedField)?.position?.width || 12}
                      onChange={(e) => resizeField(selectedField, parseInt(e.target.value) || 1)}
                      className="h-8"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const field = fields.find(f => f.id === selectedField)
                        if (field?.position) {
                          resizeField(selectedField, 12 - field.position.col)
                        }
                      }}
                      title="Expandir até o final"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Controles específicos para campos de múltipla escolha */}
              {renderOptionsControls(fields.find(f => f.id === selectedField)!)}
            </Card>
          )}
        </div>
      )}

      {/* Lista simples para layouts não personalizados */}
      {layout !== 'custom' && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Ordem dos Campos</Label>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                draggable
                onDragStart={(e) => handleDragStart(e, field.id)}
                onDragOver={(e) => handleDragOver(e, field.id)}
                onDrop={(e) => handleDrop(e, field.id)}
                className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50 cursor-move"
              >
                <div className="flex items-center gap-3">
                  <Move className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm">{field.label}</p>
                    <p className="text-xs text-gray-500">
                      {field.type} {field.required && '• Obrigatório'}
                    </p>
                  </div>
                </div>
                
                {/* Controles de layout das opções para campos múltipla escolha */}
                {['select', 'radio', 'checkbox'].includes(field.type) && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => onUpdateField(field.id, { optionsLayout: 'vertical' })}
                      className={`p-1 rounded ${
                        (field.optionsLayout || 'vertical') === 'vertical' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title="Layout Vertical"
                    >
                      <AlignLeft className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onUpdateField(field.id, { optionsLayout: 'horizontal' })}
                      className={`p-1 rounded ${
                        field.optionsLayout === 'horizontal' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title="Layout Horizontal"
                    >
                      <Columns className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onUpdateField(field.id, { optionsLayout: 'grid' })}
                      className={`p-1 rounded ${
                        field.optionsLayout === 'grid' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title="Layout Grid"
                    >
                      <Grid className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
