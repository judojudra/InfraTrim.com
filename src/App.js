import React, { useState } from 'react';
import { Upload, TrendingDown, Zap, DollarSign, Server, Database, HardDrive, CheckCircle, BarChart3, Settings, ArrowRight, Home, User, LogOut, ChevronRight, Activity, Layers, Cpu, Shield, Terminal, BarChart2, Code2, X, Play } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ===== DESIGN TOKENS =====
const t = {
  bg: { primary: '#0b0e18', secondary: '#0e1120', card: 'rgba(12,16,30,0.8)', cardHover: 'rgba(18,22,38,0.9)', glass: 'rgba(12,16,28,0.6)', glassStrong: 'rgba(10,13,24,0.97)', surface: '#111628' },
  brand: { primary: '#e2e2e2', accent: '#22c55e', accentDim: 'rgba(34,197,94,0.12)', accentBorder: 'rgba(34,197,94,0.25)', warm: '#f59e0b', warmDim: 'rgba(245,158,11,0.12)' },
  text: { primary: '#f0f1f5', secondary: '#a1a4b2', muted: '#6b6f82', dimmed: '#4a4e60', inverse: '#0b0e18' },
  border: { subtle: 'rgba(100,140,255,0.08)', medium: 'rgba(100,140,255,0.12)', strong: 'rgba(100,140,255,0.20)' },
  shadow: { card: '0 1px 2px rgba(0,0,0,0.4)', cardHover: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(100,140,255,0.12)', btn: '0 1px 3px rgba(0,0,0,0.4)', green: '0 4px 12px rgba(34,197,94,0.2)' },
  radius: { sm: '6px', md: '8px', lg: '12px', xl: '16px', full: '9999px' },
  tr: { fast: 'all 0.15s ease', normal: 'all 0.2s ease', slow: 'all 0.3s ease' },
};
const CHART_COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#a855f7', '#06b6d4'];

const API_URL = process.env.REACT_APP_API_URL || '';

// ===== LOGO COMPONENT =====
const Logo = ({ size = 'default' }) => {
  const sizes = { small: { fontSize: '0.95rem', tracking: '-0.04em' }, default: { fontSize: '1.1rem', tracking: '-0.04em' }, large: { fontSize: '1.3rem', tracking: '-0.04em' } };
  const s = sizes[size];
  return (
    <span style={{ fontSize: s.fontSize, fontWeight: '800', letterSpacing: s.tracking, color: '#f0f1f5', fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>
      infra<span style={{ color: t.brand.accent }}>trim</span>
    </span>
  );
};

// ===== IDE BANNER COMPONENT =====
const IdeBanner = ({ onDismiss }) => (
  <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(34,197,94,0.06))', border: `1px solid rgba(59,130,246,0.15)`, borderRadius: t.radius.lg, padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', animation: 'fadeInDown 0.3s ease-out 0.1s both' }}>
    <div style={{ width: '32px', height: '32px', borderRadius: t.radius.md, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Code2 size={15} color="#60a5fa" />
    </div>
    <div style={{ flex: 1 }}>
      <span style={{ fontWeight: '600', fontSize: '0.8rem', color: '#f0f1f5' }}>InfraTrim IDE & CLI</span>
      <span style={{ fontSize: '0.75rem', color: t.text.muted, marginLeft: '0.5rem' }}>Developer tools for real-time AWS cost insights — IDE extension and CLI coming soon. Available to download shortly.</span>
    </div>
    {onDismiss && <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: t.text.dimmed, cursor: 'pointer', padding: '0.25rem', flexShrink: 0 }}><X size={14} /></button>}
  </div>
);

const CloudCostOptimizer = () => {
  const [csvData, setCsvData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [screen, setScreen] = useState('landing');
  const [selectedId, setSelectedId] = useState(null);
  const [user, setUser] = useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [toast, setToast] = useState(null);
  const [showIdeBanner, setShowIdeBanner] = useState(true);

  const loadDemoData = () => {
    const demoResult = {
      total_cost: 4865.00,
      total_savings: 1410.00,
      savings_percentage: 29.0,
      total_rows: 14,
      services: { EC2: 1820, S3: 1290, RDS: 1040, Lambda: 385, CloudFront: 330 },
      recommendations: [
        { id: 1, type: 'EC2 Right-Sizing', desc: '5 oversized instances averaging <25% CPU utilization across us-east-1 and us-west-2', action: 'Downsize t3.2xlarge to t3.large, consolidate m5.xlarge workloads', icon: 'Server', save: 546.00, conf: 91, sev: 'high', count: 5, current_cost: 1820.00 },
        { id: 2, type: 'S3 Intelligent-Tiering', desc: '12TB in S3 Standard with >70% infrequent access pattern detected over 90 days', action: 'Migrate to S3 Intelligent-Tiering for automatic cost optimization', icon: 'Database', save: 387.00, conf: 94, sev: 'high', count: 8, current_cost: 1290.00 },
        { id: 3, type: 'Reserved Instance Savings', desc: 'RDS db.r5.xlarge running on-demand pricing for 11 consecutive months', action: 'Purchase 1-year All Upfront Reserved Instance for 34% savings', icon: 'DollarSign', save: 353.60, conf: 88, sev: 'med', count: 2, current_cost: 1040.00 },
        { id: 4, type: 'Unused EBS Volumes', desc: '9 unattached gp2 EBS volumes totaling 2.7TB in us-east-1', action: 'Snapshot critical data and delete unused volumes', icon: 'HardDrive', save: 123.40, conf: 97, sev: 'high', count: 9, current_cost: 123.40 },
      ],
    };
    if (!user) setUser({ name: 'demo', email: 'demo@infratrim.com' });
    setCsvData(demoResult);
    setScreen('dashboard');
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_URL}/api/analyze`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Analysis failed');
      const result = await response.json();
      setCsvData(result);
      setAnalyzing(false);
      setScreen('dashboard');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to analyze file. Make sure the backend server is running!');
      setAnalyzing(false);
    }
  };

  const handleLogin = (e) => { e.preventDefault(); setUser({ name: loginEmail.split('@')[0], email: loginEmail }); setScreen('upload'); };
  const handleLogout = () => { setUser(null); setCsvData(null); setScreen('landing'); setShowAccountMenu(false); };
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const generateTerraform = async () => {
    try {
      const response = await fetch(`${API_URL}/api/generate-terraform`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recommendations: csvData.recommendations }) });
      const result = await response.json();
      const blob = new Blob([result.terraform_script], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'optimized-infrastructure.tf'; a.click();
      showToast(`Terraform config exported — $${result.total_savings}/mo savings, ${result.optimization_count} optimizations`);
    } catch (error) { showToast('Failed to generate Terraform script', 'error'); }
  };

  const processData = () => {
    if (!csvData || !csvData.services) return null;
    return { serviceData: csvData.services, monthlyData: { '2025-09': csvData.total_cost } };
  };

  const iconMap = { 'Server': Server, 'Database': Database, 'HardDrive': HardDrive, 'DollarSign': DollarSign, 'Zap': Zap };
  const backendRecs = csvData?.recommendations?.map(rec => ({ ...rec, icon: iconMap[rec.icon] || Server, mo: rec.save / 12, act: rec.action || rec.act })) || [];
  const hardcodedRecs = [
    { id: 1, type: 'EC2 Right-Sizing', icon: Server, sev: 'high', conf: 89, save: 450, mo: 450, desc: '3 t3.2xlarge instances averaging <30% CPU utilization', act: 'Downsize to t3.large', cur: 1350, proj: 540 },
    { id: 2, type: 'S3 Optimization', icon: Database, sev: 'med', conf: 92, save: 280, mo: 280, desc: '8TB in Standard tier with infrequent access patterns', act: 'Migrate to Intelligent-Tiering', cur: 400, proj: 120 },
    { id: 3, type: 'Unused EBS Volumes', icon: HardDrive, sev: 'high', conf: 95, save: 120, mo: 120, desc: '15 unattached EBS volumes across us-east-1', act: 'Snapshot and delete', cur: 1200, proj: 0 },
    { id: 4, type: 'Reserved Instances', icon: DollarSign, sev: 'med', conf: 87, save: 360, mo: 360, desc: 'RDS instances running on-demand pricing', act: 'Purchase 1-year reserved capacity', cur: 1040, proj: 640 }
  ];
  const recs = backendRecs.length > 0 ? backendRecs : hardcodedRecs;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: t.bg.glassStrong, border: `1px solid ${t.border.medium}`, borderRadius: t.radius.md, padding: '0.6rem 0.85rem', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
        <p style={{ fontSize: '0.75rem', color: t.text.muted, marginBottom: '0.15rem' }}>{label}</p>
        {payload.map((entry, i) => (<p key={i} style={{ fontSize: '0.9rem', fontWeight: '600', color: entry.color }}>${entry.value.toFixed(2)}</p>))}
      </div>
    );
  };

  // ===== SHARED COMPONENTS =====
  const AccountMenu = () => (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setShowAccountMenu(!showAccountMenu)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${t.border.subtle}`, borderRadius: t.radius.md, color: t.text.secondary, cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500', transition: t.tr.fast }}>
        <User size={13} />{user?.name || 'Account'}
      </button>
      {showAccountMenu && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '0.4rem', background: t.bg.glassStrong, border: `1px solid ${t.border.medium}`, borderRadius: t.radius.lg, padding: '0.35rem', minWidth: '200px', zIndex: 50, boxShadow: '0 12px 40px rgba(0,0,0,0.6)', animation: 'scaleIn 0.15s ease-out' }}>
          <div style={{ padding: '0.6rem 0.75rem', borderBottom: `1px solid ${t.border.subtle}` }}>
            <div style={{ fontWeight: '600', color: 'white', fontSize: '0.85rem' }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: t.text.dimmed }}>{user?.email}</div>
          </div>
          <button onClick={() => { setCsvData(null); setScreen('upload'); setShowAccountMenu(false); }} style={{ width: '100%', textAlign: 'left', padding: '0.55rem 0.75rem', background: 'none', border: 'none', color: t.text.secondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', borderRadius: t.radius.sm, transition: t.tr.fast }}><Upload size={13} />New Analysis</button>
          <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '0.55rem 0.75rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', borderRadius: t.radius.sm, transition: t.tr.fast }}><LogOut size={13} />Sign Out</button>
        </div>
      )}
    </div>
  );

  const Toast = () => toast ? (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, background: toast.type === 'error' ? '#991b1b' : '#14532d', borderRadius: t.radius.lg, padding: '0.85rem 1.25rem', color: 'white', fontSize: '0.85rem', fontWeight: '500', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', maxWidth: '400px', animation: 'fadeInUp 0.2s ease-out', display: 'flex', alignItems: 'center', gap: '0.6rem', border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}` }}>
      <CheckCircle size={16} /><span>{toast.msg}</span>
      <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '0', marginLeft: '0.5rem', fontSize: '1rem', lineHeight: 1 }}>&times;</button>
    </div>
  ) : null;

  const Nav = () => {
    if (screen === 'landing' || screen === 'login' || screen === 'upload' || analyzing) return null;
    return (
      <div className="nav-bar" style={{ position: 'sticky', top: 0, zIndex: 100, background: t.bg.glassStrong, borderBottom: `1px solid ${t.border.subtle}`, padding: '0.6rem 1rem', marginBottom: '1.5rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setScreen('dashboard')}>
            <Logo size="default" />
          </div>
          <div className="nav-pills" style={{ display: 'flex', gap: '1px', background: 'rgba(255,255,255,0.03)', borderRadius: t.radius.md, padding: '2px', border: `1px solid ${t.border.subtle}` }}>
            {[{ id: 'dashboard', label: 'Dashboard', icon: Home }, { id: 'recommendations', label: 'Recommendations', icon: Zap }, { id: 'analysis', label: 'Analysis', icon: BarChart3 }, { id: 'ami', label: 'AMI', icon: Settings }].map(n => (
              <button key={n.id} onClick={() => { setScreen(n.id); setSelectedId(null); }} className="nav-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', background: screen === n.id ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', borderRadius: '6px', color: screen === n.id ? '#fff' : t.text.dimmed, cursor: 'pointer', fontSize: '0.8rem', fontWeight: screen === n.id ? '600' : '400', transition: t.tr.fast, whiteSpace: 'nowrap', flexShrink: 0 }}>
                <n.icon size={13} /><span className="nav-label">{n.label}</span>
              </button>
            ))}
          </div>
          <AccountMenu />
        </div>
      </div>
    );
  };

  const processed = processData();
  const totalCost = csvData?.total_cost || (processed ? Object.values(processed.serviceData).reduce((a, b) => a + b, 0) : 0);
  const totalSave = csvData?.total_savings || recs.reduce((s, r) => s + r.save, 0);

  // ===== LANDING =====
  if (screen === 'landing') {
    return (
      <div style={{ minHeight: '100vh', background: t.bg.primary, color: 'white', position: 'relative' }}>
        {/* Grid background */}
        <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(80,120,220,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(80,120,220,0.035) 1px, transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none', zIndex: 0 }} />
        {/* Azure radial glow — fading from top center */}
        <div style={{ position: 'fixed', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '100%', height: '100%', background: 'radial-gradient(ellipse at 50% 20%, rgba(30,60,140,0.18) 0%, rgba(20,50,120,0.08) 40%, transparent 75%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Navigation */}
        <nav style={{ position: 'relative', zIndex: 10, borderBottom: `1px solid ${t.border.subtle}`, padding: '0 2rem' }}>
          <div className="landing-topbar" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '56px' }}>
            <Logo size="large" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <a href="#features" style={{ color: t.text.dimmed, fontSize: '0.8rem', textDecoration: 'none', fontWeight: '500' }}>Features</a>
              <button onClick={() => setScreen('login')} style={{ padding: '0.4rem 1rem', background: 'white', border: 'none', borderRadius: t.radius.md, color: t.text.inverse, fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem', transition: t.tr.fast }}>
                Sign In
              </button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <div className="landing-hero" style={{ maxWidth: '800px', margin: '0 auto', padding: '8rem 2rem 4rem', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.85rem', background: t.brand.accentDim, border: `1px solid ${t.brand.accentBorder}`, borderRadius: t.radius.full, fontSize: '0.75rem', color: t.brand.accent, marginBottom: '1.75rem', fontWeight: '600', letterSpacing: '0.02em', animation: 'fadeInUp 0.5s ease-out' }}>
            Built for AWS
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5.5vw, 4rem)', fontWeight: '800', marginBottom: '1.25rem', lineHeight: 1.08, letterSpacing: '-0.045em', color: '#fafafa', animation: 'fadeInUp 0.5s ease-out 0.05s both' }}>
            Stop overpaying<br />for AWS infrastructure
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: t.text.muted, maxWidth: '540px', margin: '0 auto 2.5rem', lineHeight: 1.6, animation: 'fadeInUp 0.5s ease-out 0.1s both' }}>
            Upload your AWS Cost Explorer data. Our ML model analyzes every line item and tells you exactly where you're wasting money.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', animation: 'fadeInUp 0.5s ease-out 0.15s both' }}>
            <button onClick={() => setScreen('login')} style={{ padding: '0.7rem 1.75rem', fontSize: '0.9rem', background: 'white', border: 'none', borderRadius: t.radius.md, color: t.text.inverse, fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: t.tr.fast }}>
              Get Started <ArrowRight size={15} />
            </button>
            <button onClick={loadDemoData} style={{ padding: '0.7rem 1.75rem', fontSize: '0.9rem', background: 'transparent', border: `1px solid ${t.border.medium}`, borderRadius: t.radius.md, color: t.text.secondary, fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: t.tr.fast }}>
              <Play size={15} /> Try Demo
            </button>
          </div>
        </div>

        {/* Metrics strip */}
        <div style={{ borderTop: `1px solid ${t.border.subtle}`, borderBottom: `1px solid ${t.border.subtle}`, position: 'relative', zIndex: 10 }}>
          <div className="landing-stats" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', animation: 'fadeInUp 0.5s ease-out 0.25s both' }}>
            {[
              { value: 'EC2, S3, RDS', sub: 'Services Analyzed', icon: Server },
              { value: 'Random Forest', sub: 'ML Model', icon: Cpu },
              { value: 'Terraform', sub: 'IaC Export', icon: Terminal },
              { value: 'Real-time', sub: 'Cost Insights', icon: BarChart2 },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: t.radius.md, background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border.subtle}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.icon size={16} color={t.text.dimmed} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: t.text.primary, letterSpacing: '-0.01em' }}>{s.value}</div>
                  <div style={{ fontSize: '0.7rem', color: t.text.dimmed, marginTop: '0.1rem' }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div id="features" className="landing-features" style={{ maxWidth: '1200px', margin: '0 auto', padding: '5rem 2rem 6rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', position: 'relative', zIndex: 10, animation: 'fadeInUp 0.5s ease-out 0.35s both' }}>
          {[
            { icon: BarChart3, title: 'Cost Analysis', desc: 'Break down your AWS spend by service, region, and usage. Identify anomalies and cost spikes across EC2, S3, RDS, and Lambda.', tag: 'Analysis' },
            { icon: Zap, title: 'ML Recommendations', desc: 'Trained Random Forest model detects right-sizing opportunities, idle resources, and pricing inefficiencies with confidence scores.', tag: 'Intelligence' },
            { icon: Shield, title: 'Terraform Generation', desc: 'Export optimized infrastructure as Terraform configs. Apply recommendations to your AWS account with a single deployment.', tag: 'Automation' },
          ].map((f, i) => (
            <div key={i} onMouseEnter={() => setHoveredCard(`l-${i}`)} onMouseLeave={() => setHoveredCard(null)} style={{ padding: '2rem', background: hoveredCard === `l-${i}` ? 'rgba(255,255,255,0.02)' : 'transparent', border: `1px solid ${t.border.subtle}`, transition: t.tr.slow, cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <f.icon size={16} color={t.text.dimmed} />
                <span style={{ fontSize: '0.7rem', fontWeight: '600', color: t.text.dimmed, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.tag}</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.6rem', letterSpacing: '-0.02em', color: t.text.primary }}>{f.title}</h3>
              <p style={{ color: t.text.muted, lineHeight: 1.6, fontSize: '0.85rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${t.border.subtle}`, padding: '2rem', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <p style={{ fontSize: '0.75rem', color: t.text.dimmed }}>InfraTrim — AWS cost optimization powered by machine learning</p>
        </div>
      </div>
    );
  }

  // ===== LOGIN =====
  if (screen === 'login') {
    return (
      <div style={{ minHeight: '100vh', background: t.bg.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative' }}>
        <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(80,120,220,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(80,120,220,0.035) 1px, transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%', background: 'radial-gradient(ellipse at 50% 40%, rgba(30,60,140,0.15) 0%, rgba(20,50,120,0.06) 40%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '380px', width: '100%', position: 'relative', zIndex: 10 }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'fadeInDown 0.4s ease-out' }}>
            <div style={{ marginBottom: '1rem' }}><Logo size="large" /></div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>Sign in to InfraTrim</h1>
            <p style={{ color: t.text.dimmed, fontSize: '0.85rem' }}>Enter your credentials to continue</p>
          </div>
          <div className="login-card" style={{ background: t.bg.surface, borderRadius: t.radius.xl, padding: '2rem', border: `1px solid ${t.border.medium}`, animation: 'fadeInUp 0.4s ease-out 0.05s both' }}>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: t.text.muted, fontWeight: '500' }}>Email</label>
                <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@company.com" required style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: t.radius.md, background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border.medium}`, color: 'white', fontSize: '0.85rem', transition: t.tr.fast }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: t.text.muted, fontWeight: '500' }}>Password</label>
                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" required style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: t.radius.md, background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border.medium}`, color: 'white', fontSize: '0.85rem', transition: t.tr.fast }} />
              </div>
              <button type="submit" style={{ width: '100%', padding: '0.7rem', background: 'white', border: 'none', borderRadius: t.radius.md, color: t.text.inverse, fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', transition: t.tr.fast }}>Continue</button>
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button type="button" onClick={() => setScreen('landing')} style={{ background: 'none', border: 'none', color: t.text.dimmed, cursor: 'pointer', fontSize: '0.8rem' }}>← Back</button>
              </div>
            </form>
          </div>
          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: t.text.dimmed }}>Demo — any email and password works</p>
        </div>
      </div>
    );
  }

  // ===== UPLOAD =====
  if (screen === 'upload') {
    return (
      <div style={{ minHeight: '100vh', background: t.bg.primary, color: 'white', padding: '2rem' }}>
        <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(80,120,220,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(80,120,220,0.035) 1px, transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%', background: 'radial-gradient(ellipse at 50% 30%, rgba(30,60,140,0.15) 0%, rgba(20,50,120,0.06) 40%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem', animation: 'fadeInDown 0.3s ease-out' }}>
            <Logo size="default" />
            <AccountMenu />
          </div>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem', animation: 'fadeInUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: '800', marginBottom: '0.6rem', letterSpacing: '-0.03em' }}>Upload AWS Cost Data</h1>
            <p style={{ fontSize: '1rem', color: t.text.muted }}>CSV export from AWS Cost Explorer</p>
          </div>
          {!analyzing ? (
            <div className="upload-zone" onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files[0]) handleUpload({ target: { files: e.dataTransfer.files } }); }}
              style={{ background: isDragOver ? 'rgba(34,197,94,0.04)' : t.bg.surface, borderRadius: t.radius.xl, padding: '4rem 2rem', border: isDragOver ? `1px dashed ${t.brand.accentBorder}` : `1px dashed ${t.border.medium}`, transition: t.tr.normal, maxWidth: '560px', margin: '0 auto', animation: 'fadeInUp 0.4s ease-out 0.1s both' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', width: '48px', height: '48px', borderRadius: t.radius.lg, background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border.subtle}`, alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Upload size={20} color={t.text.dimmed} />
                </div>
                <h2 className="upload-heading" style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.4rem' }}>Drop your CSV here</h2>
                <p style={{ fontSize: '0.8rem', color: t.text.dimmed, marginBottom: '1.75rem' }}>or select a file to upload</p>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <label style={{ cursor: 'pointer' }}>
                    <input type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
                    <div style={{ background: 'white', padding: '0.6rem 1.5rem', borderRadius: t.radius.md, fontWeight: '600', fontSize: '0.85rem', color: t.text.inverse, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: t.tr.fast }}>
                      <Upload size={14} />Select File
                    </div>
                  </label>
                  <button onClick={loadDemoData} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: t.text.muted, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500' }}>
                    <Play size={14} />Try with demo data instead
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 0', animation: 'fadeIn 0.3s ease-out', maxWidth: '360px', margin: '0 auto' }}>
              <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: t.brand.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '1.25rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Analyzing cost data...</h3>
              <p style={{ color: t.text.dimmed, marginTop: '0.35rem', fontSize: '0.85rem' }}>Running Random Forest model</p>
              <div style={{ maxWidth: '200px', margin: '1.25rem auto 0', height: '2px', borderRadius: '1px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '1px', background: t.brand.accent, animation: 'progressBar 2.5s ease-in-out infinite' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== DASHBOARD =====
  if (screen === 'dashboard') {
    return (
      <div style={{ minHeight: '100vh', background: t.bg.primary, color: 'white', position: 'relative' }}>
        <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: '100%', background: 'radial-gradient(ellipse at 50% 0%, rgba(30,60,140,0.14) 0%, rgba(20,50,120,0.05) 40%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <Nav /><Toast />
        <div className="dash-content" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
          {showIdeBanner && <IdeBanner onDismiss={() => setShowIdeBanner(false)} />}
          {csvData?.recommendations && (
            <div style={{ background: t.brand.accentDim, border: `1px solid ${t.brand.accentBorder}`, borderRadius: t.radius.lg, padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', animation: 'fadeInDown 0.3s ease-out' }}>
              <CheckCircle size={16} color={t.brand.accent} />
              <div>
                <span style={{ fontWeight: '600', fontSize: '0.8rem' }}>Analysis complete</span>
                <span style={{ fontSize: '0.75rem', color: t.text.muted, marginLeft: '0.5rem' }}>{csvData.total_rows} rows processed</span>
              </div>
            </div>
          )}
          {/* Metric cards */}
          <div className="metric-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {[
              { label: 'Monthly Spend', value: `$${totalCost.toFixed(2)}`, icon: DollarSign, color: t.text.primary },
              { label: 'Potential Savings', value: `$${totalSave.toFixed(2)}`, icon: TrendingDown, color: t.brand.accent, trend: totalCost > 0 ? `-${((totalSave / totalCost) * 100).toFixed(0)}%` : null },
              { label: 'Recommendations', value: recs.length, icon: Zap, color: t.brand.warm },
            ].map((m, i) => (
              <div key={i} onMouseEnter={() => setHoveredCard(`m-${i}`)} onMouseLeave={() => setHoveredCard(null)} style={{ background: t.bg.surface, borderRadius: t.radius.lg, padding: '1.25rem', border: `1px solid ${hoveredCard === `m-${i}` ? t.border.strong : t.border.subtle}`, transition: t.tr.normal, animation: `fadeInUp 0.3s ease-out ${i * 0.05}s both` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ color: t.text.dimmed, fontSize: '0.8rem', fontWeight: '500' }}>{m.label}</span>
                  <m.icon size={16} color={t.text.dimmed} />
                </div>
                <div className="metric-value" style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.03em', color: m.color }}>{m.value}</div>
                {m.trend && <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: t.brand.accent, fontWeight: '600' }}>{m.trend} from current spend</div>}
              </div>
            ))}
          </div>
          {/* Terraform */}
          <div style={{ marginBottom: '2rem', animation: 'fadeInUp 0.3s ease-out 0.15s both' }}>
            <button onClick={generateTerraform} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', fontSize: '0.85rem', background: t.brand.accent, border: 'none', borderRadius: t.radius.md, color: '#052e16', fontWeight: '600', cursor: 'pointer', boxShadow: t.shadow.green, width: '100%', justifyContent: 'center', transition: t.tr.fast }}>
              <Terminal size={16} />Export Terraform Config
            </button>
          </div>
          {/* Action cards */}
          <div className="action-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {[{ title: 'Recommendations', sub: `${recs.length} items found`, sc: 'recommendations', icon: Zap },
              { title: 'Cost Analysis', sub: 'Charts & breakdown', sc: 'analysis', icon: BarChart3 },
              { title: 'AMI Generator', sub: 'Optimized configs', sc: 'ami', icon: Settings }
            ].map((a, i) => (
              <button key={i} onClick={() => setScreen(a.sc)} onMouseEnter={() => setHoveredCard(`a-${i}`)} onMouseLeave={() => setHoveredCard(null)} style={{ background: t.bg.surface, borderRadius: t.radius.lg, padding: '1.25rem', border: `1px solid ${hoveredCard === `a-${i}` ? t.border.strong : t.border.subtle}`, cursor: 'pointer', color: 'white', textAlign: 'left', transition: t.tr.normal, animation: `fadeInUp 0.3s ease-out ${0.2 + i * 0.05}s both` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', alignItems: 'center' }}>
                  <a.icon size={18} color={t.text.dimmed} />
                  <ArrowRight size={14} color={t.text.dimmed} style={{ transition: t.tr.fast, transform: hoveredCard === `a-${i}` ? 'translateX(3px)' : 'none', opacity: hoveredCard === `a-${i}` ? 1 : 0.4 }} />
                </div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.15rem' }}>{a.title}</h3>
                <p style={{ fontSize: '0.75rem', color: t.text.dimmed }}>{a.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== RECOMMENDATIONS =====
  if (screen === 'recommendations') {
    if (selectedId) {
      const r = recs.find(x => x.id === selectedId);
      const Icon = r.icon;
      return (
        <div style={{ minHeight: '100vh', background: t.bg.primary, color: 'white', position: 'relative' }}>
          <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: '100%', background: 'radial-gradient(ellipse at 50% 0%, rgba(30,60,140,0.14) 0%, rgba(20,50,120,0.05) 40%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
          <Nav />
          <div className="page-content" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem 2rem', animation: 'fadeIn 0.3s ease-out' }}>
            <button onClick={() => setSelectedId(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', color: t.text.dimmed, cursor: 'pointer', marginBottom: '1.25rem', fontSize: '0.8rem' }}>← Back</button>
            <div style={{ background: t.bg.surface, borderRadius: t.radius.xl, padding: '2rem', border: `1px solid ${t.border.subtle}` }}>
              <div className="rec-detail-header" style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem', alignItems: 'start' }}>
                <div style={{ padding: '0.75rem', borderRadius: t.radius.lg, background: r.sev === 'high' ? 'rgba(239,68,68,0.1)' : t.brand.warmDim, border: `1px solid ${r.sev === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                  <Icon size={28} color={r.sev === 'high' ? '#ef4444' : '#f59e0b'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.02em' }}>{r.type}</h1>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: t.radius.full, fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', background: r.sev === 'high' ? 'rgba(239,68,68,0.1)' : t.brand.warmDim, color: r.sev === 'high' ? '#ef4444' : '#f59e0b' }}>{r.sev}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: t.text.muted, marginBottom: '0.75rem' }}>{r.desc}</p>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: t.brand.accent, letterSpacing: '-0.02em' }}>${r.save.toFixed(2)}<span style={{ fontSize: '0.85rem', color: t.text.dimmed, fontWeight: '400', marginLeft: '0.25rem' }}>/mo</span></div>
                  {r.conf && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem' }}><div style={{ width: '60px', height: '2px', borderRadius: '1px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}><div style={{ width: `${r.conf}%`, height: '100%', borderRadius: '1px', background: t.brand.accent }} /></div><span style={{ fontSize: '0.7rem', color: t.text.dimmed }}>{r.conf}%</span></div>}
                </div>
              </div>
              <div style={{ padding: '1.25rem', background: t.brand.accentDim, borderRadius: t.radius.lg, border: `1px solid ${t.brand.accentBorder}`, marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <CheckCircle size={14} color={t.brand.accent} />
                  <h3 style={{ fontSize: '0.85rem', fontWeight: '600' }}>Action Required</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: t.text.secondary }}>{r.act || r.action || 'Optimize these resources to reduce costs'}</p>
                {r.count && <p style={{ fontSize: '0.8rem', color: t.text.dimmed, marginTop: '0.3rem' }}>Affects {r.count} resources</p>}
              </div>
              {(r.cur !== undefined || r.current_cost !== undefined) && (
                <div className="rec-cost-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: t.radius.lg, border: `1px solid ${t.border.subtle}` }}>
                    <div style={{ fontSize: '0.75rem', color: t.text.dimmed, marginBottom: '0.2rem' }}>Current</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.02em' }}>${(r.cur || r.current_cost || 0).toFixed(2)}/mo</div>
                  </div>
                  {r.proj !== undefined && (
                    <div style={{ padding: '1.25rem', background: t.brand.accentDim, borderRadius: t.radius.lg, border: `1px solid ${t.brand.accentBorder}` }}>
                      <div style={{ fontSize: '0.75rem', color: t.text.dimmed, marginBottom: '0.2rem' }}>Projected</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '700', color: t.brand.accent, letterSpacing: '-0.02em' }}>${r.proj.toFixed(2)}/mo</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div style={{ minHeight: '100vh', background: t.bg.primary, color: 'white', position: 'relative' }}>
        <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: '100%', background: 'radial-gradient(ellipse at 50% 0%, rgba(30,60,140,0.14) 0%, rgba(20,50,120,0.05) 40%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <Nav />
        <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.25rem', letterSpacing: '-0.02em', animation: 'fadeInUp 0.3s ease-out' }}>Recommendations</h1>
          {recs.map((r, i) => {
            const Icon = r.icon;
            return (
              <button key={r.id} onClick={() => setSelectedId(r.id)} onMouseEnter={() => setHoveredCard(`r-${r.id}`)} onMouseLeave={() => setHoveredCard(null)} style={{ width: '100%', background: hoveredCard === `r-${r.id}` ? 'rgba(255,255,255,0.02)' : t.bg.surface, borderRadius: t.radius.lg, padding: '1rem 1.25rem', border: `1px solid ${hoveredCard === `r-${r.id}` ? t.border.strong : t.border.subtle}`, cursor: 'pointer', color: 'white', textAlign: 'left', marginBottom: '0.5rem', transition: t.tr.normal, animation: `fadeInUp 0.3s ease-out ${i * 0.04}s both` }}>
                <div className="rec-card-inner" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ padding: '0.5rem', borderRadius: t.radius.md, background: r.sev === 'high' ? 'rgba(239,68,68,0.1)' : t.brand.warmDim, flexShrink: 0 }}>
                    <Icon size={20} color={r.sev === 'high' ? '#ef4444' : '#f59e0b'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: '600' }}>{r.type}</h3>
                        <span style={{ padding: '0.1rem 0.4rem', borderRadius: t.radius.full, fontSize: '0.6rem', fontWeight: '600', textTransform: 'uppercase', background: r.sev === 'high' ? 'rgba(239,68,68,0.1)' : t.brand.warmDim, color: r.sev === 'high' ? '#ef4444' : '#f59e0b' }}>{r.sev}</span>
                      </div>
                      <div className="rec-card-right" style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: '700', color: t.brand.accent }}>${r.save.toFixed(2)}</span>
                        {r.conf && <span style={{ fontSize: '0.65rem', color: t.text.dimmed, marginLeft: '0.4rem' }}>{r.conf}%</span>}
                      </div>
                    </div>
                    <p style={{ color: t.text.dimmed, fontSize: '0.8rem' }}>{r.desc}</p>
                  </div>
                  <ChevronRight className="rec-chevron" size={16} color={t.text.dimmed} style={{ flexShrink: 0, opacity: hoveredCard === `r-${r.id}` ? 0.8 : 0.3, transition: t.tr.fast }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== ANALYSIS =====
  if (screen === 'analysis') {
    const svcData = processed ? Object.entries(processed.serviceData).map(([name, cost]) => ({ name, cost })) : [];
    const moData = processed ? Object.entries(processed.monthlyData).sort().map(([month, cost]) => ({ month, cost })) : [];
    return (
      <div style={{ minHeight: '100vh', background: t.bg.primary, color: 'white', position: 'relative' }}>
        <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: '100%', background: 'radial-gradient(ellipse at 50% 0%, rgba(30,60,140,0.14) 0%, rgba(20,50,120,0.05) 40%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <Nav />
        <div className="page-content" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.25rem', letterSpacing: '-0.02em', animation: 'fadeInUp 0.3s ease-out' }}>Cost Analysis</h1>
          <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
            <div style={{ background: t.bg.surface, borderRadius: t.radius.lg, padding: '1.25rem', border: `1px solid ${t.border.subtle}`, animation: 'fadeInUp 0.3s ease-out 0.05s both' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem' }}>Cost by Service</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={svcData} dataKey="cost" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2} strokeWidth={0} label={(e) => `${e.name}: $${e.cost.toFixed(0)}`}>
                    {svcData.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: t.bg.surface, borderRadius: t.radius.lg, padding: '1.25rem', border: `1px solid ${t.border.subtle}`, animation: 'fadeInUp 0.3s ease-out 0.1s both' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem' }}>Monthly Trend</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={moData}>
                  <defs>
                    <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" stroke={t.text.dimmed} tick={{ fontSize: 11, fill: t.text.dimmed }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                  <YAxis stroke={t.text.dimmed} tick={{ fontSize: 11, fill: t.text.dimmed }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cost" stroke="#22c55e" strokeWidth={2} fill="url(#costGradient)" dot={{ fill: '#22c55e', r: 4, strokeWidth: 2, stroke: t.bg.primary }} activeDot={{ r: 6, stroke: '#4ade80', strokeWidth: 2, fill: '#22c55e' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== AMI =====
  if (screen === 'ami') {
    return (
      <div style={{ minHeight: '100vh', background: t.bg.primary, color: 'white', position: 'relative' }}>
        <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: '100%', background: 'radial-gradient(ellipse at 50% 0%, rgba(30,60,140,0.14) 0%, rgba(20,50,120,0.05) 40%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <Nav /><Toast />
        <div className="page-content" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.25rem', letterSpacing: '-0.02em', animation: 'fadeInUp 0.3s ease-out' }}>AMI Configuration</h1>
          <div style={{ background: t.bg.surface, borderRadius: t.radius.xl, padding: '1.75rem', border: `1px solid ${t.border.subtle}`, animation: 'fadeInUp 0.3s ease-out 0.05s both' }}>
            <div className="ami-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem' }}>Recommended Specs</h3>
                {[['Instance Type', 't3.large', Cpu], ['CPU', '2 vCPUs', Activity], ['Memory', '8 GB', Layers], ['Storage', 'gp3 100GB', HardDrive], ['Network', '5 Gbps', Zap], ['Est. Cost', '$180/mo', DollarSign]].map(([k, v, Icon], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0', borderBottom: i < 5 ? `1px solid ${t.border.subtle}` : 'none', animation: `fadeInUp 0.3s ease-out ${i * 0.04}s both` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Icon size={13} color={t.text.dimmed} />
                      <span style={{ color: t.text.muted, fontSize: '0.8rem' }}>{k}</span>
                    </div>
                    <span style={{ fontWeight: '600', color: k === 'Est. Cost' ? t.brand.accent : t.text.primary, fontSize: '0.85rem' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: t.radius.lg, padding: '1.25rem', marginBottom: '1rem', border: `1px solid ${t.border.subtle}`, animation: 'fadeInUp 0.3s ease-out 0.25s both' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '0.35rem', fontSize: '0.85rem' }}>Model Reasoning</h4>
                  <p style={{ color: t.text.dimmed, fontSize: '0.8rem', lineHeight: 1.55 }}>Based on observed CPU utilization (40-60%), memory-light workloads, and cost-optimization priority, t3.large provides the best price-performance ratio.</p>
                </div>
                <button onClick={generateTerraform} style={{ width: '100%', background: t.brand.accent, padding: '0.7rem', borderRadius: t.radius.md, fontWeight: '600', border: 'none', color: '#052e16', cursor: 'pointer', fontSize: '0.85rem', boxShadow: t.shadow.green, transition: t.tr.fast, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', animation: 'fadeInUp 0.3s ease-out 0.3s both' }}>
                  <Terminal size={14} />Export Terraform
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CloudCostOptimizer;
