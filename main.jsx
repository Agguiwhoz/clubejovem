import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { MessageCircle, Send, ShieldCheck, Lightbulb, ArrowUpRight, LogIn, LogOut, CheckCircle2, Clock3, XCircle, Menu, ChevronRight, Heart, Sparkles } from 'lucide-react';
import './styles.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const categories = ['Juventude', 'Relacionamentos', 'Sociedade', 'Desenvolvimento pessoal', 'Fé e valores', 'Educação e carreira', 'Actualidade', 'Outro'];
const statusLabel = { pending: 'Em análise', approved: 'Aprovado', selected: 'Escolhido para debate', rejected: 'Não seleccionado' };

function App() {
  const [view, setView] = useState('home');
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ title: '', category: 'Juventude', description: '', anonymous: true, name: '', email: '' });
  const [session, setSession] = useState(null);
  const [adminIdeas, setAdminIdeas] = useState([]);
  const [login, setLogin] = useState({ email: '', password: '' });
  const [adminBusy, setAdminBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadIdeas() {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from('suggestions')
      .select('id,title,category,description,votes,status,created_at')
      .in('status', ['approved', 'selected']).order('votes', { ascending: false }).limit(30);
    if (error) setNotice('Não foi possível carregar as sugestões públicas.');
    else setIdeas(data || []);
    setLoading(false);
  }
  useEffect(() => { loadIdeas(); }, []);

  async function submitIdea(e) {
    e.preventDefault();
    if (!supabase) { setNotice('A plataforma ainda não está ligada à base de dados. Consulte o guia de instalação.'); return; }
    if (!form.anonymous && !form.name.trim()) { setNotice('Indique o seu nome ou escolha a opção anónima.'); return; }
    setLoading(true);
    const payload = {
      title: form.title.trim(), category: form.category, description: form.description.trim(),
      is_anonymous: form.anonymous, author_name: form.anonymous ? null : form.name.trim(),
      author_email: form.anonymous ? null : (form.email.trim() || null), status: 'pending'
    };
    const { error } = await supabase.from('suggestions').insert(payload);
    setLoading(false);
    if (error) setNotice(error.message.includes('row-level') ? 'Não foi possível enviar. Verifique as permissões da base de dados.' : 'Ocorreu um erro ao enviar a sugestão.');
    else {
      setForm({ title: '', category: 'Juventude', description: '', anonymous: true, name: '', email: '' });
      setNotice('Sugestão recebida! A equipa do Club Jovem irá analisá-la. Obrigado por participares.');
      setView('home');
    }
  }

  async function signIn(e) {
    e.preventDefault();
    if (!supabase) return setNotice('Configure primeiro a ligação à base de dados.');
    setAdminBusy(true);
    const { error } = await supabase.auth.signInWithPassword(login);
    setAdminBusy(false);
    if (error) setNotice('Não foi possível iniciar sessão. Confirme as credenciais.');
    else { setView('admin'); setNotice(''); }
  }

  async function loadAdmin() {
    if (!supabase || !session) return;
    setAdminBusy(true);
    const { data, error } = await supabase.from('suggestions').select('*').order('created_at', { ascending: false });
    if (error) setNotice('Acesso não autorizado ou erro ao carregar propostas.');
    else setAdminIdeas(data || []);
    setAdminBusy(false);
  }
  useEffect(() => { if (view === 'admin' && session) loadAdmin(); }, [view, session]);

  async function updateStatus(id, status) {
    const { error } = await supabase.from('suggestions').update({ status }).eq('id', id);
    if (error) setNotice('Não foi possível actualizar o estado. Verifique se a conta tem permissões de administrador.');
    else { setAdminIdeas(items => items.map(x => x.id === id ? { ...x, status } : x)); setNotice('Estado actualizado.'); }
  }

  async function vote(id) {
    if (!supabase) return;
    const key = 'wisa-voter-token';
    let token = localStorage.getItem(key);
    if (!token) { token = crypto.randomUUID(); localStorage.setItem(key, token); }
    const { error } = await supabase.from('votes').insert({ suggestion_id: id, voter_token: token });
    if (error) setNotice(error.code === '23505' ? 'Já votaste nesta sugestão neste dispositivo.' : 'Não foi possível registar o voto.');
    else { setNotice('Voto registado. Obrigado!'); loadIdeas(); }
  }

  const stats = useMemo(() => ({
    total: adminIdeas.length,
    pending: adminIdeas.filter(x => x.status === 'pending').length,
    selected: adminIdeas.filter(x => x.status === 'selected').length
  }), [adminIdeas]);

  const configured = !!supabase;

  return <div className="app">
    <header className="topbar">
      <button className="brand" onClick={() => setView('home')} aria-label="Wisa Tovova início">
        <span className="brand-mark"><MessageCircle size={25}/></span>
        <span><b>wisa</b><small>tovova</small></span>
      </button>
      <nav><button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>Início</button><button className={view === 'submit' ? 'active' : ''} onClick={() => setView('submit')}>Enviar sugestão</button><button className="admin-link" onClick={() => setView(session ? 'admin' : 'login')}><ShieldCheck size={16}/> Equipa</button></nav>
    </header>

    <main>
      {view === 'home' && <>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow"><span className="pulse"/> UMA INICIATIVA DO CLUB JOVEM</span>
            <h1>As melhores conversas <em>começam contigo.</em></h1>
            <p>Que assunto gostarias de ver discutido no próximo Wisa Tovova? Partilha a tua ideia. A tua voz pode iniciar uma grande conversa.</p>
            <div className="hero-actions"><button className="primary" onClick={() => setView('submit')}>Sugerir um tema <ArrowUpRight size={18}/></button><button className="text-btn" onClick={() => document.getElementById('como-funciona')?.scrollIntoView({behavior:'smooth'})}>Como funciona <ChevronRight size={17}/></button></div>
            <div className="hero-note"><span className="avatar-dots"><i/><i/><i/></span><span>Uma ideia tua pode chegar ao próximo debate.</span></div>
          </div>
          <div className="hero-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="chat-card"><span className="chat-tag">A PERGUNTA É TUA</span><h2>O que precisamos de conversar?</h2><div className="chat-line"/><div className="chat-line short"/><div className="typing"><i/><i/><i/></div></div><div className="art-sticker">A tua voz<br/>importa.</div></div>
        </section>

        <section className="intro-strip"><div><span className="mini-icon"><Lightbulb size={20}/></span><div><b>Não há ideias pequenas.</b><p>Queremos ouvir os assuntos que realmente importam para ti.</p></div></div><div><span className="mini-icon"><MessageCircle size={20}/></span><div><b>Conversas com respeito.</b><p>Diferentes opiniões ajudam-nos a crescer.</p></div></div><div><span className="mini-icon"><ShieldCheck size={20}/></span><div><b>Podes participar anonimamente.</b><p>A identificação é opcional.</p></div></div></section>

        <section className="section" id="como-funciona"><div className="section-heading"><span className="eyebrow blue">PARTICIPA</span><h2>É simples. A conversa começa aqui.</h2><p>Três passos para fazeres parte dos próximos debates.</p></div><div className="steps"><article><span>01</span><h3>Pensa num tema</h3><p>Escolhe um assunto que merece atenção e conversa.</p></article><article><span>02</span><h3>Envia a tua ideia</h3><p>Escreve a sugestão e decide se queres identificar-te.</p></article><article><span>03</span><h3>Acompanha</h3><p>A equipa analisa as propostas e pode escolhê-las para os próximos debates.</p></article></div></section>

        <section className="section ideas-section"><div className="section-heading row-heading"><div><span className="eyebrow blue">A COMUNIDADE PROPÕE</span><h2>Temas em destaque</h2><p>Propostas aprovadas para receber a participação da comunidade.</p></div><button className="outline" onClick={() => setView('submit')}>Enviar uma ideia <Send size={16}/></button></div>
          {!configured && <div className="setup-note">Pré-visualização: liga a plataforma ao Supabase para receber e publicar sugestões reais.</div>}
          {loading ? <p className="muted">A carregar…</p> : ideas.length ? <div className="idea-grid">{ideas.map(x => <article className="idea-card" key={x.id}><span className="category">{x.category}</span><h3>{x.title}</h3><p>{x.description}</p><div className="idea-foot"><span><Heart size={15}/> {x.votes || 0} votos</span><span className={x.status === 'selected' ? 'chosen' : ''}>{x.status === 'selected' ? 'Escolhido' : 'Aprovado'}</span><button onClick={() => vote(x.id)} aria-label="Votar nesta sugestão">Votar <ArrowUpRight size={14}/></button></div></article>)}</div> : <div className="empty"><MessageCircle size={28}/><b>As primeiras conversas começam com uma ideia.</b><p>Em breve, poderás ver aqui os temas aprovados pela equipa.</p><button className="primary small" onClick={() => setView('submit')}>Sugerir primeiro tema</button></div>}
        </section>
        <section className="closing"><div><span className="eyebrow">WISA TOVOVA</span><h2>Não fiques só a pensar.<br/><em>Vem e vamos conversar.</em></h2></div><button className="white-btn" onClick={() => setView('submit')}>Partilhar uma sugestão <ArrowUpRight size={17}/></button></section>
      </>}

      {view === 'submit' && <section className="form-page"><button className="back" onClick={() => setView('home')}>← Voltar ao início</button><div className="form-intro"><span className="eyebrow blue">A TUA VOZ IMPORTA</span><h1>Que tema devemos <em>conversar?</em></h1><p>Preenche os campos abaixo. A tua sugestão será enviada à equipa do Club Jovem para análise.</p></div><form className="suggestion-form" onSubmit={submitIdea}>
        <label htmlFor="title">Qual é o tema? <span>*</span></label><input id="title" required maxLength="100" placeholder="Ex.: Estamos a viver para impressionar os outros?" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
        <label htmlFor="category">Categoria <span>*</span></label><select id="category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select>
        <label htmlFor="description">Por que gostarias de conversar sobre este tema?</label><textarea id="description" rows="4" maxLength="700" placeholder="Partilha um pouco do teu ponto de vista (opcional)." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><small className="counter">{form.description.length}/700</small>
        <div className="privacy-choice"><div><b>Como queres participar?</b><p>Podes enviar a sugestão anonimamente ou identificar-te.</p></div><label className="switch"><input type="checkbox" checked={form.anonymous} onChange={e=>setForm({...form,anonymous:e.target.checked})}/><span/></label></div>
        {form.anonymous ? <div className="anonymous-info"><ShieldCheck size={18}/> A tua sugestão será enviada sem nome ou contacto.</div> : <div className="identity-fields"><label htmlFor="name">O teu nome <span>*</span></label><input id="name" required placeholder="Como te chamas?" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><label htmlFor="email">Email (opcional)</label><input id="email" type="email" placeholder="teuemail@exemplo.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>}
        <button className="primary submit-btn" disabled={loading}>{loading ? 'A enviar…' : 'Enviar a minha sugestão'} <Send size={17}/></button><p className="form-legal">Ao enviar, concordas que a equipa do Club Jovem analise a tua proposta. Não publiques dados pessoais teus ou de terceiros no texto da sugestão.</p>
      </form></section>}

      {view === 'login' && <section className="login-page"><div className="login-card"><span className="login-icon"><ShieldCheck/></span><span className="eyebrow blue">ÁREA RESERVADA</span><h1>Painel da equipa</h1><p>Acesso exclusivo aos membros autorizados do Club Jovem.</p><form onSubmit={signIn}><label>Email institucional</label><input type="email" required value={login.email} onChange={e=>setLogin({...login,email:e.target.value})} placeholder="equipa@clubjovem.org"/><label>Palavra-passe</label><input type="password" required value={login.password} onChange={e=>setLogin({...login,password:e.target.value})} placeholder="A tua palavra-passe"/><button className="primary submit-btn" disabled={adminBusy}>Entrar <LogIn size={17}/></button></form><button className="back centered" onClick={()=>setView('home')}>Voltar ao site</button></div></section>}

      {view === 'admin' && <section className="admin-page"><div className="admin-head"><div><span className="eyebrow blue">GESTÃO DE CONTEÚDOS</span><h1>Painel do Club Jovem</h1><p>Analisa, organiza e selecciona as sugestões recebidas.</p></div><button className="outline" onClick={async()=>{await supabase.auth.signOut();setView('home')}}><LogOut size={16}/> Terminar sessão</button></div><div className="stats"><div><span>Total recebidas</span><b>{stats.total}</b></div><div><span>Em análise</span><b>{stats.pending}</b></div><div><span>Escolhidas</span><b>{stats.selected}</b></div></div><div className="admin-list"><div className="admin-list-head"><h2>Sugestões recebidas</h2><button className="outline" onClick={loadAdmin}>Actualizar</button></div>{adminBusy ? <p className="muted">A carregar…</p> : adminIdeas.length ? adminIdeas.map(x=><article className="admin-item" key={x.id}><div className="admin-item-top"><span className="category">{x.category}</span><span className="status">{statusLabel[x.status]}</span></div><h3>{x.title}</h3><p>{x.description || 'Sem descrição adicional.'}</p><div className="admin-meta"><span>{x.is_anonymous ? 'Participação anónima' : `Por: ${x.author_name || 'Sem nome'}`}</span><span>{new Date(x.created_at).toLocaleDateString('pt-PT')}</span>{x.author_email && <span>{x.author_email}</span>}</div><div className="admin-actions"><button onClick={()=>updateStatus(x.id,'approved')}><CheckCircle2 size={15}/> Aprovar</button><button onClick={()=>updateStatus(x.id,'selected')}><Sparkles size={15}/> Escolher para debate</button><button className="reject" onClick={()=>updateStatus(x.id,'rejected')}><XCircle size={15}/> Não seleccionar</button></div></article>) : <div className="empty">Ainda não existem sugestões.</div>}</div></section>}
    </main>
    {notice && <div className="toast" role="status"><span>{notice}</span><button onClick={()=>setNotice('')}><XCircle size={17}/></button></div>}
    <footer><div className="footer-brand"><b>wisa</b><span>tovova</span></div><p>Vem e vamos conversar.</p><small>Uma iniciativa do Club Jovem · © {new Date().getFullYear()}</small><button onClick={()=>setView('login')}>Acesso da equipa</button></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);