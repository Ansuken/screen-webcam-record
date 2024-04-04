import React, { useState, useEffect, useRef } from 'react';
import './WebcamPreview.css'; // Importamos un archivo CSS para los estilos

const WebcamPreview: React.FC = () => {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
      // Solicitar permisos al montar el componente
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(async() => {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setCameras(videoDevices);
            if (videoDevices.length > 0) {
              setSelectedCamera(videoDevices[0].deviceId);
            }
          })
          .catch((err) => {
            console.error('Error al obtener permisos:', err);
          });
  }, []);

  const handleCameraChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCamera(event.target.value);
  };

  const handleStartStream = async () => {
    try {
      if (!selectedCamera) return;
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: selectedCamera }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Obtenemos la info de la cámara
      const [videoTrack] = stream.getVideoTracks();
      console.log('Capabilities', videoTrack.getCapabilities())
      console.log('Settings', videoTrack.getSettings())
      console.log('Constraints', videoTrack.getConstraints())


      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const handleStopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  return (
    <div className="camera-container">
      <h2>Seleccione una cámara:</h2>
      <select value={selectedCamera || ''} onChange={handleCameraChange} className="camera-select">
        {cameras.map(camera => (
          <option key={camera.deviceId} value={camera.deviceId}>{camera.label}</option>
        ))}
      </select>
      <br />
      <button onClick={handleStartStream} className="camera-button">Iniciar</button>
      <button onClick={handleStopStream} className="camera-button">Detener</button>
      <br />
      <video ref={videoRef} autoPlay className="camera-video" />
    </div>
  );
};

export default WebcamPreview;
