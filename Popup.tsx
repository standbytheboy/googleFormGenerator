// Popup.tsx
import React, { useState } from 'react';
import { createFormFromJson } from './formsApi';
import { FormJson } from './types';

export default function Popup() {
  const [status, setStatus] = useState<string>('Aguardando arquivo...');
  const [formLink, setFormLink] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content) as FormJson;
        
        setStatus('Criando formulário no Google Drive...');
        
        // Dispara a criação via API
        const link = await createFormFromJson(jsonData);
        
        setStatus('Sucesso!');
        setFormLink(link);
      } catch (error) {
        setStatus(`Erro: ${(error as Error).message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-80 p-6 bg-slate-50 flex flex-col items-center shadow-lg rounded-xl">
      <h1 className="text-xl font-bold text-slate-800 mb-4 text-center">
        Gerador de Forms
      </h1>
      
      <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors w-full text-center mb-4">
        Fazer Upload do JSON
        <input 
          type="file" 
          accept=".json" 
          className="hidden" 
          onChange={handleFileUpload} 
        />
      </label>

      <p className="text-sm text-slate-600 text-center mb-4">
        {status}
      </p>

      {formLink && (
        <a 
          href={formLink} 
          target="_blank" 
          rel="noreferrer"
          className="text-blue-500 hover:text-blue-700 underline text-sm"
        >
          Abrir Formulário Gerado
        </a>
      )}
    </div>
  );
}