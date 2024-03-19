import React from 'react'
import ReactDOM from 'react-dom/client'
import ScreenCaptureComponent from './ScreenRecordingComponent'
import './index.css'
import WebcamPreview from './WebcamPreview'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ScreenCaptureComponent />
    <WebcamPreview />
  </React.StrictMode>,
)
