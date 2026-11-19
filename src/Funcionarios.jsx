import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { Form } from "./ui.jsx";
const h = (t) => (t ? t.slice(0, 5) : "");
const hor = (x) =>
  h(x.horario_inicio) && h(x.horario_fim)
    ? `${h(x.horario_inicio)} às ${h(x.horario_fim)}`
    : "—";
export default function Funcionarios({ eu }) {
  const [ps, setP] = useState([]),
    [cs, setC] = useState([]),
    [f, setF] = useState(null);
  const carregar = async () => {
    const a = await supabase.from("perfis").select("*").order("nome");
    const b = await supabase.from("convites").select("*").order("nome");
    setP(a.data || []);
    setC(b.data || []);
  };
  useEffect(() => {
    carregar();
  }, []);
  const tempo = (x) => [
    {
      k: "inicio",
      l: "Início do expediente",
      t: "time",
      v: h(x?.horario_inicio),
    },
    { k: "fim", l: "Fim do expediente", t: "time", v: h(x?.horario_fim) },
  ];
  const convidar = () =>
    setF({
      titulo: "Convidar funcionário",
      campos: [
        { k: "nome", l: "Nome", r: 1 },
        { k: "email", l: "E-mail", t: "email", r: 1 },
        ...tempo(),
      ],
      onSubmit: async (v) => {
        const { error } = await supabase
          .from("convites")
          .insert({
            nome: v.nome,
            email: v.email.toLowerCase(),
            horario_inicio: v.inicio || null,
            horario_fim: v.fim || null,
          });
        if (error)
          return error.code === "23505"
            ? "Este e-mail já foi convidado ou já tem conta."
            : error.message;
        carregar();
      },
    });
  const horario = (x) =>
    setF({
      titulo: `Horário: ${x.nome}`,
      campos: tempo(x),
      onSubmit: async (v) => {
        const { error } = await supabase.rpc("atualizar_horario", {
          p_id: x.id,
          p_inicio: v.inicio || null,
          p_fim: v.fim || null,
        });
        if (error) return error.message;
        carregar();
      },
    });
  const excluir = async (x) => {
    if (!confirm(`Excluir ${x.nome}? A pessoa perderá o acesso ao sistema.`))
      return;
    const { error } = await supabase.rpc("excluir_funcionario", { p_id: x.id });
    error ? alert(error.message) : carregar();
  };
  const cancelar = async (c) => {
    await supabase.from("convites").delete().eq("id", c.id);
    carregar();
  };
  return (
    <>
      <div className="bar">
        <h2>Funcionários</h2>
        <button className="b p" onClick={convidar}>
          Convidar funcionário
        </button>
      </div>
      <p className="mu">
        Depois de convidar, peça para a pessoa criar a conta no sistema usando o
        mesmo e-mail.
      </p>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Tipo</th>
              <th>Horário</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ps.map((x) => (
              <tr key={x.id}>
                <td>{x.nome}</td>
                <td>{x.email || "—"}</td>
                <td>
                  <span className={"tg " + (x.papel === "admin" ? "ok" : "no")}>
                    {x.papel === "admin" ? "Administrador" : "Funcionário"}
                  </span>
                </td>
                <td>{hor(x)}</td>
                <td className="ac">
                  <button className="b" onClick={() => horario(x)}>
                    Horário
                  </button>
                  {x.papel === "funcionario" && x.id !== eu && (
                    <>
                      {" "}
                      <button className="b" onClick={() => excluir(x)}>
                        Excluir
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {cs.map((c) => (
              <tr key={c.id}>
                <td>{c.nome}</td>
                <td>{c.email}</td>
                <td>
                  <span className="tg rd">Convite pendente</span>
                </td>
                <td>{hor(c)}</td>
                <td className="ac">
                  <button className="b" onClick={() => cancelar(c)}>
                    Cancelar convite
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {f && <Form {...f} onClose={() => setF(null)} />}
    </>
  );
}
