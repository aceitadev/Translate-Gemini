// Importação das dependências
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config.json');

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

const getGeminiModel = () => {
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
};

function parseLanguageCodes(langCode) {
    const languageMap = {
        'pt': 'português',
        'en': 'inglês',
        'es': 'espanhol',
    };

    return languageMap[langCode] || langCode;
}

app.get('/translate/:langPair/:text', async (req, res) => {
    try {
        const { langPair, text } = req.params;
        const decodedText = decodeURIComponent(text);

        const [sourceCode, targetCode] = langPair.split('-');

        if (!sourceCode || !targetCode) {
            return res.status(400).json({
                error: 'Formato inválido. Use: /translate/idioma1-idioma2/texto'
            });
        }

        const sourceLanguage = parseLanguageCodes(sourceCode);
        const targetLanguage = parseLanguageCodes(targetCode);

        if (sourceLanguage === sourceCode) {
            return res.status(400).json({
                error: 'Formato inválido. Use: /translate/idioma1-idioma2/texto'
            });
        }

        if (targetLanguage === targetCode) {
            return res.status(400).json({
                error: 'Formato inválido. Use: /translate/idioma1-idioma2/texto'
            });
        }

        const model = getGeminiModel();

        const prompt = `Traduza o seguinte texto do ${sourceLanguage} para ${targetLanguage}:\n\n"${decodedText}"\n\nApenas retorne o texto traduzido, sem explicações adicionais.`;

        const result = await model.generateContent(prompt);
        const translation = result.response.text().trim();

        return res.json({
            original: decodedText,
            translated: translation,
            sourceLanguage,
            targetLanguage
        });

    } catch (error) {
        console.error('Erro ao traduzir:', error);
        return res.status(500).json({
            error: 'Erro ao processar a tradução',
            details: error.message
        });
    }
});

app.get('/detect-language/:text', async (req, res) => {
    try {
        const text = decodeURIComponent(req.params.text);

        if (!text) {
            return res.status(400).json({ error: 'O texto é obrigatório' });
        }

        const model = getGeminiModel();
        const prompt = `Qual é o idioma do seguinte texto? Responda apenas com o nome do idioma em português:\n\n"${text}"`;

        const result = await model.generateContent(prompt);
        const language = result.response.text().trim();

        return res.json({
            text,
            detectedLanguage: language
        });

    } catch (error) {
        console.error('Erro ao detectar idioma:', error);
        return res.status(500).json({
            error: 'Erro ao detectar idioma',
            details: error.message
        });
    }
});

app.get('/', (req, res) => {
    res.send(`
    <html>
      <head>
        <title>API de Tradução com Gemini</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
          pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>API de Tradução com Google Gemini</h1>
        <h2>Como usar:</h2>
        
        <h3>1. Tradução</h3>
        <pre>GET /translate/{idioma-origem}-{idioma-destino}/{texto}</pre>
        <p>Exemplo: <a href="/translate/pt-en/olá%20mundo" target="_blank">/translate/pt-en/olá mundo</a></p>
        
        <h3>2. Detecção de idioma</h3>
        <pre>GET /detect-language/{texto}</pre>
        <p>Exemplo: <a href="/detect-language/hello%20world" target="_blank">/detect-language/hello world</a></p>
        
        <h3>Códigos de idioma suportados:</h3>
        <ul>
          <li><code>pt</code> - Português</li>
          <li><code>en</code> - Inglês</li>
          <li><code>es</code> - Espanhol</li>
        </ul>
      </body>
    </html>
  `);
});

app.listen(3000, () => {
    console.log(`Servidor rodando na porta 3000`);
});