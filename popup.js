// Formulário sempre em modo quiz (teste), com resposta correta por pergunta.
// Estrutura esperada do JSON:
// {
//   "title": "Título do formulário",
//   "questions": [
//     { "type": "text", "text": "Pergunta 1", "correctAnswer": "texto exato" },
//     {
//       "type": "radio",
//       "text": "Pergunta 2",
//       "options": ["Opção A", "Opção B"],
//       "correctAnswer": "Opção A"
//     }
//   ]
// }
// Opcional por pergunta: "points": 2 (padrão 1)

// Obtém token OAuth2 usando chrome.identity
function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(chrome.runtime.lastError?.message || "Erro ao obter token");
      } else {
        resolve(token);
      }
    });
  });
}

function questionPoints(q) {
  if (typeof q.points === "number" && Number.isFinite(q.points) && q.points >= 0) {
    return Math.floor(q.points);
  }
  return 1;
}

function buildGrading(q) {
  const pointValue = questionPoints(q);
  const raw = q.correctAnswer;
  if (typeof raw !== "string" || !raw.length) {
    throw new Error("correctAnswer deve ser uma string não vazia.");
  }
  return {
    pointValue,
    correctAnswers: {
      answers: [{ value: raw }],
    },
  };
}

async function formsBatchUpdate(formId, token, requests) {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });

  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const msg =
      body?.error?.message ||
      (typeof text === "string" && text ? text : "resposta vazia");
    throw new Error(`Falha na API do Forms: ${res.status} — ${msg}`);
  }
}

async function addQuestionsToForm(formId, questions, token) {
  const enableQuiz = {
    updateSettings: {
      settings: {
        quizSettings: {
          isQuiz: true,
        },
      },
      updateMask: "quizSettings",
    },
  };

  const createRequests = questions.map((q, index) => {
    let questionItem = {};
    const grading = buildGrading(q);

    if (q.type === "text") {
      questionItem = {
        textQuestion: { paragraph: false },
      };
    } else if (q.type === "radio" && Array.isArray(q.options)) {
      questionItem = {
        choiceQuestion: {
          type: "RADIO",
          options: q.options.map((opt) => ({ value: String(opt) })),
        },
      };
    }

    return {
      createItem: {
        item: {
          title: q.text,
          questionItem: {
            question: {
              required: true,
              grading,
              ...questionItem,
            },
          },
        },
        location: { index },
      },
    };
  });

  await formsBatchUpdate(formId, token, [enableQuiz, ...createRequests]);
}

async function createFormFromJson(jsonData) {
  const token = await getAuthToken();

  const createRes = await fetch("https://forms.googleapis.com/v1/forms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      info: { title: jsonData.title },
    }),
  });

  if (!createRes.ok) {
    const errorBody = await createRes.text();
    throw new Error(`Erro ao criar formulário: ${createRes.status} - ${errorBody}`);
  }

  const formData = await createRes.json();
  const formId = formData.formId;

  await addQuestionsToForm(formId, jsonData.questions || [], token);

  return `https://docs.google.com/forms/d/${formId}/edit`;
}

function setStatus(text) {
  const el = document.getElementById("status");
  if (el) el.textContent = text;
}

function setLink(url) {
  const container = document.getElementById("formLink");
  if (!container) return;
  container.innerHTML = "";
  if (!url) return;

  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noreferrer";
  a.textContent = "Abrir formulário gerado";

  container.appendChild(a);
}

function parseAndValidateJson(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error("JSON inválido. Verifique a sintaxe.");
  }

  if (!data || typeof data !== "object") {
    throw new Error("JSON deve ser um objeto.");
  }

  if (typeof data.title !== "string" || !data.title.trim()) {
    throw new Error('Campo "title" é obrigatório e deve ser string.');
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error('Campo "questions" deve ser uma lista com pelo menos 1 pergunta.');
  }

  data.questions = data.questions.map((q) => {
    const copy = { ...q };
    if (typeof copy.correctAnswer === "number" && Number.isFinite(copy.correctAnswer)) {
      copy.correctAnswer = String(copy.correctAnswer);
    }
    return copy;
  });

  data.questions.forEach((q, idx) => {
    if (!q || typeof q !== "object") {
      throw new Error(`Pergunta ${idx + 1} é inválida.`);
    }
    if (q.type !== "text" && q.type !== "radio") {
      throw new Error(
        `Pergunta ${idx + 1}: tipo inválido "${q.type}". Use "text" ou "radio".`
      );
    }
    if (typeof q.text !== "string" || !q.text.trim()) {
      throw new Error(`Pergunta ${idx + 1}: campo "text" é obrigatório.`);
    }
    if (typeof q.correctAnswer !== "string" || !q.correctAnswer.length) {
      throw new Error(
        `Pergunta ${idx + 1}: campo "correctAnswer" (string) é obrigatório para o modo teste.`
      );
    }
    if (q.points !== undefined) {
      if (
        typeof q.points !== "number" ||
        !Number.isFinite(q.points) ||
        q.points < 0
      ) {
        throw new Error(
          `Pergunta ${idx + 1}: "points", se informado, deve ser um número >= 0.`
        );
      }
    }
    if (q.type === "radio") {
      if (!Array.isArray(q.options) || q.options.length === 0) {
        throw new Error(
          `Pergunta ${idx + 1}: para "radio" é obrigatório informar "options" com pelo menos 1 opção.`
        );
      }
      const opts = q.options.map((o) => String(o));
      if (!opts.includes(q.correctAnswer)) {
        throw new Error(
          `Pergunta ${idx + 1}: "correctAnswer" deve ser exatamente uma das strings em "options".`
        );
      }
    }
  });

  return data;
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("createBtn");
  const input = document.getElementById("jsonInput");

  if (!btn || !input) return;

  btn.addEventListener("click", async () => {
    setLink(null);

    const raw = input.value.trim();
    if (!raw) {
      setStatus("Cole um JSON antes de continuar.");
      return;
    }

    btn.disabled = true;
    setStatus("Validando JSON...");

    try {
      const jsonData = parseAndValidateJson(raw);
      setStatus("Criando formulário no Google Forms...");

      const link = await createFormFromJson(jsonData);
      setStatus("Formulário criado com sucesso!");
      setLink(link);
    } catch (error) {
      setStatus(`Erro: ${error.message || error}`);
    } finally {
      btn.disabled = false;
    }
  });
});

