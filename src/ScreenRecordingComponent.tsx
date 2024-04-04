import {useState, useRef, useEffect} from 'react';
import './ScreenRecordingComponent.css';

const ScreenRecordingComponent = () => {
    //Estado para controlar la grabación de pantalla y webcam
    const [screenRecording, setScreenRecording] = useState<boolean>(false);
    const [webcamRecording, setWebcamRecording] = useState<boolean>(false);

    //Estado para almacenar el stream de la pantalla y la webcam
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

    //Referencia al elemento de video de la pantalla y webcam
    const screenVideoRef = useRef<HTMLVideoElement>(null);
    const webcamVideoRef = useRef<HTMLVideoElement>(null);

    //Referencia al MediaRecorder para la grabación de pantalla y webcam
    const screenMediaRecorderRef = useRef<MediaRecorder | null>(null);
    const webcamMediaRecorderRef = useRef<MediaRecorder | null>(null);

    //Referencia al array de Blob para los chunks grabados de pantalla y webcam
    const screenRecordedChunksRef = useRef<Blob[]>([]);
    const webcamRecordedChunksRef = useRef<Blob[]>([]);

    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

    const [videoInput, setVideoInput] = useState<string>('');
    const [audioInput, setAudioInput] = useState<string>('');

    useEffect(()=>{
        // Solicitar permisos al montar el componente
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(async() => {
                const devices = await navigator.mediaDevices.enumerateDevices();
                setDevices(devices)
                devices.map(dev => {
                    if (dev.kind === 'audioinput' && dev.deviceId === 'default') {
                        console.log(dev)
                        setAudioInput(dev.deviceId)
                    }
                    if (dev.kind === 'videoinput') {
                        console.log(dev)
                        setVideoInput(dev.deviceId)
                    }
                })
            })
            .catch((err) => {
                console.error('Error al obtener permisos:', err);
            });
    },[])

    console.log(devices)

    //Función para iniciar la grabación de pantalla
    const startScreenRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                 // Si el usuario quiere capturar pantalla con su audio, debemos quitar audio de aquí
                // Porque se generan problemas de audio y se oye fatal
                // Solo si queremos dejar que capture por si solo el audio de sistema según estipule
                // el navegador, ya que Chrome, por ejemplo, solo captura audio si es pestaña,
                // pero no si es la propia pantalla o ventana
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                },
            }).then( // En este punto ya tenemos el stream de la pantalla
                displayMediaStream => {
                    // Ahora lo que hacemos es obtener el stream de audio
                    const videoTrack = displayMediaStream.getVideoTracks();
                    const audioStream = navigator.mediaDevices.getUserMedia({
                        video: false,
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            sampleRate: 44100,
                            deviceId: { exact: audioInput } // Aquí se selecciona el dispositivo de audio
                        }
                    }).then(
                        audioStream => {
                            // Y este es el resultado final, un stream con video y audio
                            const audioTrack = audioStream.getAudioTracks();
                            // Retornamos el stream con video y audio
                            return new MediaStream([videoTrack, audioTrack].flat());
                        }
                    );
                    return audioStream;
                }
            ); //Obtener el stream de la pantalla
            setScreenStream(stream);

            //Crear un MediaRecorder para grabar el stream
            const mediaRecorder = new MediaRecorder(stream);
            //Almacenar el MediaRecorder en la referencia
            screenMediaRecorderRef.current = mediaRecorder;

            //Evento ondataavailable para manejar los datos grabados
            mediaRecorder.ondataavailable = (e) => {
                console.log('data available', e.data)
                if (e.data.size > 0) {
                    screenRecordedChunksRef.current.push(e.data);
                }
            };

            //Evento onstop para manejar la finalización de la grabación
            mediaRecorder.onstop = () => {
                //Safari no gestiona bien el type video/webm, tiene que ser vide/mp4
                const recordedBlob = new Blob(screenRecordedChunksRef.current, { type: 'video/mp4' });
                const videoURL = URL.createObjectURL(recordedBlob);
                if (screenVideoRef.current) {
                    screenVideoRef.current.src = videoURL;
                }
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(60000);
            /*Comenzar la grabación indicando el tamaño en ms de los chunks,
            así cada 60s entrará en el evento ondataavailable*/
            setScreenRecording(true); //Actualizar el estado de grabación de pantalla
        } catch (error) {
            console.error('Error starting screen recording:', error);
        }
    };

    //Función para detener la grabación de pantalla
    const stopScreenRecording = () => {
        if (screenMediaRecorderRef.current) {
            screenMediaRecorderRef.current.stop(); //Detener el MediaRecorder
            setScreenRecording(false);
        }
    };

    //Función para iniciar la grabación de webcam
    const startWebcamRecording = async () => {
        try {
            const constraints: MediaStreamConstraints = {
                video: {
                    deviceId: { exact: videoInput }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                    deviceId: { exact: audioInput }
                }
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints); //Obtener el stream de la webcam
            setWebcamStream(stream);

            // Asignar el stream al elemento de video de la webcam
            if (webcamVideoRef.current) {
                webcamVideoRef.current.srcObject = stream;
            }
            //Crear un MediaRecorder para grabar el stream
            const mediaRecorder = new MediaRecorder(stream);
            //Almacenar el MediaRecorder en la referencia
            webcamMediaRecorderRef.current = mediaRecorder;

            mediaRecorder.onstart = () => {
                console.log('MediaRecorder started', mediaRecorder);
            }
            //Evento ondataavailable para manejar los datos grabados
            mediaRecorder.ondataavailable = (e) => {
                console.log(e.data)
                if (e.data.size > 0) {
                    webcamRecordedChunksRef.current.push(e.data);
                }
            };

            //Evento onstop para manejar la finalización de la grabación
            mediaRecorder.onstop = () => {
                //Safari no gestiona bien el type video/webm, tiene que ser vide/mp4
                const recordedBlob = new Blob(webcamRecordedChunksRef.current, { type: 'video/mp4' });
                const videoURL = URL.createObjectURL(recordedBlob);
                if (webcamVideoRef.current) {
                    webcamVideoRef.current.src = videoURL;
                }
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(60000);
            /*Comenzar la grabación indicando el tamaño en ms de los chunks,
            así cada 60s entrará en el evento ondataavailable*/
            setWebcamRecording(true);
        } catch (error) {
            console.error('Error starting webcam recording:', error);
        }
    };

    //Función para detener la grabación de webcam
    const stopWebcamRecording = () => {
        if (webcamMediaRecorderRef.current) {
            webcamMediaRecorderRef.current.stop(); //Detener el MediaRecorder
            setWebcamRecording(false);
        }
    };

    return (
        <div className="screen-recording-container">
            <div className="header">
                <h1>Screen and Webcam Recorder</h1>
            </div>
            <div className="devices">
                <div className="device-item">
                    <h3>Audio Input</h3>
                    <select value={audioInput} onChange={(e)=>setAudioInput(e.target.value)}>{devices.map(dev => {
                        if (dev.kind === 'audioinput')
                            return <option
                                value={dev.deviceId}
                                key={dev.deviceId}>
                                {dev.label}
                            </option>
                    })}</select>
                </div>
                <div className="device-item">
                    <h3>Video Input</h3>
                    <select value={videoInput} onChange={(e)=>setVideoInput(e.target.value)}>{devices.map(dev => {
                        if (dev.kind === 'videoinput')
                            return <option
                                value={dev.deviceId}
                                key={dev.deviceId}>
                                {dev.label}
                            </option>
                    })}</select>
                </div>


            </div>
            <div className="button-container">
                {!screenRecording ? (
                    <button className="start-button" onClick={startScreenRecording}>Start Screen Recording</button>
                ) : (
                    <button className="stop-button" onClick={stopScreenRecording}>Stop Screen Recording</button>
                )}
                {!webcamRecording ? (
                    <button className="start-button" onClick={startWebcamRecording}>Start Webcam Recording</button>
                ) : (
                    <button className="stop-button" onClick={stopWebcamRecording}>Stop Webcam Recording</button>
                )}
            </div>
            <div className="video-container">
                {screenStream && (
                    <div className="screen-video">
                        <h2 className="video-title">Screen Recording</h2>
                        <video autoPlay controls ref={screenVideoRef} playsInline/>
                    </div>
                )}
                {webcamStream && (
                    <div className="webcam-video">
                        <h2 className="video-title">Webcam Recording</h2>
                        <video autoPlay controls ref={webcamVideoRef} playsInline/>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScreenRecordingComponent;
