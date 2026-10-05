import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Camera,
  Scan,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileText,
  SwitchCamera,
  Maximize2,
} from 'lucide-react'
import { cameraScanService } from '@/services/cameraScanService'
import { cn } from '@/utils/cn'

interface CameraScanModalProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'barcode' | 'photo' | 'document'
  title?: string
  onCapture: (data: { type: 'barcode' | 'photo' | 'document'; value: string }) => void
}

export const CameraScanModal: React.FC<CameraScanModalProps> = ({
  isOpen,
  onClose,
  mode = 'barcode',
  title,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [isScanning, setIsScanning] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    let activeStream: MediaStream | null = null

    const startCamera = async () => {
      setError(null)
      try {
        const s = await cameraScanService.getMediaStream(facingMode)
        activeStream = s
        setStream(s)
        if (videoRef.current) {
          videoRef.current.srcObject = s
        }
      } catch (err: any) {
        setError(err.message || 'Unable to access camera sensor.')
      }
    }

    startCamera()

    return () => {
      if (activeStream) {
        cameraScanService.stopStream(activeStream)
      }
      setStream(null)
    }
  }, [isOpen, facingMode])

  // Continuous barcode detection loop
  useEffect(() => {
    if (!isOpen || mode !== 'barcode' || !stream) return

    let animationFrameId: number
    let isRunning = true

    const detectLoop = async () => {
      if (!isRunning) return
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        try {
          const result = await cameraScanService.detectBarcode(videoRef.current)
          if (result) {
            isRunning = false
            onCapture({ type: 'barcode', value: result.rawValue })
            onClose()
            return
          }
        } catch {
          // Ignore transient detection errors
        }
      }
      animationFrameId = requestAnimationFrame(detectLoop)
    }

    animationFrameId = requestAnimationFrame(detectLoop)

    return () => {
      isRunning = false
      cancelAnimationFrame(animationFrameId)
    }
  }, [isOpen, mode, stream, onCapture, onClose])

  if (!isOpen) return null

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return
    try {
      const { dataUrl } = cameraScanService.captureSnapshot(videoRef.current)
      setCapturedImage(dataUrl)
      onCapture({ type: mode, value: dataUrl })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Snapshot capture failed.')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const dataUrl = await cameraScanService.parseImageFile(file)
      onCapture({ type: mode, value: dataUrl })
      onClose()
    } catch (err: any) {
      setError(err.message || 'File upload parsing failed.')
    }
  }

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }

  // Fallback simulation for devices without BarcodeDetector or cameras
  const handleSimulateScan = () => {
    const mockBarcode = mode === 'barcode' ? '890124891024' : 'INV-DOC-SAMPLE'
    onCapture({ type: mode, value: mockBarcode })
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-3xl bg-gray-900 border border-gray-800 text-white p-5 shadow-2xl z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
              {mode === 'barcode' ? (
                <Scan className="h-5 w-5" aria-hidden="true" />
              ) : mode === 'document' ? (
                <FileText className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Camera className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <h2 id="camera-modal-title" className="text-sm font-bold leading-tight">
                {title || (mode === 'barcode' ? 'Scan Product Barcode' : mode === 'document' ? 'Capture Document' : 'Camera Photo')}
              </h2>
              <p className="text-[11px] text-gray-400">
                {mode === 'barcode' ? 'Align barcode inside viewfinder' : 'Position item and tap shutter'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {cameraScanService.isCameraSupported() && !error && (
              <button
                type="button"
                onClick={toggleFacingMode}
                title="Switch Camera"
                aria-label="Switch Camera Lens"
                className="rounded-lg p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <SwitchCamera className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close camera modal"
              className="rounded-lg p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Viewport or Fallback Container */}
        <div className="mt-4 relative aspect-4/3 w-full rounded-2xl bg-black overflow-hidden flex items-center justify-center border border-gray-800">
          {error ? (
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="mx-auto h-10 w-10 text-amber-400" aria-hidden="true" />
              <div className="text-xs text-gray-300 font-medium">
                {error}
              </div>
              <p className="text-[11px] text-gray-400">
                You can upload a photo from your photo library or document files instead.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 cursor-pointer">
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  <span>Choose Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSimulateScan}
                  className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-750 cursor-pointer"
                >
                  Simulate {mode === 'barcode' ? 'Barcode Scan' : 'Capture'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Active Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />

              {/* Viewfinder Target Reticle for Barcode Scan */}
              {mode === 'barcode' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                  <div className="relative w-64 h-36 border-2 border-primary/80 rounded-2xl shadow-2xl">
                    {/* Animated laser line */}
                    <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-red-500/80 animate-bounce" />
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white rounded-br" />
                  </div>
                </div>
              )}

              {/* Shutter Button for Photo / Document modes */}
              {mode !== 'barcode' && (
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    aria-label="Capture camera frame"
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-gray-900 border-4 border-primary/50 shadow-xl active:scale-95 transition-transform cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-full border-2 border-gray-900 bg-white" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer fallback upload action */}
        {!error && (
          <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
            <label className="inline-flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors">
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Or pick from gallery</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={handleSimulateScan}
              className="text-[11px] text-primary hover:underline cursor-pointer"
            >
              Simulate Test Value
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
