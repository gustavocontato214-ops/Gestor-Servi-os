import { useState } from 'react';
export const dt = d => new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
export const fd = d => d ? d.split('-').reverse().join('/') : '—';
export const brl = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const hoje = () => new Date().toISOString().slice(0, 10);
// onSubmit devolve um texto de erro (mantém aberto) ou nada (fecha)
export function Form({ titulo, campos, onSubmit, onClose }) {
  const [v, setV] = useState(() => Object.fromEntries(campos.map(c => [c.k, c.v ?? c.o?.[0]?.[0] ?? ''])));
  const [erro, setErro] = useState(''), [ld, setLd] = useState(false);
  const set = k => e => setV({ ...v, [k]: e.target.value });
  async function ok(e) { e.preventDefault(); setLd(true); const r = await onSubmit(v); setLd(false); r ? setErro(r) : onClose() }
  return <div className="ov"><form className="dlg" onSubmit={ok}><h3>{titulo}</h3>
    {campos.map(c => <label key={c.k}>{c.l}
      {c.t === 'select' ? <select value={v[c.k]} onChange={set(c.k)}>{c.o.map(o => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>
        : c.t === 'area' ? <textarea rows="3" value={v[c.k]} onChange={set(c.k)} required={c.r} />
          : <input type={c.t || 'text'} min={c.t === 'number' ? 0 : undefined} step={c.t === 'number' ? 'any' : undefined} value={v[c.k]} onChange={set(c.k)} required={c.r} />}</label>)}
    <p className="er">{erro}</p>
    <div className="row"><button type="button" className="b" onClick={onClose}>Cancelar</button><button className="b p" disabled={ld}>{ld ? 'Salvando…' : 'Salvar'}</button></div></form></div>;
}
