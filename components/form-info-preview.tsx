"use client"

import React from 'react'

interface InfoFieldPreviewProps {
  content?: string
  imageUrl?: string
  imageAlt?: string
  imageHeight?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  fontSize?: string
  fontWeight?: string
  textColor?: string
  isBuilder?: boolean // Para diferenciar preview do builder
}

export function InfoFieldPreview({
  content,
  imageUrl,
  imageAlt,
  imageHeight = 'auto',
  textAlign = 'left',
  fontSize = '1rem',
  fontWeight = 'normal',
  textColor = '#000000',
  isBuilder = false
}: InfoFieldPreviewProps) {
  
  // Renderizar campo de texto informativo
  if (content) {
    const textStyle: React.CSSProperties = {
      textAlign,
      fontSize,
      fontWeight,
      color: textColor,
      whiteSpace: 'pre-wrap', // Preservar quebras de linha
      wordBreak: 'break-word',
      padding: isBuilder ? '0.5rem' : '0',
      backgroundColor: isBuilder ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
      borderRadius: isBuilder ? '0.25rem' : '0',
      border: isBuilder ? '1px dashed #3b82f6' : 'none'
    }

    return (
      <div style={textStyle}>
        {isBuilder && (
          <span className="text-xs text-blue-500 block mb-1">
            [Campo Informativo]
          </span>
        )}
        {content}
      </div>
    )
  }

  // Renderizar campo de imagem
  if (imageUrl) {
    return (
      <div className="w-full">
        {isBuilder && (
          <span className="text-xs text-green-500 block mb-1">
            [Campo de Imagem]
          </span>
        )}
        <img 
          src={imageUrl}
          alt={imageAlt || "Imagem"}
          style={{ 
            height: imageHeight,
            maxWidth: '100%',
            objectFit: 'contain',
            display: 'block',
            margin: textAlign === 'center' ? '0 auto' : '0'
          }}
          className="rounded"
          onError={(e) => {
            // Imagem de placeholder quando erro
            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af"%3EImagem não disponível%3C/text%3E%3C/svg%3E'
          }}
        />
      </div>
    )
  }

  return null
}
