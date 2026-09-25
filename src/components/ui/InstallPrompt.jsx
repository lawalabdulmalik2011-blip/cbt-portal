import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownTrayIcon,
  XMarkIcon,
  DevicePhoneMobileIcon,
  ShareIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      // Re-show after 30 days
      if (Date.now() - dismissedAt < 30 * 24 * 60 * 60 * 1000) return;
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone === true) return;

    // Detect iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Handle Android/Chrome install prompt
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after delay
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // If iOS, show custom banner after delay
    if (isIOSDevice) {
      setTimeout(() => setShowBanner(true), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);

  async function handleInstall() {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowBanner(false);
  }

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none"
          >
            <div className="pointer-events-auto max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <DevicePhoneMobileIcon className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">
                  Install ExamPro
                </p>
                <p className="text-xs text-slate-500 truncate">
                  Add to home screen for faster access
                </p>
              </div>

              <button
                onClick={handleInstall}
                className="btn-primary text-xs py-2 px-3 whitespace-nowrap"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                Install
              </button>

              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 flex-shrink-0"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS instructions modal */}
      <AnimatePresence>
        {showIOSInstructions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSInstructions(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 pointer-events-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl font-extrabold text-slate-900">
                    Install on iPhone
                  </h3>
                  <button
                    onClick={() => setShowIOSInstructions(false)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <Step
                    number={1}
                    icon={ShareIcon}
                    title="Tap the Share button"
                    desc="In Safari, tap the Share icon at the bottom"
                  />
                  <Step
                    number={2}
                    icon={PlusIcon}
                    title='Tap "Add to Home Screen"'
                    desc="Scroll down in the share menu to find it"
                  />
                  <Step
                    number={3}
                    icon={DevicePhoneMobileIcon}
                    title='Tap "Add"'
                    desc="The app will appear on your home screen"
                  />
                </div>

                <button
                  onClick={() => setShowIOSInstructions(false)}
                  className="btn-primary w-full mt-6"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Step({ number, icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <Icon className="w-4 h-4 text-brand-600" />
          <p className="font-semibold text-slate-800 text-sm">{title}</p>
        </div>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  );
}