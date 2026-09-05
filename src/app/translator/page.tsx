'use client';

import React, { useState } from 'react';
import { Languages, Volume2, Mic, ArrowRightLeft, Sparkles } from 'lucide-react';

const SAMPLE_PHRASES: Record<string, Record<string, string>> = {
  'Where is the nearest drinking water?': {
    Hindi: 'Paas mein peene ka paani kahan hai?',
    Tamil: 'Kitta kudinga thanni enga irukku?',
    Telugu: 'Daggarloni taage neellu ekkada unnaayi?',
    Bengali: 'Kache khabar jol kothay pabo?'
  },
  'How much is the ticket for this monument?': {
    Hindi: 'Is smarak ka ticket kitne ka hai?',
    Tamil: 'Indha idathukku ticket evvalavu?',
    Telugu: 'Ee sthalaniki ticket entha?',
    Bengali: 'Ei jaigar ticket er daam koto?'
  },
  'Please do not take photos without permission': {
    Hindi: 'Kripya bina anumati ke tasveerein na lein.',
    Tamil: 'Anumathi illamal padam edukkaadheergal.',
    Telugu: 'Anumathi lekunda photo lu teeyavaddu.',
    Bengali: 'Onumoti chara chobi tulben na.'
  },
  'Can you help me find a verified homestay?': {
    Hindi: 'Kya aap mujhe kisi pramanit homestay ka pata bata sakte hain?',
    Tamil: 'Oru nalla homestay paakka udhavuveengala?',
    Telugu: 'Oka manchi homestay kanukodaniki sahayapadathara?',
    Bengali: 'Apni ki amake kono bhalo homestay khujte sahajjo korben?'
  }
};

export default function TranslatorPage() {
  const [inputText, setInputText] = useState('Where is the nearest drinking water?');
  const [targetLang, setTargetLang] = useState('Hindi');
  const [translatedText, setTranslatedText] = useState('Paas mein peene ka paani kahan hai?');

  const handleTranslate = (text: string, lang: string) => {
    setInputText(text);
    if (SAMPLE_PHRASES[text] && SAMPLE_PHRASES[text][lang]) {
      setTranslatedText(SAMPLE_PHRASES[text][lang]);
    } else {
      setTranslatedText(`[${lang} Regional Dialect Translation for: "${text}"]`);
    }
  };

  const playSpeech = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="container translator-page">
      <div className="page-header">
        <span className="badge badge-cyan">Bhashini-Inspired Speech & Text</span>
        <h1>Regional Indian Dialect Translator</h1>
        <p>Break language barriers with instant bidirectional regional voice readout across Hindi, Tamil, Telugu, and Bengali.</p>
      </div>

      <div className="translator-card glass-panel">
        <div className="card-top-controls">
          <div className="lang-box">
            <span className="lang-label">Input Language:</span>
            <strong>English (Global)</strong>
          </div>

          <div className="swap-icon">
            <ArrowRightLeft size={20} className="text-saffron" />
          </div>

          <div className="lang-box">
            <span className="lang-label">Target Regional Language:</span>
            <select 
              value={targetLang} 
              onChange={(e) => {
                setTargetLang(e.target.value);
                handleTranslate(inputText, e.target.value);
              }}
              className="form-select"
            >
              <option value="Hindi">Hindi (Northern / Central)</option>
              <option value="Tamil">Tamil (Tamil Nadu)</option>
              <option value="Telugu">Telugu (Andhra / Telangana)</option>
              <option value="Bengali">Bengali (West Bengal)</option>
            </select>
          </div>
        </div>

        <div className="translation-boxes">
          {/* Input Box */}
          <div className="box-half">
            <label className="form-label">Type or Select Phrase</label>
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => handleTranslate(e.target.value, targetLang)}
              className="form-textarea"
            />
          </div>

          {/* Translated Output Box */}
          <div className="box-half translated-box">
            <div className="box-header-row">
              <label className="form-label">Pronunciation & Translation ({targetLang})</label>
              <button onClick={() => playSpeech(translatedText)} className="btn btn-secondary btn-sm">
                <Volume2 size={16} /> Listen Audio
              </button>
            </div>
            <div className="translated-output">
              {translatedText}
            </div>
          </div>
        </div>

        {/* Quick Travel Phrases */}
        <div className="quick-phrases">
          <h4>Essential Tourist Quick-Phrases:</h4>
          <div className="chips-row">
            {Object.keys(SAMPLE_PHRASES).map((phrase, i) => (
              <button
                key={i}
                onClick={() => handleTranslate(phrase, targetLang)}
                className={`phrase-chip ${inputText === phrase ? 'active' : ''}`}
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
