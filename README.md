# Criador de Anúncios – Distrito Digital

Ferramenta web da rede [Distrito Digital](https://distritodigital.com.br) para montar textos de anúncio para o guia.
É a versão web da planilha Excel/VBA: o usuário preenche os dados da empresa, escolhe um dos 5 modelos
e o texto é montado na hora, substituindo os campos num texto pré-formatado. **Não usa IA (por enquanto).**

- HTML + CSS + JavaScript puro (ES modules), organizado com [Vite](https://vite.dev)
- Sem framework, sem backend, sem banco de dados
- Deploy na Netlify

## Como rodar

Requisitos: Node.js 20.19 ou mais recente.

```bash
npm install      # instala as dependências (só o Vite)
npm run dev      # servidor local em http://localhost:5173
npm test         # testes das funções puras (gerador e checklist)
npm run build    # gera a pasta dist/ pronta para a Netlify
npm run preview  # serve a pasta dist/ localmente para conferir o build
```

## Estrutura

```
index.html          # página única (formulário, modelos, resultado)
assets/             # logo, favicon e wireframe.pdf (o PDF não vai para o build)
src/
  main.js           # interface: eventos, validação, renderização, copiar
  templates.js      # os 5 modelos e suas versões de texto (só conteúdo)
  generator.js      # gerarAnuncio(dados, idModelo, indiceVersao) → { titulo, texto, descricao, whatsappMsg, palavrasChave }
  checklist.js      # montarChecklist(saida, dados) → [{ label, ok }]
  style.css         # estilos (cores em variáveis CSS no topo)
tests/              # testes com o test runner nativo do Node (node --test)
netlify.toml        # configuração de build e deploy
```

## Como editar os textos dos modelos

Todos os textos ficam em [`src/templates.js`](src/templates.js). **Os textos atuais são provisórios** e devem
ser trocados pelos da planilha do cliente.

Cada modelo tem de 2 a 3 versões (o botão "Gerar outra versão" alterna entre elas). Cada versão tem:

| Campo       | Uso                              | Limite ideal          |
|-------------|----------------------------------|-----------------------|
| `titulo`    | título do anúncio                | até 60 caracteres     |
| `texto`     | texto do anúncio                 | 300 a 1.600 caracteres|
| `descricao` | descrição curta para o Google    | até 155 caracteres    |

A mensagem do botão de WhatsApp é a constante `mensagemWhatsapp`, no mesmo arquivo.

### Sintaxe

| Sintaxe                  | Resultado                                          |
|--------------------------|----------------------------------------------------|
| `{campo}`                | é trocado pelo valor do campo                      |
| `{#campo}...{/campo}`    | o trecho só aparece se o campo estiver preenchido  |
| `{^campo}...{/campo}`    | o trecho só aparece se o campo estiver **vazio**   |

Exemplo:

```
{#anos}Há {anos_texto}, {/anos}{^anos}Há muitos anos, {/anos}{empresa} é referência em {palavra_chave}.
```

Uma linha em branco cria um novo parágrafo. Depois de montar, o texto é limpo automaticamente
(espaços duplos, espaço antes de vírgula/ponto, pontuação repetida e maiúscula no início das frases),
então um campo opcional vazio nunca deixa "buracos".

### Campos disponíveis

| Campo                     | Origem                                                     |
|---------------------------|------------------------------------------------------------|
| `{empresa}`               | Nome da empresa                                            |
| `{palavra_chave}`         | Palavra-chave                                              |
| `{palavra_chave_cap}`     | Palavra-chave com a primeira letra maiúscula               |
| `{argumento_principal}`   | Argumento principal                                        |
| `{cidade}`                | Região ou cidade como digitada (ex.: São José do Rio Preto, SP) |
| `{cidade_nome}`           | Cidade sem a UF (ex.: São José do Rio Preto)               |
| `{atuacao}`               | Atuação em minúsculas (serviços / produtos / produtos e serviços) |
| `{mercado}`               | Mercado                                                    |
| `{argumento1}` a `{argumento3}` | Argumentos/itens (sem o `;` final)                   |
| `{argumentos}`            | Argumentos preenchidos unidos como "A, B e C"              |
| `{ano_fundacao}`          | Ano de fundação como digitado                              |
| `{ano}`                   | Só o ano de fundação (ex.: 1998)                           |
| `{anos}` / `{anos_texto}` | Anos desde a fundação: `28` / `28 anos` (ou `1 ano`)       |
| `{whatsapp}`              | WhatsApp formatado (00) 00000-0000                          |

Depois de editar, rode `npm test`: os testes conferem se todas as versões geram texto sem buracos,
com os opcionais vazios e preenchidos.

### Para adicionar um modelo

Acrescente um objeto em `modelos` (com `id`, `nome`, `resumo` e `versoes`) em `templates.js`
e um ícone com o mesmo `id` no objeto `ICONES` de `src/main.js`.

## Campo WhatsApp (a confirmar com o cliente)

Para remover o campo, apague o bloco marcado com `INÍCIO CAMPO WHATSAPP` / `FIM CAMPO WHATSAPP`
em `index.html`. Nada mais precisa mudar: os modelos usam a chamada para ação sem WhatsApp e o
checklist deixa de mostrar o item de telefone.

## Deploy na Netlify

1. Suba o projeto para um repositório no GitHub (ou GitLab/Bitbucket).
2. Na Netlify: **Add new site → Import an existing project** e escolha o repositório.
3. As configurações já vêm do `netlify.toml` (build `npm run build`, pasta `dist`, Node 22). É só confirmar.
4. A cada `push` na branch principal, a Netlify publica de novo.

Alternativa sem repositório: rode `npm run build` e arraste a pasta `dist/` em
**Sites → Add new site → Deploy manually**.

### Subdomínio `anuncios.distritodigital.com.br`

1. Na Netlify, abra o site → **Domain management → Add a domain** → digite
   `anuncios.distritodigital.com.br` e confirme.
2. No painel DNS onde o domínio `distritodigital.com.br` está registrado (Registro.br, Cloudflare, Hostinger etc.),
   crie um registro:

   | Tipo  | Nome       | Valor                          |
   |-------|------------|--------------------------------|
   | CNAME | `anuncios` | `NOME-DO-SITE.netlify.app`     |

   (troque `NOME-DO-SITE` pelo nome que a Netlify deu ao site). Se usar Cloudflare, deixe o proxy
   desligado (nuvem cinza) até o certificado ser emitido.
3. Aguarde a propagação do DNS (minutos a algumas horas). A Netlify emite o HTTPS (Let's Encrypt) sozinha;
   confira em **Domain management → HTTPS**.

O `netlify.toml` envia `X-Robots-Tag: noindex` (e a página tem `<meta name="robots" content="noindex">`)
para a ferramenta interna não aparecer no Google. Remova os dois se quiser que ela seja indexada.

## Como ativar IA no futuro

A geração está isolada em `src/generator.js`. A interface só chama `gerarAnuncio(dados, idModelo, indiceVersao)`
e já usa `await` no resultado, então a função pode passar a ser assíncrona sem mudar o resto.

1. Crie `netlify/functions/generate.js` (a pasta já está configurada no `netlify.toml`):

   ```js
   // netlify/functions/generate.js
   import Anthropic from '@anthropic-ai/sdk';

   const client = new Anthropic(); // lê ANTHROPIC_API_KEY das variáveis de ambiente

   export default async (req) => {
     const { dados, idModelo, indiceVersao } = await req.json();

     const resposta = await client.messages.create({
       model: 'claude-sonnet-5-5', // conferir o modelo mais recente na documentação
       max_tokens: 2000,
       system:
         'Você escreve anúncios para o guia comercial Distrito Digital, com foco em SEO local. ' +
         'Responda só com JSON: { "titulo", "texto", "descricao", "whatsappMsg", "palavrasChave" }. ' +
         'Título até 60 caracteres, texto entre 300 e 1.600, descrição até 155.',
       messages: [{ role: 'user', content: JSON.stringify({ dados, modelo: idModelo, versao: indiceVersao }) }],
     });

     return Response.json(JSON.parse(resposta.content[0].text));
   };
   ```

   (Para usar a OpenAI, a ideia é a mesma com o SDK `openai` e a variável `OPENAI_API_KEY`.)

2. Instale o SDK: `npm install @anthropic-ai/sdk` e cadastre a chave em
   **Netlify → Site configuration → Environment variables** (`ANTHROPIC_API_KEY`). Nunca coloque a chave no código do front.

3. Troque a implementação de `gerarAnuncio` em `src/generator.js`, mantendo o gerador atual como reserva:

   ```js
   export async function gerarAnuncio(dados, idModelo, indiceVersao = 0) {
     try {
       const r = await fetch('/.netlify/functions/generate', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ dados, idModelo, indiceVersao }),
       });
       if (!r.ok) throw new Error(`HTTP ${r.status}`);
       return await r.json();
     } catch {
       return gerarAnuncioSemIA(dados, idModelo, indiceVersao); // a função atual, renomeada
     }
   }
   ```

4. Como hoje o texto é regenerado a cada tecla, com IA vale trocar para gerar com um botão
   (ou com espera de ~1 s depois que o usuário para de digitar) em `src/main.js`, para não fazer uma chamada por tecla.
   A interface já descarta respostas antigas que chegarem fora de ordem.

Para testar functions localmente: `npm install -g netlify-cli` e `netlify dev`.

---

Ferramenta de uso exclusivo da rede Distrito Digital, idealizada por César Marcondes.
Desenvolvido por Gabriel Hansen.
