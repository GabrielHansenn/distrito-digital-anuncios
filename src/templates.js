/*
 * ============================================================================
 *  MODELOS DE TEXTO DO CRIADOR DE ANÚNCIOS
 * ============================================================================
 *
 *  ATENÇÃO: os textos abaixo são PROVISÓRIOS (placeholders). Eles devem ser
 *  substituídos pelos textos reais da planilha do cliente quando ela chegar.
 *  Este arquivo contém apenas conteúdo: nenhuma lógica de montagem fica aqui.
 *
 *  Cada modelo tem de 2 a 3 versões. Cada versão tem:
 *    - titulo     → título do anúncio (ideal: até 60 caracteres)
 *    - texto      → texto do anúncio (ideal: entre 300 e 1.600 caracteres)
 *    - descricao  → descrição curta para o Google (ideal: até 155 caracteres)
 *
 *  ---------------------------------------------------------------------------
 *  SINTAXE DOS MODELOS
 *  ---------------------------------------------------------------------------
 *  {campo}                 → substituído pelo valor do campo
 *  {#campo}...{/campo}     → o trecho só aparece se o campo estiver preenchido
 *  {^campo}...{/campo}     → o trecho só aparece se o campo estiver VAZIO
 *
 *  Uma linha em branco entre frases cria um novo parágrafo.
 *  Depois da montagem, espaços duplos, espaço antes de vírgula/ponto e
 *  pontuação repetida são limpos automaticamente, então não é preciso se
 *  preocupar com "buracos" quando um campo opcional estiver vazio.
 *
 *  ---------------------------------------------------------------------------
 *  CAMPOS DISPONÍVEIS
 *  ---------------------------------------------------------------------------
 *  Digitados no formulário:
 *    {empresa}              nome da empresa
 *    {palavra_chave}        palavra-chave (ex.: publicidade)
 *    {argumento_principal}  principal diferencial
 *    {cidade}               região ou cidade como digitada (ex.: São José do Rio Preto, SP)
 *    {mercado}              mercado (ex.: agência de publicidade)
 *    {argumento1} {argumento2} {argumento3}  argumentos/itens opcionais
 *    {ano_fundacao}         ano de fundação como digitado
 *    {whatsapp}             WhatsApp formatado: (00) 00000-0000
 *
 *  Calculados automaticamente:
 *    {palavra_chave_cap}    palavra-chave com a primeira letra maiúscula
 *    {cidade_nome}          cidade sem a UF (ex.: São José do Rio Preto)
 *    {atuacao}              atuação em minúsculas (serviços / produtos / produtos e serviços)
 *    {argumentos}           argumentos preenchidos unidos como "A, B e C"
 *    {ano}                  só o ano de fundação (ex.: 1998)
 *    {anos}                 anos desde a fundação (ex.: 28)
 *    {anos_texto}           "1 ano" ou "28 anos"
 * ============================================================================
 */

// Chamadas para ação reutilizadas nos modelos.
// Se o campo WhatsApp for removido do formulário, a versão sem WhatsApp é usada.
const CTA_ORCAMENTO =
  '{#whatsapp}Chame no WhatsApp {whatsapp} e peça seu orçamento.{/whatsapp}' +
  '{^whatsapp}Entre em contato e peça seu orçamento.{/whatsapp}';

const CTA_CONVERSA =
  '{#whatsapp}Fale com a gente pelo WhatsApp {whatsapp}.{/whatsapp}' +
  '{^whatsapp}Fale com a gente e solicite uma proposta sem compromisso.{/whatsapp}';

const CTA_CURTA =
  '{#whatsapp}WhatsApp {whatsapp}.{/whatsapp}' +
  '{^whatsapp}Peça seu orçamento!{/whatsapp}';

/** Mensagem pronta para o botão de WhatsApp do anúncio. */
export const mensagemWhatsapp =
  'Olá! Vi o anúncio da {empresa} no Distrito Digital e gostaria de um orçamento.';

/**
 * Lista dos modelos, na ordem em que aparecem na tela.
 * Os ícones ficam em main.js (são parte da interface, não do conteúdo).
 */
export const modelos = [
  // --------------------------------------------------------------------------
  {
    id: 'tradicao',
    nome: 'Tradição',
    resumo: 'Anos de mercado, confiança e história na cidade.',
    versoes: [
      {
        titulo: '{empresa} | {palavra_chave_cap} em {cidade_nome}',
        texto: `{#anos}Há {anos_texto}, {/anos}{^anos}Há muitos anos, {/anos}{empresa} é referência em {palavra_chave} em {cidade}. Como {mercado} com tradição na região, oferece {atuacao} com a experiência de quem conhece de perto as necessidades de cada cliente.

Nosso principal diferencial: {argumento_principal}. {#argumentos}Entre os destaques: {argumentos}.{/argumentos} Uma história construída com seriedade, confiança e compromisso{#ano}, desde {ano}{/ano}.

Procurando {palavra_chave} em {cidade_nome}? ${CTA_ORCAMENTO}`,
        descricao: `{palavra_chave_cap} em {cidade_nome}{#anos} há {anos_texto}{/anos}. {empresa}: tradição e confiança. ${CTA_CURTA}`,
      },
      {
        titulo: '{palavra_chave_cap} em {cidade_nome}{#ano} desde {ano}{/ano}',
        texto: `{palavra_chave_cap} em {cidade}, com quem tem história: {empresa}{#ano} atua desde {ano}{/ano}{^ano} tem anos de estrada{/ano} e se tornou sinônimo de confiança para quem procura {mercado} na região.

{#anos}São {anos_texto} oferecendo {atuacao} com seriedade e atendimento próximo. {/anos}Nosso principal diferencial: {argumento_principal}. {#argumentos}Você também conta com: {argumentos}.{/argumentos} A experiência acumulada ao longo do tempo garante soluções testadas e a tranquilidade de contratar quem sabe o que faz.

Tradição faz diferença. ${CTA_CONVERSA}`,
        descricao: `{empresa}: {palavra_chave} em {cidade_nome}{#ano} desde {ano}{/ano}. Tradição, confiança e atendimento próximo. ${CTA_CURTA}`,
      },
      {
        titulo: '{empresa}: tradição em {palavra_chave}',
        texto: `Quem é de {cidade_nome} conhece {empresa}. {#anos}São {anos_texto} de mercado{/anos}{^anos}São anos de mercado{/anos} oferecendo {palavra_chave} com responsabilidade, honestidade e o mesmo cuidado do primeiro dia.

Como {mercado}, acompanhamos a cidade crescer e construímos uma relação de confiança com várias gerações de clientes. Nosso principal diferencial: {argumento_principal}. {#argumentos}Destaques: {argumentos}.{/argumentos}

Precisa de {atuacao} de {palavra_chave} em {cidade_nome}? Conte com quem tem história. ${CTA_ORCAMENTO}`,
        descricao: `{empresa}, tradição em {palavra_chave} em {cidade_nome}. {argumento_principal}. ${CTA_CURTA}`,
      },
    ],
  },

  // --------------------------------------------------------------------------
  {
    id: 'inovacao',
    nome: 'Inovação',
    resumo: 'Novidade, tecnologia e soluções modernas.',
    versoes: [
      {
        titulo: '{palavra_chave_cap} com inovação em {cidade_nome}',
        texto: `Procurando {palavra_chave} em {cidade}, com soluções modernas? {empresa} une tecnologia, criatividade e novas ideias para entregar {atuacao} à altura do que você precisa hoje.

Atenta às tendências do mercado, a equipe investe em ferramentas e processos atuais para oferecer mais agilidade, praticidade e resultado. Nosso principal diferencial: {argumento_principal}. {#argumentos}Também oferecemos: {argumentos}.{/argumentos}

Inovação de verdade, com atendimento próximo em {cidade_nome}. ${CTA_CONVERSA}`,
        descricao: `{palavra_chave_cap} em {cidade_nome} com tecnologia e soluções modernas. Conheça {empresa}. ${CTA_CURTA}`,
      },
      {
        titulo: '{empresa} | {palavra_chave_cap} em {cidade_nome}',
        texto: `{empresa} traz o que há de mais moderno em {palavra_chave} para {cidade}. Como {mercado}, apostamos em inovação, tecnologia e soluções inteligentes para facilitar a vida de quem busca {atuacao} com qualidade e eficiência.

Destaque: {argumento_principal}. {#argumentos}E mais: {argumentos}.{/argumentos} Tudo pensado para entregar resultados atuais, com agilidade e transparência do primeiro contato até a entrega.

Quer conhecer as novidades? ${CTA_ORCAMENTO}`,
        descricao: `{empresa}: inovação em {palavra_chave} em {cidade_nome}. Soluções modernas e atendimento ágil. ${CTA_CURTA}`,
      },
    ],
  },

  // --------------------------------------------------------------------------
  {
    id: 'qualidade',
    nome: 'Qualidade',
    resumo: 'Acabamento, materiais e cuidado em cada detalhe.',
    versoes: [
      {
        titulo: '{palavra_chave_cap} com qualidade em {cidade_nome}',
        texto: `Quem busca {palavra_chave} em {cidade}, com qualidade de verdade, encontra em {empresa} cuidado em cada detalhe. Como {mercado}, trabalhamos com atenção ao acabamento, bons materiais e um processo pensado para entregar {atuacao} sem dor de cabeça.

Nosso principal diferencial: {argumento_principal}. {#argumentos}Você também conta com: {argumentos}.{/argumentos} Cada trabalho é acompanhado de perto, do planejamento à entrega, para garantir o resultado que você espera.

Qualidade que se vê no resultado. ${CTA_ORCAMENTO}`,
        descricao: `{palavra_chave_cap} em {cidade_nome} com acabamento caprichado e cuidado em cada detalhe. {empresa}. ${CTA_CURTA}`,
      },
      {
        titulo: '{empresa} | {palavra_chave_cap} em {cidade_nome}',
        texto: `{empresa} é sinônimo de qualidade em {palavra_chave} em {cidade}. Oferecemos {atuacao} feitos com capricho, responsabilidade e atenção a cada etapa.

Como {mercado}, sabemos que qualidade não é detalhe: é o que garante satisfação e tranquilidade. Nosso principal diferencial: {argumento_principal}. {#argumentos}Por isso, entregamos: {argumentos}.{/argumentos}

Faça como quem já confia em {empresa} em {cidade_nome}. ${CTA_CONVERSA}`,
        descricao: `{empresa}: qualidade em {palavra_chave} em {cidade_nome}. {argumento_principal}. ${CTA_CURTA}`,
      },
      {
        titulo: '{palavra_chave_cap} em {cidade_nome}: qualidade garantida',
        texto: `Em {cidade}, {empresa} é a escolha de quem não abre mão de qualidade em {palavra_chave}. Do primeiro atendimento ao resultado final, cada detalhe recebe atenção para que você tenha {atuacao} à altura das suas expectativas.

Nosso principal diferencial: {argumento_principal}. {#argumentos}Destaques: {argumentos}.{/argumentos} Como {mercado}, seguimos padrões rigorosos e trabalhamos com profissionais preparados.

Qualidade não se improvisa. ${CTA_ORCAMENTO}`,
        descricao: `{palavra_chave_cap} com qualidade garantida em {cidade_nome}. Conheça {empresa}. ${CTA_CURTA}`,
      },
    ],
  },

  // --------------------------------------------------------------------------
  {
    id: 'melhor-empresa',
    nome: 'Melhor Empresa',
    resumo: 'Referência no segmento, a escolha nº 1 da região.',
    versoes: [
      {
        titulo: 'Melhor {palavra_chave} em {cidade_nome} | {empresa}',
        texto: `Procurando a melhor opção de {palavra_chave} em {cidade}? {empresa} é referência no segmento e uma das escolhas preferidas de quem procura {mercado} na região.

Nosso principal diferencial: {argumento_principal}. {#argumentos}Somam-se a isso: {argumentos}.{/argumentos} Atendimento atencioso, compromisso com prazos e foco total na satisfação colocam {empresa} entre as primeiras escolhas para {atuacao} de {palavra_chave} em {cidade_nome}.

Escolha quem é referência. ${CTA_ORCAMENTO}`,
        descricao: `Melhor {palavra_chave} em {cidade_nome}: {empresa} é referência no segmento. ${CTA_CURTA}`,
      },
      {
        titulo: 'Referência em {palavra_chave} em {cidade_nome}',
        texto: `Quem conhece recomenda: {empresa} é referência em {palavra_chave} em {cidade}, e se destaca entre as opções de {mercado} da região.

O motivo? {argumento_principal}. {#argumentos}E ainda: {argumentos}.{/argumentos} Oferecemos {atuacao} com padrão de excelência, atendimento personalizado e o compromisso de superar expectativas em cada projeto.

Faça como os clientes que já escolheram a melhor empresa de {cidade_nome}. ${CTA_CONVERSA}`,
        descricao: `{empresa}: referência em {palavra_chave} em {cidade_nome}, a escolha nº 1 da região. ${CTA_CURTA}`,
      },
    ],
  },

  // --------------------------------------------------------------------------
  {
    id: 'melhor-preco',
    nome: 'Melhor Preço',
    resumo: 'Custo-benefício, condições e economia.',
    versoes: [
      {
        titulo: '{palavra_chave_cap} em {cidade_nome} com o melhor preço',
        texto: `{palavra_chave_cap} com o melhor custo-benefício em {cidade} é com {empresa}. Preço justo, condições facilitadas e atendimento de confiança, sem abrir mão da qualidade.

Como {mercado}, trabalhamos para que você economize sem surpresas: orçamento claro, transparência em cada etapa e {atuacao} que cabem no seu bolso. Nosso principal diferencial: {argumento_principal}. {#argumentos}Você também conta com: {argumentos}.{/argumentos}

Economize com quem é de {cidade_nome}. ${CTA_ORCAMENTO}`,
        descricao: `{palavra_chave_cap} em {cidade_nome} com preço justo e condições facilitadas. {empresa}. ${CTA_CURTA}`,
      },
      {
        titulo: '{empresa} | {palavra_chave_cap} com preço justo',
        texto: `Quer {palavra_chave} em {cidade}, pagando menos? {empresa} oferece {atuacao} com preço competitivo, formas de pagamento facilitadas e a mesma atenção de sempre.

Destaque: {argumento_principal}. {#argumentos}E mais: {argumentos}.{/argumentos} Como {mercado}, sabemos que cada real conta. Por isso, nosso orçamento é claro, sem taxas escondidas e pensado para o seu bolso.

Economia com qualidade em {cidade_nome}. ${CTA_CONVERSA}`,
        descricao: `{palavra_chave_cap} com preço justo em {cidade_nome}: {empresa}. Condições facilitadas. ${CTA_CURTA}`,
      },
      {
        titulo: '{palavra_chave_cap} com economia em {cidade_nome}',
        texto: `Economia e qualidade podem andar juntas. Em {cidade}, {empresa} oferece {palavra_chave} com o melhor custo-benefício da região, condições especiais e pagamento facilitado.

Como {mercado}, buscamos sempre a solução mais vantajosa para o seu bolso, sem cortar o que importa. Nosso principal diferencial: {argumento_principal}. {#argumentos}Destaques: {argumentos}.{/argumentos}

Peça um orçamento e compare. ${CTA_CONVERSA}`,
        descricao: `{palavra_chave_cap} com o melhor custo-benefício em {cidade_nome}. {empresa}. ${CTA_CURTA}`,
      },
    ],
  },
];
