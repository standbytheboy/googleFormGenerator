# Gerador de Google Forms via JSON (Extensão)

Este projeto cria formulários do Google Forms a partir de um JSON colado no popup da extensão.

## 1) Pré-requisitos

- Conta Google
- Acesso ao [Google Cloud Console](https://console.cloud.google.com/)
- Chrome (ou Edge/Chromium) para carregar extensão em modo desenvolvedor

## 2) Criar projeto no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. No topo, clique em **Select a project** > **New Project**.
3. Dê um nome (ex.: `forms-json-extension`) e clique em **Create**.
4. Selecione o projeto criado.

## 3) Habilitar a API do Google Forms

1. No menu lateral, vá em **APIs & Services** > **Library**.
2. Pesquise por **Google Forms API**.
3. Clique em **Enable**.

## 4) Configurar tela de consentimento OAuth

1. Vá em **APIs & Services** > **OAuth consent screen**.
2. Escolha **External** (ou **Internal** se for Google Workspace da empresa).
3. Preencha os campos obrigatórios:
   - App name
   - User support email
   - Developer contact email
4. Em **Scopes**, adicione:
   - `https://www.googleapis.com/auth/forms.body`
5. Salve e avance até concluir.

> **Dica:** enquanto estiver em teste, adicione seu próprio e-mail em **Test users**.

## 5) Criar credencial OAuth para extensão

1. Vá em **APIs & Services** > **Credentials**.
2. Clique em **Create Credentials** > **OAuth client ID**.
3. Em tipo de aplicação, selecione **Chrome App** (ou equivalente para extensão, dependendo da interface atual).
4. Informe o **Application ID da extensão** quando solicitado:
   - Primeiro carregue a extensão localmente (passo 7) para obter esse ID.
5. Crie a credencial e copie o **Client ID** (termina com `.apps.googleusercontent.com`).

## 6) Atualizar o `example.manifest.json`

No arquivo `example.manifest.json`, substitua pelo seu client ID real do Google Cloud:

```json
"client_id": "SEU_CLIENT_ID_DO_GOOGLE_CLOUD.apps.googleusercontent.com"
```

Verifique também se o scope está assim:

```json
"scopes": [
  "https://www.googleapis.com/auth/forms.body"
]
```

Renomeie o arquivo para `manifest.json`.

## 7) Carregar a extensão no navegador

1. Abra `chrome://extensions` (ou `edge://extensions`).
2. Ative o **Developer mode**.
3. Clique em **Load unpacked**.
4. Selecione a pasta deste projeto (`tete`).
5. Copie o **Extension ID** exibido.

Se o Google Cloud pedir esse ID na credencial OAuth de extensão, volte ao passo 5 e preencha com ele.

## 8) Testar o fluxo

1. Clique no ícone da extensão.
2. Cole um JSON como este:

```json
{
  "title": "Quiz rápido",
  "questions": [
    {
      "type": "text",
      "text": "Quanto é 7 + 5?",
      "correctAnswer": "12"
    },
    {
      "type": "radio",
      "text": "Capital do Brasil?",
      "options": ["São Paulo", "Brasília", "Rio de Janeiro"],
      "correctAnswer": "Brasília",
      "points": 2
    }
  ]
}
```

O formulário é criado **em modo teste** (`isQuiz`). Cada pergunta exige `correctAnswer`; para `radio`, esse valor deve ser **idêntico** a uma das strings em `options`. Opcional: `points` (inteiro >= 0, padrão 1).

3. Clique em **Criar formulário no Google**.
4. Autorize o acesso quando o popup de login/permissão aparecer.
5. Abra o link do formulário gerado.

## 9) Erros comuns e como resolver

- **Erro ao obter token**
  - `client_id` incorreto no `manifest.json`
  - credencial OAuth criada para tipo errado de app
  - extensão com ID diferente do registrado no Google Cloud

- **401/403 na API**
  - Google Forms API não habilitada
  - scope `forms.body` ausente
  - usuário não autorizado na tela de consentimento (modo teste)

- **Popup abre, mas não cria formulário**
  - confira o JSON (tipos aceitos: `text` e `radio`)
  - perguntas `radio` precisam de `options` com pelo menos 1 item
  - toda pergunta precisa de `correctAnswer`; em `radio`, deve coincidir com uma opção

## 10) Estrutura esperada do JSON

```json
{
  "title": "Título do formulário",
  "questions": [
    {
      "type": "text",
      "text": "Pergunta aberta (resposta exata)",
      "correctAnswer": "resposta esperada"
    },
    {
      "type": "radio",
      "text": "Pergunta de escolha",
      "options": ["A", "B"],
      "correctAnswer": "A",
      "points": 1
    }
  ]
}
```