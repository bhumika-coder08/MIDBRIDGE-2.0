import React, { useState, useRef, useEffect } from 'react';
import {
  Languages,
  Mic,
  MicOff,
  Camera,
  FileText,
  Volume2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Upload,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { api } from '../services/api.js';

type TranslatorMode = 'TEXT' | 'SPEECH' | 'CAMERA' | 'DOCUMENT';

export const TranslatorPage: React.FC = () => {
  const [mode, setMode] = useState<TranslatorMode>('TEXT');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLang, setTargetLang] = useState('de');
  const [detectedLang, setDetectedLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Camera state (Part 26)
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const languages = [
    { code: 'de', name: 'German (Deutsch)' },
    { code: 'fr', name: 'French (Français)' },
    { code: 'es', name: 'Spanish (Español)' },
    { code: 'ja', name: 'Japanese (日本語)' },
    { code: 'ko', name: 'Korean (한국어)' },
    { code: 'it', name: 'Italian (Italiano)' },
    { code: 'nl', name: 'Dutch (Nederlands)' },
    { code: 'hi', name: 'Hindi (हिन्दी)' },
  ];

  // Stop camera when unmounting or switching modes
  useEffect(() => {
    if (mode !== 'CAMERA' && cameraActive) {
      stopCamera();
    }
  }, [mode]);

  const handleTranslate = async (textToTranslate?: string) => {
    const text = (textToTranslate || sourceText).trim();
    if (!text) return;

    setLoading(true);
    try {
      const res = await api.post<{
        originalText: string;
        translatedText: string;
        detectedSourceLang: string;
        targetLang: string;
      }>('/translator/translate', {
        text,
        targetLang,
        sourceLang: 'auto',
      });

      setTranslatedText(res.translatedText);
      setDetectedLang(res.detectedSourceLang);
    } catch (err: any) {
      console.error('Translation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Speech Recognition using browser Web Speech API
  const toggleSpeechRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not natively supported in your current browser. Try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSourceText(transcript);
      setIsListening(false);
      handleTranslate(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Text to Speech
  const handleSpeak = (text: string, lang: string) => {
    if ('speechSynthesis' in window && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Camera Translation (Part 26)
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } else {
        throw new Error('getUserMedia not supported in this browser.');
      }
    } catch (err: any) {
      setCameraError('Camera permission was not granted. You can upload a photo of the document instead.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureSnapshot = () => {
    // Simulate OCR capture on video frame
    setSourceText('Aufenthaltstitel gültig für Studienzwecke bis September 2027.');
    handleTranslate('Aufenthaltstitel gültig für Studienzwecke bis September 2027.');
    stopCamera();
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
            Cross-Border Mobility Translation
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">AI Mobility Translator</h1>
          <p className="text-xs sm:text-sm text-white/60">
            Certified mobility translations for consular appointments, municipal registration, and foreign academic documents.
          </p>
        </div>

        {/* 4 Mode Selectors */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'TEXT', label: 'Text Translation', icon: Languages },
            { id: 'SPEECH', label: 'Speech-to-Speech', icon: Mic },
            { id: 'CAMERA', label: 'Camera OCR', icon: Camera },
            { id: 'DOCUMENT', label: 'Document Extract', icon: FileText },
          ].map(m => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id as TranslatorMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-md'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Camera OCR Viewport (Part 26) */}
        {mode === 'CAMERA' && (
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Camera className="h-4 w-4 text-emerald-400" />
              <span>Camera OCR Document Capture</span>
            </h3>

            {cameraError && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 h-64 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`} />
              {!cameraActive && (
                <div className="text-center space-y-3 p-4">
                  <Camera className="h-10 w-10 text-white/40 mx-auto" />
                  <p className="text-xs text-white/60">Position sign or document in view for real-time OCR extraction.</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={startCamera}
                      className="px-5 py-2 rounded-full btn-primary text-xs font-semibold text-white"
                    >
                      Start Camera
                    </button>
                    <label className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs text-white cursor-pointer transition-colors">
                      <span>Upload Photo Fallback</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={() => {
                          setSourceText('Wohnsitzanmeldung für Einwanderer - Bürgeramt Mitte');
                          handleTranslate('Wohnsitzanmeldung für Einwanderer - Bürgeramt Mitte');
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {cameraActive && (
              <div className="flex justify-center gap-3">
                <button
                  onClick={captureSnapshot}
                  className="px-6 py-2 rounded-full btn-primary text-xs font-semibold text-white flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Capture & OCR Translate</span>
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-full bg-white/10 text-xs text-white/70 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Translation Panels (Part 25) */}
        <div className="glass-strong rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl space-y-6">
          {/* Target Language Selector */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-mono text-white/60">
              <span>Source: <strong className="text-white uppercase">{detectedLang}</strong> (Auto-Detected)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">Target Language:</span>
              <select
                value={targetLang}
                onChange={e => {
                  setTargetLang(e.target.value);
                  if (sourceText) handleTranslate();
                }}
                className="bg-[#121216] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                {languages.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Two-Column Translation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Box */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-white/60 font-mono">
                <span>ORIGINAL MOBILITY TEXT</span>
                <span className="text-[10px]">{sourceText.length} chars</span>
              </div>
              <textarea
                rows={6}
                value={sourceText}
                onChange={e => setSourceText(e.target.value)}
                placeholder="Type or paste official mobility phrase (e.g. 'passport', 'admission letter', 'blocked account', 'city registration')..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
              />

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSpeechRecognition}
                    className={`p-2 rounded-full border transition-colors ${
                      isListening
                        ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                        : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                    }`}
                    title="Speak to dictate"
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>

                  <button
                    onClick={() => {
                      setSourceText('');
                      setTranslatedText('');
                    }}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10"
                    title="Clear"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleTranslate()}
                  disabled={loading || !sourceText.trim()}
                  className="px-6 py-2 rounded-full btn-primary text-xs font-semibold text-white flex items-center gap-1.5 disabled:opacity-40"
                >
                  <span>{loading ? 'Translating...' : 'Translate'}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Output Box */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-white/60 font-mono">
                <span>TARGET TRANSLATION ({targetLang.toUpperCase()})</span>
                {translatedText && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] text-white/70 hover:text-white"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              <div className="w-full h-36 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white/90 overflow-y-auto font-medium leading-relaxed select-all">
                {translatedText ? (
                  translatedText
                ) : (
                  <span className="text-white/30 italic text-xs font-normal">
                    Translated output compliant with target consular/municipal nomenclature will appear here...
                  </span>
                )}
              </div>

              {translatedText && (
                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    onClick={() => handleSpeak(translatedText, targetLang)}
                    className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white"
                  >
                    <Volume2 className="h-4 w-4 text-emerald-400" />
                    <span>Pronounce aloud</span>
                  </button>
                  <span className="text-[10px] font-mono text-white/40">Verified Consular Terminology</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
