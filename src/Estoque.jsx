import {useEffect,useState} from 'react';import {supabase} from './supabase';import {Form,dt} from './ui.jsx';
export default function Estoque(){
  const [itens,setI]=useState([]),[movs,setM]=useState([]),[f,setF]=useState(null),[ina,setIna]=useState(true);
  const carregar=async()=>{
    const a=await supabase.from('itens').select('*').order('nome');
    const b=await supabase.from('movimentacoes').select('*,itens(nome),servicos(nome)').order('created_at',{ascending:false}).limit(100);
    setI(a.data||[]);setM(b.data||[])};
  useEffect(()=>{carregar()},[]);
  const rpc=async(fn,args)=>{const {error}=await supabase.rpc(fn,args);if(error)return error.message;carregar()};
  const novo=()=>setF({titulo:'Novo item',campos:[{k:'nome',l:'Nome da ferramenta',r:1},{k:'qtd',l:'Quantidade inicial',t:'number',v:1,r:1}],onSubmit:v=>rpc('criar_item',{p_nome:v.nome,p_qtd:+v.qtd})});
  const mov=(it,tipo)=>setF({titulo:`${tipo==='entrada'?'Entrada':'Saída'}: ${it.nome}`,campos:[{k:'qtd',l:'Quantidade',t:'number',v:1,r:1}],onSubmit:v=>rpc('registrar_movimentacao',{p_item:it.id,p_tipo:tipo,p_qtd:+v.qtd,p_servico:null})});
  return <>
    <div className="bar"><h2>Ferramentas em estoque</h2><div><label className="ck"><input type="checkbox" checked={ina} onChange={e=>setIna(e.target.checked)}/> Mostrar inativos</label><button className="b p" onClick={novo}>Adicionar item</button></div></div>
    {itens.length?<div className="tw"><table><thead><tr><th>Qtd</th><th>Item</th><th>Status</th><th/></tr></thead><tbody>
      {itens.filter(i=>ina||i.qtd>0).map(i=><tr key={i.id} className={i.qtd?'':'off'}><td className="q">{i.qtd}</td><td>{i.nome}</td><td><span className={'tg '+(i.qtd?'ok':'no')}>{i.qtd?'Ativo':'Inativo'}</span></td>
      <td className="ac"><button className="b" onClick={()=>mov(i,'entrada')}>Entrada</button> <button className="b" disabled={!i.qtd} onClick={()=>mov(i,'saida')}>Saída</button></td></tr>)}</tbody></table></div>
      :<p className="em">Nenhum item cadastrado. Adicione a primeira ferramenta para começar.</p>}
    <h3>Histórico de movimentações</h3>
    {movs.length?<div className="tw"><table><thead><tr><th>Data e hora</th><th>Item</th><th>Tipo</th><th>Qtd</th><th>Responsável</th><th>Serviço</th></tr></thead><tbody>
      {movs.map(m=><tr key={m.id}><td>{dt(m.created_at)}</td><td>{m.itens?.nome}</td><td><span className={'tg '+(m.tipo==='entrada'?'ok':'rd')}>{m.tipo==='entrada'?'Entrada':'Saída'}</span></td><td>{m.qtd}</td><td>{m.usuario_nome}</td><td>{m.servicos?.nome||'—'}</td></tr>)}</tbody></table></div>
      :<p className="em">Nenhuma movimentação registrada ainda.</p>}
    {f&&<Form {...f} onClose={()=>setF(null)}/>}
  </>;
}
