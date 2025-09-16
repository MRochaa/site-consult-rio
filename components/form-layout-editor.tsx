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
  const [gridPreview, setGridPreview] = useState<boolean>(true)
  const gridRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Garantir que todos os campos tenham posição quando o layout é 'custom'
  useEffect(() => {
    if (layout === 'custom') {
      const fieldsNeedingPosition = fields.filter(f => !f.position)
      if (fieldsNeedingPosition.length > 0) {
        fieldsNeedingPosition.forEach((field, index) => {
          const existingPositions = fields.filter(f => f.position).map(f => f.position!)
          let newRow = 0
          
          // Encontrar a próxima linha disponível
          if (existingPositions.length > 0) {
            newRow = Math.max(...existingPositions.map(p => p.row)) + 1
          }
          
          onUpdateField(field.id, {
            position: { row: newRow + index, col: 0, width: 12 }
          })
        })
      }
    }
  }, [layout, fields])

  // Aplicar layout automático quando mudar de tipo (exceto custom)
  const applyAutomaticLayout = (newLayout: 'single' | 'two-column' | 'custom') => {
    if (newLayout === 'single') {
      // Layout de coluna única - todos os campos ocupam largura total
      fields.forEach((field, index) => {
        onUpdateField(field.id, {
          position: {
            row: index,
            col: 0,
            width: 12
          }
        })
      })
    } else if (newLayout === 'two-column') {
      // Layout de duas colunas - campos alternados
      fields.forEach((field, index) => {
        onUpdateField(field.id, {
          position: {
            row: Math.floor(index / 2),
            col: (index % 2) * 6,
            width: 6
          }
        })
      })
    }
    // Para 'custom', mantém as posições atuais ou cria padrão se não existirem
    onUpdateLayout(newLayout)
  }

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
        if (newPosition.col + newPosition.width <= 12) newPosition.col++
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

  // Funções melhoradas para drag and drop no grid customizado
  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    if (layout !== 'custom') return
    
    e.preventDefault()
    setDraggedField(fieldId)
    setIsDragging(true)
    setSelectedField(fieldId)
    
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedField || !gridRef.current) return
    
    const gridRect = gridRef.current.getBoundingClientRect()
    const relativeX = e.clientX - gridRect.left - dragOffset.x
    const relativeY = e.clientY - gridRect.top - dragOffset.y
    
    // Calcular nova posição baseada na grade (12 colunas)
    const gridWidth = gridRect.width
    const cellWidth = gridWidth / 12
    const cellHeight = 60 // altura de cada linha em pixels
    
    const newCol = Math.max(0, Math.min(11, Math.floor(relativeX / cellWidth)))
    const newRow = Math.max(0, Math.floor(relativeY / cellHeight))
    
    const field = fields.find(f => f.id === draggedField)
    if (field?.position) {
      // Ajustar largura se necessário
      const maxWidth = 12 - newCol
      const width = Math.min(field.position.width, maxWidth)
      
      updateFieldPosition(draggedField, {
        row: newRow,
        col: newCol,
        width: width
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDraggedField(null)
  }

  // Função para drag and drop na lista simples
  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedField(fieldId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
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
    
    // Recalcular posições baseado no layout atual
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
    // Para custom, manter as posições mas atualizar a ordem no array
    
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
          onClick={() => applyAutomaticLayout('single')}
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
          onClick={() => applyAutomaticLayout('two-column')}
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
          onClick={() => applyAutomaticLayout('custom')}
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
                ? 'repeating-linear-gradient(0deg, transparent, transparent 59px, #e5e7eb 59px, #e5e7eb 60px), repeating-linear-gradient(90deg, transparent, transparent calc(100% / 12 - 1px), #e5e7eb calc(100% / 12 - 1px), #e5e7eb calc(100% / 12))'
                : 'none',
              userSelect: 'none'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {fields.map((field) => {
              const position = field.position || { row: 0, col: 0, width: 12 }
              const isSelected = selectedField === field.id
              const isDraggingThis = draggedField === field.id && isDragging
              
              return (
                <div
                  key={field.id}
                  onMouseDown={(e) => handleMouseDown(e, field.id)}
                  onClick={() => setSelectedField(field.id)}
                  className={`absolute transition-all border-2 rounded-lg p-3 bg-white ${
                    isSelected 
                      ? 'border-blue-500 shadow-lg z-20' 
                      : 'border-gray-300 hover:border-gray-400 z-10'
                  } ${isDraggingThis ? 'cursor-grabbing opacity-70' : 'cursor-grab'}`}
                  style={{
                    top: `${position.row * 60}px`,
                    left: `calc(${(position.col / 12) * 100}%)`,
                    width: `calc(${(position.width / 12) * 100}% - 8px)`,
                    minHeight: '50px',
                    transition: isDraggingThis ? 'none' : 'all 0.2s ease'
                  }}
                >
                  <div className="flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-2">
                      <Move className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-medium truncate">{field.label}</span>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {position.width}/12
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 pointer-events-none">
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
                  <Label className="text-xs">Posição (Linha, Coluna)</Label>
                  <div className="grid grid-cols-3 gap-1">
                    <div />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveField(selectedField, 'up')}
                      className="h-8"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <div />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveField(selectedField, 'left')}
                      className="h-8"
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </Button>
                    <div className="text-xs text-center py-2 font-mono">
                      {fields.find(f => f.id === selectedField)?.position?.row || 0},
                      {fields.find(f => f.id === selectedField)?.position?.col || 0}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveField(selectedField, 'right')}
                      className="h-8"
                    >
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                    <div />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveField(selectedField, 'down')}
                      className="h-8"
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
                      className="h-8"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Dica: Arraste o campo para reposicionar
                  </p>
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
          <Label className="text-sm font-semibold">Ordem dos Campos (arraste para reordenar)</Label>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                draggable
                onDragStart={(e) => handleDragStart(e, field.id)}
                onDragOver={handleDragOver}
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
