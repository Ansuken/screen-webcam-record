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

    useEffect(()=>{
        navigator.mediaDevices.enumerateDevices().then(devices=>{  // USe memo
            console.log(devices)
            setDevices(devices)
        })
    },[])


    //Función para iniciar la grabación de pantalla
    const startScreenRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                },
            }); //Obtener el stream de la pantalla
            setScreenStream(stream);

            //Crear un MediaRecorder para grabar el stream
            const mediaRecorder = new MediaRecorder(stream);
            //Almacenar el MediaRecorder en la referencia
            screenMediaRecorderRef.current = mediaRecorder;

            //Evento ondataavailable para manejar los datos grabados
            mediaRecorder.ondataavailable = (e) => {
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

            mediaRecorder.start(); //Comenzar la grabación
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
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            }); //Obtener el stream de la webcam
            setWebcamStream(stream);

            //Crear un MediaRecorder para grabar el stream
            const mediaRecorder = new MediaRecorder(stream);
            //Almacenar el MediaRecorder en la referencia
            webcamMediaRecorderRef.current = mediaRecorder;

            //Evento ondataavailable para manejar los datos grabados
            mediaRecorder.ondataavailable = (e) => {
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

            mediaRecorder.start(); //Comenzar la grabación
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
                    <select>{devices.map(dev => {
                        if (dev.kind === 'audioinput')
                            return <option
                                value={dev.deviceId}
                                key={new Date().getTime()}>
                                {dev.label}
                            </option>
                    })}</select>
                </div>
                <div className="device-item">
                    <h3>Audio Output</h3>
                    <select>{devices.map(dev => {
                        if (dev.kind === 'audiooutput')
                            return <option
                                value={dev.deviceId}
                                key={new Date().getTime()}>
                                {dev.label}
                            </option>
                    })}</select>
                </div>
                <div className="device-item">
                    <h3>Video Input</h3>
                    <select>{devices.map(dev => {
                        if (dev.kind === 'videoinput')
                            return <option
                                value={dev.deviceId}
                                key={new Date().getTime()}>
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
                        <video autoPlay controls ref={screenVideoRef}/>
                    </div>
                )}
                {webcamStream && (
                    <div className="webcam-video">
                        <h2 className="video-title">Webcam Recording</h2>
                        <video autoPlay controls ref={webcamVideoRef}
                               onLoadedMetadata={() => webcamVideoRef.current?.play()}/>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScreenRecordingComponent;