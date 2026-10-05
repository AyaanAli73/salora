// Camera, Barcode Scanning, and Document Capture Architecture

export interface ScanResult {
  rawValue: string
  format?: string
  timestamp: string
}

class CameraScanService {
  public isCameraSupported(): boolean {
    if (typeof window === 'undefined') return false
    return Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  }

  public isBarcodeDetectorSupported(): boolean {
    if (typeof window === 'undefined') return false
    return 'BarcodeDetector' in window
  }

  public async getMediaStream(facingMode: 'environment' | 'user' = 'environment'): Promise<MediaStream> {
    if (!this.isCameraSupported()) {
      throw new Error('Camera hardware access is not supported in this browser environment.')
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      return stream
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Camera permission was denied. Please grant camera access in browser settings.')
      } else if (err.name === 'NotFoundError') {
        throw new Error('No camera sensor was detected on this device.')
      } else {
        throw new Error(err.message || 'Unable to start camera video feed.')
      }
    }
  }

  public stopStream(stream: MediaStream | null) {
    if (!stream) return
    stream.getTracks().forEach((track) => track.stop())
  }

  public async detectBarcode(videoOrImage: HTMLVideoElement | HTMLImageElement | ImageBitmap): Promise<ScanResult | null> {
    if (this.isBarcodeDetectorSupported()) {
      try {
        const detector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'code_128', 'upc_a', 'ean_8'],
        })
        const barcodes = await detector.detect(videoOrImage)
        if (barcodes && barcodes.length > 0) {
          return {
            rawValue: barcodes[0].rawValue,
            format: barcodes[0].format,
            timestamp: new Date().toISOString(),
          }
        }
      } catch (err) {
        console.warn('[CameraScan] BarcodeDetector error:', err)
      }
    }
    return null
  }

  public captureSnapshot(
    videoElement: HTMLVideoElement,
    quality: number = 0.92
  ): { dataUrl: string; width: number; height: number } {
    const width = videoElement.videoWidth || 640
    const height = videoElement.videoHeight || 480

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not create 2D canvas context for snapshot capture.')

    ctx.drawImage(videoElement, 0, 0, width, height)
    const dataUrl = canvas.toDataURL('image/jpeg', quality)

    return { dataUrl, width, height }
  }

  // Fallback file picker parser for devices without live streaming or denied permissions
  public async parseImageFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read image file.'))
      reader.readAsDataURL(file)
    })
  }
}

export const cameraScanService = new CameraScanService()
