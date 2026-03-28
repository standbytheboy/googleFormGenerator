export interface FormJson {
    title: string;
    questions: FormQuestion[];
  }

  export interface FormQuestion {
    type: 'text' | 'radio' | 'checkbox';
    text: string;
    correctAnswer: string | string[];
    options?: string[];
    /** Pontos da questão no quiz (padrão 1). */
    points?: number;
  }