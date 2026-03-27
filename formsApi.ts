// formsApi.ts
import { FormJson } from './types';

const getAuthToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(chrome.runtime.lastError?.message || 'Erro ao obter token');
      } else {
        resolve(token);
      }
    });
  });
};

function questionPoints(q: FormJson['questions'][0]): number {
  if (typeof q.points === 'number' && Number.isFinite(q.points) && q.points >= 0) {
    return Math.floor(q.points);
  }
  return 1;
}

function buildGrading(q: FormJson['questions'][0]) {
  const pointValue = questionPoints(q);
  const raw = q.correctAnswer;
  if (typeof raw !== 'string' || !raw.length) {
    throw new Error('correctAnswer deve ser uma string não vazia.');
  }
  return {
    pointValue,
    correctAnswers: {
      answers: [{ value: raw }],
    },
  };
}

async function formsBatchUpdate(formId: string, token: string, requests: unknown[]) {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  const text = await res.text();
  let body: { error?: { message?: string } } | null = null;
  try {
    body = text ? (JSON.parse(text) as typeof body) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const msg = body?.error?.message || (text || 'resposta vazia');
    throw new Error(`Falha na API do Forms: ${res.status} — ${msg}`);
  }
}

const addQuestionsToForm = async (formId: string, questions: FormJson['questions'], token: string) => {
  const enableQuiz = {
    updateSettings: {
      settings: {
        quizSettings: {
          isQuiz: true,
        },
      },
      updateMask: 'quizSettings',
    },
  };

  const createRequests = questions.map((q, index) => {
    let questionItem: Record<string, unknown> = {};
    const grading = buildGrading(q);

    if (q.type === 'text') {
      questionItem = {
        textQuestion: { paragraph: false },
      };
    } else if (q.type === 'radio' && q.options) {
      questionItem = {
        choiceQuestion: {
          type: 'RADIO',
          options: q.options.map((opt) => ({ value: String(opt) })),
        },
      };
    }

    return {
      createItem: {
        item: {
          title: q.text,
          questionItem: {
            question: { required: true, grading, ...questionItem },
          },
        },
        location: { index },
      },
    };
  });

  await formsBatchUpdate(formId, token, [enableQuiz, ...createRequests]);
};

export const createFormFromJson = async (jsonData: FormJson): Promise<string> => {
  const token = await getAuthToken();

  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: { title: jsonData.title },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Erro ao criar formulário: ${createRes.status} - ${errText}`);
  }

  const formData = (await createRes.json()) as { formId: string };
  const formId = formData.formId;

  await addQuestionsToForm(formId, jsonData.questions, token);

  return `https://docs.google.com/forms/d/${formId}/edit`;
};
