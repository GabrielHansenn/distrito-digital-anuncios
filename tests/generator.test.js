// Testes das funções puras do gerador. Rodar com: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  gerarAnuncio,
  contarVersoes,
  prepararDados,
  preencherModelo,
  limparTexto,
  interpretarAnoFundacao,
  juntarLista,
  limparArgumento,
  cidadeSemUF,
  formatarTelefone,
} from '../src/generator.js';
import { modelos } from '../src/templates.js';

// Data fixa para os testes não dependerem do dia em que rodam
const HOJE = new Date(2026, 10, 11); // 11/11/2026

const COMPLETO = {
  empresa: 'Empresa XPTO',
  palavra_chave: 'publicidade',
  argumento_principal: 'experiência de 20 anos',
  cidade: 'São José do Rio Preto, SP',
  atuacao: 'Serviços',
  mercado: 'agência de publicidade',
  argumento1: 'Completa - Online e Offline',
  argumento2: 'Qualidade na execução',
  argumento3: '',
  ano_fundacao: '30/06/1905',
};

// Só os obrigatórios: todos os opcionais vazios
const MINIMO = {
  empresa: 'Vidraçaria Casa',
  palavra_chave: 'vidraçaria',
  argumento_principal: 'atendimento de confiança',
  cidade: 'Forte',
  atuacao: 'Produtos e Serviços',
  mercado: 'vidraçaria',
};

/** Procura sinais de "buraco" no texto montado. */
function problemas(texto) {
  const achados = [];
  if (/\{[#^/]?\w+\}/.test(texto)) achados.push('placeholder não substituído');
  if (/ {2,}/.test(texto)) achados.push('espaço duplo');
  if (/\s[,.;:!?]/.test(texto)) achados.push('espaço antes de pontuação');
  if (/[,;:]\s*[,.;:]/.test(texto)) achados.push('pontuação duplicada');
  if (/\.\s*\./.test(texto)) achados.push('ponto duplicado');
  if (/\b(undefined|null|NaN)\b/.test(texto)) achados.push('valor inválido');
  if (/\n{3,}/.test(texto)) achados.push('linhas em branco demais');
  return achados;
}

test('todos os modelos e versões geram texto sem buracos com os opcionais vazios', () => {
  for (const modelo of modelos) {
    for (let v = 0; v < contarVersoes(modelo.id); v++) {
      const saida = gerarAnuncio(MINIMO, modelo.id, v, HOJE);
      for (const parte of ['titulo', 'texto', 'descricao', 'whatsappMsg']) {
        assert.deepEqual(problemas(saida[parte]), [], `${modelo.id} v${v + 1} (${parte}): ${saida[parte]}`);
      }
      assert.ok(saida.texto.includes('Vidraçaria Casa'));
      assert.ok(!/desde\s*[.,]/.test(saida.texto), 'sem "desde" solto quando não há ano');
    }
  }
});

test('todos os modelos e versões geram texto sem buracos com os dados completos', () => {
  for (const modelo of modelos) {
    for (let v = 0; v < contarVersoes(modelo.id); v++) {
      const saida = gerarAnuncio({ ...COMPLETO, whatsapp: '17991026669' }, modelo.id, v, HOJE);
      for (const parte of ['titulo', 'texto', 'descricao']) {
        assert.deepEqual(problemas(saida[parte]), [], `${modelo.id} v${v + 1} (${parte}): ${saida[parte]}`);
      }
      assert.ok(saida.texto.length >= 300 && saida.texto.length <= 1600, `${modelo.id} v${v + 1}: tamanho`);
    }
  }
});

test('cada modelo tem de 2 a 3 versões completas', () => {
  assert.equal(modelos.length, 5);
  for (const m of modelos) {
    assert.ok(m.versoes.length >= 2 && m.versoes.length <= 3, m.id);
    for (const v of m.versoes) {
      assert.ok(v.titulo && v.texto && v.descricao, m.id);
    }
  }
});

test('ano de fundação: aceita ano solto e data completa', () => {
  assert.deepEqual(interpretarAnoFundacao('1998', HOJE), { valido: true, ano: '1998', anos: '28' });
  // 30/06 já passou em 11/11/2026
  assert.deepEqual(interpretarAnoFundacao('30/06/1905', HOJE), { valido: true, ano: '1905', anos: '121' });
  // 25/12 ainda não chegou: conta um ano a menos
  assert.equal(interpretarAnoFundacao('25/12/2000', HOJE).anos, '25');
  assert.equal(interpretarAnoFundacao('11/11/2000', HOJE).anos, '26');
  assert.equal(interpretarAnoFundacao('5-3-2010', HOJE).anos, '16');
  assert.equal(interpretarAnoFundacao(' 1998 ', HOJE).ano, '1998');
});

test('ano de fundação: vazio, inválido ou futuro não gera anos', () => {
  assert.deepEqual(interpretarAnoFundacao('', HOJE), { valido: true, ano: '', anos: '' });
  assert.equal(interpretarAnoFundacao('98', HOJE).valido, false);
  assert.equal(interpretarAnoFundacao('31/13/1998', HOJE).valido, false);
  assert.equal(interpretarAnoFundacao('2030', HOJE).valido, false);
  assert.equal(interpretarAnoFundacao('abc', HOJE).valido, false);
  // Fundada este ano: ainda não tem 1 ano
  assert.equal(interpretarAnoFundacao('2026', HOJE).anos, '');
});

test('modelo Tradição usa os anos calculados da data de fundação', () => {
  const saida = gerarAnuncio(COMPLETO, 'tradicao', 0, HOJE);
  assert.match(saida.texto, /^Há 121 anos, Empresa XPTO/);
  assert.match(saida.texto, /desde 1905\./);

  const umAno = gerarAnuncio({ ...COMPLETO, ano_fundacao: '2025' }, 'tradicao', 0, HOJE);
  assert.match(umAno.texto, /^Há 1 ano, /);

  const semAno = gerarAnuncio({ ...COMPLETO, ano_fundacao: '' }, 'tradicao', 0, HOJE);
  assert.match(semAno.texto, /^Há muitos anos, Empresa XPTO/);
  assert.match(semAno.texto, /confiança e compromisso\./);
});

test('argumentos: remove ";" do final e une como "A, B e C"', () => {
  assert.equal(limparArgumento('Qualidade na execução;'), 'Qualidade na execução');
  assert.equal(limparArgumento('  Entrega rápida ; ; '), 'Entrega rápida');
  assert.equal(limparArgumento('A; B'), 'A; B'); // só o final

  const d = prepararDados({ argumento1: 'Entrega rápida;', argumento2: 'Garantia;', argumento3: 'Parcelamento;' });
  assert.equal(d.argumentos, 'Entrega rápida, Garantia e Parcelamento');

  assert.equal(prepararDados({ argumento1: 'A;', argumento3: 'C;' }).argumentos, 'A e C');
  assert.equal(prepararDados({ argumento2: 'Só um;' }).argumentos, 'Só um');
  assert.equal(prepararDados({ argumento1: ';' }).argumentos, '');

  const saida = gerarAnuncio({ ...MINIMO, argumento1: 'Entrega rápida;', argumento2: 'Garantia;' }, 'qualidade', 0, HOJE);
  assert.match(saida.texto, /Entrega rápida e Garantia\./);
  assert.ok(!saida.texto.includes(';'));
});

test('juntarLista', () => {
  assert.equal(juntarLista([]), '');
  assert.equal(juntarLista(['A']), 'A');
  assert.equal(juntarLista(['A', 'B']), 'A e B');
  assert.equal(juntarLista(['A', '', 'B', 'C']), 'A, B e C');
});

test('campos derivados', () => {
  const d = prepararDados(COMPLETO, HOJE);
  assert.equal(d.palavra_chave_cap, 'Publicidade');
  assert.equal(d.atuacao, 'serviços');
  assert.equal(d.cidade_nome, 'São José do Rio Preto');
  assert.equal(d.anos, '121');
  assert.equal(prepararDados({ atuacao: 'Produtos e Serviços' }).atuacao, 'produtos e serviços');
  assert.equal(prepararDados({ palavra_chave: 'ótica' }).palavra_chave_cap, 'Ótica');
});

test('cidade sem UF', () => {
  assert.equal(cidadeSemUF('São José do Rio Preto, SP'), 'São José do Rio Preto');
  assert.equal(cidadeSemUF('Campinas - SP'), 'Campinas');
  assert.equal(cidadeSemUF('Campinas/SP'), 'Campinas');
  assert.equal(cidadeSemUF('Belo Horizonte MG'), 'Belo Horizonte');
  assert.equal(cidadeSemUF('Forte'), 'Forte');
  assert.equal(cidadeSemUF('Zona Sul'), 'Zona Sul');
});

test('motor de modelos: blocos condicionais e campos', () => {
  const v = { a: 'X', b: '', lista: 'A e B' };
  assert.equal(preencherModelo('Oi {a}.', v), 'Oi X.');
  assert.equal(preencherModelo('{#a}Tem {a}.{/a}{^a}Não tem.{/a}', v), 'Tem X.');
  assert.equal(preencherModelo('{#b}Tem {b}.{/b}{^b}Não tem.{/b}', v), 'Não tem.');
  assert.equal(preencherModelo('Antes {#b}meio {b}{/b} depois.', v), 'Antes depois.');
  assert.equal(preencherModelo('Itens: {b}. Fim.', v), 'Itens. Fim.');
  assert.equal(preencherModelo('{#a}Externo {#lista}com {lista}{/lista}.{/a}', v), 'Externo com A e B.');
  assert.equal(preencherModelo('Campo {inexistente} some.', v), 'Campo some.');
});

test('limpeza do texto', () => {
  assert.equal(limparTexto('a  b   c'), 'A b c');
  assert.equal(limparTexto('Olá , mundo .'), 'Olá, mundo.');
  assert.equal(limparTexto('Fim,.'), 'Fim.');
  assert.equal(limparTexto('Fim..'), 'Fim.');
  assert.equal(limparTexto('Um, , dois'), 'Um, dois');
  assert.equal(limparTexto('Um.\n\n\n\ndois.'), 'Um.\n\nDois.');
  assert.equal(limparTexto('O motivo? experiência.'), 'O motivo? Experiência.');
  assert.equal(limparTexto('Preço 1.600,00 reais.'), 'Preço 1.600,00 reais.');
});

test('versões dão a volta e WhatsApp entra no texto quando preenchido', () => {
  const total = contarVersoes('tradicao');
  assert.deepEqual(gerarAnuncio(COMPLETO, 'tradicao', total, HOJE), gerarAnuncio(COMPLETO, 'tradicao', 0, HOJE));

  const comWhats = gerarAnuncio({ ...COMPLETO, whatsapp: '17991026669' }, 'melhor-preco', 0, HOJE);
  assert.match(comWhats.texto, /WhatsApp \(17\) 99102-6669/);
  const semWhats = gerarAnuncio(COMPLETO, 'melhor-preco', 0, HOJE);
  assert.ok(!semWhats.texto.includes('WhatsApp'));
});

test('palavras-chave sugeridas e mensagem do WhatsApp', () => {
  const saida = gerarAnuncio(COMPLETO, 'inovacao', 0, HOJE);
  assert.deepEqual(saida.palavrasChave, [
    'publicidade',
    'publicidade São José do Rio Preto',
    'agência de publicidade São José do Rio Preto',
  ]);
  assert.equal(saida.whatsappMsg, 'Olá! Vi o anúncio da Empresa XPTO no Distrito Digital e gostaria de um orçamento.');
  // Sem cidade: não repete a palavra-chave
  assert.deepEqual(gerarAnuncio({ palavra_chave: 'x', mercado: 'y' }, 'inovacao', 0, HOJE).palavrasChave, ['x']);
});

test('formatação do telefone', () => {
  assert.equal(formatarTelefone('17991026669'), '(17) 99102-6669');
  assert.equal(formatarTelefone('1733334444'), '(17) 3333-4444');
  assert.equal(formatarTelefone('(17) 9910'), '(17) 9910');
  assert.equal(formatarTelefone(''), '');
});
