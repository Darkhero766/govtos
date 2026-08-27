'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export default function HindiTranslate() {
  useEffect(() => {
    let hindi = false;
    let observer: MutationObserver | null = null;

    const ensureWidget = () => {
      if (document.querySelector('script[data-fr-google-translate]')) return;
      window.googleTranslateElementInit = () => {
        if (!window.google?.translate?.TranslateElement) return;
        if (!document.querySelector('.goog-te-combo')) {
          new window.google.translate.TranslateElement(
            { pageLanguage: 'en', includedLanguages: 'hi,en', autoDisplay: false },
            'google_translate_element'
          );
        }
      };
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.dataset.frGoogleTranslate = 'true';
      document.head.appendChild(script);
    };

    const translate = (language: 'en' | 'hi') => {
      ensureWidget();
      const tryChange = () => {
        const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
        if (!select) { window.setTimeout(tryChange, 250); return; }
        select.value = language;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      };
      tryChange();
    };

    const attach = () => {
      const button = document.querySelector<HTMLElement>('.lang-pill');
      if (!button || button.dataset.hindiBound === 'true') return;
      button.dataset.hindiBound = 'true';
      button.setAttribute('role', 'button');
      button.setAttribute('tabindex', '0');
      button.title = 'हिंदी में अनुवाद करें';
      const toggle = () => {
        hindi = !hindi;
        translate(hindi ? 'hi' : 'en');
        button.textContent = hindi ? 'English' : 'हिंदी';
        button.title = hindi ? 'Switch to English' : 'हिंदी में अनुवाद करें';
      };
      button.addEventListener('click', toggle);
      button.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    };

    ensureWidget();
    attach();
    observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer?.disconnect();
  }, []);

  return <div id="google_translate_element" aria-hidden="true" style={{ position: 'fixed', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }} />;
}
