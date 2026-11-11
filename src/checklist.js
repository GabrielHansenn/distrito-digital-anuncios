/*
 * ============================================================================
 *  CHECKLIST DE SEO LOCAL
 * ============================================================================
 *  Função pura: (saida, dados) → lista de { label, ok }
 *    - saida: { titulo, texto, descricao } (já com as edições do usuário)
 *    - dados: valores digitados no formulário
 *
 *  As comparações ignoram maiúsculas/minúsculas e acentos.
 * ============================================================================
 */

import { cidadeSemUF } from './generator.js';

// Limites de tamanho (os mesmos mostrados nos contadores da tela)
export const LIMITES = {
  titulo: 60,
  textoMin: 300,
  textoMax: 1600,
  descricao: 155,
};

/** Normaliza para comparação: minúsculas, sem acentos, espaços simples. */
export function normalizar(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Verifica se `trecho` aparece em `alvo` (ambos normalizados). */
function contem(alvo, trecho) {
  const t = normalizar(trecho);
  return t !== '' && normalizar(alvo).includes(t);
}

// Verbos e expressões de chamada para ação (já sem acento)
const CHAMADA_PARA_ACAO =
  /\b(fale|chame|chama|entre em contato|peca|pecam|solicite|agende|ligue|visite|venha|conheca|faca (seu|um|uma) (orcamento|pedido|reserva)|mande|envie|consulte|garanta|aproveite|reserve|compre|contrate|escolha)\b/;

/** Formata número no padrão brasileiro (1.600). */
const num = (n) => n.toLocaleString('pt-BR');

/**
 * Monta a lista do checklist de SEO local.
 */
export function montarChecklist(saida, dados) {
  const titulo = saida?.titulo ?? '';
  const textoAnuncio = saida?.texto ?? '';
  const descricao = saida?.descricao ?? '';

  const palavra = String(dados?.palavra_chave ?? '').trim();
  const cidade = cidadeSemUF(dados?.cidade);
  const empresa = String(dados?.empresa ?? '').trim();
  const inicio = textoAnuncio.slice(0, 120);
  const tamanho = textoAnuncio.trim().length;

  const itens = [
    {
      label: palavra ? `Palavra-chave “${palavra}” no texto` : 'Palavra-chave no texto',
      ok: contem(textoAnuncio, palavra),
    },
    {
      label: cidade ? `Cidade “${cidade}” no texto` : 'Cidade no texto',
      ok: contem(textoAnuncio, cidade),
    },
    {
      label: 'Palavra-chave e cidade logo no começo',
      ok: contem(inicio, palavra) && contem(inicio, cidade),
    },
    {
      label: 'Nome da empresa no texto',
      ok: contem(textoAnuncio, empresa),
    },
    {
      label: 'Chamada para ação',
      ok: CHAMADA_PARA_ACAO.test(normalizar(textoAnuncio)),
    },
  ];

  // Só confere o telefone se o campo existir no formulário e estiver preenchido
  const digitosTelefone = String(dados?.whatsapp ?? '').replace(/\D/g, '');
  if (digitosTelefone) {
    // Compara os 8 últimos dígitos, para aceitar o número com ou sem DDD/9
    const final = digitosTelefone.slice(-8);
    itens.push({
      label: 'Telefone ou WhatsApp no texto',
      ok: textoAnuncio.replace(/\D/g, '').includes(final),
    });
  }

  itens.push(
    {
      label: `Tamanho bom (${num(LIMITES.textoMin)} a ${num(LIMITES.textoMax)} caracteres)`,
      ok: tamanho >= LIMITES.textoMin && tamanho <= LIMITES.textoMax,
    },
    {
      label: `Título com até ${LIMITES.titulo} caracteres`,
      ok: titulo.trim().length > 0 && titulo.length <= LIMITES.titulo,
    },
    {
      label: `Descrição com até ${LIMITES.descricao} caracteres`,
      ok: descricao.trim().length > 0 && descricao.length <= LIMITES.descricao,
    },
  );

  return itens;
}
