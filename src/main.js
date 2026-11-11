/*
 * ============================================================================
 *  INTERFACE DO CRIADOR DE ANÚNCIOS
 *  Liga o formulário, os cards de modelo e a área de resultado.
 *  Toda a geração de texto fica em generator.js (pode virar IA no futuro).
 * ============================================================================
 */

import './style.css';
import { modelos } from './templates.js';
import { gerarAnuncio, contarVersoes, formatarTelefone } from './generator.js';
import { montarChecklist, LIMITES } from './checklist.js';

/* ---------------------------------------------------------------------------
 *  Configuração
 * ------------------------------------------------------------------------ */

// Campos do formulário (os que não existirem no HTML são ignorados)
const CAMPOS = [
  'empresa', 'palavra_chave', 'argumento_principal', 'cidade', 'atuacao', 'mercado',
  'argumento1', 'argumento2', 'argumento3', 'ano_fundacao', 'whatsapp',
];

// Campos obrigatórios e o texto mostrado no lugar enquanto estiverem vazios
const OBRIGATORIOS = {
  empresa: 'Nome da empresa',
  palavra_chave: 'Palavra-chave',
  argumento_principal: 'Argumento principal',
  cidade: 'Região ou cidade',
  mercado: 'Mercado',
};

// Dados de exemplo da planilha, carregados ao abrir a página
const EXEMPLO = {
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
  whatsapp: '',
};

// Ícones dos cards de modelo (traço simples, herdam a cor do texto)
const ICONES = {
  tradicao:
    '<path d="M3 18.5h18"/><path d="M4 8l4.5 4L12 5l3.5 7L20 8l-1.6 8H5.6L4 8z"/><circle cx="12" cy="5" r=".6"/>',
  inovacao:
    '<path d="M9.5 17.5h5M10.5 20.5h3"/><path d="M12 4a5.5 5.5 0 0 0-3.2 10c.6.5 1 1.2 1 2v.5h4.4V16c0-.8.4-1.5 1-2A5.5 5.5 0 0 0 12 4z"/><path d="M12 1v1M4 4.5l.8.8M20 4.5l-.8.8M1.5 11h1M21.5 11h1"/>',
  qualidade:
    '<circle cx="12" cy="9" r="6"/><path d="M9.4 9.1l1.8 1.8 3.4-3.4"/><path d="M8.6 14l-1.6 7.5 5-2.6 5 2.6-1.6-7.5"/>',
  'melhor-empresa':
    '<circle cx="12" cy="15.5" r="5"/><path d="M12 13.2l.8 1.6 1.7.2-1.3 1.2.3 1.7-1.5-.8-1.5.8.3-1.7-1.3-1.2 1.7-.2z"/><path d="M9 11.3L6.5 3h3.5l2 5.2L14 3h3.5L15 11.3"/>',
  'melhor-preco':
    '<circle cx="10" cy="12" r="7"/><circle cx="10" cy="12" r="4.6"/><path d="M11.2 10.4c-.2-.5-.7-.8-1.3-.8-.8 0-1.3.5-1.3 1.1 0 1.5 2.8.9 2.8 2.5 0 .6-.6 1.2-1.4 1.2-.7 0-1.2-.4-1.4-.9M10 8.8v.8M10 14.4v.8"/><path d="M20.5 7v10M18.5 15l2 2 2-2"/>',
};

/* ---------------------------------------------------------------------------
 *  Estado e elementos
 * ------------------------------------------------------------------------ */

const estado = {
  modelo: modelos[0].id,
  versao: 0,
  editado: false, // o usuário editou os textos gerados à mão?
  geracao: 0, //    contador para descartar respostas antigas (útil com IA)
};

const $ = (seletor) => document.querySelector(seletor);
const form = $('#formulario');
const saidaTitulo = $('#saida-titulo');
const saidaTexto = $('#saida-texto');
const saidaDescricao = $('#saida-descricao');

/** Lê os valores do formulário. Campos ausentes no HTML não entram. */
function lerDados() {
  const dados = {};
  for (const nome of CAMPOS) {
    const el = form.elements.namedItem(nome);
    if (el) dados[nome] = el.value;
  }
  return dados;
}

/* ---------------------------------------------------------------------------
 *  Cards de modelo
 * ------------------------------------------------------------------------ */

function montarCardsModelos() {
  const lista = $('#modelos');
  for (const m of modelos) {
    const card = document.createElement('label');
    card.className = 'modelo';
    card.innerHTML = `
      <input type="radio" name="modelo" value="${m.id}" class="sr-only" />
      <svg class="modelo__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[m.id] || ''}</svg>
      <span class="modelo__nome"></span>
      <span class="modelo__resumo"></span>`;
    card.querySelector('.modelo__nome').textContent = m.nome;
    card.querySelector('.modelo__resumo').textContent = m.resumo;
    const radio = card.querySelector('input');
    radio.checked = m.id === estado.modelo;
    radio.addEventListener('change', () => {
      estado.modelo = m.id;
      estado.versao = 0;
      gerar();
    });
    lista.appendChild(card);
  }
}

/* ---------------------------------------------------------------------------
 *  Validação e avisos dos campos
 * ------------------------------------------------------------------------ */

const tocados = new Set(); // campos que o usuário já visitou

// Textos de ajuda padrão (mostrados quando não há aviso)
const AJUDA = {
  palavra_chave: 'Uma palavra só.',
  ano_fundacao: 'Usado no modelo Tradição.',
};

/** Atualiza o aviso de um campo. tipo: '' (ajuda), 'alerta' ou 'erro'. */
function mostrarAviso(nome, mensagem, tipo = '') {
  const alvo = document.querySelector(`[data-aviso="${nome}"]`);
  const campo = form.elements.namedItem(nome);
  if (!alvo) return;
  alvo.textContent = mensagem || AJUDA[nome] || '';
  alvo.className = tipo ? `aviso aviso--${tipo}` : '';
  if (campo) campo.classList.toggle('invalido', tipo === 'erro');
  if (campo) campo.setAttribute('aria-invalid', tipo === 'erro' ? 'true' : 'false');
}

function validarCampos() {
  const dados = lerDados();

  for (const nome of Object.keys(OBRIGATORIOS)) {
    const vazio = !String(dados[nome] ?? '').trim();
    if (vazio && tocados.has(nome)) {
      mostrarAviso(nome, 'Campo obrigatório.', 'erro');
      continue;
    }
    // Regras específicas de cada campo
    const valor = String(dados[nome] ?? '').trim();
    if (nome === 'palavra_chave' && /\s/.test(valor)) {
      mostrarAviso(nome, 'Use uma palavra só, sem espaços.', 'alerta');
    } else if (nome === 'cidade' && valor && valor[0] !== valor[0].toLocaleUpperCase('pt-BR')) {
      mostrarAviso(nome, 'Comece com letra maiúscula (ex.: Campinas).', 'alerta');
    } else {
      mostrarAviso(nome, '');
    }
  }

  // Ano de fundação: aceita "1998" ou "30/06/1998"
  const ano = String(dados.ano_fundacao ?? '').trim();
  const anoOk = !ano || /^\d{4}$/.test(ano) || /^\d{1,2}[/.-]\d{1,2}[/.-]\d{4}$/.test(ano);
  mostrarAviso('ano_fundacao', anoOk ? '' : 'Use o formato 1998 ou 30/06/1998.', anoOk ? '' : 'alerta');

  // Contador do nome da empresa
  const contador = document.querySelector('[data-contador-campo="empresa"]');
  if (contador) contador.textContent = `${(dados.empresa || '').length}/30`;

  // Lista de obrigatórios que faltam (mostrada acima do resultado)
  const faltando = Object.entries(OBRIGATORIOS)
    .filter(([nome]) => !String(dados[nome] ?? '').trim())
    .map(([, rotulo]) => rotulo);
  const aviso = $('#faltando');
  aviso.hidden = faltando.length === 0;
  aviso.textContent = faltando.length
    ? `Falta preencher: ${faltando.join(', ')}. Os trechos entre colchetes serão trocados pelos dados.`
    : '';
}

/* ---------------------------------------------------------------------------
 *  Geração e renderização do resultado
 * ------------------------------------------------------------------------ */

/** Gera o anúncio com os dados atuais e preenche a área de resultado. */
async function gerar() {
  const id = ++estado.geracao;
  const dados = lerDados();

  // Obrigatórios vazios aparecem como [Campo] no texto, para orientar o usuário
  const dadosGeracao = { ...dados };
  for (const [nome, rotulo] of Object.entries(OBRIGATORIOS)) {
    if (!String(dados[nome] ?? '').trim()) dadosGeracao[nome] = `[${rotulo}]`;
  }

  // await: permite trocar o gerador por uma chamada assíncrona (IA) no futuro
  const saida = await gerarAnuncio(dadosGeracao, estado.modelo, estado.versao);
  if (id !== estado.geracao) return; // chegou uma geração mais nova

  saidaTitulo.value = saida.titulo;
  saidaTexto.value = saida.texto;
  saidaDescricao.value = saida.descricao;
  estado.editado = false;
  $('#aviso-edicao').classList.remove('aviso-edicao--ativo');

  renderizarPalavrasChave(saida.palavrasChave);
  $('#whatsapp-msg').textContent = saida.whatsappMsg;

  const modelo = modelos.find((m) => m.id === estado.modelo);
  const total = contarVersoes(estado.modelo);
  $('#selo-modelo').textContent = `Modelo: ${modelo.nome}`;
  $('#versao-info').textContent = `Versão ${(estado.versao % total) + 1} de ${total} deste modelo.`;
  $('#outra-versao').disabled = total < 2;

  atualizarAnalise();
}

/** Recalcula contadores e checklist (chamado a cada edição dos textos). */
function atualizarAnalise() {
  atualizarContador(saidaTitulo, $('#contador-titulo'), (n) => `${n}/${LIMITES.titulo}`, (n) => n > LIMITES.titulo);
  atualizarContador(
    saidaTexto,
    $('#contador-texto'),
    (n) => `${n.toLocaleString('pt-BR')} caracteres · ideal ${LIMITES.textoMin} a ${LIMITES.textoMax.toLocaleString('pt-BR')}`,
    (n) => n < LIMITES.textoMin || n > LIMITES.textoMax,
  );
  atualizarContador(saidaDescricao, $('#contador-descricao'), (n) => `${n}/${LIMITES.descricao}`, (n) => n > LIMITES.descricao);

  const itens = montarChecklist(
    { titulo: saidaTitulo.value, texto: saidaTexto.value, descricao: saidaDescricao.value },
    lerDados(),
  );
  const lista = $('#checklist');
  lista.replaceChildren(
    ...itens.map((item) => {
      const li = document.createElement('li');
      li.className = item.ok ? 'ok' : 'pendente';
      li.innerHTML = item.ok
        ? '<span class="checklist__icone" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M4.5 8.3l2.2 2.2 4.8-4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>'
        : '<span class="checklist__icone" aria-hidden="true">!</span>';
      const texto = document.createElement('span');
      texto.textContent = item.label;
      const status = document.createElement('span');
      status.className = 'sr-only';
      status.textContent = item.ok ? ' (atendido)' : ' (pendente)';
      li.append(texto, status);
      return li;
    }),
  );
  const atendidos = itens.filter((i) => i.ok).length;
  $('#checklist-resumo').textContent = `${atendidos} de ${itens.length} itens atendidos.`;
}

function atualizarContador(campo, alvo, formatar, excedeu) {
  const n = campo.value.length;
  alvo.textContent = formatar(n);
  alvo.classList.toggle('contador--excedido', excedeu(n));
  campo.classList.toggle('saida__campo--excedido', excedeu(n));
}

function renderizarPalavrasChave(palavras) {
  const lista = $('#palavras-chave');
  lista.replaceChildren(
    ...palavras.map((palavra) => {
      const li = document.createElement('li');
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'chip';
      botao.textContent = palavra;
      botao.title = 'Copiar palavra-chave';
      botao.addEventListener('click', () => copiar(palavra, botao));
      li.appendChild(botao);
      return li;
    }),
  );
}

/* ---------------------------------------------------------------------------
 *  Copiar para a área de transferência
 * ------------------------------------------------------------------------ */

/**
 * Copia o texto e mostra "Copiado!" no botão.
 * Se a API de clipboard falhar, tenta execCommand e, por último,
 * deixa o texto selecionado (no campo `selecionar`) para o usuário copiar.
 */
async function copiar(texto, botao, selecionar) {
  let ok = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      ok = true;
    }
  } catch {
    ok = false;
  }

  if (!ok) ok = copiarComSelecao(texto);

  if (!ok && selecionar) {
    selecionar.focus();
    selecionar.select();
  }
  mostrarFeedback(botao, ok ? 'Copiado!' : 'Selecionado: use Ctrl+C');
}

/** Alternativa antiga: copia através de um campo temporário selecionado. */
function copiarComSelecao(texto) {
  const temp = document.createElement('textarea');
  temp.value = texto;
  temp.setAttribute('readonly', '');
  temp.style.position = 'fixed';
  temp.style.opacity = '0';
  document.body.appendChild(temp);
  temp.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  temp.remove();
  return ok;
}

function mostrarFeedback(botao, mensagem) {
  if (!botao.dataset.textoOriginal) botao.dataset.textoOriginal = botao.textContent;
  botao.textContent = mensagem;
  botao.classList.add('botao--copiado');
  $('#anuncio-status').textContent = mensagem;
  clearTimeout(botao._timer);
  botao._timer = setTimeout(() => {
    botao.textContent = botao.dataset.textoOriginal;
    botao.classList.remove('botao--copiado');
  }, 1800);
}

/* ---------------------------------------------------------------------------
 *  Dados de exemplo e limpeza
 * ------------------------------------------------------------------------ */

function carregarExemplo() {
  for (const [nome, valor] of Object.entries(EXEMPLO)) {
    const el = form.elements.namedItem(nome);
    if (!el) continue;
    el.value = valor;
    if (valor && el.tagName !== 'SELECT') el.classList.add('exemplo');
  }
  $('#aviso-exemplo').hidden = false;
}

/** Tira a marcação de exemplo de um campo; some com o aviso se não sobrar nenhum. */
function desmarcarExemplo(el) {
  el.classList.remove('exemplo');
  if (!form.querySelector('.exemplo')) $('#aviso-exemplo').hidden = true;
}

/** Limpa o formulário. `reiniciarModelo` volta para o primeiro modelo. */
function limparTudo(reiniciarModelo) {
  form.reset();
  form.querySelectorAll('.exemplo').forEach((el) => el.classList.remove('exemplo'));
  $('#aviso-exemplo').hidden = true;
  tocados.clear();
  if (reiniciarModelo) estado.modelo = modelos[0].id;
  // form.reset() desmarca os cards; marca de novo o modelo atual
  form.querySelector(`input[name="modelo"][value="${estado.modelo}"]`).checked = true;
  estado.versao = 0;
  validarCampos();
  gerar();
  form.elements.namedItem('empresa').focus();
}

/* ---------------------------------------------------------------------------
 *  Eventos
 * ------------------------------------------------------------------------ */

function ligarEventos() {
  // Qualquer alteração nos dados regenera o texto em tempo real
  form.addEventListener('input', (e) => {
    const el = e.target;
    if (el.name === 'modelo') return;
    if (el.name === 'whatsapp') el.value = formatarTelefone(el.value);
    desmarcarExemplo(el);
    validarCampos();
    gerar();
  });
  // Mostra "Campo obrigatório" só depois que o usuário passou pelo campo
  form.addEventListener('focusout', (e) => {
    if (e.target.name in OBRIGATORIOS) {
      tocados.add(e.target.name);
      validarCampos();
    }
  });
  form.addEventListener('submit', (e) => e.preventDefault());

  // Edição manual dos textos: recalcula checklist e destaca o aviso
  for (const campo of [saidaTitulo, saidaTexto, saidaDescricao]) {
    campo.addEventListener('input', () => {
      estado.editado = true;
      $('#aviso-edicao').classList.add('aviso-edicao--ativo');
      atualizarAnalise();
    });
  }
  // O título é uma linha só: Enter não quebra linha
  saidaTitulo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.preventDefault();
  });

  $('#copiar-texto').addEventListener('click', (e) => copiar(saidaTexto.value, e.currentTarget, saidaTexto));
  $('#copiar-tudo').addEventListener('click', (e) => {
    const tudo =
      `Título:\n${saidaTitulo.value}\n\n` +
      `Texto do anúncio:\n${saidaTexto.value}\n\n` +
      `Descrição curta (Google):\n${saidaDescricao.value}`;
    copiar(tudo, e.currentTarget, saidaTexto);
  });
  $('#copiar-whatsapp').addEventListener('click', (e) => copiar($('#whatsapp-msg').textContent, e.currentTarget));

  $('#outra-versao').addEventListener('click', () => {
    estado.versao = (estado.versao + 1) % contarVersoes(estado.modelo);
    gerar();
  });

  // Novo anúncio: confirmação na própria página (sem confirm())
  const acoes = $('#acoes');
  const confirmacao = $('#confirmacao');
  const fecharConfirmacao = () => {
    confirmacao.hidden = true;
    acoes.hidden = false;
  };
  $('#novo-anuncio').addEventListener('click', () => {
    acoes.hidden = true;
    confirmacao.hidden = false;
    $('#cancelar-novo').focus();
  });
  $('#cancelar-novo').addEventListener('click', () => {
    fecharConfirmacao();
    $('#novo-anuncio').focus();
  });
  $('#confirmar-novo').addEventListener('click', () => {
    fecharConfirmacao();
    limparTudo(true);
  });
  confirmacao.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      fecharConfirmacao();
      $('#novo-anuncio').focus();
    }
  });

  $('#limpar-exemplo').addEventListener('click', () => limparTudo(false));
}

/* ---------------------------------------------------------------------------
 *  Início
 * ------------------------------------------------------------------------ */

montarCardsModelos();
carregarExemplo();
ligarEventos();
validarCampos();
gerar();
