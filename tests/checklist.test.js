// Testes do checklist de SEO local. Rodar com: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarChecklist, normalizar } from '../src/checklist.js';

const DADOS = {
  empresa: 'Vidraçaria Casa',
  palavra_chave: 'vidraçaria',
  cidade: 'Forte, SP',
};

const TEXTO_BOM =
  'Vidraçaria com o melhor custo-benefício em Forte é na Vidraçaria Casa. ' +
  'Preço justo, condições facilitadas e atendimento de confiança, sem abrir mão da qualidade. '.repeat(3) +
  'Chame no WhatsApp (17) 99102-6669 e peça seu orçamento.';

const item = (lista, inicio) => lista.find((i) => i.label.startsWith(inicio));

test('normaliza sem acentos e sem diferenciar maiúsculas', () => {
  assert.equal(normalizar('  São JOSÉ  do Rio Preto '), 'sao jose do rio preto');
});

test('texto bom atende todos os itens', () => {
  const lista = montarChecklist(
    { titulo: 'Vidraçaria Casa | Vidraçaria em Forte', texto: TEXTO_BOM, descricao: 'Vidraçaria em Forte.' },
    { ...DADOS, whatsapp: '(17) 99102-6669' },
  );
  assert.equal(lista.length, 9);
  assert.deepEqual(lista.filter((i) => !i.ok), []);
  assert.equal(item(lista, 'Palavra-chave “').label, 'Palavra-chave “vidraçaria” no texto');
  assert.equal(item(lista, 'Cidade').label, 'Cidade “Forte” no texto');
});

test('compara sem acento e sem maiúsculas', () => {
  const lista = montarChecklist({ titulo: 't', texto: 'VIDRACARIA em forte. vidracaria casa', descricao: 'd' }, DADOS);
  assert.ok(item(lista, 'Palavra-chave “').ok);
  assert.ok(item(lista, 'Cidade').ok);
  assert.ok(item(lista, 'Nome da empresa').ok);
});

test('item de telefone só aparece com WhatsApp preenchido', () => {
  const semCampo = montarChecklist({ titulo: 't', texto: TEXTO_BOM, descricao: 'd' }, DADOS);
  assert.equal(semCampo.length, 8);
  assert.equal(item(semCampo, 'Telefone'), undefined);

  const vazio = montarChecklist({ titulo: 't', texto: TEXTO_BOM, descricao: 'd' }, { ...DADOS, whatsapp: '' });
  assert.equal(item(vazio, 'Telefone'), undefined);

  const outro = montarChecklist({ titulo: 't', texto: TEXTO_BOM, descricao: 'd' }, { ...DADOS, whatsapp: '(17) 98888-7777' });
  assert.equal(item(outro, 'Telefone').ok, false);
});

test('palavra-chave e cidade precisam estar nos primeiros 120 caracteres', () => {
  const texto = `${'Texto genérico sem os termos. '.repeat(5)}Vidraçaria em Forte.`;
  const lista = montarChecklist({ titulo: 't', texto, descricao: 'd' }, DADOS);
  assert.ok(item(lista, 'Palavra-chave “').ok);
  assert.equal(item(lista, 'Palavra-chave e cidade logo no começo').ok, false);
});

test('chamada para ação', () => {
  const sem = montarChecklist({ titulo: 't', texto: 'Somos uma vidraçaria.', descricao: 'd' }, DADOS);
  assert.equal(item(sem, 'Chamada').ok, false);
  for (const frase of ['Fale conosco.', 'Entre em contato!', 'PEÇA já.', 'Solicite um orçamento.', 'Agende sua visita.']) {
    const com = montarChecklist({ titulo: 't', texto: frase, descricao: 'd' }, DADOS);
    assert.ok(item(com, 'Chamada').ok, frase);
  }
});

test('limites de tamanho', () => {
  const curto = montarChecklist({ titulo: 'x'.repeat(61), texto: 'curto', descricao: 'y'.repeat(156) }, DADOS);
  assert.equal(item(curto, 'Tamanho').ok, false);
  assert.equal(item(curto, 'Título').ok, false);
  assert.equal(item(curto, 'Descrição').ok, false);

  const longo = montarChecklist({ titulo: 'x'.repeat(60), texto: 'a'.repeat(1601), descricao: 'y'.repeat(155) }, DADOS);
  assert.equal(item(longo, 'Tamanho').ok, false);
  assert.ok(item(longo, 'Título').ok);
  assert.ok(item(longo, 'Descrição').ok);
});
