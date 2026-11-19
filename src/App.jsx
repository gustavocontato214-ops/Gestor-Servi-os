import {useEffect,useState} from 'react';import {supabase} from './supabase';
import Inicio from './Inicio.jsx';import Estoque from './Estoque.jsx';import Servicos from './Servicos.jsx';import Orcamentos from './Orcamentos.jsx';import Funcionarios from './Funcionarios.jsx';
function Login(){
  const [novo,setNovo]=useState(false),[v,setV]=useState({}),[msg,setMsg]=useState('');
  const set=k=>e=>setV({...v,[k]:e.target.value});
  async function ok(e){e.preventDefault();setMsg('');
    const r=novo?await supabase.auth.signUp({email:v.email,password:v.senha,options:{data:{nome:v.nome,empresa:v.empresa}}}):await supabase.auth.signInWithPassword({email:v.email,password:v.senha});
    if(r.error)setMsg(r.error.message);else if(novo&&!r.data.session)setMsg('Conta criada. Confirme o e-mail e depois entre.')}
  return <div className="ov"><form className="dlg" onSubmit={ok}><h3>{novo?'Criar conta':'Entrar'}</h3>
    {novo&&<><label>Seu nome<input required onChange={set('nome')}/></label><label>Nome da empresa (só para cadastrar uma empresa nova; se foi convidado, deixe em branco)<input onChange={set('empresa')}/></label></>}
    <label>E-mail<input type="email" required onChange={set('email')}/></label><label>Senha<input type="password" minLength="6" required onChange={set('senha')}/></label>
    <p className="er">{msg}</p><div className="row"><button type="button" className="b" onClick={()=>setNovo(!novo)}>{novo?'Já tenho conta':'Criar conta'}</button><button className="b p">{novo?'Criar':'Entrar'}</button></div></form></div>;
}
export default function App(){
  const [s,setS]=useState(undefined),[p,setP]=useState(null),[tab,setTab]=useState('inicio'),[pre,setPre]=useState(null);
  useEffect(()=>{supabase.auth.getSession().then(({data})=>setS(data.session));
    const {data:l}=supabase.auth.onAuthStateChange((_,x)=>setS(x));return()=>l.subscription.unsubscribe()},[]);
  useEffect(()=>{if(!s){setP(null);return}(async()=>{
    const q=()=>supabase.from('perfis').select('nome,papel,horario_inicio,horario_fim,empresas(nome)').eq('id',s.user.id).maybeSingle();let {data}=await q();
    if(!data){const m=s.user.user_metadata||{};await supabase.rpc('criar_empresa',{p_empresa:m.empresa||'Minha empresa',p_nome:m.nome||s.user.email});({data}=await q())}
    setP(data);setTab('inicio')})()},[s?.user?.id]);
  if(s===undefined)return null;if(!s)return <Login/>;if(!p)return <p className="em">Carregando…</p>;
  const admin=p.papel==='admin';
  const T=[['inicio','Início'],['estoque','Estoque'],['servicos','Serviços'],...(admin?[['orc','Orçamentos'],['func','Funcionários']]:[])];
  return <div className="app"><div className="bar"><h1>Estoque e serviços</h1><div className="mu">{p.empresas?.nome} · {p.nome} ({admin?'Administrador':'Funcionário'}) <button className="b" onClick={()=>supabase.auth.signOut()}>Sair</button></div></div>
    <div className="tabs">{T.map(([k,l])=><button key={k} className={'tab'+(tab===k?' on':'')} onClick={()=>setTab(k)}>{l}</button>)}</div>
    {tab==='inicio'&&<Inicio p={p} admin={admin} ir={setTab}/>}{tab==='estoque'&&<Estoque admin={admin}/>}
    {tab==='servicos'&&<Servicos admin={admin} onOrc={id=>{setPre(id);setTab('orc')}}/>}
    {admin&&tab==='orc'&&<Orcamentos pre={pre} limpar={()=>setPre(null)}/>}{admin&&tab==='func'&&<Funcionarios eu={s.user.id}/>}</div>;
}
