'use client';

import { useState, useRef, useEffect } from 'react';

interface ImageUploadProps {
  onImageSelected: (file: File | null, preview: string | null, isRemoved?: boolean) => void;
  label?: string;
  initialImage?: string;
}

export default function ImageUpload({ onImageSelected, label = 'Foto do Cliente', initialImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialImage || null);
  const [fileName, setFileName] = useState<string | null>(initialImage ? 'Foto atual' : null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar com mudanças no initialImage
  useEffect(() => {
    console.log('ImageUpload recebeu initialImage:', initialImage);
    if (initialImage && initialImage.trim()) {
      setPreview(initialImage);
      setFileName('Foto atual');
    }
  }, [initialImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      setPreview(null);
      setFileName(null);
      onImageSelected(null, null, false);
      return;
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      setFileName(file.name);
      onImageSelected(file, result, false);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Indica que uma imagem existente foi removida
    onImageSelected(null, null, true);
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
        {label}
      </label>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {preview ? (
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start',
          padding: '1rem',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '6px',
            overflow: 'hidden',
            backgroundColor: '#f3f4f6'
          }}>
            <img
              src={preview}
              alt="Preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#374151' }}>
              <strong>Arquivo:</strong> {fileName}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleClick}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Alterar
              </button>
              <button
                type="button"
                onClick={handleRemove}
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          style={{
            width: '100%',
            padding: '2rem',
            border: '2px dashed #cbd5e1',
            borderRadius: '6px',
            backgroundColor: '#f8fafc',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: '#475569',
            transition: 'all 0.2s',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#94a3b8';
            e.currentTarget.style.backgroundColor = '#f1f5f9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.backgroundColor = '#f8fafc';
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📸</div>
          <p style={{ margin: 0, marginBottom: '0.25rem' }}>Clique para selecionar uma foto</p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
            PNG, JPG ou GIF (máximo 5MB) - Recomendado usar CPF/CNPJ do cliente como nome do arquivo
          </p>
        </button>
      )}
    </div>
  );
}
