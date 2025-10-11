import React, { useState } from 'react';
import { Upload, Cloud, TrendingDown, Zap, DollarSign, Server, Database, HardDrive, CheckCircle, Download, BarChart3, Settings, ArrowRight, Home, User, LogOut } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CloudCostOptimizer = () => {
  const [csvData, setCsvData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [screen, setScreen] = useState('landing');
  const [selectedId, setSelectedId] = useState(null);
  const [user, setUser] = useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const generateCSV = () => {
    const csv = `Service,Region,Cost,Date
EC2,us-east-1,450.00,2025-09
S3,us-east-1,850.00,2025-09
RDS,us-east-1,520.00,2025-09
Lambda,us-east-1,45.00,2025-09
EC2,us-east-1,420.00,2025-08
S3,us-east-1,780.00,2025-08`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-aws-costs.csv';
    a.click();
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAnalyzing(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((h, idx) => {
              row[h.trim()] = values[idx]?.trim();
            });
            data.push(row);
          }
        }
        setTimeout(() => {
          setCsvData(data);
          setAnalyzing(false);
          setScreen('dashboard');
        }, 2000);
      };
      reader.readAsText(file);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setUser({ name: loginEmail.split('@')[0], email: loginEmail });
    setScreen('upload');
  };

  const handleLogout = () => {
    setUser(null);
    setCsvData(null);
    setScreen('landing');
    setShowAccountMenu(false);
  };

  const processData = () => {
    if (!csvData) return null;
    const serviceData = {};
    const monthlyData = {};
    csvData.forEach(row => {
      const service = row.Service || row.service;
      const cost = parseFloat(row.Cost || row.cost || 0);
      const date = row.Date || row.date || '2025-09';
      if (!serviceData[service]) serviceData[service] = 0;
      serviceData[service] += cost;
      if (!monthlyData[date]) monthlyData[date] = 0;
      monthlyData[date] += cost;
    });
    return { serviceData, monthlyData };
  };

  const recs = [
    { id: 1, type: 'EC2 Right-Sizing', icon: Server, sev: 'high', conf: 89, save: 5400, mo: 450, desc: '3 t3.2xlarge with <30% CPU', act: 'Downsize to t3.large', cur: 1350, proj: 540 },
    { id: 2, type: 'S3 Optimization', icon: Database, sev: 'med', conf: 92, save: 2800, mo: 233, desc: '8TB Standard storage', act: 'Use Intelligent-Tiering', cur: 400, proj: 120 },
    { id: 3, type: 'Unused EBS', icon: HardDrive, sev: 'high', conf: 95, save: 1200, mo: 100, desc: '15 unattached volumes', act: 'Delete after backup', cur: 1200, proj: 0 },
    { id: 4, type: 'Reserved Instances', icon: DollarSign, sev: 'med', conf: 87, save: 3600, mo: 300, desc: 'RDS on on-demand', act: 'Buy 1-year RI', cur: 1040, proj: 640 }
  ];
  const AccountMenu = () => (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setShowAccountMenu(!showAccountMenu)} style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
        background: 'rgba(139,92,246,0.2)', border: '1px solid #8b5cf6',
        borderRadius: '0.5rem', color: 'white', cursor: 'pointer'
      }}>
        <User size={16} />
        {user?.name || 'Account'}
      </button>
      {showAccountMenu && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: '0.5rem',
          background: 'rgba(30,41,59,0.95)', border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: '0.5rem', padding: '0.5rem', minWidth: '200px', zIndex: 50
        }}>
          <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(139,92,246,0.2)' }}>
            <div style={{ fontWeight: '600', color: 'white' }}>{user?.name}</div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{user?.email}</div>
          </div>
          <button onClick={() => { setCsvData(null); setScreen('upload'); setShowAccountMenu(false); }} style={{
            width: '100%', textAlign: 'left', padding: '0.75rem', background: 'none',
            border: 'none', color: 'white', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem'
          }}>
            <Upload size={16} />
            New Upload
          </button>
          <button onClick={handleLogout} style={{
            width: '100%', textAlign: 'left', padding: '0.75rem', background: 'none',
            border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem'
          }}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );

  const Nav = () => {
    if (screen === 'landing' || screen === 'login' || screen === 'upload' || analyzing) return null;
    return (
      <div style={{ background: 'rgba(30,41,59,0.8)', borderBottom: '1px solid rgba(139,92,246,0.2)', padding: '1rem 2rem', marginBottom: '2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Cloud size={32} color="#c084fc" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>Cloud Cost Optimizer</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'recommendations', label: 'Recommendations', icon: Zap },
              { id: 'analysis', label: 'Analysis', icon: BarChart3 },
              { id: 'ami', label: 'AMI', icon: Settings }
            ].map(n => (
              <button key={n.id} onClick={() => { setScreen(n.id); setSelectedId(null); }} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
                background: screen === n.id ? 'rgba(139,92,246,0.3)' : 'transparent',
                border: '1px solid ' + (screen === n.id ? '#8b5cf6' : 'transparent'),
                borderRadius: '0.5rem', color: 'white', cursor: 'pointer', fontSize: '0.875rem'
              }}>
                <n.icon size={16} />
                {n.label}
              </button>
            ))}
          </div>
          <AccountMenu />
        </div>
      </div>
    );
  };

  const processed = processData();
  const totalCost = processed ? Object.values(processed.serviceData).reduce((a, b) => a + b, 0) : 0;
  const totalSave = recs.reduce((s, r) => s + r.save, 0);
  // LANDING PAGE
  if (screen === 'landing') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)', color: 'white' }}>
        <div style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Cloud size={40} color="#c084fc" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Cloud Cost Optimizer</h1>
          </div>
          <button onClick={() => setScreen('login')} style={{
            padding: '0.75rem 1.5rem', background: 'linear-gradient(to right, #9333ea, #db2777)',
            border: 'none', borderRadius: '0.5rem', color: 'white', fontWeight: '600', cursor: 'pointer'
          }}>
            Get Started
          </button>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '4rem', fontWeight: 'bold', marginBottom: '1.5rem',
            background: 'linear-gradient(to right, #c084fc, #f9a8d4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Optimize Your Cloud Costs with AI
          </h1>
          <p style={{ fontSize: '1.5rem', color: '#d1d5db', maxWidth: '800px', margin: '0 auto 3rem' }}>
            ML-powered analysis identifies waste and helps you save up to 40% on AWS costs
          </p>

          <button onClick={() => setScreen('login')} style={{
            padding: '1rem 2.5rem', fontSize: '1.25rem', background: 'linear-gradient(to right, #9333ea, #db2777)',
            border: 'none', borderRadius: '0.75rem', color: 'white', fontWeight: '600',
            cursor: 'pointer', marginBottom: '4rem', boxShadow: '0 10px 30px rgba(147,51,234,0.3)'
          }}>
            Start Optimizing Now
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              { icon: Zap, title: 'ML-Powered Analysis', desc: 'Advanced algorithms detect usage patterns and optimization opportunities' },
              { icon: TrendingDown, title: 'Save Up to 40%', desc: 'Identify unused resources, right-size instances, and optimize storage' },
              { icon: Server, title: 'Smart Recommendations', desc: 'Get actionable insights with confidence scores and projected savings' }
            ].map((f, i) => (
              <div key={i} style={{
                padding: '2rem', background: 'rgba(30,41,59,0.5)', backdropFilter: 'blur(16px)',
                borderRadius: '1rem', border: '1px solid rgba(139,92,246,0.2)'
              }}>
                <f.icon size={48} color="#c084fc" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>{f.title}</h3>
                <p style={{ color: '#9ca3af' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // LOGIN PAGE
  if (screen === 'login') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '450px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Cloud size={64} color="#c084fc" style={{ margin: '0 auto 1rem' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Welcome Back</h1>
            <p style={{ color: '#9ca3af' }}>Sign in to access your dashboard</p>
          </div>

          <div style={{
            background: 'rgba(30,41,59,0.5)', backdropFilter: 'blur(16px)',
            borderRadius: '1rem', padding: '2rem', border: '1px solid rgba(139,92,246,0.2)'
          }}>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                    background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(139,92,246,0.3)',
                    color: 'white', fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                    background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(139,92,246,0.3)',
                    color: 'white', fontSize: '1rem'
                  }}
                />
              </div>

              <button type="submit" style={{
                width: '100%', padding: '0.75rem', background: 'linear-gradient(to right, #9333ea, #db2777)',
                border: 'none', borderRadius: '0.5rem', color: 'white', fontWeight: '600',
                fontSize: '1rem', cursor: 'pointer', marginBottom: '1rem'
              }}>
                Sign In
              </button>

              <div style={{ textAlign: 'center' }}>
                <button type="button" onClick={() => setScreen('landing')} style={{
                  background: 'none', border: 'none', color: '#c084fc',
                  cursor: 'pointer', fontSize: '0.875rem'
                }}>
                  ← Back to home
                </button>
              </div>
            </form>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>
            <p>Demo: Use any email/password to login</p>
          </div>
        </div>
      </div>
    );
  }
  // UPLOAD PAGE
  if (screen === 'upload') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)', color: 'white', padding: '2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Cloud size={40} color="#c084fc" />
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Cloud Cost Optimizer</h1>
            </div>
            <AccountMenu />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{
              fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem',
              background: 'linear-gradient(to right, #c084fc, #f9a8d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              Upload Your Cost Data
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#d1d5db' }}>Get instant ML-powered optimization insights</p>
          </div>

          <div style={{
            background: 'rgba(30,41,59,0.5)', backdropFilter: 'blur(16px)',
            borderRadius: '1rem', padding: '3rem', border: '1px solid rgba(139,92,246,0.2)'
          }}>
            {!analyzing ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <Upload size={80} color="#c084fc" style={{ margin: '0 auto 1rem' }} />
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Upload AWS Cost CSV</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ cursor: 'pointer' }}>
                    <input type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
                    <div style={{
                      background: 'linear-gradient(to right, #9333ea, #db2777)',
                      padding: '1rem 2rem', borderRadius: '0.75rem', fontWeight: '600', fontSize: '1.125rem'
                    }}>
                      Select CSV File
                    </div>
                  </label>
                  <div style={{ color: '#6b7280' }}>or</div>
                  <button onClick={generateCSV} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem'
                  }}>
                    <Download size={20} />Download Sample CSV
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div style={{
                  display: 'inline-block', width: '64px', height: '64px', border: '4px solid transparent',
                  borderTopColor: '#8b5cf6', borderBottomColor: '#8b5cf6',
                  borderRadius: '50%', animation: 'spin 1s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '1rem' }}>Analyzing...</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD
  if (screen === 'dashboard') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)', color: 'white' }}>
        <Nav />
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ background: 'linear-gradient(to bottom right, rgba(147,51,234,0.2), rgba(88,28,135,0.2))', backdropFilter: 'blur(16px)', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid rgba(139,92,246,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#9ca3af' }}>Total Cost</span>
                <DollarSign size={24} color="#c084fc" />
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 'bold' }}>${totalCost.toFixed(2)}</div>
            </div>
            <div style={{ background: 'linear-gradient(to bottom right, rgba(5,150,105,0.2), rgba(4,120,87,0.2))', backdropFilter: 'blur(16px)', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#9ca3af' }}>Potential Savings</span>
                <TrendingDown size={24} color="#34d399" />
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#34d399' }}>${totalSave.toFixed(2)}</div>
            </div>
            <div style={{ background: 'linear-gradient(to bottom right, rgba(37,99,235,0.2), rgba(29,78,216,0.2))', backdropFilter: 'blur(16px)', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid rgba(59,130,246,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#9ca3af' }}>Recommendations</span>
                <Zap size={24} color="#60a5fa" />
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 'bold' }}>{recs.length}</div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {[
              { title: 'View Recommendations', sc: 'recommendations', icon: Zap, color: '#fbbf24' },
              { title: 'Cost Analysis', sc: 'analysis', icon: BarChart3, color: '#60a5fa' },
              { title: 'AMI Generator', sc: 'ami', icon: Settings, color: '#34d399' }
            ].map((a, i) => (
              <button key={i} onClick={() => setScreen(a.sc)} style={{ background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer', color: 'white', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <a.icon size={32} color={a.color} />
                  <ArrowRight size={20} color="#9ca3af" />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>{a.title}</h3>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  // RECOMMENDATIONS
  if (screen === 'recommendations') {
    if (selectedId) {
      const r = recs.find(x => x.id === selectedId);
      const Icon = r.icon;
      return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)', color: 'white' }}>
          <Nav />
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
            <button onClick={() => setSelectedId(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#c084fc', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '1rem' }}>← Back</button>
            <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: '1rem', padding: '2rem', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', alignItems: 'start' }}>
                <div style={{ padding: '1rem', borderRadius: '0.75rem', background: r.sev === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)' }}>
                  <Icon size={40} color={r.sev === 'high' ? '#f87171' : '#fbbf24'} />
                </div>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{r.type}</h1>
                  <p style={{ fontSize: '1.125rem', color: '#d1d5db', marginBottom: '1rem' }}>{r.desc}</p>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#34d399' }}>${r.save} annual</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1.5rem', background: 'rgba(51,65,85,0.3)', borderRadius: '0.75rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Current</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${r.cur}/mo</div>
                </div>
                <div style={{ padding: '1.5rem', background: 'rgba(51,65,85,0.3)', borderRadius: '0.75rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Projected</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#34d399' }}>${r.proj}/mo</div>
                </div>
              </div>
              <div style={{ padding: '1.5rem', background: 'rgba(16,185,129,0.1)', borderRadius: '0.75rem', border: '1px solid rgba(16,185,129,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <CheckCircle size={20} color="#34d399" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Recommended Action</h3>
                </div>
                <p>{r.act}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)', color: 'white' }}>
        <Nav />
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Recommendations</h1>
          {recs.map(r => {
            const Icon = r.icon;
            return (
              <button key={r.id} onClick={() => setSelectedId(r.id)} style={{ width: '100%', background: 'rgba(30,41,59,0.5)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer', color: 'white', textAlign: 'left', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: r.sev === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)' }}>
                    <Icon size={32} color={r.sev === 'high' ? '#f87171' : '#fbbf24'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{r.type}</h3>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34d399' }}>${r.save}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{r.conf}% confidence</div>
                      </div>
                    </div>
                    <p style={{ color: '#d1d5db' }}>{r.desc}</p>
                  </div>
                  <ArrowRight size={20} color="#9ca3af" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ANALYSIS
  if (screen === 'analysis') {
    const svcData = Object.entries(processed.serviceData).map(([name, cost]) => ({ name, cost }));
    const moData = Object.entries(processed.monthlyData).sort().map(([month, cost]) => ({ month, cost }));
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)', color: 'white' }}>
        <Nav />
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Cost Analysis</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid rgba(139,92,246,0.2)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Cost by Service</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={svcData} dataKey="cost" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e) => `${e.name}: $${e.cost.toFixed(0)}`}>
                    {svcData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #8b5cf6' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid rgba(139,92,246,0.2)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Monthly Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={moData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #8b5cf6' }} />
                  <Line type="monotone" dataKey="cost" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AMI
  if (screen === 'ami') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)', color: 'white' }}>
        <Nav />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>AMI Configuration Generator</h1>
          <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: '1rem', padding: '2rem', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Recommended Configuration</h3>
                {[
                  ['Instance Type', 't3.large'],
                  ['CPU', '2 vCPUs'],
                  ['Memory', '8 GB'],
                  ['Storage', 'gp3 100GB'],
                  ['Network', '5 Gbps'],
                  ['Monthly Cost', '$180']
                ].map(([k, v], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: i < 5 ? '1px solid #475569' : 'none' }}>
                    <span style={{ color: '#9ca3af' }}>{k}</span>
                    <span style={{ fontWeight: '600', color: k === 'Monthly Cost' ? '#34d399' : 'white' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ background: 'rgba(15,23,42,0.5)', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1rem' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>ML Reasoning</h4>
                  <p style={{ color: '#d1d5db', fontSize: '0.875rem' }}>Based on your usage: moderate CPU (40-60%), memory-light workloads, cost-optimized</p>
                </div>
                <button style={{ width: '100%', background: 'linear-gradient(to right, #2563eb, #9333ea)', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', color: 'white', cursor: 'pointer' }}>
                  Generate Terraform Config
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