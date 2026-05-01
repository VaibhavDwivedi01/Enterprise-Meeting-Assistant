import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { UploadCloud, FileAudio, Loader2, Calendar, Mic, Square, Download } from 'lucide-react';
import AudioVisualizer from '../components/AudioVisualizer';
import toast from 'react-hot-toast';

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [includeScreen, setIncludeScreen] = useState(false);
  const [recordingStream, setRecordingStream] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchMeetings();
    return () => clearInterval(timerRef.current);
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data } = await api.get('/meetings');
      setMeetings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let finalStream = voiceStream;
      let displayStream = null;
      let audioCtx = null;

      if (includeScreen) {
        audioCtx = new AudioContext();
        const dest = audioCtx.createMediaStreamDestination();
        
        const sourceMic = audioCtx.createMediaStreamSource(voiceStream);
        sourceMic.connect(dest);

        displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "browser" },
          audio: true
        });
        
        if (displayStream.getAudioTracks().length > 0) {
          const sourceScreen = audioCtx.createMediaStreamSource(displayStream);
          sourceScreen.connect(dest);
        }
        
        finalStream = dest.stream;
      }

      const mediaRecorder = new MediaRecorder(finalStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Visualizer shows the final mixed audio (mic + screen)
      setRecordingStream(finalStream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        let extension = 'webm';
        if (mimeType.includes('mp4')) extension = 'mp4';
        else if (mimeType.includes('ogg')) extension = 'ogg';

        const audioFile = new File([audioBlob], `live-recording.${extension}`, { type: mimeType });
        setFile(audioFile);
        
        // Cleanup all tracks securely
        if (displayStream) displayStream.getTracks().forEach(track => track.stop());
        voiceStream.getTracks().forEach(track => track.stop());
        finalStream.getTracks().forEach(track => track.stop());
        if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
      };

      // Start recording with 1-second chunks for reliability
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Recording error", err);
      toast.error("Failed to start recording. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingStream(null);
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    try {
      await api.post('/meetings/upload', formData);
      setTitle('');
      setFile(null);
      fetchMeetings();
    } catch (err) {
      console.error("Upload failed", err);
      toast.error(err.response?.data || 'Upload failed due to network error.');
    } finally {
      setUploading(false);
    }
  };

  const downloadPdf = async (id, title) => {
    try {
      const response = await api.get(`/meetings/${id}/export/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/\s+/g, '_')}_Report.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to download PDF", err);
      toast.error("Failed to download PDF report.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-gray-200 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
          <p className="text-sm text-gray-500 mt-1">Record or upload meeting audio to intelligently extract structured tasks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 bg-white p-6 rounded-2xl shadow-[0_5px_20px_-5px_rgba(0,0,0,0.05)] border border-gray-100 h-fit">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Add New Recording</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Audio Source</label>
              
              {!isRecording ? (
                <div className="flex gap-3">
                  <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 hover:border-blue-300 transition-colors">
                    <input type="file" onChange={e => setFile(e.target.files[0])} accept="audio/*,video/*" className="hidden" id="file-upload" />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                      <UploadCloud className={`h-6 w-6 mb-2 transition-colors ${file && !file.name.startsWith('live-recording') ? 'text-green-500' : 'text-blue-500'}`} />
                      <span className="text-xs text-gray-600 font-medium">Upload File</span>
                    </label>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 border-2 border-gray-200 bg-red-50/50 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer" onClick={startRecording}>
                       <Mic className="h-6 w-6 text-red-500 mb-2" />
                       <span className="text-xs text-gray-600 font-medium">Record Audio</span>
                    </div>
                    <label className="flex items-center justify-center gap-2 mt-2 cursor-pointer text-xs text-gray-500 font-medium">
                      <input type="checkbox" checked={includeScreen} onChange={e => setIncludeScreen(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      Include screen audio
                    </label>
                  </div>
                </div>
              ) : (
                <div className="w-full border-2 border-red-400 bg-red-50 rounded-xl p-6 flex flex-col items-center justify-center">
                   <div className="flex items-center gap-3 text-red-600 font-bold text-2xl mb-4">
                      <div className="h-3 w-3 bg-red-600 rounded-full animate-ping"></div>
                      {formatTime(recordingTime)}
                   </div>
                   <div className="mb-6 w-full px-4">
                     {recordingStream && <AudioVisualizer stream={recordingStream} />}
                   </div>
                   <button type="button" onClick={stopRecording} className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-full font-medium shadow-md hover:bg-red-700 transition-colors">
                     <Square className="h-4 w-4 fill-current" /> Stop Recording
                   </button>
                </div>
              )}

              {file && (
                 <div className="mt-3 text-sm text-center font-medium text-green-600 bg-green-50 py-2 rounded-lg border border-green-100">
                    Ready: {file.name}
                 </div>
              )}
            </div>

            <button type="submit" disabled={uploading || !file || !title || isRecording}
              title={isRecording ? "Stop recording to extract tasks" : ""}
              className="w-full py-3 mt-4 text-white rounded-xl font-bold text-sm tracking-wide shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 disabled:opacity-50 transition-all duration-300 flex justify-center transform hover:-translate-y-0.5">
              {uploading ? <span className="flex items-center gap-2"><Loader2 className="animate-spin h-5 w-5" /> Processing Engine...</span> : 'Save & Extract Tasks'}
            </button>
          </form>
        </div>

        <div className="col-span-1 lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Processed Meetings</h2>
          {loading ? (
             <div className="py-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>
          ) : meetings.length === 0 ? (
             <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm">
                <FileAudio className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No meetings processed yet.</p>
                <p className="text-gray-400 text-sm mt-1">Upload an audio file or record one directly to get started.</p>
             </div>
          ) : (
            meetings.map(m => (
              <div key={m.id} className="bg-white p-6 rounded-2xl shadow-[0_5px_20px_-5px_rgba(0,0,0,0.05)] border border-gray-100 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                      <FileAudio className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{m.title}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 font-medium mt-0.5"><Calendar className="h-3 w-3" /> Auto-Processed</p>
                    </div>
                  </div>
                  <button onClick={() => downloadPdf(m.id, m.title)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download PDF Report">
                     <Download className="h-5 w-5" />
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed mb-4 border border-gray-100">
                  <span className="font-semibold text-blue-600 block mb-2 text-xs uppercase tracking-wider">Automated Summary</span>
                  {m.summary}
                </div>
                <div className="text-sm">
                   <details className="cursor-pointer text-gray-600 group">
                      <summary className="font-medium outline-none text-blue-600 flex items-center gap-2 hover:underline">View Full Transcript</summary>
                      <div className="mt-3 p-4 bg-white border border-gray-200 rounded-xl max-h-48 overflow-y-auto italic text-gray-600 shadow-inner">
                        {m.transcript}
                      </div>
                   </details>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Meetings;
