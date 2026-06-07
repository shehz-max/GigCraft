'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, FileText, HelpCircle, Video, Target, Send, Trophy,
  User, Briefcase, BookOpen, Clock, ChevronRight, Plus,
  BarChart3, Tag, Copy, CheckCircle2, Settings, PenTool, Zap,
  Layout, History, X, AlertTriangle, Eye, RefreshCw,
  Download, Trash2, Filter, Menu
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const PLATFORMS = [
  { id: 'Upwork', icon: '↑' },
  { id: 'Freelancer', icon: '◉' },
  { id: 'Fiverr', icon: '✦' },
  { id: 'Guru', icon: '◆' },
  { id: 'PeoplePerHour', icon: '⏱' },
];

const TONES = [
  { value: 'Conversational', label: 'Conversational', desc: 'Warm & engaging' },
  { value: 'Expert', label: 'Technical Expert', desc: 'Data-driven' },
  { value: 'Formal', label: 'Formal B2B', desc: 'Corporate tone' },
  { value: 'Friendly', label: 'Casual Friendly', desc: 'Approachable' },
];

export default function Home() {
  const [activeView, setActiveView] = useState('generate');
  const [platform, setPlatform] = useState('Upwork');
  const [jobDescription, setJobDescription] = useState('');
  const [clientReviews, setClientReviews] = useState('');
  const [userTone, setUserTone] = useState('Conversational');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle state

  const [result, setResult] = useState(null);
  const [parsedJob, setParsedJob] = useState(null);
  const [matchedEvidence, setMatchedEvidence] = useState(null);
  const [activeTab, setActiveTab] = useState('letter');
  const [history, setHistory] = useState([]);
  const [activeProposalId, setActiveProposalId] = useState(null);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // AI Orchestra State Variables
  const [strategyBrief, setStrategyBrief] = useState(null);
  const [qualityScore, setQualityScore] = useState(null);
  const [criticIssues, setCriticIssues] = useState([]);
  const [bidScore, setBidScore] = useState(null);
  const [bidVerdict, setBidVerdict] = useState(null);
  const [bidReasons, setBidReasons] = useState([]);
  
  // UI States
  const [strategyExpanded, setStrategyExpanded] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [followUpType, setFollowUpType] = useState('value_add');
  const [generatingFollowUp, setGeneratingFollowUp] = useState(false);
  const [followUpText, setFollowUpText] = useState('');

  // Outreach Campaign State
  const [prospectName, setProspectName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [prospectPain, setProspectPain] = useState('');
  const [outreachPortfolio, setOutreachPortfolio] = useState('');
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [outreachResult, setOutreachResult] = useState(null);

  // SOW Builder State
  const [generatingSOW, setGeneratingSOW] = useState(false);
  const [sowText, setSowText] = useState('');
  const [sowModalOpen, setSowModalOpen] = useState(false);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profile, setProfile] = useState({ name: '', headline: '', base_rate: 0, bio: '', tone: 'Conversational' });
  const [portfolios, setPortfolios] = useState([]);
  const [caseStudies, setCaseStudies] = useState([]);
  const [modalTab, setModalTab] = useState('profile');
  const [newItem, setNewItem] = useState({
    title: '', description: '', technologies: '', link: '', metrics: '',
    problem: '', solution: '', result: ''
  });

  // History filters
  const [historyFilter, setHistoryFilter] = useState('all');

  useEffect(() => {
    fetchProfile();
    fetchPortfolio();
    fetchHistory();
  }, []);

  // Lock body scroll when modal is open to prevent scroll chaining
  useEffect(() => {
    if (profileModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [profileModalOpen]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data && !data.error) {
        setProfile(data);
        setUserTone(data.tone || 'Conversational');
      }
    } catch (err) { console.error('Failed to load profile:', err); }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      if (data && !data.error) {
        setPortfolios(data.portfolios || []);
        setCaseStudies(data.caseStudies || []);
      }
    } catch (err) { console.error('Failed to load portfolio:', err); }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data && !data.error) setHistory(data);
    } catch (err) { console.error('Failed to load history:', err); }
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!jobDescription) return;
    setLoading(true);
    setResult(null);
    setParsedJob(null);
    setMatchedEvidence(null);
    setStrategyBrief(null);
    setQualityScore(null);
    setCriticIssues([]);
    setBidScore(null);
    setBidVerdict(null);
    setBidReasons([]);
    setGenerationSuccess(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, jobDescription, clientReviews, userTone })
      });
      const data = await res.json();
      if (res.ok && data.proposal) {
        setResult(data.proposal);
        setParsedJob(data.parsedJob || null);
        setMatchedEvidence(data.matchedEvidence || null);
        setStrategyBrief(data.strategyBrief || null);
        setQualityScore(data.proposal.qualityScore || null);
        setCriticIssues(data.proposal.criticIssues || []);
        setBidScore(data.proposal.bidScore || null);
        setBidVerdict(data.proposal.bidVerdict || null);
        setBidReasons(data.proposal.bidReasons || []);
        
        setActiveProposalId(data.id);
        setGenerationSuccess(true);
        setActiveTab('letter');
        fetchHistory();
        toast.success('Proposal crafted successfully!');
      } else {
        toast.error(data.error || 'Generation failed.');
      }
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Network error during generation.');
    } finally {
      setLoading(false);
    }
  };

  // Regenerate (A/B variant)
  const handleRegenerate = () => {
    if (!jobDescription) return;
    handleGenerate();
  };

  const handleGenerateFollowUp = async (type) => {
    if (!activeProposalId || !result) return;
    setGeneratingFollowUp(true);
    setFollowUpType(type);
    setFollowUpText('');
    try {
      const res = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: parsedJob?.clientName || result?.clientName || 'there',
          jobDescription: jobDescription,
          coverLetter: result.coverLetter,
          followUpType: type
        })
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setFollowUpText(data.message);
        toast.success('Follow-up drafted!');
      } else {
        toast.error(data.error || 'Failed to draft follow-up.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error generating follow-up.');
    } finally {
      setGeneratingFollowUp(false);
    }
  };

  const handleGenerateOutreach = async (e) => {
    if (e) e.preventDefault();
    if (!prospectName || !companyName || !prospectPain) return;
    setGeneratingOutreach(true);
    setOutreachResult(null);
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectName,
          companyName,
          prospectPain,
          portfolioContext: outreachPortfolio
        })
      });
      const data = await res.json();
      if (res.ok && data.linkedinMessage) {
        setOutreachResult(data);
        toast.success('Outreach campaign drafted!');
      } else {
        toast.error(data.error || 'Failed to draft outreach campaign.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during outreach generation.');
    } finally {
      setGeneratingOutreach(false);
    }
  };

  const handleGenerateSOW = async () => {
    if (!activeProposalId) return;
    setGeneratingSOW(true);
    setSowText('');
    setSowModalOpen(true);
    try {
      const res = await fetch('/api/sow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: activeProposalId
        })
      });
      const data = await res.json();
      if (res.ok && data.sow) {
        setSowText(data.sow);
        toast.success('SOW contract generated!');
      } else {
        toast.error(data.error || 'Failed to generate SOW.');
        setSowModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during SOW generation.');
      setSowModalOpen(false);
    } finally {
      setGeneratingSOW(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        toast.success('Profile saved!');
        fetchProfile();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Save failed.');
      }
    } catch (err) { console.error('Profile save error:', err); }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: modalTab, ...newItem })
      });
      if (res.ok) {
        toast.success(`${modalTab === 'case_study' ? 'Case Study' : 'Portfolio Item'} added!`);
        fetchPortfolio();
        setNewItem({ title: '', description: '', technologies: '', link: '', metrics: '', problem: '', solution: '', result: '' });
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed.');
      }
    } catch (err) { console.error('Error adding item:', err); }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch('/api/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) { fetchHistory(); toast.success(`Marked as ${status}`); }
    } catch (err) { console.error('Status update error:', err); }
  };

  const handleDeleteProposal = async (id) => {
    try {
      const res = await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchHistory();
        toast.success('Proposal deleted');
        if (activeProposalId === id) {
          setResult(null);
          setActiveProposalId(null);
        }
      }
    } catch (err) { console.error('Delete error:', err); }
  };

  const handleSelectHistory = (item) => {
    let loomScript = item.generated_loom_script;
    let strategyBriefObj = null;
    let qualityScoreVal = null;
    let criticIssuesList = [];
    let bidScoreVal = null;
    let bidVerdictVal = null;
    let bidReasonsList = [];
    let parsedJobObj = null;

    try {
      if (loomScript && loomScript.trim().startsWith('{')) {
        const meta = JSON.parse(loomScript);
        loomScript = meta.script;
        strategyBriefObj = meta.strategyBrief || null;
        qualityScoreVal = meta.qualityScore || null;
        criticIssuesList = meta.criticIssues || [];
        bidScoreVal = meta.bidScore || null;
        bidVerdictVal = meta.bidVerdict || null;
        bidReasonsList = meta.bidReasons || [];
        parsedJobObj = meta.parsedJob || null;
      }
    } catch (e) {
      console.warn("Could not parse loom script metadata:", e);
    }

    setResult({
      coverLetter: item.generated_proposal,
      screeningAnswers: item.generated_questions || [],
      loomScript: loomScript,
      milestones: item.generated_milestones || [],
      pricingTiers: strategyBriefObj?.pricingIntelligence?.tiers || {
        basic: { scope: 'N/A', price: 'N/A', delivery: 'N/A' },
        standard: { scope: 'N/A', price: 'N/A', delivery: 'N/A' },
        premium: { scope: 'N/A', price: 'N/A', delivery: 'N/A' }
      }
    });

    setParsedJob(parsedJobObj);
    setStrategyBrief(strategyBriefObj);
    setQualityScore(qualityScoreVal);
    setCriticIssues(criticIssuesList);
    setBidScore(bidScoreVal);
    setBidVerdict(bidVerdictVal);
    setBidReasons(bidReasonsList);

    setActiveProposalId(item.id);
    setPlatform(item.platform);
    setJobDescription(item.job_description || '');
    setMatchedEvidence(null);
    setGenerationSuccess(false);
    setActiveView('generate');
  };

  const getWordCount = (text) => text ? text.trim().split(/\s+/).filter(Boolean).length : 0;

  const getKeywordMatches = useCallback(() => {
    if (!jobDescription || !result) return [];
    const keywords = ['React', 'Next.js', 'Node.js', 'Python', 'Tailwind', 'PostgreSQL', 'SQL',
      'FastAPI', 'API', 'Docker', 'AWS', 'Firebase', 'Supabase', 'CSS', 'HTML',
      'Copywriting', 'SEO', 'WordPress', 'Shopify', 'UI', 'UX', 'GitHub',
      'TypeScript', 'JavaScript', 'GraphQL', 'MongoDB', 'Redis', 'Figma'];
    const matched = [];
    const textLower = (result.coverLetter || '').toLowerCase();
    const jdLower = jobDescription.toLowerCase();
    keywords.forEach(kw => {
      if (jdLower.includes(kw.toLowerCase())) {
        matched.push({ name: kw, inProposal: textLower.includes(kw.toLowerCase()) });
      }
    });
    return matched;
  }, [jobDescription, result]);

  const matches = getKeywordMatches();

  const handleCopy = async (text) => {
    const content = text || result?.coverLetter;
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleExport = () => {
    if (!result) return;
    let content = `# Proposal — ${platform}\n\n`;
    content += `## Cover Letter\n${result.coverLetter}\n\n`;
    if (result.screeningAnswers?.length) {
      content += `## Screening Answers\n`;
      result.screeningAnswers.forEach((q, i) => {
        content += `### Q${i + 1}: ${q.question}\n${q.answer}\n\n`;
      });
    }
    if (result.loomScript) content += `## Loom Script\n${result.loomScript}\n\n`;
    if (result.milestones?.length) {
      content += `## Milestones\n`;
      result.milestones.forEach(m => { content += `- ${m.phase}: ${m.description} (${m.pricePercentage}%)\n`; });
    }
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposal-${platform.toLowerCase()}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as Markdown!');
  };

  const stats = useMemo(() => ({
    total: history.length,
    won: history.filter(h => h.status === 'Won').length,
    sent: history.filter(h => h.status === 'Sent').length,
    rate: history.length > 0 ? Math.round((history.filter(h => h.status === 'Won').length / history.length) * 100) : 0
  }), [history]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'all') return history;
    return history.filter(h => h.platform === historyFilter || h.status?.toLowerCase() === historyFilter);
  }, [history, historyFilter]);

  const getInitials = (name) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
  const getPlatformIcon = (pid) => PLATFORMS.find(p => p.id === pid)?.icon || '●';

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', borderRadius: '8px', padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }
      }} />

      <div className="app-layout">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon"><Zap size={17} /></div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">GigCraft</span>
              <span className="sidebar-brand-tagline">Proposal Engine</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-section-label">Workspace</div>
            <button className={`sidebar-nav-item ${activeView === 'generate' ? 'active' : ''}`} onClick={() => { setActiveView('generate'); setSidebarOpen(false); }}>
              <PenTool size={17} className="sidebar-nav-icon" /> Generate
            </button>
            <button className={`sidebar-nav-item ${activeView === 'history' ? 'active' : ''}`} onClick={() => { setActiveView('history'); setSidebarOpen(false); }}>
              <History size={17} className="sidebar-nav-icon" /> History
              {history.length > 0 && <span className="sidebar-nav-badge">{history.length}</span>}
            </button>
            <button className={`sidebar-nav-item ${activeView === 'outreach' ? 'active' : ''}`} onClick={() => { setActiveView('outreach'); setSidebarOpen(false); }}>
              <Send size={17} className="sidebar-nav-icon" style={{ transform: 'rotate(-20deg)' }} /> Outreach
            </button>
            <button className={`sidebar-nav-item ${activeView === 'analytics' ? 'active' : ''}`} onClick={() => { setActiveView('analytics'); setSidebarOpen(false); }}>
              <BarChart3 size={17} className="sidebar-nav-icon" /> Analytics
            </button>

            <div className="sidebar-section-label" style={{ marginTop: '14px' }}>Settings</div>
            <button className="sidebar-nav-item" onClick={() => { setProfileModalOpen(true); setModalTab('profile'); setSidebarOpen(false); }}>
              <User size={17} className="sidebar-nav-icon" /> Profile
            </button>
            <button className="sidebar-nav-item" onClick={() => { setProfileModalOpen(true); setModalTab('portfolio'); setSidebarOpen(false); }}>
              <Briefcase size={17} className="sidebar-nav-icon" /> Portfolio
              {portfolios.length > 0 && <span className="sidebar-nav-badge">{portfolios.length}</span>}
            </button>
            <button className="sidebar-nav-item" onClick={() => { setProfileModalOpen(true); setModalTab('case_study'); setSidebarOpen(false); }}>
              <BookOpen size={17} className="sidebar-nav-icon" /> Case Studies
              {caseStudies.length > 0 && <span className="sidebar-nav-badge">{caseStudies.length}</span>}
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-profile-card" onClick={() => { setProfileModalOpen(true); setModalTab('profile'); setSidebarOpen(false); }}>
              <div className="sidebar-avatar">{getInitials(profile.name)}</div>
              <div className="sidebar-profile-info">
                <div className="sidebar-profile-name">{profile.name || 'Set up profile'}</div>
                <div className="sidebar-profile-role">{profile.headline || 'Click to configure'}</div>
              </div>
              <Settings size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main-content">
          <header className="top-header">
            <div className="header-left">
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu size={18} />
              </button>
              <div>
                <div className="header-page-title">
                  {activeView === 'generate' && 'Proposal Generator'}
                  {activeView === 'history' && 'Proposal History'}
                  {activeView === 'outreach' && 'Cold Outreach Builder'}
                  {activeView === 'analytics' && 'Analytics'}
                </div>
                <div className="header-breadcrumb">
                  GigCraft <ChevronRight size={11} style={{ verticalAlign: 'middle' }} />{' '}
                  <span>{activeView === 'generate' ? 'Generate' : activeView === 'history' ? 'History' : activeView === 'outreach' ? 'Outreach' : 'Analytics'}</span>
                </div>
              </div>
            </div>
            <div className="header-right">
              <div className="word-count-badge">
                <Briefcase size={11} /> {portfolios.length} projects · {caseStudies.length} studies
              </div>
            </div>
          </header>

          <div className="page-content">
            <AnimatePresence mode="wait">
              {/* ════ GENERATE VIEW ════ */}
              {activeView === 'generate' && (
                <motion.div key="gen" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="generate-layout">
                  {/* Left column */}
                  <div className="generate-sidebar">
                    <div className="card">
                      <div className="card-header">
                        <div className="card-title-group">
                          <h3 className="card-title"><span className="card-title-icon green"><Target size={15} /></span> Job Details</h3>
                          <p className="card-subtitle">Paste the target job posting</p>
                        </div>
                      </div>

                      <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div className="form-group">
                          <label className="form-label"><Layout size={13} /> Platform</label>
                          <div className="platform-selector">
                            {PLATFORMS.map(p => (
                              <button key={p.id} type="button" onClick={() => setPlatform(p.id)} className={`platform-chip ${platform === p.id ? 'active' : ''}`}>
                                <span className="platform-chip-dot" />{p.id}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label"><FileText size={13} /> Job Description</label>
                          <textarea className="textarea-input textarea-lg" placeholder="Paste the raw job posting here..." value={jobDescription} onChange={e => setJobDescription(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label"><Eye size={13} /> Client Reviews <span className="form-label-hint">(optional)</span></label>
                          <textarea className="textarea-input" placeholder="Paste past client feedback..." value={clientReviews} onChange={e => setClientReviews(e.target.value)} rows={3} style={{ minHeight: '72px' }} />
                        </div>
                        <div className="form-group">
                          <label className="form-label"><PenTool size={13} /> Tone</label>
                          <select className="select-input" value={userTone} onChange={e => setUserTone(e.target.value)}>
                            {TONES.map(t => <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>)}
                          </select>
                        </div>
                        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                          {loading ? (
                            <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-flex' }}><Sparkles size={16} /></motion.span> Crafting...</>
                          ) : (
                            <><Sparkles size={16} /> Generate Proposal</>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Bid Advisor Score Card */}
                    {bidScore !== null && (
                      <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{
                        borderLeft: `4px solid ${bidVerdict === 'STRONG_BID' ? 'var(--success)' : bidVerdict === 'CAUTIOUS' ? 'var(--warning)' : 'var(--danger)'}`
                      }}>
                        <div className="card-header" style={{ marginBottom: '8px' }}>
                          <div className="card-title-group">
                            <h3 className="card-title" style={{ fontSize: '0.88rem' }}>
                              <span className="card-title-icon" style={{
                                background: bidVerdict === 'STRONG_BID' ? 'var(--success-light)' : bidVerdict === 'CAUTIOUS' ? 'var(--warning-light)' : 'var(--danger-light)',
                                color: bidVerdict === 'STRONG_BID' ? 'var(--success)' : bidVerdict === 'CAUTIOUS' ? 'var(--warning)' : 'var(--danger)'
                              }}><Trophy size={14} /></span> Bid Advisor
                            </h3>
                            <p className="card-subtitle">Pre-flight lead evaluation</p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px', padding: '10px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{
                            width: '46px', height: '46px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: bidVerdict === 'STRONG_BID' ? 'var(--success-light)' : bidVerdict === 'CAUTIOUS' ? 'var(--warning-light)' : 'var(--danger-light)',
                            color: bidVerdict === 'STRONG_BID' ? 'var(--success)' : bidVerdict === 'CAUTIOUS' ? 'var(--warning)' : 'var(--danger)',
                            fontWeight: 700, fontSize: '1.05rem', border: '1px solid var(--border-light)'
                          }}>
                            {bidScore}
                          </div>
                          <div>
                            <div style={{
                              fontSize: '0.85rem', fontWeight: 700,
                              color: bidVerdict === 'STRONG_BID' ? 'var(--success)' : bidVerdict === 'CAUTIOUS' ? 'var(--warning)' : 'var(--danger)'
                            }}>
                              {bidVerdict === 'STRONG_BID' ? '🟢 STRONG BID' : bidVerdict === 'CAUTIOUS' ? '🟡 CAUTIOUS' : '🔴 SKIP OPPORTUNITY'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Score based on budget, flags, & scope
                            </div>
                          </div>
                        </div>

                        {bidReasons && bidReasons.length > 0 && (
                          <div style={{ fontSize: '0.74rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {bidReasons.map((reason, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', color: 'var(--text-secondary)' }}>
                                <span style={{ color: bidVerdict === 'STRONG_BID' ? 'var(--success)' : bidVerdict === 'CAUTIOUS' ? 'var(--warning)' : 'var(--danger)' }}>•</span>
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Client Intelligence Card */}
                    {parsedJob && (parsedJob.clientPersonality || parsedJob.urgencyLevel || (parsedJob.redFlags && parsedJob.redFlags.length > 0)) && (
                      <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                        <div className="card-header" style={{ marginBottom: '10px' }}>
                          <div className="card-title-group">
                            <h3 className="card-title" style={{ fontSize: '0.88rem' }}><span className="card-title-icon blue"><User size={14} /></span> Client Intelligence</h3>
                            <p className="card-subtitle">Extracted behavioral signals</p>
                          </div>
                        </div>

                        {/* Red Flags Warning Block */}
                        {parsedJob.redFlags && parsedJob.redFlags.length > 0 && (
                          <div className="alert-banner danger" style={{ marginBottom: '12px', padding: '10px', background: 'var(--danger-light)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                            <AlertTriangle size={15} className="alert-banner-icon" style={{ color: 'var(--danger)', marginTop: '1px' }} />
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              <strong style={{ color: 'var(--danger)' }}>Red Flags Detected!</strong>
                              <div style={{ marginTop: '3px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {parsedJob.redFlags.map((flag, idx) => (
                                  <span key={idx} style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.66rem', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    {flag.replace('_', ' ')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.75rem' }}>
                          {parsedJob.clientPersonality && (
                            <>
                              <div style={{ background: 'var(--bg-inset)', padding: '8px', borderRadius: '4px' }}>
                                <div style={{ color: 'var(--text-faint)', fontSize: '0.66rem', textTransform: 'uppercase', fontWeight: 600 }}>Formality</div>
                                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px', textTransform: 'capitalize' }}>{parsedJob.clientPersonality.formality || 'mixed'}</div>
                              </div>
                              <div style={{ background: 'var(--bg-inset)', padding: '8px', borderRadius: '4px' }}>
                                <div style={{ color: 'var(--text-faint)', fontSize: '0.66rem', textTransform: 'uppercase', fontWeight: 600 }}>Technicality</div>
                                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px', textTransform: 'capitalize' }}>{parsedJob.clientPersonality.technicalDepth || 'semi-technical'}</div>
                              </div>
                              <div style={{ background: 'var(--bg-inset)', padding: '8px', borderRadius: '4px', gridColumn: '1 / -1' }}>
                                <div style={{ color: 'var(--text-faint)', fontSize: '0.66rem', textTransform: 'uppercase', fontWeight: 600 }}>Decision Style</div>
                                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px', textTransform: 'capitalize' }}>{parsedJob.clientPersonality.decisionStyle || 'exploratory'}</div>
                              </div>
                            </>
                          )}

                          {parsedJob.urgencyLevel && (
                            <div style={{ background: 'var(--bg-inset)', padding: '8px', borderRadius: '4px', gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ color: 'var(--text-faint)', fontSize: '0.66rem', textTransform: 'uppercase', fontWeight: 600 }}>Project Urgency</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{parsedJob.urgencyLevel.reasoning || 'Standard timeframe'}</div>
                              </div>
                              <div style={{
                                width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: parsedJob.urgencyLevel.score >= 4 ? 'var(--warning-light)' : 'var(--bg-subtle)',
                                color: parsedJob.urgencyLevel.score >= 4 ? 'var(--warning)' : 'var(--text-secondary)',
                                fontWeight: 700, fontSize: '0.85rem', border: '1px solid var(--border-light)'
                              }}>
                                {parsedJob.urgencyLevel.score}/5
                              </div>
                            </div>
                          )}

                          {parsedJob.budgetAnalysis && (
                            <div style={{ background: 'var(--bg-inset)', padding: '8px', borderRadius: '4px', gridColumn: '1 / -1' }}>
                              <div style={{ color: 'var(--text-faint)', fontSize: '0.66rem', textTransform: 'uppercase', fontWeight: 600 }}>Budget Analysis</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                                  {parsedJob.budgetAnalysis.min || parsedJob.budgetAnalysis.max ? (
                                    `${parsedJob.budgetAnalysis.min ? '$' + parsedJob.budgetAnalysis.min : ''}${parsedJob.budgetAnalysis.min && parsedJob.budgetAnalysis.max ? '-' : ''}${parsedJob.budgetAnalysis.max ? '$' + parsedJob.budgetAnalysis.max : ''} (${parsedJob.budgetAnalysis.type})`
                                  ) : 'Not specified'}
                                </span>
                                <span style={{
                                  fontSize: '0.68rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px',
                                  background: parsedJob.budgetAnalysis.isRealistic ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                  color: parsedJob.budgetAnalysis.isRealistic ? 'var(--success)' : 'var(--danger)',
                                  border: `1px solid ${parsedJob.budgetAnalysis.isRealistic ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                }}>
                                  {parsedJob.budgetAnalysis.isRealistic ? 'Realistic' : 'Underpriced'}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {parsedJob.budgetAnalysis.reasoning}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Parsed Job Insights */}
                    {parsedJob && (
                      <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="card-header" style={{ marginBottom: '12px' }}>
                          <div className="card-title-group">
                            <h3 className="card-title" style={{ fontSize: '0.88rem' }}><span className="card-title-icon blue"><Eye size={14} /></span> Job Insights</h3>
                            <p className="card-subtitle">Extracted by NLP parser</p>
                          </div>
                        </div>

                        {/* Hidden instruction alert */}
                        {parsedJob.hiddenInstructions && parsedJob.hiddenInstructions !== 'None' && parsedJob.hiddenInstructions !== 'null' && (
                          <div className="alert-banner warning" style={{ marginBottom: '12px' }}>
                            <AlertTriangle size={16} className="alert-banner-icon" style={{ color: 'var(--warning)' }} />
                            <div><strong>Hidden Instruction Detected!</strong><br />{parsedJob.hiddenInstructions}</div>
                          </div>
                        )}

                        <div className="insights-grid">
                          {parsedJob.clientName && parsedJob.clientName !== 'there' && (
                            <div className="insight-item">
                              <div className="insight-label">Client Name</div>
                              <div className="insight-value">{parsedJob.clientName}</div>
                            </div>
                          )}
                          {parsedJob.toneStyle && (
                            <div className="insight-item">
                              <div className="insight-label">Client Tone</div>
                              <div className="insight-value">{parsedJob.toneStyle}</div>
                            </div>
                          )}
                          {parsedJob.projectComplexity && (
                            <div className="insight-item">
                              <div className="insight-label">Complexity</div>
                              <div className="insight-value" style={{ textTransform: 'capitalize' }}>{parsedJob.projectComplexity}</div>
                            </div>
                          )}
                          {parsedJob.technicalSkills?.length > 0 && (
                            <div className="insight-item" style={{ gridColumn: '1 / -1' }}>
                              <div className="insight-label">Required Skills</div>
                              <div className="insight-tags">
                                {parsedJob.technicalSkills.map((s, i) => <span key={i} className="insight-tag">{s}</span>)}
                              </div>
                            </div>
                          )}
                          {parsedJob.implicitStackAssumptions?.length > 0 && (
                            <div className="insight-item" style={{ gridColumn: '1 / -1' }}>
                              <div className="insight-label">Implicit Stack Assumptions</div>
                              <div className="insight-tags">
                                {parsedJob.implicitStackAssumptions.map((s, i) => (
                                  <span key={i} className="insight-tag" style={{ background: 'var(--accent-100)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {parsedJob.diagnosticClues?.length > 0 && (
                            <div className="insight-item" style={{ gridColumn: '1 / -1' }}>
                              <div className="insight-label">Key Diagnostic Questions</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {parsedJob.diagnosticClues.map((c, i) => (
                                  <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                    <span style={{ color: 'var(--primary-500)', fontWeight: 'bold' }}>?</span>
                                    <span>{c}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {parsedJob.painPoints?.length > 0 && (
                            <div className="insight-item" style={{ gridColumn: '1 / -1' }}>
                              <div className="insight-label">Pain Points</div>
                              <div className="insight-value" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {parsedJob.painPoints.map((p, i) => (
                                  <div key={i} style={{ padding: '6px', background: 'var(--bg-inset)', borderRadius: '4px', borderLeft: '2px solid var(--accent-300)' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.74rem' }}>{p.symptom || p}</div>
                                    {p.businessImpact && <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: '2px' }}>Impact: {p.businessImpact}</div>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Matched Evidence */}
                    {matchedEvidence && (matchedEvidence.matchedPortfolios?.length > 0 || matchedEvidence.matchedCaseStudies?.length > 0) && (
                      <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <div className="card-header" style={{ marginBottom: '10px' }}>
                          <div className="card-title-group">
                            <h3 className="card-title" style={{ fontSize: '0.88rem' }}><span className="card-title-icon gold"><Briefcase size={14} /></span> Matched Evidence</h3>
                            <p className="card-subtitle">Portfolio items used in proposal</p>
                          </div>
                        </div>
                        {matchedEvidence.matchedPortfolios?.map((p, i) => (
                          <div key={i} style={{ padding: '8px 10px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-sm)', marginBottom: '6px', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{p.title}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Score: {p.score} · {p.technologies?.join(', ')}</div>
                          </div>
                        ))}
                        {matchedEvidence.matchedCaseStudies?.map((c, i) => (
                          <div key={`cs-${i}`} style={{ padding: '8px 10px', background: 'var(--accent-50)', borderRadius: 'var(--radius-sm)', marginBottom: '6px', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{c.title}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Case Study · Score: {c.score}</div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* Keywords */}
                    {matches.length > 0 && (
                      <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="card-header" style={{ marginBottom: '10px' }}>
                          <div className="card-title-group">
                            <h3 className="card-title" style={{ fontSize: '0.88rem' }}><span className="card-title-icon gold"><Tag size={14} /></span> Keywords</h3>
                          </div>
                          <span className="word-count-badge" style={{ background: matches.every(m => m.inProposal) ? 'var(--success-light)' : 'var(--warning-light)', color: matches.every(m => m.inProposal) ? 'var(--success)' : 'var(--warning)' }}>
                            {matches.filter(m => m.inProposal).length}/{matches.length}
                          </span>
                        </div>
                        <div className="keyword-grid">
                          {matches.map((item, i) => (
                            <span key={i} className={`keyword-tag ${item.inProposal ? 'matched' : 'missing'}`}>
                              {item.inProposal ? <CheckCircle2 size={11} /> : '!'} {item.name}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Right: Result */}
                  <div className="generate-main">
                    {loading ? (
                      <div className="card">
                        <div className="loading-state">
                          <div className="loading-spinner" />
                          <div className="loading-text">Orchestrating AI Proposal...</div>
                          <div className="loading-steps">
                            <div className="loading-step"><span className="loading-step-dot" /> Stage 1: Deep parsing job description (Groq)</div>
                            <div className="loading-step"><span className="loading-step-dot" /> Matching semantic portfolio evidence</div>
                            <div className="loading-step"><span className="loading-step-dot" /> Stage 2: Formulating B2B bid strategy & pricing (Gemini)</div>
                            <div className="loading-step"><span className="loading-step-dot" /> Stage 3: Crafting persuasive copy (Groq)</div>
                            <div className="loading-step"><span className="loading-step-dot" /> Stage 4: Critiquing & refining against KB rules (Gemini)</div>
                          </div>
                        </div>
                      </div>
                    ) : result ? (
                      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {generationSuccess && (
                          <div className="success-banner">
                            <div className="success-check-circle"><svg viewBox="0 0 24 24"><path d="M20 6L9 17L4 12" /></svg></div>
                            <div className="success-text">
                              <h4>Proposal Crafted by AI Orchestra</h4>
                              <p>Qualified, strategized, written, and critiqued across 4 AI agents.</p>
                            </div>
                          </div>
                        )}

                        {/* Quality Critic Score Header */}
                        {qualityScore !== null && (
                          <div className="card" style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '18px', padding: '12px 18px',
                            borderLeft: `4px solid ${qualityScore >= 8.5 ? 'var(--success)' : qualityScore >= 7.0 ? 'var(--info)' : 'var(--warning)'}`
                          }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <div style={{
                                width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: qualityScore >= 8.5 ? 'var(--success-light)' : 'var(--info-light)',
                                color: qualityScore >= 8.5 ? 'var(--success)' : 'var(--info)',
                                fontWeight: 700, fontSize: '0.9rem', border: '1px solid var(--border-light)'
                              }}>
                                {qualityScore}
                              </div>
                              <div>
                                <h4 style={{ fontSize: '0.82rem', fontWeight: 700 }}>Quality Score Audit</h4>
                                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Verified against rules & heuristics</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{
                                fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                                background: qualityScore >= 7.0 ? 'var(--success-light)' : 'var(--warning-light)',
                                color: qualityScore >= 7.0 ? 'var(--success)' : 'var(--warning)'
                              }}>
                                {qualityScore >= 7.0 ? 'PASS' : 'REFINED'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Critic Issues Block */}
                        {criticIssues && criticIssues.length > 0 && (
                          <div className="card" style={{ padding: '12px 18px', background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                            <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--danger)', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                              <AlertTriangle size={14} /> Critic Optimization Notes (Auto-Refined)
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              {criticIssues.map((issue, idx) => (
                                <div key={idx}>• {issue}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Collapsible Strategy Panel */}
                        {strategyBrief && (
                          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <button
                              onClick={() => setStrategyExpanded(!strategyExpanded)}
                              style={{
                                width: '100%', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: 'var(--bg-inset)', border: 'none', cursor: 'pointer', textAlign: 'left'
                              }}
                            >
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span className="card-title-icon blue" style={{ width: '22px', height: '22px', fontSize: '0.75rem' }}><Layout size={12} /></span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Strategy Architect Brief</span>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>{strategyExpanded ? '▲ Hide' : '▼ View Strategy'}</span>
                            </button>

                            {strategyExpanded && (
                              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-light)', fontSize: '0.76rem' }}>
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>🎯 Hook Strategy</div>
                                  <div style={{ color: 'var(--text-muted)', background: 'var(--bg-inset)', padding: '8px', borderRadius: '4px' }}>
                                    {strategyBrief.hookStrategy}
                                  </div>
                                </div>

                                {strategyBrief.painToSolutionMap && strategyBrief.painToSolutionMap.length > 0 && (
                                  <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>🛠️ Pain to Solution Mapping</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      {strategyBrief.painToSolutionMap.map((map, idx) => (
                                        <div key={idx} style={{ padding: '8px', border: '1px solid var(--border-light)', borderRadius: '4px', background: 'var(--bg-inset)' }}>
                                          <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Pain: {map.pain}</div>
                                          {map.businessImpact && <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>Impact: {map.businessImpact}</div>}
                                          <div style={{ color: 'var(--accent-600)', marginTop: '4px', fontWeight: 500 }}>Fix: {map.proposedFix}</div>
                                          {map.evidenceToUse && <div style={{ color: 'var(--text-faint)', fontSize: '0.68rem', marginTop: '2px' }}>Proof: Weaving in "{map.evidenceToUse}"</div>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                                  {strategyBrief.differentiators && strategyBrief.differentiators.length > 0 && (
                                    <div>
                                      <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>✨ Unique Differentiators</div>
                                      <div style={{ color: 'var(--text-muted)' }}>
                                        {strategyBrief.differentiators.map((diff, idx) => <div key={idx} style={{ marginBottom: '2px' }}>• {diff}</div>)}
                                      </div>
                                    </div>
                                  )}
                                  {strategyBrief.microValue && (
                                    <div>
                                      <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>🎁 Reciprocity Micro-Value</div>
                                      <div style={{ color: 'var(--text-muted)' }}>{strategyBrief.microValue}</div>
                                    </div>
                                  )}
                                </div>

                                {strategyBrief.pricingIntelligence && (
                                  <div style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '10px' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>💰 Pricing Analysis & Reasoning</div>
                                    <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <div><strong>Market Rates:</strong> Median ${strategyBrief.pricingIntelligence.marketRate?.median} (Low: ${strategyBrief.pricingIntelligence.marketRate?.low}, High: ${strategyBrief.pricingIntelligence.marketRate?.high})</div>
                                      <div><strong>Recommended Bid:</strong> {strategyBrief.pricingIntelligence.recommendedBid}</div>
                                      <div style={{ fontStyle: 'italic', marginTop: '2px' }}>"{strategyBrief.pricingIntelligence.bidReasoning}"</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {platform.toLowerCase() === 'upwork' && result.coverLetter && (
                          <div className="preview-widget">
                            <div className="preview-widget-label">📱 Client Dashboard Preview — First 2 Lines</div>
                            <div className="preview-widget-text">{result.coverLetter.split('\n').filter(Boolean).slice(0, 2).join('\n')}</div>
                          </div>
                        )}

                        <div className="card" style={{ padding: 0 }}>
                          <div style={{ padding: '14px 18px 0' }}>
                            <div className="result-tabs">
                              <button className={`result-tab ${activeTab === 'letter' ? 'active' : ''}`} onClick={() => setActiveTab('letter')}>
                                <FileText size={13} /> Letter <span className="result-tab-count">{getWordCount(result.coverLetter)}w</span>
                              </button>
                              <button className={`result-tab ${activeTab === 'questions' ? 'active' : ''}`} onClick={() => setActiveTab('questions')}>
                                <HelpCircle size={13} /> Questions <span className="result-tab-count">{result.screeningAnswers?.length || 0}</span>
                              </button>
                              <button className={`result-tab ${activeTab === 'loom' ? 'active' : ''}`} onClick={() => setActiveTab('loom')}>
                                <Video size={13} /> Loom
                              </button>
                              <button className={`result-tab ${activeTab === 'milestones' ? 'active' : ''}`} onClick={() => setActiveTab('milestones')}>
                                <Target size={13} /> Pricing
                              </button>
                            </div>
                          </div>

                          <div style={{ padding: '18px' }}>
                            <AnimatePresence mode="wait">
                              {activeTab === 'letter' && (
                                <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                  <textarea className="proposal-editor" value={result.coverLetter} onChange={e => setResult({ ...result, coverLetter: e.target.value })} />
                                </motion.div>
                              )}
                              {activeTab === 'questions' && (
                                <motion.div key="q" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {result.screeningAnswers?.length > 0 ? result.screeningAnswers.map((item, i) => (
                                    <div key={i} className="question-card">
                                      <div className="question-label"><span className="question-number">{i + 1}</span>{item.question}</div>
                                      <textarea className="textarea-input" value={item.answer} onChange={e => {
                                        const a = [...result.screeningAnswers]; a[i].answer = e.target.value;
                                        setResult({ ...result, screeningAnswers: a });
                                      }} rows={3} />
                                    </div>
                                  )) : <div className="empty-state" style={{ padding: '28px' }}><p style={{ color: 'var(--text-muted)' }}>No screening questions detected.</p></div>}
                                </motion.div>
                              )}
                              {activeTab === 'loom' && (
                                <motion.div key="lo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                  <div className="loom-script">{result.loomScript || 'Loom script not generated.'}</div>
                                </motion.div>
                              )}
                              {activeTab === 'milestones' && (
                                <motion.div key="m" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                  <div>
                                    <div className="section-label">Milestones</div>
                                    <div className="milestone-timeline">
                                      {result.milestones?.length > 0 ? result.milestones.map((m, i) => (
                                        <div key={i} className="milestone-row">
                                          <div className="milestone-row-info">
                                            <div className="milestone-row-phase">{m.phase}</div>
                                            <div className="milestone-row-desc">{m.description}</div>
                                          </div>
                                          <div className="milestone-row-pct">{m.pricePercentage}%</div>
                                        </div>
                                      )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No milestones.</p>}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="section-label">Pricing Tiers</div>
                                    <div className="tiers-row">
                                      <div className="tier-card">
                                        <div className="tier-name">Basic</div>
                                        <div className="tier-price">{result.pricingTiers?.basic?.price || 'N/A'}</div>
                                        <div className="tier-scope">{result.pricingTiers?.basic?.scope || 'N/A'}</div>
                                      </div>
                                      <div className="tier-card featured">
                                        <div className="tier-name">Standard</div>
                                        <div className="tier-price">{result.pricingTiers?.standard?.price || 'N/A'}</div>
                                        <div className="tier-scope">{result.pricingTiers?.standard?.scope || 'N/A'}</div>
                                      </div>
                                      <div className="tier-card">
                                        <div className="tier-name">Premium</div>
                                        <div className="tier-price">{result.pricingTiers?.premium?.price || 'N/A'}</div>
                                        <div className="tier-scope">{result.pricingTiers?.premium?.scope || 'N/A'}</div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div style={{ padding: '0 18px 18px' }}>
                            <div className="action-bar">
                              <div className="action-bar-left">
                                <button className="btn btn-ghost btn-sm" onClick={() => handleCopy()}>
                                  {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={handleExport}>
                                  <Download size={13} /> Export
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={handleRegenerate} disabled={loading}>
                                  <RefreshCw size={13} /> Regenerate
                                </button>
                                {activeProposalId && (
                                  <>
                                    <button className="btn btn-ghost btn-sm" onClick={() => { setFollowUpModalOpen(true); setFollowUpText(''); }}>
                                      <History size={13} /> Follow-Up
                                    </button>
                                    {history.find(h => h.id === activeProposalId)?.status === 'Won' && (
                                      <button className="btn btn-ghost btn-sm" onClick={handleGenerateSOW} disabled={generatingSOW}>
                                        <Trophy size={13} style={{ color: 'var(--success)' }} /> SOW
                                      </button>
                                    )}
                                  </>
                                )}
                                {activeTab === 'letter' && <span className="word-count-badge">{getWordCount(result.coverLetter)} words</span>}
                              </div>
                              {activeProposalId && (
                                <div className="action-bar-right">
                                  <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateStatus(activeProposalId, 'Sent')}>
                                    <Send size={13} /> Sent
                                  </button>
                                  <button className="btn btn-success btn-sm" onClick={() => handleUpdateStatus(activeProposalId, 'Won')}>
                                    <Trophy size={13} /> Won
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="card">
                        <div className="empty-state">
                          <motion.div className="empty-state-icon" animate={{ y: [0, -5, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}>✨</motion.div>
                          <h3>Your Proposal Hub</h3>
                          <p>Paste a job posting and generate a tailored pitch package — cover letter, screening answers, Loom script, and pricing.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ════ HISTORY VIEW ════ */}
              {activeView === 'history' && (
                <motion.div key="hist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div className="stats-row" style={{ marginBottom: '20px' }}>
                    <div className="stat-card"><div className="stat-value">{stats.total}</div><div className="stat-label">Total</div></div>
                    <div className="stat-card"><div className="stat-value">{stats.sent}</div><div className="stat-label">Sent</div></div>
                    <div className="stat-card"><div className="stat-value" style={{ color: 'var(--success)' }}>{stats.won}</div><div className="stat-label">Won</div></div>
                    <div className="stat-card"><div className="stat-value" style={{ color: 'var(--accent-500)' }}>{stats.rate}%</div><div className="stat-label">Win Rate</div></div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title-group">
                        <h3 className="card-title"><span className="card-title-icon blue"><Clock size={15} /></span> History</h3>
                        <p className="card-subtitle">Click to reload, edit, or re-submit</p>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {['all', ...PLATFORMS.map(p => p.id)].map(f => (
                          <button key={f} className={`platform-chip ${historyFilter === f ? 'active' : ''}`} onClick={() => setHistoryFilter(f)} style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
                            {f === 'all' ? 'All' : f}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="history-list">
                      {filteredHistory.length > 0 ? filteredHistory.map((item, i) => (
                        <motion.div key={item.id} className="history-item" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => handleSelectHistory(item)}>
                            <div className="history-item-icon">{getPlatformIcon(item.platform)}</div>
                            <div className="history-item-info">
                              <div className="history-item-title">{item.job_title}</div>
                              <div className="history-item-meta">{item.platform} · {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                            </div>
                          </div>
                          <span className={`status-pill ${item.status?.toLowerCase()}`}>{item.status}</span>
                          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleDeleteProposal(item.id); }} style={{ padding: '4px', color: 'var(--text-faint)' }}>
                            <Trash2 size={14} />
                          </button>
                        </motion.div>
                      )) : (
                        <div className="empty-state" style={{ padding: '40px' }}>
                          <div className="empty-state-icon">📋</div>
                          <h3>No Proposals Yet</h3>
                          <p>Generate your first proposal to start tracking.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ════ OUTREACH VIEW ════ */}
              {activeView === 'outreach' && (
                <motion.div key="outreach" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="generate-layout">
                  {/* Left outreach form */}
                  <div className="generate-sidebar">
                    <div className="card">
                      <div className="card-header">
                        <div className="card-title-group">
                          <h3 className="card-title"><span className="card-title-icon green"><Send size={15} /></span> Prospect Details</h3>
                          <p className="card-subtitle">Set up target company info</p>
                        </div>
                      </div>

                      <form onSubmit={handleGenerateOutreach} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div className="form-group">
                          <label className="form-label"><User size={13} /> Contact Name</label>
                          <input type="text" className="text-input" placeholder="e.g. Sarah Chen" value={prospectName} onChange={e => setProspectName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label"><Briefcase size={13} /> Company Name</label>
                          <input type="text" className="text-input" placeholder="e.g. FinTrack" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label"><AlertTriangle size={13} /> Pain Point / Problem</label>
                          <textarea className="textarea-input" placeholder="Describe what is broken or what opportunity they're missing (e.g. their mobile app dashboard loads slowly causing users to leave negative feedback)..." value={prospectPain} onChange={e => setProspectPain(e.target.value)} required rows={4} />
                        </div>
                        <div className="form-group">
                          <label className="form-label"><BookOpen size={13} /> Relevant Case / Proof <span className="form-label-hint">(optional)</span></label>
                          <input type="text" className="text-input" placeholder="e.g. Rebuilt Next.js SaaS app and cut load times by 40%" value={outreachPortfolio} onChange={e => setOutreachPortfolio(e.target.value)} />
                        </div>
                        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={generatingOutreach}>
                          {generatingOutreach ? (
                            <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-flex' }}><Sparkles size={16} /></motion.span> Drafting...</>
                          ) : (
                            <><Sparkles size={16} /> Generate Outreach</>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Right outreach results display */}
                  <div className="generate-main">
                    {generatingOutreach ? (
                      <div className="card">
                        <div className="loading-state">
                          <div className="loading-spinner" />
                          <div className="loading-text">Drafting multi-channel cold outreach campaign...</div>
                          <div className="loading-steps">
                            <div className="loading-step"><span className="loading-step-dot" /> Formulating LinkedIn Connection Request</div>
                            <div className="loading-step"><span className="loading-step-dot" /> Drafting personalized Cold Email</div>
                            <div className="loading-step"><span className="loading-step-dot" /> Creating 3-email Follow-up Drip Sequence</div>
                          </div>
                        </div>
                      </div>
                    ) : outreachResult ? (
                      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        
                        {/* LinkedIn note */}
                        <div className="card">
                          <div className="card-header" style={{ marginBottom: '10px' }}>
                            <div className="card-title-group">
                              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span className="card-title-icon blue" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>in</span>
                                LinkedIn Connection Request note
                              </h4>
                              <p className="card-subtitle">300 character limit note to attach to invite</p>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => {
                              navigator.clipboard.writeText(outreachResult.linkedinMessage);
                              toast.success('LinkedIn note copied!');
                            }}><Copy size={13} /> Copy</button>
                          </div>
                          <div className="loom-script" style={{ fontSize: '0.82rem', padding: '12px 14px' }}>
                            {outreachResult.linkedinMessage}
                          </div>
                          <div style={{ fontSize: '0.66rem', color: 'var(--text-faint)', marginTop: '6px', textAlign: 'right' }}>
                            {outreachResult.linkedinMessage?.length || 0} / 300 characters
                          </div>
                        </div>

                        {/* Cold Email */}
                        <div className="card">
                          <div className="card-header" style={{ marginBottom: '12px' }}>
                            <div className="card-title-group">
                              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span className="card-title-icon green" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}><Send size={13} /></span>
                                Cold Email
                              </h4>
                              <p className="card-subtitle">Initial outbound cold email</p>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => {
                              const mail = `Subject: ${outreachResult.coldEmail?.subject}\n\n${outreachResult.coldEmail?.body}`;
                              navigator.clipboard.writeText(mail);
                              toast.success('Email copied!');
                            }}><Copy size={13} /> Copy Email</button>
                          </div>
                          <div style={{ background: 'var(--bg-inset)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '0.8rem', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                              <strong>Subject:</strong> {outreachResult.coldEmail?.subject}
                            </div>
                            <div style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                              {outreachResult.coldEmail?.body}
                            </div>
                          </div>
                        </div>

                        {/* Follow up Drips */}
                        {outreachResult.dripSequence && outreachResult.dripSequence.length > 0 && (
                          <div>
                            <div className="section-label" style={{ marginBottom: '12px' }}>Follow-Up Drip Sequence</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                              {outreachResult.dripSequence.map((drip, idx) => (
                                <div key={idx} className="card">
                                  <div className="card-header" style={{ marginBottom: '10px' }}>
                                    <div className="card-title-group">
                                      <h5 style={{ fontSize: '0.8rem', fontWeight: 700 }}>Drip #{idx + 1} (Day {idx === 0 ? '4' : '9'})</h5>
                                    </div>
                                    <button className="btn btn-ghost btn-sm" onClick={() => {
                                      navigator.clipboard.writeText(`Subject: ${drip.subject}\n\n${drip.body}`);
                                      toast.success(`Drip #${idx + 1} copied!`);
                                    }} style={{ padding: '2px 6px' }}><Copy size={11} /></button>
                                  </div>
                                  <div style={{ background: 'var(--bg-inset)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '0.76rem' }}>
                                    <div style={{ paddingBottom: '6px', borderBottom: '1px solid var(--border-light)', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                      <strong>Subject:</strong> {drip.subject}
                                    </div>
                                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                      {drip.body}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </motion.div>
                    ) : (
                      <div className="card">
                        <div className="empty-state">
                          <motion.div className="empty-state-icon" animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>📧</motion.div>
                          <h3>Outreach Campaign Builder</h3>
                          <p>Fill out the details of a prospect to auto-generate a multi-channel campaign: LinkedIn connection message, personalized email, and follow-up drip sequence.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ════ ANALYTICS VIEW ════ */}
              {activeView === 'analytics' && (
                <motion.div key="ana" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div className="stats-row" style={{ marginBottom: '20px' }}>
                    <div className="stat-card"><div className="stat-value">{stats.total}</div><div className="stat-label">Total</div></div>
                    <div className="stat-card"><div className="stat-value">{stats.sent}</div><div className="stat-label">Sent</div></div>
                    <div className="stat-card"><div className="stat-value" style={{ color: 'var(--success)' }}>{stats.won}</div><div className="stat-label">Won</div></div>
                    <div className="stat-card"><div className="stat-value" style={{ color: 'var(--accent-500)' }}>{stats.rate}%</div><div className="stat-label">Win Rate</div></div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                    <div className="card">
                      <div className="card-header">
                        <div className="card-title-group"><h3 className="card-title" style={{ fontSize: '0.88rem' }}><span className="card-title-icon green"><BarChart3 size={14} /></span> By Platform</h3></div>
                      </div>
                      {PLATFORMS.map(plat => {
                        const count = history.filter(h => h.platform === plat.id).length;
                        const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                        return (
                          <div key={plat.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.82rem', width: '20px', textAlign: 'center' }}>{plat.icon}</span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 500, width: '100px', color: 'var(--text-secondary)' }}>{plat.id}</span>
                            <div style={{ flex: 1, height: '5px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }}
                                style={{ height: '100%', background: 'var(--primary-500)', borderRadius: 'var(--radius-full)' }} />
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-faint)', width: '32px', textAlign: 'right' }}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="card">
                      <div className="card-header">
                        <div className="card-title-group"><h3 className="card-title" style={{ fontSize: '0.88rem' }}><span className="card-title-icon gold"><Trophy size={14} /></span> Recent Wins</h3></div>
                      </div>
                      {history.filter(h => h.status === 'Won').length > 0 ? history.filter(h => h.status === 'Won').slice(0, 5).map((item, i) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 0', borderBottom: i < 4 ? '1px solid var(--border-light)' : 'none' }}>
                          <span style={{ fontSize: '0.82rem' }}>{getPlatformIcon(item.platform)}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.job_title}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-faint)' }}>{item.platform}</div>
                          </div>
                          <span className="status-pill won">Won</span>
                        </div>
                      )) : <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No wins recorded yet.</p>}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {profileModalOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProfileModalOpen(false)}>
            <motion.div className="modal-container" initial={{ y: 16, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 16, scale: 0.97, opacity: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 24 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2><User size={18} /> Profile & Portfolio</h2>
                <button className="modal-close-btn" onClick={() => setProfileModalOpen(false)}><X size={15} /></button>
              </div>
              <div className="modal-tabs">
                <button className={`modal-tab ${modalTab === 'profile' ? 'active' : ''}`} onClick={() => setModalTab('profile')}>Profile</button>
                <button className={`modal-tab ${modalTab === 'portfolio' ? 'active' : ''}`} onClick={() => setModalTab('portfolio')}>Portfolio ({portfolios.length})</button>
                <button className={`modal-tab ${modalTab === 'case_study' ? 'active' : ''}`} onClick={() => setModalTab('case_study')}>Case Studies ({caseStudies.length})</button>
              </div>
              <div className="modal-body">
                {modalTab === 'profile' && (
                  <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="form-group"><label className="form-label">Full Name</label><input type="text" className="text-input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required /></div>
                    <div className="form-group"><label className="form-label">Headline</label><input type="text" className="text-input" value={profile.headline} onChange={e => setProfile({ ...profile, headline: e.target.value })} required /></div>
                    <div className="form-group"><label className="form-label">Hourly Rate ($)</label><input type="number" className="text-input" value={profile.base_rate} onChange={e => setProfile({ ...profile, base_rate: Number(e.target.value) })} required /></div>
                    <div className="form-group"><label className="form-label">Bio</label><textarea className="textarea-input" value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={4} required /></div>
                    <div className="form-group"><label className="form-label">Default Tone</label><select className="select-input" value={profile.tone} onChange={e => setProfile({ ...profile, tone: e.target.value })}>{TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setProfileModalOpen(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary">Save Profile</button>
                    </div>
                  </form>
                )}
                {modalTab === 'portfolio' && (
                  <div>
                    {portfolios.length > 0 && (<><div className="section-label">Existing Items</div><div className="portfolio-grid">{portfolios.map((p, i) => (<div key={i} className="portfolio-card-mini"><h5>{p.title}</h5><p>{p.description?.slice(0, 70)}...</p>{p.technologies && <div className="tech-tags">{(typeof p.technologies === 'string' ? p.technologies.split(',') : p.technologies).slice(0, 4).map((t, j) => <span key={j} className="tech-tag">{t.trim()}</span>)}</div>}</div>))}</div><div className="divider" /></>)}
                    <div className="section-label"><Plus size={11} /> Add New</div>
                    <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="form-group"><label className="form-label">Title</label><input type="text" className="text-input" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} required /></div>
                      <div className="form-group"><label className="form-label">Technologies</label><input type="text" className="text-input" placeholder="React, Next.js, PostgreSQL" value={newItem.technologies} onChange={e => setNewItem({ ...newItem, technologies: e.target.value })} required /></div>
                      <div className="form-group"><label className="form-label">Description</label><textarea className="textarea-input" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} rows={3} required /></div>
                      <div className="form-group"><label className="form-label">URL</label><input type="url" className="text-input" value={newItem.link} onChange={e => setNewItem({ ...newItem, link: e.target.value })} /></div>
                      <div className="form-group"><label className="form-label">Metric</label><input type="text" className="text-input" value={newItem.metrics} onChange={e => setNewItem({ ...newItem, metrics: e.target.value })} /></div>
                      <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}><Plus size={14} /> Add Item</button>
                    </form>
                  </div>
                )}
                {modalTab === 'case_study' && (
                  <div>
                    {caseStudies.length > 0 && (<><div className="section-label">Existing Studies</div><div className="portfolio-grid">{caseStudies.map((cs, i) => (<div key={i} className="portfolio-card-mini"><h5>{cs.title}</h5><p>{cs.problem?.slice(0, 70)}...</p></div>))}</div><div className="divider" /></>)}
                    <div className="section-label"><Plus size={11} /> Add New</div>
                    <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="form-group"><label className="form-label">Title</label><input type="text" className="text-input" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} required /></div>
                      <div className="form-group"><label className="form-label">Technologies</label><input type="text" className="text-input" value={newItem.technologies} onChange={e => setNewItem({ ...newItem, technologies: e.target.value })} required /></div>
                      <div className="form-group"><label className="form-label">Problem</label><textarea className="textarea-input" value={newItem.problem} onChange={e => setNewItem({ ...newItem, problem: e.target.value })} rows={3} required /></div>
                      <div className="form-group"><label className="form-label">Solution</label><textarea className="textarea-input" value={newItem.solution} onChange={e => setNewItem({ ...newItem, solution: e.target.value })} rows={3} required /></div>
                      <div className="form-group"><label className="form-label">Result</label><textarea className="textarea-input" value={newItem.result} onChange={e => setNewItem({ ...newItem, result: e.target.value })} rows={3} required /></div>
                      <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}><Plus size={14} /> Add Study</button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOLLOW-UP MODAL */}
      <AnimatePresence>
        {followUpModalOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFollowUpModalOpen(false)}>
            <motion.div className="modal-container" initial={{ y: 16, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 16, scale: 0.97, opacity: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 24 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2><History size={18} /> Follow-Up Builder</h2>
                <button className="modal-close-btn" onClick={() => setFollowUpModalOpen(false)}><X size={15} /></button>
              </div>
              <div style={{ display: 'flex', gap: '8px', padding: '14px 24px', background: 'var(--bg-inset)', borderBottom: '1px solid var(--border-light)', overflowX: 'auto' }}>
                <button className={`btn btn-sm ${followUpType === 'value_add' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleGenerateFollowUp('value_add')} disabled={generatingFollowUp}>
                  Day 3: Value-Add Insight
                </button>
                <button className={`btn btn-sm ${followUpType === 'breakup' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleGenerateFollowUp('breakup')} disabled={generatingFollowUp}>
                  Day 10: Breakup Letter
                </button>
                <button className={`btn btn-sm ${followUpType === 'retainer' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleGenerateFollowUp('retainer')} disabled={generatingFollowUp}>
                  Post-Delivery: Retainer Upsell
                </button>
              </div>
              <div className="modal-body" style={{ minHeight: '260px', display: 'flex', flexDirection: 'column' }}>
                {generatingFollowUp ? (
                  <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <div className="loading-spinner" style={{ width: '32px', height: '32px' }} />
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Drafting context-aware follow-up on Groq...</div>
                  </div>
                ) : followUpText ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                    <textarea
                      className="proposal-editor"
                      style={{ minHeight: '180px', flex: 1, fontSize: '0.82rem', padding: '12px' }}
                      value={followUpText}
                      onChange={e => setFollowUpText(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button className="btn btn-secondary" onClick={() => setFollowUpModalOpen(false)}>Close</button>
                      <button className="btn btn-primary" onClick={async () => {
                        await navigator.clipboard.writeText(followUpText);
                        toast.success('Follow-up copied!');
                      }}><Copy size={14} /> Copy Follow-Up</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '6px' }}>
                    <div style={{ fontSize: '1.4rem' }}>🔄</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Select a follow-up strategy above</div>
                    <p style={{ fontSize: '0.72rem', maxWidth: '280px', textAlign: 'center', marginTop: '2px' }}>
                      GigCraft will automatically build a pitch-specific follow-up message using standard rules.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOW MODAL */}
      <AnimatePresence>
        {sowModalOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSowModalOpen(false)}>
            <motion.div className="modal-container" initial={{ y: 16, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 16, scale: 0.97, opacity: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 24 }} onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
              <div className="modal-header">
                <h2><Trophy size={18} /> Scope of Work (SOW) Contract</h2>
                <button className="modal-close-btn" onClick={() => setSowModalOpen(false)}><X size={15} /></button>
              </div>
              <div className="modal-body" style={{ minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
                {generatingSOW ? (
                  <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <div className="loading-spinner" style={{ width: '32px', height: '32px' }} />
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Formulating contract on Gemini...</div>
                  </div>
                ) : sowText ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                    <textarea
                      className="proposal-editor"
                      style={{ minHeight: '280px', flex: 1, fontSize: '0.8rem', fontFamily: 'var(--font-mono)', padding: '12px', lineHeight: 1.5 }}
                      value={sowText}
                      onChange={e => setSowText(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button className="btn btn-secondary" onClick={() => setSowModalOpen(false)}>Close</button>
                      <button className="btn btn-secondary" onClick={() => {
                        const blob = new Blob([sowText], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `sow-${activeProposalId?.substring(0, 8) || 'contract'}.md`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success('Downloaded as Markdown!');
                      }}><Download size={14} /> Download</button>
                      <button className="btn btn-primary" onClick={async () => {
                        await navigator.clipboard.writeText(sowText);
                        toast.success('SOW contract copied!');
                      }}><Copy size={14} /> Copy Contract</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '0.82rem' }}>Failed to render SOW contract.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
