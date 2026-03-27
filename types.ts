// types.ts
export interface FormJson {
    title: string;
    questions: FormQuestion[];
  }
  
  export interface FormQuestion {
    type: 'text' | 'radio';
    text: string;
    /** Resposta correta (texto curto: combinação exata; múltipla escolha: valor igual a uma das options). */
    correctAnswer: string;
    options?: string[];
    /** Pontos da questão no quiz (padrão 1). */
    points?: number;
  }