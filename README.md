# Gerador de Google Forms via JSON (Extensao)

Este projeto cria formularios do Google Forms a partir de um JSON colado no popup da extensao.

## 1) Pre-requisitos

- Conta Google
- Acesso ao [Google Cloud Console](https://console.cloud.google.com/)
- Chrome (ou Edge/Chromium) para carregar extensao em modo desenvolvedor

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
3. Preencha os campos obrigatorios:
   - App name
   - User support email
   - Developer contact email
4. Em **Scopes**, adicione:
   - `https://www.googleapis.com/auth/forms.body`
5. Salve e avance ate concluir.

> Dica: enquanto estiver em teste, adicione seu proprio email em **Test users**.

## 5) Criar credencial OAuth para extensao

1. Vá em **APIs & Services** > **Credentials**.
2. Clique em **Create Credentials** > **OAuth client ID**.
3. Em tipo de aplicacao, selecione **Chrome App** (ou equivalente para extensao, dependendo da interface atual).
4. Informe o **Application ID da extensao** quando solicitado:
   - Primeiro carregue a extensao localmente (passo 7) para obter esse ID.
5. Crie a credencial e copie o **Client ID** (termina com `.apps.googleusercontent.com`).

## 6) Atualizar o `manifest.json`

No arquivo `manifest.json`, substitua pelo seu client ID real do Google Cloud

```json
"client_id": "SEU_CLIENT_ID_DO_GOOGLE_CLOUD.apps.googleusercontent.com"
```

Verifique tambem se o scope esta assim:

```json
"scopes": [
  "https://www.googleapis.com/auth/forms.body"
]
```

## 7) Carregar a extensao no navegador

1. Abra `chrome://extensions` (ou `edge://extensions`).
2. Ative **Developer mode**.
3. Clique em **Load unpacked**.
4. Selecione a pasta deste projeto (`tete`).
5. Copie o **Extension ID** exibido.

Se o Google Cloud pedir esse ID na credencial OAuth de extensao, volte ao passo 5 e preencha com ele.

## 8) Testar o fluxo

1. Clique no icone da extensao.
2. Cole um JSON como este:

```json
{
  "title": "Quiz rapido",
  "questions": [
    {
      "type": "text",
      "text": "Quanto e 7 + 5?",
      "correctAnswer": "12"
    },
    {
      "type": "radio",
      "text": "Capital do Brasil?",
      "options": ["Sao Paulo", "Brasilia", "Rio de Janeiro"],
      "correctAnswer": "Brasilia",
      "points": 2
    }
  ]
}
```

O formulario e criado **em modo teste** (`isQuiz`). Cada pergunta exige `correctAnswer`; para `radio`, esse valor deve ser **identico** a uma das strings em `options`. Opcional: `points` (inteiro >= 0, padrao 1).

3. Clique em **Criar formulario no Google**.
4. Autorize o acesso quando o popup de login/permissao aparecer.
5. Abra o link do formulario gerado.

## 9) Erros comuns e como resolver

- **Erro ao obter token**
  - `client_id` incorreto no `manifest.json`
  - credencial OAuth criada para tipo errado de app
  - extensao com ID diferente do registrado no Google Cloud

- **401/403 na API**
  - Google Forms API nao habilitada
  - scope `forms.body` ausente
  - usuario nao autorizado na tela de consentimento (modo teste)

- **Popup abre, mas nao cria formulario**
  - confira o JSON (tipos aceitos: `text` e `radio`)
  - perguntas `radio` precisam de `options` com pelo menos 1 item
  - toda pergunta precisa de `correctAnswer`; em `radio`, deve coincidir com uma opcao

## 10) Estrutura esperada do JSON

```json
{
  "title": "Titulo do formulario",
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

# googleFormGenerator
