import React, { useState, useEffect, useRef } from 'react';
import './WebcamPreview.css'; // Importamos un archivo CSS para los estilos

const WebcamPreview: React.FC = () => {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error enumerating devices:', error);
      }
    };
    fetchCameras();
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
    <div className="camera-container"> {/* Añadimos una clase al contenedor principal */}
      <h2>Seleccione una cámara:</h2>
      <select value={selectedCamera || ''} onChange={handleCameraChange} className="camera-select"> {/* Añadimos una clase al select */}
        {cameras.map(camera => (
          <option key={camera.deviceId} value={camera.deviceId}>{camera.label}</option>
        ))}
      </select>
      <br />
      <button onClick={handleStartStream} className="camera-button">Iniciar</button> {/* Añadimos una clase al botón */}
      <button onClick={handleStopStream} className="camera-button">Detener</button> {/* Añadimos una clase al botón */}
      <br />
      <video ref={videoRef} autoPlay className="camera-video" /> {/* Añadimos una clase al elemento de video */}
    </div>
  );
};

export default WebcamPreview;