import {useEffect,useState} from 'react';import {supabase} from './supabase';import {Form,fd,brl,hoje} from './ui.jsx';
export default function Orcamentos({pre,limpar}){
  const [qs,setQ]=useState([]),[sv,setS]=useState([]),[f,setF]=useState(null),[doc,setDoc]=useState(null);
  const carregar=async()=>{
    const a=await supabase.from('orcamentos').select('*,servicos(nome)').order('created_at',{ascending:false});
    const b=await supabase.from('servicos').select('id,nome').order('nome');
    setQ(a.data||[]);setS(b.data||[]);return b.data||[]};
  const novo=(lista,sid)=>{if(!lista.length)return alert('Cadastre um serviço antes de criar o orçamento.');
    setF({titulo:'Novo orçamento',campos:[{k:'servico_id',l:'Serviço',t:'select',o:lista.map(s=>[s.id,s.nome]),v:sid||lista[0].id},{k:'cliente',l:'Nome da empresa',r:1},{k:'cnpj',l:'CNPJ da empresa',r:1},{k:'data',l:'Data do orçamento',t:'date',v:hoje(),r:1},{k:'validade',l:'Validade',t:'date',r:1},{k:'valor_materiais',l:'Valor dos materiais (R$)',t:'number',r:1},{k:'descricao',l:'Descrição dos materiais',t:'area',r:1},{k:'assinatura_cliente',l:'Assinatura da empresa (nome de quem assina)',r:1},{k:'assinatura_nos',l:'Nossa assinatura (nome de quem assina)',r:1}],
      onSubmit:async v=>{const {error}=await supabase.from('orcamentos').insert({...v,valor_materiais:+v.valor_materiais});if(error)return error.message;carregar()}})};
  useEffect(()=>{carregar().then(l=>{if(pre){novo(l,pre);limpar()}})},[]);
  return <>
    <div className="bar"><h2>Orçamentos</h2><button className="b p" onClick={()=>novo(sv)}>Novo orçamento</button></div>
    {qs.length?<div className="tw"><table><thead><tr><th>Empresa</th><th>Serviço</th><th>Data</th><th>Validade</th><th>Materiais</th><th/></tr></thead><tbody>
      {qs.map(q=><tr key={q.id}><td>{q.cliente}<div className="mu">{q.cnpj}</div></td><td>{q.servicos?.nome||'—'}</td><td>{fd(q.data)}</td><td>{fd(q.validade)}{q.validade<hoje()&&<> <span className="tg rd">Vencido</span></>}</td><td>{brl(q.valor_materiais)}</td><td className="ac"><button className="b" onClick={()=>setDoc(q)}>Abrir</button></td></tr>)}</tbody></table></div>
      :<p className="em">Nenhum orçamento ainda. Crie um a partir de um serviço cadastrado.</p>}
    {f&&<Form {...f} onClose={()=>setF(null)}/>}
    {doc&&<div className="ov"><div className="dlg doc"><h3>Orçamento: {doc.cliente}</h3>
      <dl><dt>Serviço</dt><dd>{doc.servicos?.nome}</dd><dt>CNPJ</dt><dd>{doc.cnpj}</dd><dt>Data</dt><dd>{fd(doc.data)}</dd><dt>Validade</dt><dd>{fd(doc.validade)}</dd><dt>Valor dos materiais</dt><dd><b>{brl(doc.valor_materiais)}</b></dd><dt>Descrição</dt><dd style={{whiteSpace:'pre-wrap'}}>{doc.descricao}</dd></dl>
      <div className="sig"><div><hr/>{doc.assinatura_cliente}<small>Assinatura da empresa</small></div><div><hr/>{doc.assinatura_nos}<small>Nossa assinatura</small></div></div>
      <div className="row noprint"><button className="b" onClick={()=>setDoc(null)}>Fechar</button><button className="b p" onClick={()=>window.print()}>Imprimir</button></div></div></div>}
  </>;
}
