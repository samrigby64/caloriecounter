import { useEffect, useRef, useState } from 'react'
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'

interface Props {
  onDetected: (barcode: string) => void
}

const hints = new Map()
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
])

/** Live camera barcode scanner. Calls onDetected once with the first read. */
export default function BarcodeScanner({ onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const firedRef = useRef(false)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader(hints)
    let controls: IScannerControls | null = null
    let cancelled = false

    reader
      .decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current!,
        (result) => {
          if (result && !firedRef.current) {
            firedRef.current = true
            onDetected(result.getText())
          }
        },
      )
      .then((c) => {
        if (cancelled) c.stop()
        else controls = c
      })
      .catch((err) => {
        setError(
          err?.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow camera access and try again.'
            : 'Could not start the camera. Make sure the site is served over HTTPS.',
        )
      })

    return () => {
      cancelled = true
      controls?.stop()
    }
  }, [onDetected])

  return (
    <div className="overflow-hidden rounded-2xl bg-black">
      {error ? (
        <p className="px-4 py-10 text-center text-sm text-red-400">{error}</p>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            className="h-64 w-full object-cover"
            muted
            playsInline
          />
          {/* Aiming guide */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-3/4 rounded-xl border-2 border-brand/80" />
          </div>
        </div>
      )}
    </div>
  )
}
