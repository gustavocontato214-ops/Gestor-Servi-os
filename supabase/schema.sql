-- Rode no Supabase: SQL Editor > New query > Run
create extension if not exists pgcrypto;
create table empresas(id uuid primary key default gen_random_uuid(),nome text not null,created_at timestamptz default now());
create table perfis(id uuid primary key references auth.users on delete cascade,empresa_id uuid not null references empresas,nome text not null);
create function minha_empresa() returns uuid language sql security definer stable set search_path=public as $$select empresa_id from perfis where id=auth.uid()$$;
create table itens(id uuid primary key default gen_random_uuid(),empresa_id uuid not null references empresas,nome text not null,qtd int not null default 0 check(qtd>=0),created_at timestamptz default now());
create table servicos(id uuid primary key default gen_random_uuid(),empresa_id uuid not null default minha_empresa() references empresas,nome text not null,tempo_estimado text,materiais text,pessoas int,inicio date,supervisor text,responsavel text,created_at timestamptz default now());
create table movimentacoes(id uuid primary key default gen_random_uuid(),empresa_id uuid not null references empresas,item_id uuid not null references itens,servico_id uuid references servicos,tipo text not null check(tipo in('entrada','saida')),qtd int not null check(qtd>0),usuario_id uuid references auth.users,usuario_nome text not null,created_at timestamptz default now());
create table orcamentos(id uuid primary key default gen_random_uuid(),empresa_id uuid not null default minha_empresa() references empresas,servico_id uuid references servicos,cliente text not null,cnpj text not null,data date not null,validade date not null,valor_materiais numeric(12,2) not null,descricao text not null,assinatura_cliente text not null,assinatura_nos text not null,created_at timestamptz default now());

alter table empresas enable row level security;alter table perfis enable row level security;alter table itens enable row level security;
alter table servicos enable row level security;alter table movimentacoes enable row level security;alter table orcamentos enable row level security;
create policy ver on empresas for select using(id=minha_empresa());
create policy ver on perfis for select using(empresa_id=minha_empresa());
create policy ver on itens for select using(empresa_id=minha_empresa());
create policy ver on movimentacoes for select using(empresa_id=minha_empresa());
create policy tudo on servicos for all using(empresa_id=minha_empresa()) with check(empresa_id=minha_empresa());
create policy tudo on orcamentos for all using(empresa_id=minha_empresa()) with check(empresa_id=minha_empresa());
-- itens e movimentacoes só mudam pelas funções abaixo (o estoque nunca fica negativo)

create function criar_empresa(p_empresa text,p_nome text) returns void language plpgsql security definer set search_path=public as $$
declare e uuid;
begin
 if auth.uid() is null then raise exception 'Não autenticado'; end if;
 if exists(select 1 from perfis where id=auth.uid()) then return; end if;
 insert into empresas(nome) values(p_empresa) returning id into e;
 insert into perfis(id,empresa_id,nome) values(auth.uid(),e,p_nome);
end$$;

create function registrar_movimentacao(p_item uuid,p_tipo text,p_qtd int,p_servico uuid default null) returns void language plpgsql security definer set search_path=public as $$
declare emp uuid:=minha_empresa(); it itens; v_nome text;
begin
 if emp is null then raise exception 'Usuário sem empresa'; end if;
 if p_qtd is null or p_qtd<1 then raise exception 'Quantidade inválida'; end if;
 select * into it from itens where id=p_item and empresa_id=emp for update;
 if not found then raise exception 'Item não encontrado'; end if;
 if p_servico is not null and not exists(select 1 from servicos where id=p_servico and empresa_id=emp) then raise exception 'Serviço inválido'; end if;
 if p_tipo='saida' and it.qtd<p_qtd then raise exception 'Estoque insuficiente (disponível: %)',it.qtd; end if;
 update itens set qtd=qtd+case when p_tipo='entrada' then p_qtd else -p_qtd end where id=p_item;
 select nome into v_nome from perfis where id=auth.uid();
 insert into movimentacoes(empresa_id,item_id,servico_id,tipo,qtd,usuario_id,usuario_nome) values(emp,p_item,p_servico,p_tipo,p_qtd,auth.uid(),v_nome);
end$$;

create function criar_item(p_nome text,p_qtd int) returns void language plpgsql security definer set search_path=public as $$
declare emp uuid:=minha_empresa(); i uuid;
begin
 if emp is null then raise exception 'Usuário sem empresa'; end if;
 insert into itens(empresa_id,nome) values(emp,p_nome) returning id into i;
 perform registrar_movimentacao(i,'entrada',p_qtd);
end$$;
