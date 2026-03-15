import { useState, useEffect, useRef } from 'react';
import { Code2, ExternalLink, X, TrendingUp, Tag, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const embedUrl = 'https://codeforces-metric.vercel.app/';


const overviewSection = {
  title: 'Codeforces Metric',
  description:
    'A client-side Codeforces profile analyzer that provides rating breakdowns, tag insights, productivity timing, language stats, contest source categorization, friend comparisons and goal-based DSA tracking - all built with plain JS and Codeforces public APIs.'
};

function DsaHelperPage() {
  const [isEmbedOpen, setIsEmbedOpen] = useState(false);

  const [iframeLoading, setIframeLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const iframeTimerRef = useRef<number | null>(null);

  const [showTransition, setShowTransition] = useState(true);
  const [transitionVisible, setTransitionVisible] = useState(false);

  useEffect(() => {
    // Play module transition on mount
    setTransitionVisible(true);
    const fadeOut = window.setTimeout(() => setTransitionVisible(false), 1000);
    const finish = window.setTimeout(() => setShowTransition(false), 1400);

    return () => {
      window.clearTimeout(fadeOut);
      window.clearTimeout(finish);
    };
  }, []);

  useEffect(() => {
    // Manage iframe loading / timeout when modal opens/closes
    if (isEmbedOpen) {
      setIframeError(false);
      setIframeLoading(true);
      iframeTimerRef.current = window.setTimeout(() => {
        setIframeLoading(false);
        setIframeError(true);
      }, 8000) as unknown as number;
    } else {
      if (iframeTimerRef.current) {
        window.clearTimeout(iframeTimerRef.current);
        iframeTimerRef.current = null;
      }
      setIframeLoading(false);
      setIframeError(false);
    }
  }, [isEmbedOpen]);

  const openEmbed = () => {
    setIsEmbedOpen(true);
  };

  const handleIframeLoad = () => {
    setIframeLoading(false);
    setIframeError(false);
    if (iframeTimerRef.current) {
      window.clearTimeout(iframeTimerRef.current);
      iframeTimerRef.current = null;
    }
  };

  const handleModalClose = () => {
    setIsEmbedOpen(false);
    setIframeLoading(false);
    setIframeError(false);
    if (iframeTimerRef.current) {
      window.clearTimeout(iframeTimerRef.current);
      iframeTimerRef.current = null;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50 to-white relative overflow-x-hidden">
        
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #d1d5db 1px, transparent 1px),
              linear-gradient(to bottom, #d1d5db 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="absolute left-8 top-0 bottom-0 hidden lg:flex flex-col justify-around py-16 z-20">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg border-4 border-gray-600" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-tl from-gray-300 to-gray-200" />
            </div>
          ))}
        </div>

        <div className="absolute left-28 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 via-red-300 to-red-400 shadow-sm z-20 hidden lg:block" />

        <div
          className="absolute top-0 right-40 w-16 h-64 bg-gradient-to-b from-purple-600 to-purple-700 shadow-xl z-30 hidden md:block"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)' }}
        />

        <div className="absolute top-0 right-0 w-32 h-32 z-30 hidden md:block">
          <div
            className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-gray-300 to-gray-100 shadow-2xl"
            style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)', transform: 'rotateZ(0deg)' }}
          />
          <div
            className="absolute top-0 right-0 w-full h-full bg-gradient-to-tl from-purple-100 to-white"
            style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }}
          />
        </div>

<div className="relative mx-2 sm:mx-4 md:mx-8 pt-8 sm:pt-12 pb-12 sm:pb-16 flex justify-center">
        
          <div className="flex-1 max-w-4xl">
            <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-3xl shadow-2xl border-4 border-purple-300 overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(126, 34, 206, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6)' }}>
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`, backgroundRepeat: 'repeat', backgroundSize: '200px 200px' }} />

              <div className="relative p-4 sm:p-8 pb-6 border-b-2 border-dashed border-purple-200">
                <div className="inline-block relative">
                  <div className="absolute inset-0 bg-yellow-200 transform -skew-x-12 opacity-40" />
                  <h2 className="text-3xl sm:text-4xl text-purple-900 relative px-4" style={{ fontFamily: 'Georgia, serif' }}>{overviewSection.title}</h2>
                </div>
                <div className="mt-3 sm:mt-0 sm:absolute sm:top-4 sm:right-6">
                  <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="text-purple-600 border-2 border-transparent hover:border-purple-300 hover:bg-purple-50">
                    ← Back
                  </Button>
                </div>
              </div>

              <div className="p-4 sm:p-8 space-y-6">
                <div className="bg-purple-50/50 border-l-8 border-purple-600 rounded-r-xl p-6 shadow-inner">
                  <p className="text-sm sm:text-base text-gray-800 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>{overviewSection.description}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                    <Button onClick={openEmbed} className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 text-white px-8 py-6 text-base sm:text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                      <Code2 className="w-5 h-5 mr-2" />
                      Launch Here
                    </Button>

                    <Button variant="outline" onClick={() => window.open(embedUrl, '_blank')} className="border-3 border-purple-600 text-purple-700 hover:bg-purple-50 px-8 py-6 text-base sm:text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all">
                      <ExternalLink className="w-5 h-5 mr-2" />
                      Open in New Tab
                    </Button>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div className="bg-white rounded-xl p-5 border-2 border-purple-200 shadow-md hover:shadow-xl transition-all hover:border-purple-400 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100 rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mb-3">
                            <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-purple-900 mb-2">Track Progress</h3>
                          <p className="text-xs sm:text-sm text-gray-600">Monitor rating changes and problem-solving patterns</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-5 border-2 border-purple-200 shadow-md hover:shadow-xl transition-all hover:border-purple-400 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-3">
                            <Tag className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-blue-900 mb-2">Topic Analysis</h3>
                          <p className="text-xs sm:text-sm text-gray-600">Identify strengths and weaknesses by problem tags</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-5 border-2 border-purple-200 shadow-md hover:shadow-xl transition-all hover:border-purple-400 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mb-3">
                            <Clock className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-green-900 mb-2">Peak Performance</h3>
                          <p className="text-xs sm:text-sm text-gray-600">Find your most productive coding hours</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-5 border-2 border-purple-200 shadow-md hover:shadow-xl transition-all hover:border-purple-400 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-100 rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center mb-3">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-amber-900 mb-2">Friend Compare</h3>
                          <p className="text-xs sm:text-sm text-gray-600">Compete and compare with your coding buddies</p>
                        </div>
                      </div>
                </div>



                
              </div>

              <div className="px-8 py-4 border-t-2 border-purple-200 bg-purple-50/50 flex justify-between items-center">
                <div className="text-xs sm:text-sm text-gray-500">V.I.D.H.Y.A • Codeforces Module</div>
                <div className="text-xs sm:text-sm text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>Page 1</div>
              </div>
            </div>

            <div className="mt-8 hidden lg:flex gap-4 justify-end mr-10">
              <div className="bg-yellow-100 p-5 shadow-xl transform rotate-2 border-b-4 border-yellow-400 rounded-sm max-w-xs mr-10">
                <p className="text-sm text-gray-700 mb-2" style={{ fontFamily: 'cursive' }}>
                  <strong>Quick Tip:</strong>
                </p>
                <p className="text-xs text-gray-600">Focus on problem quality over quantity. Solve fewer problems deeply rather than many superficially!</p>
              </div>

              <div className="bg-green-100 p-5 shadow-xl transform -rotate-1 border-b-4 border-green-400 rounded-sm max-w-xs">
                <p className="text-sm text-gray-700 mb-2" style={{ fontFamily: 'cursive' }}>
                  <strong>Study Hack:</strong>
                </p>
                <p className="text-xs text-gray-600">Review your solutions after 24 hours. Spaced repetition is key! 🧠</p>
              </div>
            </div>
          </div>
        </div>

        
      </div>

      {showTransition && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-all duration-500 ${transitionVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="text-6xl font-hand text-purple-800 tracking-wide">Module 1</div>
        </div>
      )}

      <Dialog open={isEmbedOpen} onOpenChange={(open) => { if (!open) handleModalClose(); else setIsEmbedOpen(true); }}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-7xl h-[88vh] p-0 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b-2 border-purple-300 bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Code2 className="w-6 h-6 text-purple-700" />
                <h3 className="text-base sm:text-2xl text-purple-800 truncate" style={{ fontFamily: 'Georgia, serif' }}>DSA Helper - Codeforces Metrics</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => window.open(embedUrl, '_blank')} className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 border-2 border-transparent hover:border-purple-300">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in new tab
                </Button>
                <Button variant="ghost" size="sm" onClick={handleModalClose} className="text-gray-600 hover:text-gray-700 hover:bg-gray-100">
                  Close
                </Button>
              </div>
            </div>

            <div className="flex-1 bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100">
              <div className="relative h-full flex items-stretch">
                {iframeLoading && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/70">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                )}

                {iframeError && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/90 p-6 text-center">
                    <p className="text-lg text-slate-700 mb-3">Embedding blocked or taking too long.</p>
                    <div className="flex gap-3">
                      <Button onClick={() => window.open(embedUrl, '_blank')}>Open in new tab</Button>
                      <Button variant="outline" onClick={() => { setIframeError(false); setIframeLoading(true); iframeTimerRef.current = window.setTimeout(() => { setIframeLoading(false); setIframeError(true); }, 8000) as unknown as number; }}>Retry</Button>
                    </div>
                  </div>
                )}

                <iframe
                  src={embedUrl}
                  className="w-full h-full border-0"
                  title="DSA Helper - Codeforces Metrics"
                  onLoad={handleIframeLoad}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DsaHelperPage;
