/*
 * ============================================================================
 *  GERADOR DE ANÚNCIOS (sem IA)
 * ============================================================================
 *
 *  Ponto único de geração de texto. A interface (main.js) só usa:
 *    - gerarAnuncio(dados, idModelo, indiceVersao)
 *    - contarVersoes(idModelo)
 *
 *  Para ativar IA no futuro, basta trocar a implementação de gerarAnuncio
 *  por uma chamada a uma Netlify Function (ver README). A interface já trata
 *  o retorno como Promise, então a função pode passar a ser assíncrona.
 *
 *  Tudo aqui é puro: nenhuma função acessa o DOM nem guarda estado.
 * ============================================================================
 */

import { modelos, mensagemWhatsapp } from './templates.js';

// UFs brasileiras, usadas para tirar a UF do final do nome da cidade
const UFS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]);

/* ---------------------------------------------------------------------------
 *  Funções auxiliares de dados
 * ------------------------------------------------------------------------ */

/** Converte qualquer valor em texto sem espaços nas pontas. */
function texto(valor) {
  return valor == null ? '' : String(valor).trim();
}

/** Remove ponto e vírgula (e espaços) do final, como "Qualidade;" → "Qualidade". */
export function limparArgumento(valor) {
  return texto(valor).replace(/[\s;]+$/, '');
}

/** Une uma lista como "A", "A e B" ou "A, B e C". */
export function juntarLista(itens) {
  const lista = itens.filter(Boolean);
  if (lista.length <= 1) return lista[0] || '';
  return `${lista.slice(0, -1).join(', ')} e ${lista[lista.length - 1]}`;
}

/** Primeira letra maiúscula, sem mexer no resto. */
export function primeiraMaiuscula(valor) {
  const s = texto(valor);
  return s ? s.charAt(0).toLocaleUpperCase('pt-BR') + s.slice(1) : '';
}

/** Tira a UF do final: "São José do Rio Preto, SP" → "São José do Rio Preto". */
export function cidadeSemUF(valor) {
  const s = texto(valor);
  // Separadores aceitos: vírgula, hífen, travessão, barra ou só espaço
  const m = s.match(/^(.*?)\s*(?:[,\-–—/]\s*|\s+)([A-Za-z]{2})$/);
  if (m && m[1] && UFS.has(m[2].toUpperCase())) {
    // Só com espaço, exige a UF em maiúsculas (evita cortar palavras curtas)
    const soEspaco = !/[,\-–—/]/.test(s.slice(m[1].length));
    if (!soEspaco || m[2] === m[2].toUpperCase()) return m[1].trim();
  }
  return s;
}

/**
 * Interpreta o ano de fundação, aceitando "1998" ou "30/06/1998"
 * (também com "-" ou "." como separador).
 * Retorna { valido, ano, anos }. Campo vazio é válido, mas sem ano.
 * `hoje` pode ser informado para facilitar os testes.
 */
export function interpretarAnoFundacao(valor, hoje = new Date()) {
  const s = texto(valor);
  if (!s) return { valido: true, ano: '', anos: '' };

  let dia = 0;
  let mes = 0;
  let ano;
  let m;
  if ((m = s.match(/^(\d{4})$/))) {
    ano = Number(m[1]);
  } else if ((m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/))) {
    dia = Number(m[1]);
    mes = Number(m[2]);
    ano = Number(m[3]);
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return { valido: false, ano: '', anos: '' };
  } else {
    return { valido: false, ano: '', anos: '' };
  }

  const anoAtual = hoje.getFullYear();
  if (ano < 1500 || ano > anoAtual) return { valido: false, ano: '', anos: '' };

  let anos = anoAtual - ano;
  // Com data completa, só conta o ano se o "aniversário" já passou
  if (mes) {
    const mesAtual = hoje.getMonth() + 1;
    if (mesAtual < mes || (mesAtual === mes && hoje.getDate() < dia)) anos -= 1;
  }
  return { valido: true, ano: String(ano), anos: anos >= 1 ? String(anos) : '' };
}

/** Formata o WhatsApp como (00) 00000-0000 ou (00) 0000-0000. */
export function formatarTelefone(valor) {
  const d = texto(valor).replace(/\D/g, '').slice(0, 11);
  if (!d) return '';
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  const corte = resto.length === 9 ? 5 : 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

/**
 * Prepara os dados digitados para os modelos: limpa, normaliza e calcula
 * os campos derivados (anos, argumentos, palavra_chave_cap, etc.).
 */
export function prepararDados(dados = {}, hoje = new Date()) {
  const argumento1 = limparArgumento(dados.argumento1);
  const argumento2 = limparArgumento(dados.argumento2);
  const argumento3 = limparArgumento(dados.argumento3);
  const fundacao = interpretarAnoFundacao(dados.ano_fundacao, hoje);
  const palavraChave = texto(dados.palavra_chave);

  return {
    empresa: texto(dados.empresa),
    palavra_chave: palavraChave,
    palavra_chave_cap: primeiraMaiuscula(palavraChave),
    argumento_principal: limparArgumento(dados.argumento_principal),
    cidade: texto(dados.cidade),
    cidade_nome: cidadeSemUF(dados.cidade),
    atuacao: texto(dados.atuacao).toLocaleLowerCase('pt-BR'),
    mercado: texto(dados.mercado),
    argumento1,
    argumento2,
    argumento3,
    argumentos: juntarLista([argumento1, argumento2, argumento3]),
    ano_fundacao: texto(dados.ano_fundacao),
    ano: fundacao.ano,
    anos: fundacao.anos,
    anos_texto: fundacao.anos ? `${fundacao.anos} ${fundacao.anos === '1' ? 'ano' : 'anos'}` : '',
    whatsapp: formatarTelefone(dados.whatsapp),
  };
}

/* ---------------------------------------------------------------------------
 *  Motor de modelos
 * ------------------------------------------------------------------------ */

/**
 * Preenche um modelo com os dados.
 * Sintaxe: {campo}, {#campo}...{/campo} (se preenchido), {^campo}...{/campo} (se vazio).
 */
export function preencherModelo(modelo, valores) {
  const preenchido = (campo) => texto(valores[campo]) !== '';
  const bloco = /\{([#^])(\w+)\}([\s\S]*?)\{\/\2\}/g;

  // Resolve os blocos condicionais (repete para suportar blocos aninhados)
  let s = modelo;
  let anterior;
  do {
    anterior = s;
    s = s.replace(bloco, (_, tipo, campo, conteudo) =>
      (tipo === '#') === preenchido(campo) ? conteudo : '',
    );
  } while (s !== anterior);

  // Substitui os campos simples; campos desconhecidos viram texto vazio
  s = s.replace(/\{(\w+)\}/g, (_, campo) => texto(valores[campo]));

  return limparTexto(s);
}

/**
 * Limpa o texto montado: espaços duplos, espaço antes de pontuação,
 * pontuação repetida, linhas em branco extras e maiúscula no início das frases.
 */
export function limparTexto(s) {
  const linhas = s.split('\n').map((linha) =>
    linha
      .replace(/[ \t ]{2,}/g, ' ') //               espaços duplos
      .replace(/\s+([,.;:!?])/g, '$1') //                espaço antes da pontuação
      .replace(/([,;:])(?:\s*[,;:])+/g, '$1') //         ", ," → ","
      .replace(/[,;:]+\s*([.!?])/g, '$1') //             ", ." → "."
      .replace(/([.!?])(?:\s*\.)+(?!\.)/g, '$1') //      ". ." ou ".." → "."
      .replace(/\(\s*\)/g, '') //                         parênteses vazios
      .replace(/^[\s,.;:]+/, '') //                       pontuação no início da linha
      .replace(/[ \t]{2,}/g, ' ')
      .trim(),
  );

  return linhas
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    // Maiúscula no começo do texto, de cada parágrafo e depois de . ! ?
    .replace(/(^|[.!?]\s+|\n)(\p{Ll})/gu, (_, antes, letra) => antes + letra.toLocaleUpperCase('pt-BR'));
}

/* ---------------------------------------------------------------------------
 *  API pública usada pela interface
 * ------------------------------------------------------------------------ */

/** Quantidade de versões de um modelo. */
export function contarVersoes(idModelo) {
  const modelo = modelos.find((m) => m.id === idModelo);
  return modelo ? modelo.versoes.length : 0;
}

/**
 * Gera o anúncio.
 * (dados, idModelo, indiceVersao) → { titulo, texto, descricao, whatsappMsg, palavrasChave }
 *
 * O índice da versão "dá a volta" (3 vira 0 num modelo com 3 versões).
 * O 4º parâmetro (data de hoje) é opcional e serve só para os testes.
 */
export function gerarAnuncio(dados, idModelo, indiceVersao = 0, hoje = new Date()) {
  const modelo = modelos.find((m) => m.id === idModelo) || modelos[0];
  const total = modelo.versoes.length;
  const versao = modelo.versoes[((indiceVersao % total) + total) % total];
  const valores = prepararDados(dados, hoje);

  // Palavras-chave sugeridas (sem repetidas e sem vazias)
  const sugestoes = [
    valores.palavra_chave,
    juntarPalavras(valores.palavra_chave, valores.cidade_nome),
    juntarPalavras(valores.mercado, valores.cidade_nome),
  ];
  const palavrasChave = [...new Set(sugestoes.filter(Boolean))];

  return {
    titulo: preencherModelo(versao.titulo, valores),
    texto: preencherModelo(versao.texto, valores),
    descricao: preencherModelo(versao.descricao, valores),
    whatsappMsg: preencherModelo(mensagemWhatsapp, valores),
    palavrasChave,
  };
}

/** Une duas partes só se ambas existirem. */
function juntarPalavras(a, b) {
  return a && b ? `${a} ${b}` : '';
}
