"use client"

import React, { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface SignaturePadProps {
  onSave: (signature: string) => void
  width?: number
  height?: number
}

export function SignaturePad({ onSave, width, height }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 200 })

  // Função para redimensionar o canvas responsivamente
  const resizeCanvas = () => {
    if (!containerRef.current || !canvasRef.current) return
    
    const container = containerRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return

    // Salvar o conteúdo atual do canvas antes de redimensionar
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    
    // Calcular novo tamanho baseado no container
    const containerWidth = container.clientWidth
    const newWidth = width || containerWidth || 400
    const newHeight = height || Math.min(containerWidth * 0.5, 250) || 200
    
    // Atualizar tamanho do canvas
    setCanvasSize({ width: newWidth, height: newHeight })
    
    // Aguardar o próximo frame para aplicar as configurações
    requestAnimationFrame(() => {
      if (!canvasRef.current) return
      const newContext = canvasRef.current.getContext('2d')
      if (!newContext) return
      
      // Restaurar configurações do contexto
      newContext.strokeStyle = '#000'
      newContext.lineWidth = 2
      newContext.lineCap = 'round'
      newContext.lineJoin = 'round'
      
      // Se havia conteúdo e não está vazio, tentar restaurar
      if (!isEmpty && imageData.data.some(pixel => pixel !== 0)) {
        // Criar um canvas temporário para redimensionar a imagem
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = imageData.width
        tempCanvas.height = imageData.height
        const tempContext = tempCanvas.getContext('2d')
        if (tempContext) {
          tempContext.putImageData(imageData, 0, 0)
          newContext.drawImage(tempCanvas, 0, 0, newWidth, newHeight)
        }
      }
    })
  }

  useEffect(() => {
    // Configurar observador de redimensionamento
    resizeCanvas()
    
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas()
    })
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    
    // Configurar contexto inicial
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    context.strokeStyle = '#000'
    context.lineWidth = 2
    context.lineCap = 'round'
    context.lineJoin = 'round'
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [width, height])

  // Função para obter coordenadas relativas ao canvas
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    let x, y
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }
    
    // Ajustar para a escala do canvas
    x = (x * canvas.width) / rect.width
    y = (y * canvas.height) / rect.height
    
    return { x, y }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    setIsEmpty(false)
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const context = canvas.getContext('2d')
    if (!context) return

    const { x, y } = getCoordinates(e)

    context.beginPath()
    context.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const { x, y } = getCoordinates(e)

    context.lineTo(x, y)
    context.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || isEmpty) return

    const dataUrl = canvas.toDataURL('image/png')
    onSave(dataUrl)
  }

  return (
    <div className="space-y-3 w-full">
      {/* Container responsivo para o canvas */}
      <div 
        ref={containerRef}
        className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white relative w-full"
        style={{ 
          minHeight: '150px',
          maxHeight: '300px',
          aspectRatio: '2 / 1' // Proporção 2:1 para assinaturas
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="cursor-crosshair touch-none w-full h-full"
          style={{ 
            display: 'block',
            maxWidth: '100%',
            height: 'auto'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Assine aqui</p>
          </div>
        )}
      </div>
      
      {/* Botões de controle */}
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          onClick={clearSignature}
          disabled={isEmpty}
          className="flex-1 sm:flex-none"
        >
          Limpar
        </Button>
        <Button
          type="button"
          onClick={saveSignature}
          disabled={isEmpty}
          className="flex-1 sm:flex-none"
        >
          Salvar Assinatura
        </Button>
      </div>
    </div>
  )
}
