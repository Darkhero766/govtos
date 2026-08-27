'use client';

import { useEffect } from 'react';

const DICT: Record<string, string> = {
  'First Response':'फर्स्ट रिस्पॉन्स','Cyber help, made understandable':'साइबर मदद, आसान भाषा में','Online safety':'ऑनलाइन सुरक्षा','Check a signal':'सिग्नल जाँचें','Track':'ट्रैक करें','CITIZEN CYBER RESPONSE':'नागरिक साइबर सहायता','Something happened online?':'ऑनलाइन कुछ हुआ?','Start here.':'यहाँ से शुरू करें।','Tell us what happened in your own words. First Response helps you understand the risk, preserve evidence and choose the right next step.':'हमें अपने शब्दों में बताइए कि क्या हुआ। फर्स्ट रिस्पॉन्स जोखिम समझने, सबूत सुरक्षित रखने और सही अगला कदम चुनने में मदद करता है।','AI-guided':'एआई सहायता','Evidence-first':'सबूत पहले','Human-readable':'आसान भाषा','CHOOSE A STARTING POINT':'शुरुआत चुनें','What do you need right now?':'अभी आपको किस मदद की ज़रूरत है?','URGENT · FINANCIAL FRAUD':'तुरंत · वित्तीय धोखाधड़ी','Money is moving right now':'अभी पैसे जा रहे हैं','Act first. Get the 1930 route and prepare the essentials.':'पहले कार्रवाई करें। 1930 पर संपर्क करें और ज़रूरी जानकारी तैयार रखें।','ONLINE SAFETY MODE':'ऑनलाइन सुरक्षा मोड','I’m being bullied or threatened':'मुझे परेशान या धमकाया जा रहा है','Build an evidence-first safety plan for harassment, threats or blackmail.':'परेशानी, धमकी या ब्लैकमेल के लिए सबूत-आधारित सुरक्षा योजना बनाएँ।','REPORT':'रिपोर्ट','I need to report something':'मुझे कुछ रिपोर्ट करना है','Cyberbullying, impersonation, account takeover, scams and more.':'साइबरबुलिंग, पहचान की नकल, अकाउंट टेकओवर, स्कैम और अन्य मामले।','TRACK':'ट्रैक','I already filed a complaint':'मैंने पहले ही शिकायत दर्ज की है','Find your reference and understand what happens next.':'अपना रेफरेंस ढूँढें और जानें कि आगे क्या होगा।','CYBERCRIME INTELLIGENCE':'साइबर अपराध जानकारी','Check a phone, UPI ID, URL or social handle.':'फोन, UPI ID, URL या सोशल हैंडल जाँचें।','Search available risk signals before you trust it. A clean result is never a guarantee of safety.':'भरोसा करने से पहले उपलब्ध जोखिम संकेत जाँचें। साफ परिणाम सुरक्षा की गारंटी नहीं है।','Check a signal →':'सिग्नल जाँचें →','HOW IT WORKS':'यह कैसे काम करता है','From confusion to a clear trail.':'उलझन से स्पष्ट रास्ते तक।','Understand':'समझें','Preserve':'सुरक्षित रखें','Act':'कार्रवाई करें','MADE FOR REAL PEOPLE':'वास्तविक लोगों के लिए','Type it. Speak it. Even in Hindi.':'लिखें। बोलें। हिंदी में भी।','Try AI helper ✦':'एआई मदद आज़माएँ ✦','QUICK ACCESS':'त्वरित पहुँच','OFFICIAL ROUTES':'आधिकारिक रास्ते','Independent citizen-service interface':'स्वतंत्र नागरिक-सेवा इंटरफ़ेस','Use official government channels for actual filing':'वास्तविक शिकायत के लिए आधिकारिक सरकारी चैनलों का उपयोग करें','Talk to First Response':'फर्स्ट रिस्पॉन्स से बात करें','For children, families and anyone who feels stuck.':'बच्चों, परिवारों और किसी भी ऐसे व्यक्ति के लिए जो समझ नहीं पा रहा कि क्या करे।','Need help?':'मदद चाहिए?','Tell me what happened…':'बताइए क्या हुआ…','Never share passwords, OTPs, PINs or private intimate images here.':'यहाँ पासवर्ड, OTP, PIN या निजी अंतरंग तस्वीरें साझा न करें।','Hey! 👋 I’m here with you.':'नमस्ते! 👋 मैं आपकी मदद के लिए यहाँ हूँ।','Tell me what happened online, in your own words.':'ऑनलाइन क्या हुआ, अपने शब्दों में बताइए।','You don’t need to know the right category.':'आपको सही श्रेणी जानना ज़रूरी नहीं है।','We’ll take it one small step at a time.':'हम एक-एक छोटे कदम से आगे बढ़ेंगे।','REPORT A CYBERCRIME':'साइबर अपराध रिपोर्ट करें','Tell the story first.':'पहले पूरी बात बताइए।','Describe what happened':'बताइए क्या हुआ','What happened?':'क्या हुआ?','Platform (Instagram, WhatsApp, UPI…)':'प्लेटफ़ॉर्म (Instagram, WhatsApp, UPI…)','When did it happen?':'यह कब हुआ?','Check suspicious content':'संदिग्ध सामग्री जाँचें','Paste suspicious content here…':'संदिग्ध सामग्री यहाँ पेस्ट करें…','Explain the signal with AI':'एआई से सिग्नल समझें','EVIDENCE VAULT':'सबूत संग्रह','Keep the useful pieces together':'ज़रूरी सबूत एक जगह रखें','Screenshot':'स्क्रीनशॉट','Phone / UPI':'फोन / UPI','URL / profile':'URL / प्रोफ़ाइल','Notes':'नोट्स','Add item':'आइटम जोड़ें','Timeline tip':'टाइमलाइन सुझाव','Build a clean trail before you report.':'रिपोर्ट करने से पहले साफ सबूत तैयार करें।','Prepare my complaint →':'मेरी शिकायत तैयार करें →','Build my report →':'मेरी रिपोर्ट बनाएँ →','CASE TRACKER':'केस ट्रैकर','Know what happens next.':'जानें कि आगे क्या होगा।','Search your First Response reference to see the current case trail.':'अपने फर्स्ट रिस्पॉन्स रेफरेंस से केस की वर्तमान स्थिति देखें।','Load available case records':'उपलब्ध केस रिकॉर्ड लोड करें','CASE JOURNEY':'केस यात्रा','Typical':'आमतौर पर','days':'दिन','CASE PREPARED':'केस तैयार है','Your trail is ready.':'आपका केस रिकॉर्ड तैयार है।','Continue to official reporting →':'आधिकारिक रिपोर्टिंग पर जाएँ →','Return to First Response':'फर्स्ट रिस्पॉन्स पर लौटें','Back':'वापस','Search':'खोजें','Find':'ढूँढें','Financial fraud':'वित्तीय धोखाधड़ी','Cybercrime report':'साइबर अपराध रिपोर्ट','Cyberbullying':'साइबरबुलिंग','Online threat':'ऑनलाइन धमकी','Impersonation':'पहचान की नकल','Blackmail':'ब्लैकमेल','Account takeover':'अकाउंट टेकओवर','Repeated harassment':'बार-बार परेशान करना','Threats':'धमकियाँ','Intimate-image abuse':'निजी तस्वीरों का दुरुपयोग','WHAT’S HAPPENING?':'क्या हो रहा है?','Choose the closest fit':'सबसे सही विकल्प चुनें','YOUR FIRST STEPS':'आपके पहले कदम','EVIDENCE FIRST':'सबूत पहले','Create case & continue →':'केस बनाएँ और आगे बढ़ें →','Structure my complaint with AI':'एआई से मेरी शिकायत व्यवस्थित करें','Drafting…':'तैयार किया जा रहा है…','No matching signal found.':'कोई मिलान वाला सिग्नल नहीं मिला।','Use in my report →':'मेरी रिपोर्ट में उपयोग करें →','RISK SIGNAL':'जोखिम सिग्नल','available reports':'उपलब्ध रिपोर्ट','Pattern:':'पैटर्न:','Source:':'स्रोत:','Last reported':'अंतिम रिपोर्ट','Connected to complaint database':'शिकायत डेटाबेस से जुड़ा है','Demo records available · connect Supabase for shared storage':'डेमो रिकॉर्ड उपलब्ध हैं · साझा स्टोरेज के लिए Supabase कनेक्ट करें'
};

function translateText(value: string) { return DICT[value.replace(/\s+/g, ' ').trim()] ?? null; }

export default function HindiTranslate() {
  useEffect(() => {
    let hindi = false;
    let applying = false;
    const originals = new WeakMap<Text, string>();

    const apply = () => {
      if (applying) return;
      applying = true;
      try {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const nodes: Text[] = [];
        let node: Node | null;
        while ((node = walker.nextNode())) nodes.push(node as Text);
        nodes.forEach(text => {
          const parent = text.parentElement;
          if (!parent || parent.closest('#google_translate_element') || parent.classList.contains('lang-pill') || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') return;
          if (!originals.has(text)) originals.set(text, text.nodeValue ?? '');
          const original = originals.get(text) ?? '';
          if (hindi) { const translated = translateText(original); if (translated) text.nodeValue = translated; }
          else text.nodeValue = original;
        });
        document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[placeholder], textarea[placeholder]').forEach(el => {
          const key = 'data-fr-original-placeholder';
          if (!el.hasAttribute(key)) el.setAttribute(key, el.getAttribute('placeholder') ?? '');
          const original = el.getAttribute(key) ?? '';
          el.placeholder = hindi ? (translateText(original) ?? original) : original;
        });
      } finally { applying = false; }
    };

    const attach = () => {
      const button = document.querySelector<HTMLElement>('.lang-pill');
      if (!button || button.dataset.frHindiBound === 'true') return;
      button.dataset.frHindiBound = 'true';
      button.setAttribute('role', 'button');
      button.setAttribute('tabindex', '0');
      const toggle = () => { hindi = !hindi; document.documentElement.lang = hindi ? 'hi' : 'en'; button.textContent = hindi ? 'English' : 'हिंदी'; button.setAttribute('aria-label', hindi ? 'Switch to English' : 'हिंदी में बदलें'); apply(); };
      button.addEventListener('click', toggle);
      button.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    };

    attach();
    const observer = new MutationObserver(() => { attach(); if (hindi) window.requestAnimationFrame(apply); });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
