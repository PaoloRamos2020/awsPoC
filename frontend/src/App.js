import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const LAMBDA_URL = process.env.REACT_APP_LAMBDA_URL || 'https://3yaj0v3c10.execute-api.us-east-1.amazonaws.com/';
const API_URL = process.env.REACT_APP_API_URL || '';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const STATUS_COLOR = {
  'En Progreso': '#3b82f6',
  'Planificación': '#f59e0b',
  'Pendiente': '#6b7280',
  'Completado': '#10b981',
};

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [syncLog, setSyncLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(LAMBDA_URL);
      const data = await res.json();
      setProjects(data.projects || []);
      setLastSync(data.timestamp);
    } catch (e) {
      console.error('Error fetching projects:', e);
    }
    setLoading(false);
  };

  const handleSync = async () => {
    setLoading(true);
    const entry = { timestamp: new Date().toISOString(), status: 'iniciado', message: 'Sincronización iniciada' };
    setSyncLog(prev => [entry, ...prev]);
    try {
      await fetchProjects();
      setSyncLog(prev => [{ timestamp: new Date().toISOString(), status: 'exitoso', message: `${projects.length} proyectos sincronizados` }, ...prev]);
    } catch (e) {
      setSyncLog(prev => [{ timestamp: new Date().toISOString(), status: 'error', message: e.message }, ...prev]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const statusCount = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  const budgetData = projects.map(p => ({ name: p.id, budget: p.budget / 1000, progress: p.progress }));

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Header */}
      <div style={{ background: '#1e3a5f', color: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 2, textTransform: 'uppercase' }}>Banana Bank — T&I</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Gestión de la Demanda PoC</div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          {lastSync ? `Última sync: ${new Date(lastSync).toLocaleTimeString('es-PE')}` : 'Sin sincronizar'}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', padding: '0 24px' }}>
        {[['dashboard','Dashboard'],['demandas','Demandas'],['synclog','Sync Log'],['arquitectura','Arquitectura']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: tab === id ? 700 : 400,
            color: tab === id ? '#1e3a5f' : '#64748b',
            borderBottom: tab === id ? '3px solid #1e3a5f' : '3px solid transparent',
            fontSize: 14
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: 24 }}>
        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                ['Total Proyectos', projects.length, '#3b82f6'],
                ['En Progreso', statusCount['En Progreso'] || 0, '#10b981'],
                ['En Planificación', statusCount['Planificación'] || 0, '#f59e0b'],
                ['Presupuesto Total', `S/ ${(projects.reduce((a,p) => a + p.budget, 0)/1000).toFixed(0)}K`, '#8b5cf6'],
              ].map(([label, value, color]) => (
                <div key={label} style={{ background: 'white', borderRadius: 8, padding: 20, borderLeft: `4px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'white', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ fontWeight: 600, marginBottom: 16 }}>Presupuesto por Proyecto (K)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={budgetData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="budget" fill="#1e3a5f" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: 'white', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ fontWeight: 600, marginBottom: 16 }}>Estado de Proyectos</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* DEMANDAS */}
        {tab === 'demandas' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Proyectos ({projects.length})</div>
              <button onClick={handleSync} disabled={loading} style={{
                background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 6,
                padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600
              }}>{loading ? 'Sincronizando...' : '↻ Sincronizar JIRA'}</button>
            </div>
            <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['ID','Proyecto','Estado','Prioridad','Equipo','Owner','Presupuesto','Progreso'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e3a5f' }}>{p.id}</td>
                      <td style={{ padding: '12px 16px' }}>{p.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: STATUS_COLOR[p.status] + '20', color: STATUS_COLOR[p.status], padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{p.status}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>{p.priority}</td>
                      <td style={{ padding: '12px 16px' }}>{p.team}</td>
                      <td style={{ padding: '12px 16px' }}>{p.owner}</td>
                      <td style={{ padding: '12px 16px' }}>S/ {p.budget.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, background: '#e2e8f0', borderRadius: 4, height: 6 }}>
                            <div style={{ width: `${p.progress}%`, background: '#1e3a5f', borderRadius: 4, height: 6 }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#64748b', minWidth: 32 }}>{p.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SYNC LOG */}
        {tab === 'synclog' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Log de Sincronización</div>
            {syncLog.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 8, padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                No hay registros de sincronización aún. Ve a Demandas y presiona Sincronizar JIRA.
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                {syncLog.map((entry, i) => (
                  <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 180 }}>{new Date(entry.timestamp).toLocaleString('es-PE')}</span>
                    <span style={{ background: entry.status === 'exitoso' ? '#d1fae5' : entry.status === 'error' ? '#fee2e2' : '#fef3c7', color: entry.status === 'exitoso' ? '#065f46' : entry.status === 'error' ? '#991b1b' : '#92400e', padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{entry.status}</span>
                    <span style={{ fontSize: 13 }}>{entry.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ARQUITECTURA */}
        {tab === 'arquitectura' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Arquitectura AWS</div>
            <div style={{ background: 'white', borderRadius: 8, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
                {[
                  { icon: '⚡', label: 'Lambda', sub: 'JIRA Mock', color: '#f59e0b' },
                  { arrow: true },
                  { icon: '🐳', label: 'ECS Fargate', sub: 'Node.js API', color: '#3b82f6' },
                  { arrow: true },
                  { icon: '🗄️', label: 'RDS', sub: 'PostgreSQL', color: '#10b981' },
                ].map((item, i) => item.arrow ? (
                  <div key={i} style={{ fontSize: 24, color: '#94a3b8', margin: '0 16px' }}>→</div>
                ) : (
                  <div key={i} style={{ textAlign: 'center', padding: 20, borderRadius: 12, border: `2px solid ${item.color}20`, background: item.color + '10', minWidth: 120 }}>
                    <div style={{ fontSize: 36 }}>{item.icon}</div>
                    <div style={{ fontWeight: 700, color: item.color, marginTop: 8 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{item.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {[
                  ['Lambda URL', 'https://3yaj0v3c10.execute-api.us-east-1.amazonaws.com/'],
                  ['ECR', '145292398795.dkr.ecr.us-east-1.amazonaws.com/demanda-poc-backend'],
                  ['RDS Endpoint', 'demanda-poc-db.cmhkme82orop.us-east-1.rds.amazonaws.com:5432'],
                  ['ECS Cluster', 'demanda-poc-cluster — us-east-1'],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 12, color: '#1e293b', wordBreak: 'break-all' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
