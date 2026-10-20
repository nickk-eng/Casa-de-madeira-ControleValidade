'use strict';

// Cada cadastro representa um alimento ou lote com sua própria validade.
const CHAVE = 'casa-de-madeira-alimentos-v1';
const el = id => document.getElementById(id);
let alimentos = [];
let editando = null;
let armazenamentoDisponivel = true;

function dataValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(valor + 'T12:00:00');
  return !Number.isNaN(data.getTime()) && data.getFullYear() > 0 &&
    `${String(data.getFullYear()).padStart(4, '0')}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}` === valor;
}

try {
  const dados = JSON.parse(localStorage.getItem(CHAVE) || '[]');
  if (!Array.isArray(dados)) throw new Error('Formato inválido');
  alimentos = dados.filter(item => item && typeof item.id === 'string' &&
    typeof item.nome === 'string' && typeof item.unidade === 'string' &&
    Number.isFinite(item.quantidade) && item.quantidade > 0 && dataValida(item.validade));
} catch {
  armazenamentoDisponivel = false;
  el('mensagem').textContent = 'Não foi possível carregar os dados. Os novos cadastros ficarão apenas nesta sessão; exporte um CSV para guardá-los.';
}

// Compara dias do calendário local, sem erros por horário ou mudança de fuso.
function diasRestantes(validade, hoje = new Date()) {
  const [ano, mes, dia] = validade.split('-').map(Number);
  return Math.round((Date.UTC(ano, mes - 1, dia) -
    Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) / 86400000);
}

function situacao(validade) {
  const dias = diasRestantes(validade);
  if (dias < 0) return { tipo: 'vencido', texto: 'Vencido' };
  if (dias === 0) return { tipo: 'proximo', texto: 'Vence hoje' };
  if (dias <= 3) return { tipo: 'proximo', texto: `Vence em ${dias} dia(s)` };
  return { tipo: 'regular', texto: 'Mais de 3 dias' };
}

function persistir(mensagem) {
  if (armazenamentoDisponivel) {
    try { localStorage.setItem(CHAVE, JSON.stringify(alimentos)); }
    catch { armazenamentoDisponivel = false; }
  }
  el('mensagem').textContent = armazenamentoDisponivel ? mensagem :
    mensagem + ' Atenção: os dados estão apenas nesta sessão. Exporte um CSV para guardá-los.';
  renderizar();
}

function celula(linha, texto) {
  const td = document.createElement('td');
  td.textContent = texto;
  linha.appendChild(td);
  return td;
}

function renderizar() {
  el('total').textContent = alimentos.length;
  el('proximos').textContent = alimentos.filter(a => situacao(a.validade).tipo === 'proximo').length;
  el('vencidos').textContent = alimentos.filter(a => situacao(a.validade).tipo === 'vencido').length;
  const busca = el('busca').value.trim().toLocaleLowerCase('pt-BR');
  const filtro = el('filtro').value;
  const visiveis = alimentos.filter(a => a.nome.toLocaleLowerCase('pt-BR').includes(busca) &&
    (filtro === 'todos' || situacao(a.validade).tipo === filtro))
    .sort((a, b) => a.validade.localeCompare(b.validade) || a.nome.localeCompare(b.nome));
  el('lista').replaceChildren();
  for (const alimento of visiveis) {
    const linha = document.createElement('tr');
    celula(linha, alimento.nome);
    celula(linha, `${alimento.quantidade.toLocaleString('pt-BR')} ${alimento.unidade}`);
    celula(linha, alimento.validade.split('-').reverse().join('/'));
    const estado = situacao(alimento.validade);
    const selo = document.createElement('span');
    selo.className = 'selo ' + estado.tipo;
    selo.textContent = estado.texto;
    celula(linha, '').appendChild(selo);
    const acoes = celula(linha, '');
    for (const [texto, acao] of [['Editar', () => editar(alimento.id)], ['Excluir', () => excluir(alimento.id)]]) {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'secundario' + (texto === 'Excluir' ? ' excluir' : '');
      botao.textContent = texto;
      botao.setAttribute('aria-label', `${texto} ${alimento.nome}`);
      botao.addEventListener('click', acao);
      acoes.appendChild(botao);
    }
    el('lista').appendChild(linha);
  }
  el('vazio').hidden = visiveis.length > 0;
  el('vazio').textContent = alimentos.length ? 'Nenhum alimento encontrado com esses filtros.' :
    'Nenhum alimento cadastrado. Comece pelo formulário acima.';
}

function cancelarEdicao() {
  editando = null;
  el('formulario').reset();
  el('titulo-formulario').textContent = 'Cadastrar alimento';
  el('salvar').textContent = 'Cadastrar alimento';
  el('cancelar').hidden = true;
}

function editar(id) {
  const alimento = alimentos.find(a => a.id === id);
  if (!alimento) return;
  editando = id;
  for (const campo of ['nome', 'quantidade', 'unidade', 'validade']) el(campo).value = alimento[campo];
  el('titulo-formulario').textContent = 'Editar alimento';
  el('salvar').textContent = 'Salvar alterações';
  el('cancelar').hidden = false;
  el('nome').focus();
}

function excluir(id) {
  const alimento = alimentos.find(a => a.id === id);
  if (!alimento || !confirm(`Excluir o cadastro de ${alimento.nome}?`)) return;
  alimentos = alimentos.filter(a => a.id !== id);
  if (editando === id) cancelarEdicao();
  persistir('Alimento excluído.');
}

el('formulario').addEventListener('submit', evento => {
  evento.preventDefault();
  const nome = el('nome').value.trim();
  const quantidade = Number(el('quantidade').value);
  const validade = el('validade').value;
  if (!nome || !Number.isFinite(quantidade) || quantidade <= 0 || !dataValida(validade)) {
    el('mensagem').textContent = 'Preencha o nome, uma quantidade maior que zero e uma data válida.';
    return;
  }
  const alimento = { id: editando || `alimento-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    nome, quantidade, unidade: el('unidade').value, validade };
  const eraEdicao = editando !== null;
  if (eraEdicao) alimentos = alimentos.map(a => a.id === editando ? alimento : a);
  else alimentos.push(alimento);
  cancelarEdicao();
  persistir(eraEdicao ? 'Alimento atualizado.' : 'Alimento cadastrado.');
});

el('cancelar').addEventListener('click', cancelarEdicao);
el('busca').addEventListener('input', renderizar);
el('filtro').addEventListener('change', renderizar);
el('exportar').addEventListener('click', () => {
  if (!alimentos.length) {
    el('mensagem').textContent = 'Cadastre um alimento antes de exportar.';
    return;
  }
  // Protege os campos de texto contra fórmulas ao abrir em uma planilha.
  const campoCSV = valor => '"' + String(valor).replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""') + '"';
  const linhas = [['Alimento', 'Quantidade', 'Unidade', 'Vencimento', 'Situação'],
    ...[...alimentos].sort((a,b) => a.validade.localeCompare(b.validade)).map(a =>
      [a.nome, a.quantidade.toLocaleString('pt-BR'), a.unidade, a.validade.split('-').reverse().join('/'), situacao(a.validade).texto])];
  const blob = new Blob(['\uFEFF' + linhas.map(l => l.map(campoCSV).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'casa-de-madeira-validade.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

renderizar();
// Atualiza os alertas caso a tela continue aberta durante a virada do dia.
setInterval(renderizar, 60000);
window.addEventListener('focus', renderizar);
