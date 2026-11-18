import { useEffect, useState } from 'react'; import { supabase } from './supabase'; import { Form, fd, hoje } from './ui.jsx';
export default function Servicos({ onOrc }) {
  const [sv, setS] = useState([]), [movs, setM] = useState([]), [itens, setI] = useState([]), [f, setF] = useState(null);
  const carregar = async () => {
    const a = await supabase.from('servicos').select('*').order('created_at', { ascending: false });
    const b = await supabase.from('movimentacoes').select('*,itens(nome)').not('servico_id', 'is', null);
    const c = await supabase.from('itens').select('*').order('nome');
    setS(a.data || []); setM(b.data || []); setI(c.data || [])
  };
  useEffect(() => { carregar() }, []);
  const tally = id => { const t = {}; movs.filter(m => m.servico_id === id).forEach(m => { const x = t[m.item_id] ??= { n: m.itens?.nome, o: 0, r: 0 }; x[m.tipo === 'saida' ? 'o' : 'r'] += m.qtd }); return t };
  const novo = () => setF({
    titulo: 'Novo serviço', campos: [{ k: 'nome', l: 'Serviço', r: 1 }, { k: 'tempo_estimado', l: 'Tempo estimado (ex.: 3 dias)', r: 1 }, { k: 'materiais', l: 'Materiais necessários', t: 'area' }, { k: 'pessoas', l: 'Pessoas trabalhando', t: 'number', v: 1, r: 1 }, { k: 'inicio', l: 'Dia de início', t: 'date', v: hoje(), r: 1 }, { k: 'supervisor', l: 'Supervisor', r: 1 }, { k: 'responsavel', l: 'Responsável pela equipe', r: 1 }],
    onSubmit: async v => { const { error } = await supabase.from('servicos').insert({ ...v, pessoas: +v.pessoas }); if (error) return error.message; carregar() }
  });
  const mov = (s, tipo) => {
    const t = tally(s.id);
    const o = tipo === 'saida' ? itens.filter(i => i.qtd > 0).map(i => [i.id, `${i.nome} (disp. ${i.qtd})`]) : Object.entries(t).filter(([, x]) => x.o > x.r).map(([k, x]) => [k, `${x.n} (pendente ${x.o - x.r})`]);
    if (!o.length) return alert(tipo === 'saida' ? 'Nenhuma ferramenta disponível.' : 'Nada pendente de devolução.');
    setF({
      titulo: tipo === 'saida' ? 'Retirar ferramenta' : 'Devolver ferramenta', campos: [{ k: 'item', l: 'Ferramenta', t: 'select', o }, { k: 'qtd', l: 'Quantidade', t: 'number', v: 1, r: 1 }],
      onSubmit: async v => {
        if (tipo === 'entrada' && +v.qtd > t[v.item].o - t[v.item].r) return 'Quantidade maior que o pendente.';
        const { error } = await supabase.rpc('registrar_movimentacao', { p_item: v.item, p_tipo: tipo, p_qtd: +v.qtd, p_servico: s.id }); if (error) return error.message; carregar()
      }
    })
  };
  return <>
    <div className="bar"><h2>Serviços em andamento</h2><button className="b p" onClick={novo}>Novo serviço</button></div>
    {!sv.length && <p className="em">Nenhum serviço cadastrado. Registre o primeiro para controlar retiradas e criar o orçamento.</p>}
    {sv.map(s => {
      const t = Object.values(tally(s.id)), pend = t.some(x => x.o > x.r); return <div className="sv" key={s.id}>
        <header><h2>{s.nome}</h2><span className={'tg ' + (pend ? 'rd' : 'ok')}>{pend ? 'Ferramentas pendentes' : 'Sem pendências'}</span></header>
        <div className="gr"><div><span>Início</span>{fd(s.inicio)}</div><div><span>Tempo estimado</span>{s.tempo_estimado}</div><div><span>Equipe</span>{s.pessoas} pessoa(s)</div><div><span>Supervisor</span>{s.supervisor}</div><div><span>Responsável pela equipe</span>{s.responsavel}</div></div>
        {s.materiais && <div className="ln"><b>Materiais necessários:</b> {s.materiais}</div>}
        <div className="ln"><b>Pegou:</b> {t.filter(x => x.o).map(x => `${x.n} ×${x.o}`).join(', ') || 'nada'}</div>
        <div className="ln"><b>Devolveu:</b> {t.filter(x => x.r).map(x => `${x.n} ×${x.r}`).join(', ') || 'nada'}</div>
        <div className="row"><button className="b" onClick={() => mov(s, 'saida')}>Retirar ferramenta</button><button className="b" onClick={() => mov(s, 'entrada')}>Devolver ferramenta</button><button className="b p" onClick={() => onOrc(s.id)}>Criar orçamento</button></div></div>
    })}
    {f && <Form {...f} onClose={() => setF(null)} />}
  </>;
}
