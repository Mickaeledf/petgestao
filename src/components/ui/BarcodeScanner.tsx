import { Camera, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface Props {
  onScan: (code: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(true)

  useEffect(() => {
    const containerId = 'barcode-reader-' + Date.now()
    if (containerRef.current) {
      containerRef.current.id = containerId
    }

    const scanner = new Html5Qrcode(containerId)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          scanner.stop().catch(() => {})
          onScan(decodedText)
        },
        () => {}
      )
      .then(() => setStarting(false))
      .catch((err) => {
        setStarting(false)
        setError(
          typeof err === 'string'
            ? err
            : err?.message ?? 'Não foi possível acessar a câmera. Verifique as permissões.'
        )
      })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary-600" />
            <h3 className="font-medium text-gray-900">Leitor de código de barras</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4">
          {error ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-danger-600">{error}</p>
              <p className="text-xs text-gray-500">Verifique se o navegador tem permissão de câmera.</p>
            </div>
          ) : (
            <>
              {starting && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                </div>
              )}
              <div ref={containerRef} className={starting ? 'hidden' : ''} />
              <p className="text-center text-xs text-gray-500 mt-3">
                Aponte a câmera para o código de barras do produto
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
