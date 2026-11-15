import type {
  Player,
  PlayerCategory,
  Position,
  ComparisonResult
} from './types';
import {useEffect,useMemo,useRef,useState} from 'react';import type {ReactNode} from 'react';
import {NavLink,Route,Routes,useLocation,useNavigate,useParams} from 'react-router-dom';
import {Activity,ArrowDownRight,ArrowUpRight,BarChart3, Bell, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardList, Database, FileBarChart, Filter, Gauge, LayoutDashboard, Menu, MoreHorizontal, Play, Plus, Search, Settings, Shield, SlidersHorizontal, Sparkles, Upload, Users, Video, X, Download, CheckCircle2, Clock3, AlertCircle, FileText, Target, TrendingUp, ArrowLeft, Crosshair, Eye, RotateCcw} from 'lucide-react';
import {Area,AreaChart,Bar,BarChart,CartesianGrid,Legend,Line,LineChart,PolarAngleAxis,PolarGrid,PolarRadiusAxis, Radar,RadarChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';

import { playerApi, api, videoApi, comparisonApi } from './lib/api';
const nav=[{label:'Overview',to:'/',icon:LayoutDashboard},{label:'Players',to:'/players',icon:Users},{label:'Video Analysis',to:'/video-analysis',icon:Video},{label:'Video Intelligence',to:'/video-intelligence.html',icon:Activity},{label:'Recruit Comparison',to:'/comparison',icon:BarChart3},{label:'Roster Simulator',to:'/roster',icon:Shield},{label:'Scouting Reports',to:'/reports',icon:FileBarChart}];
function App(){const [collapsed,setCollapsed]=useState(false);const [mobile,setMobile]=useState(false);const location=useLocation();const title=nav.find(n=>n.to===location.pathname)?.label||'Player Profile';return <div className="app-shell"><aside className={`sidebar ${collapsed?'collapsed':''} ${mobile?'mobile-open':''}`}><div className="brand"><div className="brand-mark"><Crosshair size={21}/></div>{!collapsed&&<div><div className="brand-name">TROJAN<span>SCOUT</span></div><div className="brand-sub">AI BASKETBALL INTELLIGENCE</div></div>}<button className="icon-btn sidebar-close" onClick={()=>setMobile(false)}><X size={18}/></button></div><div className="program-switch"><div className="school-badge">DS</div>{!collapsed&&<div className="school-meta"><strong>Dakota State</strong><span>Men's Basketball</span></div>}{!collapsed&&<ChevronDown size={15} className="muted"/>}</div><div className="nav-label">WORKSPACE</div><nav>{nav.map(n=>n.to.endsWith('.html')?<a key={n.to} href={n.to} onClick={()=>setMobile(false)} className={`nav-item ${location.pathname===n.to?'active':''}`}><n.icon size={18}/>{!collapsed&&<span>{n.label}</span>}</a>:<NavLink key={n.to} to={n.to} end={n.to==='/'} onClick={()=>setMobile(false)} className={({isActive})=>`nav-item ${isActive?'active':''}`}><n.icon size={18}/>{!collapsed&&<span>{n.label}</span>}{!collapsed&&n.to==='/video-analysis'&&<span className="nav-dot"/>}</NavLink>)}</nav><div className="sidebar-bottom"><div className="scout-status"><span className="status-dot"/>{!collapsed&&<><span>DEMO ENVIRONMENT</span><span className="env-tag">MOCK</span></>}</div><NavLink to="/settings" className="nav-item"><Settings size={18}/>{!collapsed&&<span>Settings</span>}</NavLink><div className="user-profile"><div className="avatar">JC</div>{!collapsed&&<div className="user-meta"><strong>Jordan Carter</strong><span>Assistant Coach</span></div>}{!collapsed&&<MoreHorizontal size={18} className="muted"/>}</div></div></aside>{mobile&&<div className="mobile-scrim" onClick={()=>setMobile(false)}/>}<main className="main-area"><header className="topbar"><div className="top-left"><button className="icon-btn mobile-menu" onClick={()=>setMobile(true)}><Menu size={20}/></button><button className="icon-btn collapse-btn" onClick={()=>setCollapsed(!collapsed)}><Menu size={19}/></button><div className="crumb">SCOUTING / <strong>{title.toUpperCase()}</strong></div></div><div className="top-actions"><div className="season-pill"><span className="live-dot"/>2025–26 SEASON</div><button className="icon-btn" aria-label="Notifications"><Bell size={18}/><i/></button><button className="help-btn"><CircleHelp size={17}/> Help</button></div></header><div className="page-wrap"><Routes><Route path="/" element={<Dashboard/>}/><Route path="/players" element={<Players/>}/><Route path="/players/:id" element={<PlayerDetail/>}/><Route path="/video-analysis" element={<VideoAnalysisPage/>}/><Route path="/comparison" element={<Comparison/>}/><Route path="/roster" element={<Roster/>}/><Route path="/reports" element={<Reports/>}/><Route path="/settings" element={<SettingsPage/>}/><Route path="*" element={<Dashboard/>}/></Routes></div></main></div>}
function PageHead({eyebrow,title,description,action}:{eyebrow:string;title:string;description:string;action?:ReactNode}){return <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action&&<div className="head-action">{action}</div>}</div>}
function StatCard({label,value,delta,icon:Icon,sub}:{label:string;value:string;delta?:string;icon:any;sub:string}){return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className="stat-icon"><Icon size={17}/></div></div><div className="stat-value">{value}</div><div className="stat-foot">{delta&&<span className="positive"><ArrowUpRight size={13}/>{delta}</span>}<span>{sub}</span></div></div>}
function Dashboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    playerApi.list()
      .then(setPlayers)
      .catch(err => {
        console.error(err);
        setError("Unable to load player data from FastAPI.");
      })
      .finally(() => setLoading(false));
  }, []);

  const recruits = players.filter(
    p => p.category === "Prospective Recruit"
  );
  const graduating = players.filter(
    p => p.category === "Graduating Athlete"
  );
  const current = players.filter(
    p => p.category === "Current Athlete"
  );

  return <>
    <PageHead
      eyebrow="PROGRAM OVERVIEW"
      title="Scouting Dashboard"
      description="Live player records from the TrojanScout database."
      action={
        <NavLink className="btn primary" to="/players">
          <Plus size={16}/> Player Directory
        </NavLink>
      }
    />

    {error && (
      <p role="alert" style={{ color: "#ff8c8c" }}>
        {error}
      </p>
    )}

    {loading ? (
      <div className="empty-state">Loading dashboard...</div>
    ) : !error ? (
      <>
        <div className="stat-grid">
          <StatCard
            label="TOTAL ATHLETES"
            value={String(players.length)}
            icon={Users}
            sub="Database records"
          />
          <StatCard
            label="PROSPECTS TRACKED"
            value={String(recruits.length)}
            icon={Target}
            sub="Prospective recruits"
          />
          <StatCard
            label="GRADUATING ATHLETES"
            value={String(graduating.length)}
            icon={Clock3}
            sub="Graduating roster"
          />
          <StatCard
            label="CURRENT ATHLETES"
            value={String(current.length)}
            icon={Activity}
            sub="Returning roster"
          />
        </div>

        <section className="panel matches-panel">
          <div className="panel-head">
            <div>
              <h2>Prospective recruits</h2>
              <p>Stored player statistics - not verified scouting rankings</p>
            </div>
            <NavLink className="text-link" to="/comparison">
              Recruit Comparison <ChevronRight size={14}/>
            </NavLink>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PLAYER</th>
                  <th>POSITION</th>
                  <th>PPG</th>
                  <th>APG</th>
                  <th>3P%</th>
                  <th/>
                </tr>
              </thead>
              <tbody>
                {recruits.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="player-cell">
                        <Avatar name={p.name}/>
                        <div>
                          <strong>{p.name}</strong>
                          <small>{p.school}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="position-chip">
                        {p.position}
                      </span>
                    </td>
                    <td>{p.ppg.toFixed(1)}</td>
                    <td>{p.apg.toFixed(1)}</td>
                    <td>{p.threePct.toFixed(1)}%</td>
                    <td>
                      <NavLink
                        to={`/players/${p.id}`}
                        className="row-link"
                      >
                        View <ChevronRight size={14}/>
                      </NavLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {recruits.length === 0 && (
            <div className="empty-state">
              No prospective recruits recorded.
            </div>
          )}
        </section>

        <div className="disclaimer">
          <AlertCircle size={15}/>
          <span>
            Statistics come from stored database records.
            Their accuracy has not been independently verified.
            No simulated scouting activity or fit scores are shown.
          </span>
        </div>
      </>
    ) : null}
  </>;
}
function ActivityItem({icon:Icon,color,title,detail,time}:any){return <div className="activity-item"><div className={`activity-icon ${color}`}><Icon size={16}/></div><div className="activity-copy"><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div>}
function Avatar({name,size='normal'}:{name:string;size?:string}){return <div className={`avatar ${size}`}>{name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div>}
function Players(){const [players,setPlayers]=useState<Player[]>([]);useEffect(()=>{let active=true;playerApi.list().then(data=>{if(active)setPlayers(data);}).catch(err=>console.error('Failed to load players:',err));return ()=>{active=false;};},[]);const [query,setQuery]=useState('');const [position,setPosition]=useState('All positions');const [category,setCategory]=useState('All categories');const [sort,setSort]=useState('ppg');const [showAdd,setShowAdd]=useState(false);const [showImport,setShowImport]=useState(false);const filtered=useMemo(()=>players.filter(p=>(p.name.toLowerCase().includes(query.toLowerCase())||p.school.toLowerCase().includes(query.toLowerCase()))&&(position==='All positions'||p.position===position)&&(category==='All categories'||p.category===category)).sort((a,b)=>(b[sort as keyof Player] as number)-(a[sort as keyof Player] as number)),[players,query,position,category,sort]);return <><PageHead eyebrow="TALENT DATABASE" title="Player Directory" description="Search, filter, and evaluate athletes across your recruiting landscape." action={<><button className="btn secondary" onClick={()=>setShowImport(true)}><Upload size={16}/> Import CSV</button><button className="btn primary" onClick={()=>setShowAdd(true)}><Plus size={16}/> Add Player</button></>}/><div className="directory-summary"><div><strong>{players.length}</strong><span>Total athletes</span></div><div><strong>{players.filter(p=>p.category==='Prospective Recruit').length}</strong><span>Prospects</span></div><div><strong>{players.filter(p=>p.category==='Current Athlete').length}</strong><span>Current roster</span></div><div><strong>{players.filter(p=>p.category==='Graduating Athlete').length}</strong><span>Graduating</span></div></div><section className="panel directory-panel"><div className="directory-toolbar"><div className="search-box"><Search size={17}/><input placeholder="Search players or schools..." value={query} onChange={e=>setQuery(e.target.value)}/><kbd>Ctrl+ K</kbd></div><div className="filters"><select value={position} onChange={e=>setPosition(e.target.value)}><option>All positions</option>{['PG','SG','SF','PF','C'].map(x=><option key={x}>{x}</option>)}</select><select value={category} onChange={e=>setCategory(e.target.value)}><option>All categories</option>{['Current Athlete','Graduating Athlete','Prospective Recruit'].map(x=><option key={x}>{x}</option>)}</select><select value={sort} onChange={e=>setSort(e.target.value)}><option value="ppg">Sort: Points</option><option value="apg">Sort: Assists</option><option value="rpg">Sort: Rebounds</option><option value="threePct">Sort: 3P%</option></select><button className="icon-btn filter-button"><SlidersHorizontal size={17}/></button></div></div><div className="table-wrap"><table className="player-table"><thead><tr><th>PLAYER</th><th>POSITION</th><th>HEIGHT</th><th>CLASS</th><th>CATEGORY</th><th>PPG</th><th>APG</th><th>RPG</th><th>FG%</th><th>3P%</th><th/></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><div className="player-cell"><Avatar name={p.name}/><div><strong>{p.name}</strong><small>{p.school}</small></div></div></td><td><span className="position-chip">{p.position}</span></td><td>{p.height}</td><td>{p.gradYear}</td><td><CategoryTag category={p.category}/></td><td className="numeric">{p.ppg.toFixed(1)}</td><td className="numeric">{p.apg.toFixed(1)}</td><td className="numeric">{p.rpg.toFixed(1)}</td><td>{p.fgPct.toFixed(1)}</td><td>{p.threePct.toFixed(1)}</td><td><NavLink to={`/players/${p.id}`} className="icon-btn row-open"><ChevronRight size={17}/></NavLink></td></tr>)}</tbody></table>{filtered.length===0&&<div className="empty-state"><Search size={25}/><strong>No players found</strong><span>Try adjusting your search or filters.</span></div>}</div><div className="table-footer"><span>Showing <strong>{filtered.length}</strong> of <strong>{players.length}</strong> athletes</span><div><button className="pagination" disabled><ChevronLeft size={15}/></button><button className="pagination current">1</button><button className="pagination">2</button><button className="pagination"><ChevronRight size={15}/></button></div></div></section>{showAdd&&<AddPlayerModal onClose={()=>setShowAdd(false)} onSave={async p=>{const created=await playerApi.create(p);setPlayers(old=>[created,...old]);setShowAdd(false);}}/>}{showImport&&<Modal title="Import player data" onClose={()=>setShowImport(false)}><div className="upload-drop"><Upload size={24}/><strong>Drop your CSV file here</strong><span>or browse files · CSV up to 10 MB</span><input type="file" accept=".csv" onChange={e=>{if(e.target.files?.[0])alert('CSV import UI ready. Connect POST /players/import to enable ingestion.')}}/></div><p className="modal-hint">Expected columns: name, school, position, height, gradYear, ppg, apg, rpg, fgPct, threePct.</p><div className="modal-actions"><button className="btn secondary" onClick={()=>setShowImport(false)}>Cancel</button></div></Modal>}</>}
function CategoryTag({category}:{category:PlayerCategory}){return <span className={`category-tag ${category==='Prospective Recruit'?'prospect':category==='Graduating Athlete'?'graduating':'current'}`}>{category}</span>}
function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={18}/></button></div>{children}</div></div>}
function AddPlayerModal({onClose,onSave}:{onClose:()=>void;onSave:(p:Partial<Player>)=>void}){const [name,setName]=useState('');const [school,setSchool]=useState('');const [position,setPosition]=useState<Position>('PG');const [category,setCategory]=useState<PlayerCategory>('Prospective Recruit');return <Modal title="Add athlete to database" onClose={onClose}><form className="form-grid" onSubmit={e=>{e.preventDefault();onSave({name,school,position,category,height:'6 ft 2 in',gradYear:2027,ppg:0,apg:0,rpg:0,fgPct:0,threePct:0,spg:0,bpg:0,topg:0,games:0,minutes:0,strengths:[],weaknesses:[],notes:''});}}><label>Player name<input required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Alex Johnson"/></label><label>School<input required value={school} onChange={e=>setSchool(e.target.value)} placeholder="College / University"/></label><label>Position<select value={position} onChange={e=>setPosition(e.target.value as Position)}>{['PG','SG','SF','PF','C'].map(x=><option key={x}>{x}</option>)}</select></label><label>Player category<select value={category} onChange={e=>setCategory(e.target.value as PlayerCategory)}>{['Prospective Recruit','Current Athlete','Graduating Athlete'].map(x=><option key={x}>{x}</option>)}</select></label><div className="modal-actions span-two"><button type="button" className="btn secondary" onClick={onClose}>Cancel</button><button className="btn primary" type="submit"><Plus size={15}/> Add Player</button></div></form></Modal>}
function PlayerDetail(){const {id=''}=useParams();const navigate=useNavigate();const [player,setPlayer]=useState<Player|undefined>();useEffect(()=>{playerApi.get(id).then(setPlayer).catch(()=>{});},[id]);if(!player)return <div className="empty-state"><strong>Player not found</strong><button className="btn secondary" onClick={()=>navigate('/players')}>Back to directory</button></div>;const statData=[{name:'PPG',value:player.ppg},{name:'APG',value:player.apg},{name:'RPG',value:player.rpg},{name:'FG%',value:player.fgPct},{name:'3P%',value:player.threePct},{name:'SPG',value:player.spg},{name:'BPG',value:player.bpg}];return <><button className="back-link" onClick={()=>navigate('/players')}><ArrowLeft size={15}/> Back to Player Directory</button><div className="profile-hero panel"><div className="profile-main"><Avatar name={player.name} size="large"/><div><div className="eyebrow">ATHLETE PROFILE · {player.school.toUpperCase()}</div><h1>{player.name}</h1><div className="profile-meta"><span className="position-chip">{player.position}</span><span>{player.height}</span><span>Class of {player.gradYear}</span><CategoryTag category={player.category}/></div></div></div><button className="btn secondary"><FileText size={15}/> Create Report</button></div><div className="stat-grid profile-stats"><StatCard label="POINTS PER GAME" value={player.ppg.toFixed(1)} icon={Target} sub="Scoring average"/><StatCard label="ASSISTS PER GAME" value={player.apg.toFixed(1)} icon={Users} sub="Playmaking average"/><StatCard label="REBOUNDS PER GAME" value={player.rpg.toFixed(1)} icon={Activity} sub="Rebounding average"/><StatCard label="3-POINT %" value={`${player.threePct.toFixed(1)}%`} icon={Gauge} sub="Perimeter efficiency"/></div><div className="two-col"><section className="panel"><div className="panel-head"><div><h2>Season statistical profile</h2><p>Per-game production and shooting percentages</p></div><span className="demo-inline">SYNTHETIC DATA</span></div><div className="chart-area tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={statData}><CartesianGrid stroke="#233149" vertical={false}/><XAxis dataKey="name" stroke="#75859d" axisLine={false} tickLine={false}/><YAxis stroke="#75859d" axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:'#101b2c',border:'1px solid #293b56',borderRadius:10}}/><Bar dataKey="value" fill="#3978f6" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></section><section className="panel"><div className="panel-head"><div><h2>Scouting evaluation</h2><p>Staff observations</p></div></div><div className="tag-section"><strong className="section-kicker">KEY STRENGTHS</strong><div className="skill-tags">{player.strengths.map(x=><span className="skill-tag good" key={x}>{x}</span>)}</div></div><div className="tag-section"><strong className="section-kicker">DEVELOPMENT AREAS</strong><div className="skill-tags">{player.weaknesses.map(x=><span className="skill-tag caution" key={x}>{x}</span>)}</div></div><div className="scout-note"><strong>SCOUTING NOTES</strong><p>{player.notes}</p></div></section></div><section className="panel video-list-panel"><div className="panel-head"><div><h2>Video library</h2><p>Available game footage and tagged clips</p></div><button className="btn secondary" onClick={()=>navigate('/video-analysis')}><Video size={15}/> Analyze video</button></div><div className="video-placeholder"><div className="video-thumb"><Play size={20} fill="currentColor"/></div><div><strong>Game footage · Full game</strong><span>Demo clip · 01:24:36 · No tracking annotations</span></div><span className="muted small">No linked video</span></div></section></>}

function VideoAnalysisPage() {
  type TrackedPlayer = {
    track_id: number;
    confidence: number;
    bbox: [number, number, number, number];
  };

  type TrackingData = {
    fps: number;
    total_frames: number;
    width: number;
    height: number;
    frames: Array<{
      frame: number;
      timestamp: number;
      players: TrackedPlayer[];
    }>;
    target_track_id?: number | null;
    target_track?: Array<{
      frame: number;
      timestamp: number;
      bbox: [number, number, number, number];
      confidence: number;
      track_id: number;
      reacquired: boolean;
    }>;
  };

  type UploadResult = {
    video_id: string;
    annotated_video_url: string | null;
  };

  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState("");
  const [existingId, setExistingId] = useState("");
  const [videoId, setVideoId] = useState("");
  const [annotatedUrl, setAnnotatedUrl] = useState("");
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Keep the exact frame on which the user clicked. A raw ByteTrack ID
  // is not a permanent identity when players occlude each other.
  const [selectionFrame, setSelectionFrame] = useState<number | null>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState("Not Started");
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const baseUrl = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
  ).replace(/\/$/, "");

  useEffect(() => {
    return () => {
      if (source.startsWith("blob:")) URL.revokeObjectURL(source);
    };
  }, [source]);

  const chooseVideo = (selectedFile?: File) => {
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".mp4")) {
      setError("Choose an MP4 video.");
      return;
    }

    setFile(selectedFile);
    setSource(URL.createObjectURL(selectedFile));
    setTracking(null);
    setSelectedId(null);
    setSelectionFrame(null);
    setVideoId("");
    setAnnotatedUrl("");
    setStatus("Not Started");
    setError("");
    setTime(0);
  };

  // One shared loader for newly processed and previously saved tracking data.
  // This is the same path that made manual "Load tracking" work.
  const displayTracking = async (id: string) => {
    const response = await api.get<TrackingData>(
      `/videos/${encodeURIComponent(id)}/tracking`,
      { timeout: 0 }
    );
    const data = response.data;
    if (!Array.isArray(data.frames) || data.frames.length === 0) {
      throw new Error("Tracking finished but returned no frames.");
    }

    setTracking(data);
    setVideoId(id);
    setExistingId(id);
    setSelectedId(null);
    setSelectionFrame(null);
    setFile(null);
    // Use the same backend source as the known-working manual load path.
    setSource(`${baseUrl}/videos/${encodeURIComponent(id)}/input`);
    setTime(0);
    setDuration(0);
    setStatus("Completed");

    const framesWithPeople = data.frames.filter(f => f.players?.length > 0).length;
    console.info("TRACKING READY", {
      id,
      frames: data.frames.length,
      framesWithPeople,
      fps: data.fps
    });
    if (framesWithPeople === 0) {
      setError("Tracking completed, but no players were detected in the video.");
    }
  };

  const loadExisting = async () => {
    const id = existingId.trim();
    if (!id) return;
    setStatus("Loading");
    setError("");
    try {
      await displayTracking(id);
      // The output MP4 is optional; in fast mode only the input + SVG exist.
      setAnnotatedUrl("");
    } catch (err) {
      console.error("Load tracking failed", err);
      setError(err instanceof Error ? err.message : "Could not load this video ID.");
      setStatus("Failed");
    }
  };

  const analyze = async () => {
    if (!file) return;
    setStatus("Uploading video");
    setError("");
    setTracking(null);
    setSelectedId(null);
    setSelectionFrame(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("skip_detection", "true");
      const uploaded = await api.post<UploadResult>(
        "/videos/analyze",
        form,
        { timeout: 0 }
      );
      const id = uploaded.data.video_id;
      if (!id) throw new Error("Upload did not return a video ID.");
      setVideoId(id);
      setExistingId(id);
      setAnnotatedUrl(uploaded.data.annotated_video_url
        ? `${baseUrl}${uploaded.data.annotated_video_url}` : "");

      setStatus("Tracking players");
      await api.post(`/videos/${encodeURIComponent(id)}/track`, null, { timeout: 0 });
      setStatus("Loading tracking boxes");
      // Automatically run the same loading logic as the manual button.
      await displayTracking(id);
    } catch (err) {
      console.error("Video processing failed", err);
      setError(err instanceof Error ? err.message : "Video processing failed. Check FastAPI logs.");
      setStatus("Failed");
    }
  };

  // Match playback time to the frame timestamps returned by the tracker.
  // Do not assume that the array index always equals the source frame number.
  const currentFrame = useMemo(() => {
    if (!tracking?.frames?.length) return undefined;
    const frames = tracking.frames;
    const fps = tracking.fps > 0 ? tracking.fps : 30;
    const approximateIndex = Math.min(
      frames.length - 1,
      Math.max(0, Math.round(time * fps))
    );
    const candidate = frames[approximateIndex];
    if (Math.abs(candidate.timestamp - time) <= 1 / fps) return candidate;
    // Check nearby frames when the backend uses sampled/non-sequential frames.
    return frames.reduce((best, frame) =>
      Math.abs(frame.timestamp - time) < Math.abs(best.timestamp - time)
        ? frame : best, candidate);
  }, [tracking, time]);

  const visiblePlayers = currentFrame?.players ?? [];

  const selectedTrajectory = useMemo(() => {
    const path = new Map<number, { player: TrackedPlayer; reacquired: boolean }>();
    if (!tracking || selectedId === null || selectionFrame === null) return path;
    const frames = tracking.frames;
    const anchorIndex = frames.findIndex(f => f.frame === selectionFrame);
    if (anchorIndex === -1) return path;
    const anchor = frames[anchorIndex].players.find(p => p.track_id === selectedId);
    if (!anchor) return path;

    // If the backend followed precisely this starting track, use its
    // already computed, direction-aware re-acquisition sequence.
    if (tracking.target_track_id === selectedId && tracking.target_track?.length) {
      for (const point of tracking.target_track) {
        if (point.frame >= 0 && point.frame < tracking.total_frames) {
          path.set(point.frame, {
            player: { track_id: point.track_id, confidence: point.confidence, bbox: point.bbox },
            reacquired: point.reacquired
          });
        }
      }
      if (path.has(selectionFrame)) return path;
      path.clear();
    }

    path.set(selectionFrame, { player: anchor, reacquired: false });
    const center = (p: TrackedPlayer) => [p.bbox[0] + p.bbox[2] / 2, p.bbox[1] + p.bbox[3] / 2];
    const distance = (a: TrackedPlayer, b: TrackedPlayer) => {
      const [ax, ay] = center(a), [bx, by] = center(b);
      return Math.hypot(ax - bx, ay - by);
    };

    for (const direction of [1, -1]) {
      let previous = anchor;
      let lastSeen = selectionFrame;
      let stableId = selectedId;
      for (let index = anchorIndex + direction;
        index >= 0 && index < frames.length; index += direction) {
        const frame = frames[index];
        const gap = Math.abs(frame.frame - lastSeen);
        // Stop guessing after long disappearances; never silently switch
        // an athlete just to keep a green rectangle on screen.
        if (gap > 12) break;
        const limit = Math.min(0.22, 0.10 + 0.012 * Math.max(0, gap - 1));
        const ordered = frame.players
          .map(player => ({ player, distance: distance(previous, player) }))
          .filter(item => item.distance <= limit)
          .sort((a, b) => a.distance - b.distance);
        const sameId = ordered.find(item => item.player.track_id === stableId);
        const best = sameId ?? ordered[0];
        if (!best) continue;
        // A close pair is ambiguous unless the raw track ID is stable.
        if (!sameId && ordered[1] && best.distance > ordered[1].distance * 0.78) continue;
        const reacquired = best.player.track_id !== stableId;
        path.set(frame.frame, { player: best.player, reacquired });
        previous = best.player;
        lastSeen = frame.frame;
        stableId = best.player.track_id;
      }
    }
    return path;
  }, [tracking, selectedId, selectionFrame]);

  const selectedMatch = currentFrame ? selectedTrajectory.get(currentFrame.frame) : undefined;
  const selectedPlayer = selectedMatch?.player;

  const pick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!tracking || !videoRef.current) return;

    const rect = videoRef.current.getBoundingClientRect();

    // The video is rendered at its natural aspect ratio.
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const matches = visiblePlayers.filter(p => {
      const [bx, by, bw, bh] = p.bbox;
      return (
        x >= bx &&
        x <= bx + bw &&
        y >= by &&
        y <= by + bh
      );
    });

    // Prefer the smallest containing box when people overlap.
    matches.sort(
      (a, b) =>
        a.bbox[2] * a.bbox[3] -
        b.bbox[2] * b.bbox[3]
    );

    setSelectedId(matches[0]?.track_id ?? null);
    setSelectionFrame(matches[0] ? currentFrame?.frame ?? null : null);
  };

  const uniqueIds = tracking
    ? new Set(
        tracking.frames.flatMap(frame =>
          frame.players.map(p => p.track_id)
        )
      ).size
    : 0;

  const framesWithPlayers = tracking
    ? tracking.frames.filter(f => f.players.length > 0).length
    : 0;

  return (
    <>
      <PageHead
        eyebrow="COMPUTER VISION WORKSPACE"
        title="Video Analysis"
        description="Real YOLO11 detection and ByteTrack results from FastAPI."
        action={
          <span className="demo-inline">
            {tracking ? "LIVE TRACKING DATA" : "AWAITING VIDEO"}
          </span>
        }
      />

      <section className="panel" style={{ padding: 20 }}>
        <div className="panel-head">
          <div>
            <h2>Analyze basketball footage</h2>
            <p>Upload a short MP4 or load an already processed video.</p>
          </div>
        </div>

        <input
          type="file"
          accept=".mp4,video/mp4"
          onChange={e => chooseVideo(e.target.files?.[0])}
        />

        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button
            className="btn primary"
            onClick={analyze}
            disabled={!file || ["Uploading video", "Tracking players", "Loading tracking boxes"].includes(status)}
          >
            <Sparkles size={15} /> Analyze and Track (auto-load boxes)
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          <label className="section-kicker">
            LOAD EXISTING VIDEO ID
          </label>

          <div style={{
            display: "flex",
            gap: 10,
            marginTop: 8,
            flexWrap: "wrap"
          }}>
            <input
              style={{ flex: 1, minWidth: 240 }}
              value={existingId}
              onChange={e => setExistingId(e.target.value)}
              placeholder="Paste previously processed video ID"
            />

            <button
              className="btn secondary"
              onClick={loadExisting}
              disabled={!existingId.trim()}
            >
              Load tracking
            </button>
          </div>
        </div>

        <p style={{ marginTop: 16 }}>
          <strong>Status:</strong> {status}
        </p>

        {error && (
          <p role="alert" style={{ color: "#ff8c8c" }}>
            {error}
          </p>
        )}

        {videoId && (
          <p style={{ overflowWrap: "anywhere" }}>
            <strong>Video ID:</strong> {videoId}
          </p>
        )}
      </section>

      {source && (
        <section className="panel" style={{
          padding: 20,
          marginTop: 20
        }}>
          <div className="panel-head">
            <div>
              <h2>Video player and tracking</h2>
              <p>
                Pause the video, then click an athlete to follow them.
                The selected athlete remains highlighted when the tracker
                changes raw IDs, provided the movement is unambiguous.
              </p>
            </div>
          </div>

          <div
            onClick={pick}
            style={{
              position: "relative",
              width: "100%",
              cursor: tracking ? "crosshair" : "default",
              background: "#000"
            }}
          >
            <video
              ref={videoRef}
              src={source}
              controls
              playsInline
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                position: "relative",
                zIndex: 0
              }}
              onTimeUpdate={e =>
                setTime(e.currentTarget.currentTime)
              }
              onLoadedMetadata={e =>
                setDuration(e.currentTarget.duration)
              }
            />

            {tracking && (
              <div style={{
                position: "absolute", top: 10, left: 10, zIndex: 10,
                background: "rgba(7,18,35,.87)", color: "#fff",
                border: "1px solid #60a5fa", borderRadius: 6,
                padding: "6px 10px", fontSize: 12, pointerEvents: "none"
              }}>
                Tracking overlay active | Frame {currentFrame?.frame ?? "none"} | {visiblePlayers.length} boxes
              </div>
            )}

            {tracking && (
              <svg
                viewBox="0 0 1 1"
                preserveAspectRatio="none"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 5,
                  overflow: "visible",
                  pointerEvents: "none"
                }}
              >
                {visiblePlayers.map(p => {
                  const [x, y, w, h] = p.bbox;
                  const active = Boolean(selectedMatch &&
                    selectedMatch.player.track_id === p.track_id &&
                    selectedMatch.player.bbox[0] === p.bbox[0] &&
                    selectedMatch.player.bbox[1] === p.bbox[1]);

                  return (
                    <g key={p.track_id}>
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        fill="none"
                        stroke={active ? "#22c55e" : "#60a5fa"}
                        strokeDasharray={active && selectedMatch?.reacquired ? "0.014 0.008" : undefined}
                        strokeWidth={active ? 0.006 : 0.004}
                      />
                      <text
                        x={x}
                        y={Math.max(0.02, y - 0.006)}
                        fill={active ? "#22c55e" : "#ffffff"}
                        fontSize="0.025"
                        fontWeight={active ? "bold" : "normal"}
                      >
                        {active ? "SELECTED" : `#${p.track_id}`}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {tracking && (
            <p style={{ marginTop: 12 }}>
              <strong>Tracking loaded:</strong> {tracking.frames.length} frames,
              {" "}{framesWithPlayers} frames with people.
              <strong> Current frame:</strong> {currentFrame?.frame ?? "none"},
              {" "}{visiblePlayers.length} visible players.
            </p>
          )}

          <p style={{ marginTop: 12 }}>
            Timestamp: {time.toFixed(2)}s /{" "}
            {Number.isFinite(duration)
              ? duration.toFixed(2)
              : "0.00"}s
          </p>

          <p>
            <strong>Selected track:</strong>{" "}
            {selectedId === null
              ? "None — click a player"
              : `#${selectedId}`}
          </p>

          {selectedId !== null && (
            <p style={{ color: "#a8bcd8" }}>
              Selected-athlete path: {selectedTrajectory.size} frames. Green box means
              selected athlete; blue boxes are other detections. Proximity re-acquisitions
              are estimates and may be wrong when players overlap.
            </p>
          )}

          {selectedId !== null && (
            <p>
              {selectedPlayer
                ? `Following selected athlete (raw ID #${selectedPlayer.track_id}) | confidence ${(selectedPlayer.confidence * 100).toFixed(1)}%${selectedMatch?.reacquired ? " | proximity re-acquisition (unverified)" : ""}`
                : "Selected athlete temporarily lost; no unverified box is shown."}
            </p>
          )}

          {annotatedUrl && (
            <a
              href={annotatedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Open backend annotated video
            </a>
          )}
        </section>
      )}

      {tracking && (
        <section className="panel" style={{
          padding: 20,
          marginTop: 20
        }}>
          <div className="panel-head">
            <div>
              <h2>Actual tracking measurements</h2>
              <p>Calculated directly from the backend JSON.</p>
            </div>
          </div>

          <div className="metric-grid">
            <Metric
              label="TOTAL FRAMES"
              value={tracking.total_frames}
            />
            <Metric
              label="FRAME RATE"
              value={`${tracking.fps.toFixed(1)} FPS`}
            />
            <Metric
              label="FRAMES WITH PEOPLE"
              value={framesWithPlayers}
            />
            <Metric
              label="UNIQUE TRACK IDS"
              value={uniqueIds}
            />
          </div>
        </section>
      )}

      <div className="disclaimer">
        <AlertCircle size={15} />
        <span>
          YOLO detects people and ByteTrack assigns temporary
          identities. IDs can switch or disappear during
          occlusion. Distance, speed, and possessions are not
          calculated by this backend and are intentionally
          omitted.
        </span>
      </div>
    </>
  );
}

function Metric({label,value}:any){return <div className="metric-item"><span>{label}</span><strong>{value}</strong></div>}
function formatTime(t:number){if(!Number.isFinite(t))return '00:00';return `${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`}
// Comparison uses the live backend. No guessed similarity scores are shown.
type ComparisonRow = { id: string; name: string; score: number | null };
function extractComparisonRows(payload: unknown, players: Player[]): ComparisonRow[] {
  if (!payload || typeof payload !== 'object') return [];
  const body = payload as Record<string, unknown>;
  const source = [body.ranked_recruits, body.results, body.comparisons, body.rankings, body.recruits, body.candidates]
    .find(Array.isArray);
  if (!Array.isArray(source)) return [];
  const rows: ComparisonRow[] = [];
  for (const item of source) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const nested = (row.recruit && typeof row.recruit === 'object')
      ? row.recruit as Record<string, unknown> : row;
    const rawId = row.recruit_id ?? row.player_id ?? row.id ?? nested.id;
    if (rawId === undefined || rawId === null) continue;
    const player = players.find(p => p.id === String(rawId));
    if (!player) continue;
    const rawScore = row.fit_score ?? row.similarity_score ?? row.similarity ?? row.score;
    rows.push({id:player.id,name:player.name,score:typeof rawScore==='number' ? rawScore : null});
  }
  return rows;
}
function Comparison(){
  const [players,setPlayers]=useState<Player[]>([]);
  const [reference,setReference]=useState('');
  const [candidates,setCandidates]=useState<string[]>([]);
  const [weights,setWeights]=useState({scoring:30,playmaking:30,defense:20,rebounds:10,shooting:10});
  const [result,setResult]=useState<unknown>(null);
  const [loading,setLoading]=useState(false);
  const [playersLoading,setPlayersLoading]=useState(true);
  const [error,setError]=useState('');
  const comparisonData = result as ComparisonResult | null;

  const explanations = comparisonData?.explanations ?? {};

  useEffect(()=>{
    let active=true;
    playerApi.list().then(data=>{
      if(!active)return;
      setPlayers(data);
      setReference(data.find(p=>p.category==='Graduating Athlete')?.id ?? '');
      setCandidates(data.filter(p=>p.category==='Prospective Recruit').slice(0,3).map(p=>p.id));
    }).catch(err=>{
      console.error('Unable to load comparison players:',err);
      if(active)setError('Unable to load players from the backend.');
    }).finally(()=>{if(active)setPlayersLoading(false);});
    return ()=>{active=false;};
  },[]);
  const refs=players.filter(p=>p.category==='Graduating Athlete');
  const prospects=players.filter(p=>p.category==='Prospective Recruit');
  const ref=players.find(p=>p.id===reference);
  const toggle=(id:string)=>{
    setResult(null);
    setCandidates(old=>old.includes(id)?old.filter(x=>x!==id):old.length<5?[...old,id]:old);
  };
  const run = async () => {
  if (!ref || candidates.length === 0) return;

  setLoading(true);
  setError('');
  setResult(null);

  try {
    const metricWeights = {
      points_per_game: weights.scoring,
      assists_per_game: weights.playmaking,
      rebounds_per_game: weights.rebounds,
      field_goal_percentage: weights.shooting / 2,
      three_point_percentage: weights.shooting / 2,
      steals_per_game: weights.defense / 2,
      blocks_per_game: weights.defense / 2,
      turnovers_per_game: 0
    };

    const total = Object.values(metricWeights)
      .reduce((sum, value) => sum + value, 0);

    if (total <= 0) {
      throw new Error("Select at least one positive weight.");
    }

    const normalizedWeights = Object.fromEntries(
      Object.entries(metricWeights).map(([key, value]) => [
        key,
        value / total
      ])
    );

    const response = await comparisonApi.create(
    reference,
    candidates,
    weights
    );

    setResult(response);
  } catch (err) {
    console.error('Comparison request failed:', err);
    setError('Comparison failed. Check the console.');
  } finally {
    setLoading(false);
  }
};
  // Never compute the radar chart before the requested athlete has loaded.
  if(playersLoading) return <div className="empty-state">Loading comparison players...</div>;
  if(!ref) return <div className="empty-state"><strong>No graduating athlete available</strong><span>{error || 'Add a graduating athlete to the player database first.'}</span></div>;
  const candidatePlayers=candidates.map(id=>players.find(p=>p.id===id)).filter((p):p is Player=>Boolean(p));
  const radar=[
    {skill:'Scoring',reference:ref.ppg/20*100,...Object.fromEntries(candidatePlayers.map(p=>[p.name,p.ppg/20*100]))},
    {skill:'Playmaking',reference:ref.apg/8*100,...Object.fromEntries(candidatePlayers.map(p=>[p.name,p.apg/8*100]))},
    {skill:'Rebounding',reference:ref.rpg/10*100,...Object.fromEntries(candidatePlayers.map(p=>[p.name,p.rpg/10*100]))},
    {skill:'Shooting',reference:ref.threePct/45*100,...Object.fromEntries(candidatePlayers.map(p=>[p.name,p.threePct/45*100]))},
    {
  skill: 'Defense',
  reference: Math.min(100, (ref.spg + ref.bpg) * 12.5),
  ...Object.fromEntries(
    candidatePlayers.map(p => [
      p.name,
      Math.min(100, (p.spg + p.bpg) * 12.5)
    ])
  )
}
  ];
  const returnedRows = (() => {
  if (!result || typeof result !== "object") return [];

  const data = result as {
    similarityByPlayer?: Record<string, number>;
    ranked_recruits?: Array<{
      player_id: number;
      name: string;
      similarity_score: number;
    }>;
  };

  if (data.similarityByPlayer) {
    return Object.entries(data.similarityByPlayer)
      .map(([id, score]) => ({
        id,
        name: players.find(p => p.id === id)?.name ?? `Player ${id}`,
        score
      }))
      .sort((a, b) => b.score - a.score);
  }

  if (data.ranked_recruits) {
    return data.ranked_recruits
      .map(p => ({
        id: String(p.player_id),
        name: p.name,
        score: p.similarity_score
      }))
      .sort((a, b) => b.score - a.score);
  }

  return [];
})();
  return <>
    <PageHead eyebrow="ROSTER NEEDS ANALYSIS" title="Recruit Comparison" description="Evaluate prospective replacements against a graduating athlete's statistical profile." action={<button className="btn primary" onClick={run} disabled={!candidates.length||loading}><Sparkles size={15}/>{loading?'Analyzing...':'Run comparison'}</button>}/>
    {error&&<p role="alert" style={{color:'#ff8c8c'}}>{error}</p>}
    <section className="panel comparison-config">
      <div className="config-block"><label className="section-kicker">REFERENCE ATHLETE</label>
        <select value={reference} onChange={e=>{setReference(e.target.value);setResult(null);}}>{refs.map(p=><option value={p.id} key={p.id}>{p.name} · {p.position} · {p.school}</option>)}</select>
        <div className="reference-summary"><Avatar name={ref.name}/><div><strong>{ref.name}</strong><span>{ref.position} · {ref.height} · Class of {ref.gradYear}</span></div><CategoryTag category={ref.category}/></div>
      </div>
      <div className="config-block candidates-block"><div className="candidate-title"><label className="section-kicker">PROSPECT CANDIDATES</label><span>{candidates.length} / 5 selected</span></div>
        <div className="candidate-options">{prospects.map(p=><button key={p.id} className={`candidate-option ${candidates.includes(p.id)?'selected':''}`} onClick={()=>toggle(p.id)}><span className="check-square">{candidates.includes(p.id)&&'✓'}</span><span>{p.name}<small>{p.school} · {p.position}</small></span></button>)}</div>
      </div>
    </section>
    <div className="comparison-layout">
      <section className="panel radar-panel"><div className="panel-head"><div><h2>Skill profile comparison</h2><p>Normalized statistical indicators · not a final recruiting score</p></div><span className="demo-inline">STATISTICAL VISUALIZATION</span></div>
        <div className="radar-legend"><span><i className="legend-blue"/> {ref.name}</span>{candidatePlayers.map((p,i)=><span key={p.id}><i style={{background:['#37b7a0','#bd8bff','#e6a34b','#dd7188','#7d91a8'][i]}}/> {p.name}</span>)}</div>
        <div className="radar-chart"><ResponsiveContainer width="100%" height="100%"><RadarChart data={radar}><PolarGrid stroke="#2a3a52"/><PolarAngleAxis dataKey="skill" tick={{fill:'#a5b3c7',fontSize:12}}/><PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false}/><Radar name={ref.name} dataKey="reference" stroke="#4d88ff" fill="#3978f6" fillOpacity={.18} strokeWidth={2}/>{candidatePlayers.map((p,i)=><Radar key={p.id} name={p.name} dataKey={p.name} stroke={['#37b7a0','#bd8bff','#e6a34b','#dd7188','#7d91a8'][i]} fill="transparent" fillOpacity={0} strokeWidth={2}/>)}</RadarChart></ResponsiveContainer></div>
      </section>
      <section className="panel weights-panel"><div className="panel-head"><div><h2>Skill importance</h2><p>Set your evaluation priorities</p></div><SlidersHorizontal size={17} className="muted"/></div>{Object.entries(weights).map(([key,val])=><div className="weight-row" key={key}><div><span>{key[0].toUpperCase()+key.slice(1)}</span><strong>{val}%</strong></div><input type="range" min="0" max="50" value={val} onChange={e=>{setResult(null);setWeights(w=>({...w,[key]:Number(e.target.value)}));}}/></div>)}<div className="weight-note">Sliders are normalized and mapped to supported statistical metrics. The backend computes the similarity scores.</div></section>
    </div>
    <section className="panel ranking-panel"><div className="panel-head"><div><h2>Backend comparison results</h2><p>Results from POST /comparisons</p></div><span className="demo-inline">LIVE API</span></div>
      {!result&&<div className="empty-state">Choose recruits and click Run comparison.</div>}
      {result!==null&&<>
        {returnedRows.length>0?<div className="table-wrap"><table><thead><tr><th>RANK</th><th>RECRUIT</th><th>SIMILARITY</th><th>DATA COVERAGE</th><th>COMPARISON DETAILS</th></tr></thead><tbody>{returnedRows.map((row,index)=>{
          const backendRow=(result as {ranked_recruits?:Array<{player_id:number;data_coverage:number;strengths:string[];differences:string[]}>}).ranked_recruits?.find(r=>String(r.player_id)===row.id);
          return <tr key={row.id}><td>{index+1}</td><td>{row.name}</td><td>{row.score===null?'Not provided':`${row.score.toFixed(1)}%`}</td><td>{backendRow?.data_coverage===undefined?'—':`${backendRow.data_coverage.toFixed(1)}%`}</td><td><details
  onClick={(e) => e.stopPropagation()}
  style={{ cursor: "pointer" }}
>
  <summary
    style={{
      cursor: "pointer",
      color: "#93c5fd",
      padding: "8px 0"
    }}
  >
    Strengths & differences
  </summary>

  <div style={{ padding: "12px 0" }}>
    <strong>Strengths</strong>

    <ul>
      {(explanations[row.id]?.strengths ?? []).map(
        (item: string, index: number) => (
          <li key={index}>{item}</li>
        )
      )}
    </ul>

    <strong>Differences</strong>

    <ul>
      {(explanations[row.id]?.gaps ?? []).map(
        (item: string, index: number) => (
          <li key={index}>{item}</li>
        )
      )}
    </ul>
  </div>
</details></td></tr>;
        })}</tbody></table></div>:<p className="modal-hint">The backend responded successfully, but its score structure has not yet been mapped to a table. Raw response:</p>}
        <details style={{padding:'12px 20px'}}><summary>View complete backend response</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(result,null,2)}</pre></details>
      </>}
    </section>
    <section className="panel explanation-panel"><div className="panel-head"><div><h2>Evaluation context</h2><p>Areas to investigate during live scouting</p></div><Sparkles size={17} className="muted"/></div><div className="explanation-grid"><div><span className="explain-icon positive-bg"><TrendingUp size={16}/></span><strong>Potential strengths</strong><p>Compare playmaking volume, shooting efficiency, and role-specific production.</p></div><div><span className="explain-icon warning-bg"><AlertCircle size={16}/></span><strong>Potential gaps</strong><p>Review size, defensive versatility, competition level, and decision-making with film.</p></div><div><span className="explain-icon neutral-bg"><Database size={16}/></span><strong>Missing data</strong><p>Opponent-adjusted metrics and verified tracking data may be unavailable.</p></div></div></section>
  </>;
}

function Roster() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [grad, setGrad] = useState<string[]>([]);
  const [recruits, setRecruits] = useState<string[]>([]);
  const [maxRecruits, setMaxRecruits] = useState(2);
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  type Combination = {
    recruits?: Array<{ name?: string; position?: string }>;
    fit_score?: number;
    score_breakdown?: Record<string, number>;
    filled_positions?: string[];
    improved_areas?: string[];
    weakened_areas?: string[];
    metric_details?: Array<{
      label?: string;
      before?: number;
      after?: number;
      gap_reduced?: boolean;
    }>;
  };

  useEffect(() => {
    playerApi.list()
      .then(data => {
        setPlayers(data);
        setGrad(
          data.filter(p => p.category === "Graduating Athlete")
            .map(p => p.id)
        );
        setRecruits(
          data.filter(p => p.category === "Prospective Recruit")
            .slice(0, 3)
            .map(p => p.id)
        );
      })
      .catch(() => setError("Could not load players."));
  }, []);

  const graduating = players.filter(
    p => p.category === "Graduating Athlete"
  );
  const prospects = players.filter(
    p => p.category === "Prospective Recruit"
  );
  const returning = players.filter(
    p => p.category === "Current Athlete"
  );

  const toggle = (
    id: string,
    values: string[],
    setter: (v: string[]) => void
  ) => {
    setter(
      values.includes(id)
        ? values.filter(x => x !== id)
        : [...values, id]
    );
    setResult(null);
  };

  const simulate = async () => {
    if (!recruits.length || !grad.length || !returning.length) {
      setError("Select at least one graduating athlete and recruit, and ensure a returning athlete exists.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await api.post<unknown>(
        "/roster/simulate",
        {
          graduating_player_ids: grad.map(Number),
          returning_player_ids: returning.map(p => Number(p.id)),
          recruit_ids: recruits.map(Number),
          max_recruits: Math.min(maxRecruits, recruits.length)
        }
      );
      setResult(response.data);
    } catch (err) {
      console.error("Roster simulation failed:", err);
      setError(
        (err as {response?: {data?: {detail?: string}}})?.response?.data?.detail || "Simulation failed. Check the backend response in the console."
      );
    } finally {
      setLoading(false);
    }
  };

  const findCombinations = (
    value: unknown,
    depth = 0
  ): Combination[] => {
    if (!value || typeof value !== "object" || depth > 4) {
      return [];
    }

    if (Array.isArray(value)) {
      if (
        value.some(
          item =>
            item &&
            typeof item === "object" &&
            typeof item.fit_score === "number"
        )
      ) {
        return value as Combination[];
      }
      return [];
    }

    for (const child of Object.values(value)) {
      const found = findCombinations(child, depth + 1);
      if (found.length) return found;
    }

    return [];
  };

  const combinations = findCombinations(result)
    .sort((a, b) => (b.fit_score ?? 0) - (a.fit_score ?? 0));

  const formatItems = (items?: string[]) =>
    Array.isArray(items) && items.length
      ? items.join(", ")
      : "None identified";

  return (
    <>
      <PageHead
        eyebrow="ROSTER PLANNING"
        title="Roster Gap Simulator"
        description="Analyze roster departures and evaluate potential recruit combinations using the backend."
        action={
          <button
            className="btn primary"
            onClick={simulate}
            disabled={loading || recruits.length === 0 || grad.length === 0 || returning.length === 0}
          >
            <Sparkles size={15} />
            {loading ? "Simulating..." : "Run Simulation"}
          </button>
        }
      />

      {error && (
        <p role="alert" style={{ color: "#ff8c8c" }}>
          {error}
        </p>
      )}

      <div className="roster-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Departure scenario</h2>
              <p>Select graduating athletes</p>
            </div>
            <span className="count-badge">{grad.length} selected</span>
          </div>

          {graduating.map(p => (
            <label className="roster-choice" key={p.id}>
              <input
                type="checkbox"
                checked={grad.includes(p.id)}
                onChange={() => toggle(p.id, grad, setGrad)}
              />
              <Avatar name={p.name} />
              <span>
                <strong>{p.name}</strong>
                <small>{p.position} · {p.school}</small>
              </span>
            </label>
          ))}

          <p className="modal-hint">
            {returning.length} current athletes automatically included.
          </p>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Replacement pool</h2>
              <p>Select potential recruits</p>
            </div>
            <span className="count-badge">
              {recruits.length} selected
            </span>
          </div>

          {prospects.map(p => (
            <label className="roster-choice" key={p.id}>
              <input
                type="checkbox"
                checked={recruits.includes(p.id)}
                onChange={() => toggle(p.id, recruits, setRecruits)}
              />
              <Avatar name={p.name} />
              <span>
                <strong>{p.name}</strong>
                <small>{p.position} · {p.school}</small>
              </span>
            </label>
          ))}

          <div style={{ padding: 16 }}>
            <label>
              <strong>Maximum recruits per combination</strong>
              <select
                value={maxRecruits}
                onChange={e => {
                  setMaxRecruits(Number(e.target.value));
                  setResult(null);
                }}
                style={{ display: "block", marginTop: 8 }}
              >
                {[1, 2, 3].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 20, padding: 20 }}>
        <div className="panel-head">
          <div>
            <h2>Backend roster recommendations</h2>
            <p>Position-aware weighted roster fit</p>
          </div>
          <span className="demo-inline">LIVE API</span>
        </div>

        {!result && (
          <div className="empty-state">
            Select recruits and click Run Simulation.
          </div>
        )}

        {result !== null && (
          <>
            <p>
              <strong>
                {combinations.length} combinations evaluated
              </strong>
            </p>

            {combinations.map((combo, index) => (
              <div
                key={index}
                style={{
                  padding: 16,
                  marginTop: 12,
                  border: "1px solid #293b56",
                  borderRadius: 10
                }}
              >
                <h3>
                  #{index + 1} — Fit score:{" "}
                  {typeof combo.fit_score === "number"
                    ? combo.fit_score.toFixed(2)
                    : "N/A"} / 100
                </h3>

                <p>
                  <strong>Recruits:</strong>{" "}
                  {Array.isArray(combo.recruits)
                    ? combo.recruits.map(p => p.name ?? "Unknown").join(", ")
                    : "Not specified"}
                </p>

                <p>
                  <strong>Positions filled:</strong>{" "}
                  {formatItems(combo.filled_positions)}
                </p>

                <p>
                  <strong>Improved areas:</strong>{" "}
                  {formatItems(combo.improved_areas)}
                </p>

                <p>
                  <strong>Weakened areas:</strong>{" "}
                  {formatItems(combo.weakened_areas)}
                </p>

                <details>
                  <summary style={{ cursor: "pointer", padding: 8 }}>
                    View score breakdown and metrics
                  </summary>

                  <pre style={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere"
                  }}>
                    {JSON.stringify({
                      score_breakdown: combo.score_breakdown,
                      metric_details: combo.metric_details
                    }, null, 2)}
                  </pre>
                </details>
              </div>
            ))}

            <details style={{ marginTop: 16 }}>
              <summary style={{ cursor: "pointer" }}>
                View full backend response
              </summary>
              <pre style={{
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere"
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </>
        )}
      </section>

      <div className="disclaimer">
        <AlertCircle size={15} />
        <span>
          Roster fit scores are exploratory heuristics, not predictions
          of college performance. High-school and college statistics
          are not directly comparable.
        </span>
      </div>
    </>
  );
}

type ScoutMetric = { key: "ppg" | "apg" | "rpg" | "spg" | "bpg" | "fgPct" | "threePct"; label: string; max: number };
const scoutingMetrics: ScoutMetric[] = [
  { key: "ppg", label: "Scoring", max: 60 },
  { key: "apg", label: "Playmaking", max: 20 },
  { key: "rpg", label: "Rebounding", max: 30 },
  { key: "spg", label: "Steals", max: 10 },
  { key: "bpg", label: "Shot blocking", max: 6 },
  { key: "fgPct", label: "Field-goal shooting", max: 75 },
  { key: "threePct", label: "Three-point shooting", max: 65 }
];

function statisticalScouting(p: Player, all: Player[]) {
  const warnings: string[] = [];
  const usable = (candidate: Player, key: ScoutMetric["key"], max: number) => {
    const v = Number(candidate[key]);
    return Number.isFinite(v) && v > 0 && v <= max;
  };
  if (scoutingMetrics.some(m => Number(p[m.key]) > m.max)) {
    warnings.push("One or more statistics are unusually high; verify the source before relying on this evaluation.");
  }
  if ([p.ppg, p.apg, p.rpg, p.spg, p.bpg, p.fgPct, p.threePct].every(x => Number(x) === 0)) {
    warnings.push("All recorded statistics are zero; this may be an incomplete test record.");
  }
  const sameCategory = all.filter(x => x.id !== p.id && x.category === p.category);
  const samePosition = sameCategory.filter(x => x.position === p.position);
  // Position-specific benchmarks need at least two peers; otherwise use a broader
  // category benchmark of at least three peers. Never compare college and HS cohorts.
  const peers = samePosition.length >= 2 ? samePosition : sameCategory.length >= 3 ? sameCategory : [];
  const basis = samePosition.length >= 2 ? `${p.position} players in the same roster category` : "players in the same roster category (different positions)";
  const strengths: string[] = [];
  const development: string[] = [];
  if (!peers.length) warnings.push("Not enough comparable players for a statistical benchmark.");
  for (const metric of scoutingMetrics) {
    if (!usable(p, metric.key, metric.max)) continue;
    const values = peers.filter(x => usable(x, metric.key, metric.max)).map(x => Number(x[metric.key])).sort((a,b) => a-b);
    if (values.length < 2) continue;
    const middle = Math.floor(values.length/2);
    const median = values.length % 2 ? values[middle] : (values[middle-1] + values[middle])/2;
    const value = Number(p[metric.key]);
    if (median <= 0) continue;
    const diff = (value - median) / median;
    if (diff >= 0.2) strengths.push(`${metric.label}: ${value.toFixed(1)} vs peer median ${median.toFixed(1)}`);
    if (diff <= -0.2) development.push(`${metric.label}: ${value.toFixed(1)} vs peer median ${median.toFixed(1)}`);
  }
  return { strengths: strengths.slice(0, 4), development: development.slice(0, 4), warnings, peerCount: peers.length, basis };
}

function Reports() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    playerApi.list()
      .then(data => {
        setPlayers(data);
        setSelected(data[0]?.id ?? "");
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load players from FastAPI.");
      })
      .finally(() => setLoading(false));
  }, []);

  const p = players.find(x => x.id === selected);
  const evaluation = p ? statisticalScouting(p, players) : null;

  if (loading) return <div className="empty-state">Loading players...</div>;

  if (!p) return (
    <div className="empty-state">
      <strong>No database players available</strong>
      <span>{error || "No player records found."}</span>
    </div>
  );

  return <>
    <PageHead
      eyebrow="EVALUATION CENTER"
      title="Scouting Reports"
      description="Player statistics from the FastAPI database."
      action={
        <button className="btn primary" onClick={() => window.print()}>
          <Download size={15}/> Export PDF
        </button>
      }
    />

    <section className="panel report-select">
      <div>
        <label className="section-kicker">SELECT ATHLETE</label>
        <select value={selected} onChange={e => setSelected(e.target.value)}>
          {players.map(x => (
            <option key={x.id} value={x.id}>
              {x.name} - {x.school}
            </option>
          ))}
        </select>
      </div>
      <span className="demo-inline">DATABASE RECORDS</span>
    </section>

    <article className="panel report-document">
      <div className="report-brand">
        <div className="brand-mark"><Crosshair size={19}/></div>
        <div>
          <strong>TROJANSCOUT AI</strong>
          <small>PLAYER PROFILE - INTERNAL USE</small>
        </div>
      </div>

      <div className="report-title">
        <div>
          <div className="eyebrow">PLAYER PROFILE</div>
          <h1>{p.name}</h1>
          <p>{p.school} - {p.position} - Class of {p.gradYear}</p>
        </div>
        <CategoryTag category={p.category}/>
      </div>

      <div className="report-stats">
        {[
          ["PPG", p.ppg],
          ["APG", p.apg],
          ["RPG", p.rpg],
          ["FG%", p.fgPct],
          ["3P%", p.threePct]
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{Number(value).toFixed(1)}</strong>
          </div>
        ))}
      </div>

      <div className="report-section">
        <h3>Scouting observations</h3>
        <p>{p.notes || "No scouting observations recorded."}</p>
      </div>

      <div className="report-two">
        <div className="report-section">
          <h3>Recorded strengths</h3>
          {p.strengths.length
            ? p.strengths.map(x => (
                <div className="report-bullet" key={x}>
                  <CheckCircle2 size={15}/>{x}
                </div>
              ))
            : <p>No strengths recorded.</p>}
        </div>

        <div className="report-section">
          <h3>Development areas</h3>
          {p.weaknesses.length
            ? p.weaknesses.map(x => (
                <div className="report-bullet caution-text" key={x}>
                  <AlertCircle size={15}/>{x}
                </div>
              ))
            : <p>No development areas recorded.</p>}
        </div>
      </div>

      <div className="report-section">
        <h3>Statistical scouting indicators (automated)</h3>
        <p style={{ marginBottom: 10 }}>
          Descriptive comparison only; not a prediction of athlete performance or an independently verified scout evaluation.
          {evaluation && evaluation.peerCount > 0 ? ` Compared against ${evaluation.peerCount} ${evaluation.basis}.` : ""}
          {" "}Missing or zero-valued metrics are not treated as weaknesses.
        </p>
        {evaluation && evaluation.warnings.map((warning, i) => (
          <p key={i} style={{ color: "#b7791f", marginBottom: 6 }}>Data caution: {warning}</p>
        ))}
        <div className="report-two">
          <div className="report-section">
            <h3>Relative statistical strengths</h3>
            {evaluation && evaluation.strengths.length ? evaluation.strengths.map(x => (
              <div className="report-bullet" key={x}><CheckCircle2 size={15}/>{x}</div>
            )) : <p>No supported above-benchmark indicators yet.</p>}
          </div>
          <div className="report-section">
            <h3>Metrics to review</h3>
            {evaluation && evaluation.development.length ? evaluation.development.map(x => (
              <div className="report-bullet caution-text" key={x}><AlertCircle size={15}/>{x}</div>
            )) : <p>No supported below-benchmark indicators yet.</p>}
          </div>
        </div>
      </div>

      <div className="report-section">
        <h3>Data verification</h3>
        <p>
          Statistics are retrieved from stored database records.
          Their accuracy has not been independently verified.
          Automated peer comparisons are descriptive heuristics, not AI-generated judgments or performance predictions.
        </p>
      </div>

      <div className="report-footer">
        TROJANSCOUT AI - VERIFY DATA BEFORE RECRUITING USE
      </div>
    </article>
  </>;
}

function SettingsPage() {
  const apiUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const [status, setStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");

  const [error, setError] = useState("");

  const checkConnection = async () => {
    setStatus("checking");
    setError("");

    try {
      const response = await api.get("/health", {
        timeout: 5000
      });

      if (response.status === 200 &&
          response.data?.status === "healthy") {
        setStatus("connected");
      } else {
        setStatus("disconnected");
        setError("Unexpected health-check response.");
      }
    } catch (err) {
      console.error("Backend health check failed:", err);
      setStatus("disconnected");
      setError("FastAPI is unreachable. Check port 8000.");
    }
  };

  useEffect(() => {
    void checkConnection();
  }, []);

  return (
    <>
      <PageHead
        eyebrow="PREFERENCES"
        title="Settings"
        description="Backend configuration and system connectivity."
      />

      <section className="panel settings-card">
        <div className="settings-row">
          <div>
            <strong>Data source</strong>
            <span>Player data is retrieved from FastAPI.</span>
          </div>
          <span className="env-tag">LIVE API</span>
        </div>

        <div className="settings-row">
          <div>
            <strong>Backend API URL</strong>
            <span>Configured using VITE_API_BASE_URL</span>
          </div>
          <code>{apiUrl}</code>
        </div>

        <div className="settings-row">
          <div>
            <strong>Backend connection</strong>
            <span>
              {status === "connected"
                ? "FastAPI health check succeeded."
                : status === "checking"
                ? "Checking FastAPI..."
                : error}
            </span>
          </div>

          <span
            className={`status-pill ${
              status === "connected"
                ? "success"
                : status === "disconnected"
                ? "danger"
                : "processing"
            }`}
          >
            <i />
            {status === "connected"
              ? "Connected"
              : status === "checking"
              ? "Checking"
              : "Disconnected"}
          </span>
        </div>

        <div className="settings-row">
          <div>
            <strong>Refresh connection status</strong>
            <span>Run another backend health check.</span>
          </div>

          <button
            className="btn secondary"
            onClick={checkConnection}
            disabled={status === "checking"}
          >
            <RotateCcw size={15} />
            Check connection
          </button>
        </div>
      </section>
    </>
  );
}
export default App;




