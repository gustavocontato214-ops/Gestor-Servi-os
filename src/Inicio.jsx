import {useEffect,useState} from 'react';import {supabase} from './supabase';
const h=t=>t?t.slice(0,5):null;
export default function Inicio({p,admin,ir}){
  const [n,setN]=useState({});
  useEffect(()=>{(async()=>{
    const c=async(t,f)=>{const q=supabase.from(t).select('id',{count:'exact',head:true});return ((f?f(q):q)).then(r=>r.count??0)};
    setN({itens:await c('itens',q=>q.gt('qtd',0)),serv:await c('servicos'),...(admin?{orc:await c('orcamentos'),func:await c('perfis')}:{})})})()},[]);
  const hr=new Date().getHours(),sau=hr<12?'Bom dia':hr<18?'Boa tarde':'Boa noite';
  const cards=[['estoque',n.itens,'Ferramentas ativas'],['servicos',n.serv,'Serviços'],...(admin?[['orc',n.orc,'Orçamentos'],['func',n.func,'Usuários da empresa']]:[])];
  return <>
    <div className="hero"><h2>{sau}, {p.nome}!</h2>
      <p>Bem-vindo à {p.empresas?.nome}. Hoje é {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}.</p>
      <p className="mu">{admin?'Você é administrador: tem acesso a todas as áreas e gerencia a equipe.':'Você pode consultar ferramentas e serviços e registrar retiradas e devoluções.'}
        {h(p.horario_inicio)&&h(p.horario_fim)?` Seu horário: ${h(p.horario_inicio)} às ${h(p.horario_fim)}.`:''}</p></div>
    <div className="cards">{cards.map(([k,v,l])=><button key={k} className="card" onClick={()=>ir(k)}><b>{v??'…'}</b><span>{l}</span></button>)}</div>
  </>;
}
