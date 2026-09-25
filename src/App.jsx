import { useEffect, useMemo, useRef, useState } from 'react'

const storageKey = 'tale-steward-projects-v1'
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const emptyProject = (title = 'Untitled story') => ({
  id: uid(), title, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  scenes: [], characters: [], world: []
})
const words = (text = '') => text.trim() ? text.trim().split(/\s+/).length : 0
const shortDate = (date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

function loadProjects() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch { return [] }
}

export default function App() {
  const [projects, setProjects] = useState(loadProjects)
  const [activeId, setActiveId] = useState(() => loadProjects()[0]?.id || null)
  const [view, setView] = useState('dashboard')
  const [query, setQuery] = useState('')
  const fileRef = useRef(null)
  const active = projects.find((project) => project.id === activeId) || null

  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(projects)), [projects])
  useEffect(() => { if (!active && view !== 'dashboard') setView('dashboard') }, [active, view])

  const updateProject = (id, updater) => setProjects((all) => all.map((project) => project.id === id ? { ...updater(project), updatedAt: new Date().toISOString() } : project))
  const createProject = () => {
    const title = window.prompt('Name your story or manuscript:', 'New story')
    if (!title?.trim()) return
    const project = emptyProject(title.trim())
    setProjects((all) => [project, ...all])
    setActiveId(project.id)
    setView('scenes')
  }
  const removeProject = (id) => {
    const project = projects.find((item) => item.id === id)
    if (!project || !window.confirm(`Delete “${project.title}”? This cannot be undone unless you exported a backup.`)) return
    const remaining = projects.filter((item) => item.id !== id)
    setProjects(remaining)
    setActiveId(remaining[0]?.id || null)
    setView('dashboard')
  }
  const renameProject = () => {
    if (!active) return
    const title = window.prompt('Project title:', active.title)
    if (title?.trim()) updateProject(active.id, (project) => ({ ...project, title: title.trim() }))
  }
  const exportProject = () => {
    if (!active) return
    const blob = new Blob([JSON.stringify(active, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${active.title.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '').toLowerCase() || 'tale-steward'}-backup.json`
    link.click()
    URL.revokeObjectURL(link.href)
  }
  const importProject = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (!data || typeof data !== 'object' || !Array.isArray(data.scenes) || !Array.isArray(data.characters) || !Array.isArray(data.world)) throw new Error('Invalid backup')
      const imported = { ...data, id: uid(), title: `${data.title || 'Imported story'} (imported)`, updatedAt: new Date().toISOString() }
      setProjects((all) => [imported, ...all])
      setActiveId(imported.id)
      setView('scenes')
    } catch { window.alert('That file is not a valid Tale Steward backup.') }
  }

  const nav = [
    ['dashboard', 'Dashboard'], ['scenes', 'Manuscript'], ['characters', 'Characters'], ['world', 'World bible'], ['review', 'Continuity review'], ['search', 'Search']
  ]

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">✦</span><span>Tale Steward</span></div>
      <button className="primary wide" onClick={createProject}>＋ New story</button>
      <nav>{nav.map(([id, label]) => <button key={id} className={view === id ? 'nav active' : 'nav'} onClick={() => setView(id)} disabled={id !== 'dashboard' && !active}>{label}</button>)}</nav>
      <div className="sidebar-bottom"><button className="nav" onClick={() => fileRef.current?.click()}>⇧ Import backup</button><input ref={fileRef} type="file" accept="application/json" hidden onChange={importProject} /><p>Private by design<br/>Saved in this browser.</p></div>
    </aside>
    <main>
      <header className="topbar">
        <div><p className="eyebrow">{view === 'dashboard' ? 'Your writing home' : active?.title}</p><h1>{titleFor(view)}</h1></div>
        {active && view !== 'dashboard' && <div className="top-actions"><button className="secondary" onClick={renameProject}>Rename</button><button className="secondary" onClick={exportProject}>Export backup</button></div>}
      </header>
      <section className="content">
        {view === 'dashboard' && <Dashboard projects={projects} onCreate={createProject} onOpen={(id) => { setActiveId(id); setView('scenes') }} onDelete={removeProject} />}
        {view === 'scenes' && active && <Scenes project={active} updateProject={updateProject} />}
        {view === 'characters' && active && <Records project={active} updateProject={updateProject} type="characters" title="Characters" description="Keep the people in your story consistent." fields={[['name', 'Name'], ['role', 'Role'], ['appearance', 'Appearance'], ['motivation', 'Motivation'], ['relationships', 'Relationships'], ['notes', 'Notes']]} />}
        {view === 'world' && active && <Records project={active} updateProject={updateProject} type="world" title="World bible" description="Track places, systems, objects, history, and rules." fields={[['name', 'Entry name'], ['category', 'Category'], ['description', 'Description'], ['details', 'Important details'], ['notes', 'Notes']]} />}
        {view === 'review' && active && <Review project={active} />}
        {view === 'search' && active && <Search project={active} query={query} setQuery={setQuery} />}
      </section>
    </main>
  </div>
}

function titleFor(view) {
  return ({ dashboard: 'Stories in progress', scenes: 'Manuscript workspace', characters: 'Character ledger', world: 'World bible', review: 'Continuity review', search: 'Search your story' })[view]
}

function Dashboard({ projects, onCreate, onOpen, onDelete }) {
  return <><div className="hero"><div><span className="pill">Personal prototype</span><h2>A calm place to steward every thread of your story.</h2><p>Create a story, add scenes and notes, then build the reference system that helps you revise with confidence.</p></div><button className="primary" onClick={onCreate}>Create your first story</button></div><div className="section-heading"><h2>Your projects</h2><span>{projects.length} total</span></div>{projects.length === 0 ? <div className="empty"><div className="empty-icon">✦</div><h3>Your shelf is empty</h3><p>Begin with one manuscript. Everything stays on this device until you choose to export a backup.</p><button className="primary" onClick={onCreate}>Create a story</button></div> : <div className="project-grid">{projects.map((project) => <article className="project-card" key={project.id}><span className="card-symbol">✧</span><h3>{project.title}</h3><p>{project.scenes.length} scenes · {project.characters.length} characters · {project.world.length} world entries</p><small>Updated {shortDate(project.updatedAt)}</small><div className="card-actions"><button className="secondary" onClick={() => onOpen(project.id)}>Open workspace</button><button className="danger-text" onClick={() => onDelete(project.id)}>Delete</button></div></article>)}</div>}</n  </>
}

function Scenes({ project, updateProject }) {
  const [selected, setSelected] = useState(project.scenes[0]?.id || null)
  const scene = project.scenes.find((item) => item.id === selected)
  useEffect(() => { if (!project.scenes.some((item) => item.id === selected)) setSelected(project.scenes[0]?.id || null) }, [project.scenes, selected])
  const addScene = () => { const item = { id: uid(), title: `Scene ${project.scenes.length + 1}`, summary: '', text: '', notes: '' }; updateProject(project.id, (p) => ({ ...p, scenes: [...p.scenes, item] })); setSelected(item.id) }
  const change = (key, value) => updateProject(project.id, (p) => ({ ...p, scenes: p.scenes.map((item) => item.id === selected ? { ...item, [key]: value } : item) }))
  const deleteScene = () => { if (!scene || !window.confirm(`Delete “${scene.title}”?`)) return; updateProject(project.id, (p) => ({ ...p, scenes: p.scenes.filter((item) => item.id !== selected) })); }
  return <div className="workspace"><aside className="scene-list"><div className="list-head"><span>Scenes</span><button className="icon-button" onClick={addScene} aria-label="Add scene">＋</button></div>{project.scenes.length === 0 && <p className="muted padded">Add a chapter or scene to begin.</p>}{project.scenes.map((item, index) => <button className={item.id === selected ? 'scene-row selected' : 'scene-row'} key={item.id} onClick={() => setSelected(item.id)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title || 'Untitled scene'}</strong><small>{words(item.text)} words</small></button>)}</aside><div className="editor">{scene ? <><div className="editor-title"><input value={scene.title} onChange={(e) => change('title', e.target.value)} placeholder="Scene title" /><button className="danger-text" onClick={deleteScene}>Delete scene</button></div><label>Scene summary<textarea value={scene.summary} onChange={(e) => change('summary', e.target.value)} placeholder="What changes in this scene? What does the reader learn?" rows="3" /></label><label>Manuscript text<textarea className="manuscript" value={scene.text} onChange={(e) => change('text', e.target.value)} placeholder="Paste or write your scene here…" rows="16" /></label><div className="word-count">{words(scene.text).toLocaleString()} words</div><label>Revision notes<textarea value={scene.notes} onChange={(e) => change('notes', e.target.value)} placeholder="Questions, changes to make, continuity details to verify…" rows="4" /></label></> : <div className="empty"><div className="empty-icon">＋</div><h3>Start the manuscript</h3><p>Add a scene, chapter, prologue, or fragment. You can rearrange your plan later.</p><button className="primary" onClick={addScene}>Add first scene</button></div>}</div></div>
}

function Records({ project, updateProject, type, title, description, fields }) {
  const items = project[type]
  const add = () => { const item = { id: uid(), ...Object.fromEntries(fields.map(([key]) => [key, ''])) }; updateProject(project.id, (p) => ({ ...p, [type]: [...p[type], item] })) }
  const change = (id, key, value) => updateProject(project.id, (p) => ({ ...p, [type]: p[type].map((item) => item.id === id ? { ...item, [key]: value } : item) }))
  const remove = (id) => { if (!window.confirm('Remove this entry?')) return; updateProject(project.id, (p) => ({ ...p, [type]: p[type].filter((item) => item.id !== id) })) }
  return <><div className="intro-row"><div><h2>{title}</h2><p>{description}</p></div><button className="primary" onClick={add}>＋ Add entry</button></div>{items.length === 0 ? <div className="empty"><div className="empty-icon">✦</div><h3>Nothing recorded yet</h3><p>Build a dependable reference while you write. You can add only the details you truly need.</p><button className="primary" onClick={add}>Add your first entry</button></div> : <div className="record-grid">{items.map((item) => <article className="record-card" key={item.id}><div className="record-top"><span className="record-dot">◆</span><button className="danger-text" onClick={() => remove(item.id)}>Remove</button></div>{fields.map(([key, label], index) => <label key={key}>{label}{index === 0 ? <input value={item[key]} onChange={(e) => change(item.id, key, e.target.value)} placeholder={label} /> : <textarea value={item[key]} onChange={(e) => change(item.id, key, e.target.value)} rows="2" placeholder={label} />}</label>)}</article>)}</div>}</n  </>
}

function Review({ project }) {
  const totalWords = project.scenes.reduce((sum, item) => sum + words(item.text), 0)
  const mentioned = (name) => project.scenes.filter((scene) => new RegExp(`\b${escapeRegExp(name)}\b`, 'i').test(`${scene.title} ${scene.summary} ${scene.text} ${scene.notes}`))
  return <><div className="review-banner"><span>✦</span><div><h2>Human-centered continuity review</h2><p>This first version organizes evidence and prompts your editorial judgment. It does not alter your manuscript or send it anywhere.</p></div></div><div className="stats"><div><strong>{totalWords.toLocaleString()}</strong><span>manuscript words</span></div><div><strong>{project.scenes.length}</strong><span>scenes</span></div><div><strong>{project.characters.length}</strong><span>characters</span></div><div><strong>{project.world.length}</strong><span>world entries</span></div></div><div className="review-grid"><article><h3>Character presence</h3>{project.characters.length === 0 ? <p className="muted">Add characters to see where each is mentioned.</p> : project.characters.map((character) => { const scenes = mentioned(character.name); return <div className="presence" key={character.id}><strong>{character.name || 'Unnamed character'}</strong><span>{character.name ? `${scenes.length} scene${scenes.length === 1 ? '' : 's'} mentioned` : 'Add a name to check mentions'}</span><small>{scenes.length ? scenes.map((scene) => scene.title || 'Untitled').join(' · ') : 'Check whether this person has been introduced or intentionally remains off-page.'}</small></div> })}</article><article><h3>Editorial prompts</h3><div className="prompt">Does each scene cause a change—new information, higher stakes, a decision, or an emotional shift?</div><div className="prompt">When a character returns after several scenes, will readers remember their goal, relationship, and last known situation?</div><div className="prompt">Do place names, technology terms, and physical details match your world-bible records?</div><div className="prompt">After a revision, export a backup so you retain a recoverable snapshot.</div></article></div></>
}

function Search({ project, query, setQuery }) {
  const q = query.trim().toLowerCase()
  const results = useMemo(() => !q ? [] : [
    ...project.scenes.map((item) => ({ kind: 'Scene', title: item.title || 'Untitled scene', text: `${item.summary} ${item.text} ${item.notes}` })).filter((item) => `${item.title} ${item.text}`.toLowerCase().includes(q)),
    ...project.characters.map((item) => ({ kind: 'Character', title: item.name || 'Unnamed character', text: Object.values(item).join(' ') })).filter((item) => `${item.title} ${item.text}`.toLowerCase().includes(q)),
    ...project.world.map((item) => ({ kind: 'World entry', title: item.name || 'Untitled entry', text: Object.values(item).join(' ') })).filter((item) => `${item.title} ${item.text}`.toLowerCase().includes(q))
  ], [project, q])
  return <><div className="search-box"><span>⌕</span><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a name, location, phrase, or detail…" /></div>{!q ? <div className="empty compact"><h3>Search your story bible</h3><p>Find where a character, location, object, or exact phrase appears across your manuscript and reference notes.</p></div> : <><div className="section-heading"><h2>Results</h2><span>{results.length} found</span></div>{results.length === 0 ? <div className="empty compact"><h3>No matches for “{query}”</h3><p>Try a shorter word, another spelling, or add the detail to your records.</p></div> : <div className="results">{results.map((result, index) => <article key={`${result.kind}-${index}`} className="result"><span className="pill">{result.kind}</span><h3>{result.title}</h3><p>{excerpt(result.text, q)}</p></article>)}</div>}</>}</n}

function excerpt(text, needle) { const lower = text.toLowerCase(); const at = lower.indexOf(needle); if (at < 0) return text.slice(0, 180); const start = Math.max(0, at - 80); const end = Math.min(text.length, at + needle.length + 130); return `${start ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}` }
function escapeRegExp(value = '') { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
