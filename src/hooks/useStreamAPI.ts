import { useState, useRef } from 'react'
import type { StreamData, AlertState } from '@/types/stream'
import { DaydreamIntegration } from '@/lib/api'

export const useStreamAPI = () => {
  const [streamData, setStreamData] = useState<StreamData | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [alerts, setAlerts] = useState<AlertState[]>([])
  const [streamCreationStatus, setStreamCreationStatus] = useState("Ready to create stream")
  const [outputStatus, setOutputStatus] = useState("Output will appear here after creating a stream")
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const outputPlayerRef = useRef<HTMLIFrameElement>(null)

  const showAlert = (message: string, type: AlertState['type'] = 'info', duration = 3000) => {
    const id = Date.now()
    setAlerts(prev => [...prev, { message, type, id }])
    
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id))
    }, duration)
  }

  const removeAlert = (id: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

  const createStream = async () => {
    if (!DaydreamIntegration.isAvailable()) {
      setStreamCreationStatus("Please set your API key in the .env file first")
      showAlert("Please set your API key in the .env file first", 'error')
      return
    }
    
    try {
      setStreamCreationStatus("Creating stream...")
      
      const data = await DaydreamIntegration.createStream()
      setStreamData(data)
      
      setStreamCreationStatus(`Stream created successfully! ID: ${data.id}`)
      showAlert(`Stream created successfully! ID: ${data.id}`, 'success')
      
      if (data.output_playback_id) {
        setOutputStatus("Output player ready!")
        showAlert("Output player ready!", 'success')
      }
      
    } catch (error) {
      console.error('Error creating stream:', error)
      setStreamCreationStatus(`Failed to create stream: ${error instanceof Error ? error.message : 'Unknown error'}`)
      showAlert(`Failed to create stream: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    }
  }

  const startCamera = async () => {
    try {
      setStreamCreationStatus("Starting camera...")
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: true
      })
      
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      
      setStreamCreationStatus("Camera started successfully!")
      showAlert("Camera started successfully!", 'success')
      
    } catch (error) {
      console.error('Error accessing camera:', error)
      setStreamCreationStatus(`Failed to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`)
      showAlert(`Failed to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    }
  }

  const startWebRTCStream = async () => {
    if (!streamData || !localStream) {
      setStreamCreationStatus("No stream available. Create a stream first.")
      return
    }
    
    try {
      setStreamCreationStatus("Starting WebRTC stream...")
      
      const pc = await DaydreamIntegration.startWebRTCStream(localStream)
      setPeerConnection(pc)
      setIsStreaming(true)
      setStreamCreationStatus("WebRTC stream started successfully!")
      showAlert("WebRTC stream started successfully!", 'success')
      
    } catch (error) {
      console.error('Error starting WebRTC stream:', error)
      setStreamCreationStatus(`Failed to start stream: ${error instanceof Error ? error.message : 'Unknown error'}`)
      showAlert(`Failed to start stream: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    }
  }

  const stopStream = () => {
    if (peerConnection) {
      peerConnection.close()
      setPeerConnection(null)
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    
    setIsStreaming(false)
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    
    setStreamCreationStatus("Stream stopped")
  }

  const updateParameters = async (params: any) => {
    if (!streamData) {
      setStreamCreationStatus("No stream available. Create a stream first.")
      return
    }
    
    if (!DaydreamIntegration.isAvailable()) {
      setStreamCreationStatus("Please set your API key in the .env file first")
      return
    }
    
    try {
      setStreamCreationStatus("Updating parameters...")
      
      await DaydreamIntegration.updateParameters(params)
      
      setStreamCreationStatus("Parameters updated successfully!")
      
    } catch (error) {
      console.error('Error updating parameters:', error)
      setStreamCreationStatus(`Failed to update parameters: ${error instanceof Error ? error.message : 'Unknown error'}`)
      showAlert(`Failed to update parameters: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    }
  }

  return {
    streamData,
    localStream,
    peerConnection,
    isStreaming,
    alerts,
    streamCreationStatus,
    outputStatus,
    localVideoRef,
    outputPlayerRef,
    createStream,
    startCamera,
    startWebRTCStream,
    stopStream,
    updateParameters,
    showAlert,
    removeAlert
  }
}
