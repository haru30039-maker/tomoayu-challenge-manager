
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  LayoutGrid, 
  Settings, 
  ArrowLeft,
  User,
  AlertCircle,
  Lightbulb,
  Bell,
  Check,
  Calendar,
  UserCircle,
  Sparkles,
  RefreshCw,
  UserPlus,
  X,
  Users,
  ChevronDown,
  ChevronUp,
  Clock,
  Cloud,
  CloudOff,
  Copy,
  Share2
} from 'lucide-react';
import { Project, Step, Task, ViewMode, UpdateLog } from './types';
import { INITIAL_PROJECTS, MEMBER_NAMES } from './constants';
import { getProjectInsights } from './geminiService';

// Firebase Realtime Database URL
const FIREBASE_DB_URL = 'https://tomoayu000-default-rtdb.asia-southeast1.firebasedatabase.app';

const App: React.FC = () => {
  // --- State ---
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [logs, setLogs] = useState<UpdateLog[]>([]);
  const [members, setMembers] = useState<string[]>(MEMBER_NAMES);
  const [cloudSyncId, setCloudSyncId] = useState<string>(() => localStorage.getItem('gaku_cloud_id') || "");
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const [newMemberName, setNewMemberName] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string>(() => localStorage.getItem('gaku_user') || "");
  const [isAdmin, setIsAdmin] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [showAllLogs, setShowAllLogs] = useState(false);

  // --- Persistence & Sync Logic ---
  
  useEffect(() => {
    localStorage.setItem('gaku_projects', JSON.stringify(projects));
    localStorage.setItem('gaku_logs', JSON.stringify(logs));
    localStorage.setItem('gaku_members', JSON.stringify(members));
    localStorage.setItem('gaku_user', currentUser);
    if (cloudSyncId) localStorage.setItem('gaku_cloud_id', cloudSyncId);
  }, [projects, logs, members, currentUser, cloudSyncId]);

  const pullFromCloud = useCallback(async (id: string) => {
    if (!id) return;
    setIsSyncing(true);
    try {
      const response = await fetch(`${FIREBASE_DB_URL}/sync/${id}.json`);
      if (!response.ok) throw new Error("Sync failed");
      const data = await response.json();
      if (data) {
        if (data.projects) setProjects(data.projects);
        if (data.logs) setLogs(data.logs);
        if (data.members) setMembers(data.members);
        setLastSyncTime(Date.now());
        showNotification("最新データを同期しました");
      } else {
        showNotification("データが見つかりません。新しいIDを作成してください");
      }
    } catch (error) {
      console.error(error);
      showNotification("同期に失敗しました。IDを確認してください");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const pushToCloud = useCallback(async (id: string) => {
    if (!id) return;
    setIsSyncing(true);
    try {
      const data = { projects, logs, members, updatedAt: Date.now() };
      const response = await fetch(`${FIREBASE_DB_URL}/sync/${id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Save failed");
      setLastSyncTime(Date.now());
      showNotification("クラウドに保存しました");
    } catch (error) {
      console.error(error);
      showNotification("保存に失敗しました");
    } finally {
      setIsSyncing(false);
    }
  }, [projects, logs, members]);

  useEffect(() => {
    const localId = localStorage.getItem('gaku_cloud_id');
    if (localId) {
      pullFromCloud(localId);
    } else {
      const p = localStorage.getItem('gaku_projects');
      const l = localStorage.getItem('gaku_logs');
      const m = localStorage.getItem('gaku_members');
      if (p) setProjects(JSON.parse(p));
      if (l) setLogs(JSON.parse(l));
      if (m) setMembers(JSON.parse(m));
    }
  }, []); // eslint-disable-line

  const createNewCloudSync = async () => {
    setIsSyncing(true);
    try {
      // ランダムなIDを生成
      const newId = Math.random().toString(36).substring(2, 10);
      const data = { projects, logs, members, updatedAt: Date.now() };
      const response = await fetch(`${FIREBASE_DB_URL}/sync/${newId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Create failed");
      setCloudSyncId(newId);
      setLastSyncTime(Date.now());
      showNotification("同期を開始しました！IDをメンバーに共有してください");
    } catch (error) {
      console.error(error);
      showNotification("IDの作成に失敗しました");
    } finally {
      setIsSyncing(false);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const addLog = (projectId: string, action: string) => {
    const project = projects.find(p => p.id === projectId);
    const newLog: UpdateLog = {
      id: Math.random().toString(36).substr(2, 9),
      projectId,
      projectName: project?.name || "不明",
      memberName: currentUser || "名無し",
      action,
      timestamp: Date.now()
    };
    setLogs(prev => [newLog, ...prev.slice(0, 49)]);
    showNotification(`${newLog.memberName}が「${action}」を更新しました`);
  };

  const handleUpdateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
  };

  const handleAddProjectMember = (projectId: string, name: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId && !p.memberNames.includes(name)) {
        return { ...p, memberNames: [...p.memberNames, name] };
      }
      return p;
    }));
    showNotification(`${name}をプロジェクトに追加しました`);
  };

  const handleRemoveProjectMember = (projectId: string, name: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, memberNames: p.memberNames.filter(m => m !== name) };
      }
      return p;
    }));
  };

  const handleUpdateTask = (projectId: string, stepId: string, taskId: string, updates: Partial<Task>) => {
    if (!currentUser) {
      alert("更新する前に名前を選択してください");
      return;
    }
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          steps: p.steps.map(s => {
            if (s.id === stepId) {
              return {
                ...s,
                tasks: s.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
              };
            }
            return s;
          })
        };
      }
      return p;
    }));
    
    if (updates.isCompleted !== undefined) {
      const task = projects.find(p => p.id === projectId)?.steps.find(s => s.id === stepId)?.tasks.find(t => t.id === taskId);
      addLog(projectId, `タスク${updates.isCompleted ? '完了' : '未完了'}: ${task?.title}`);
    }
  };

  const calculateProgress = (project: Project) => {
    const totalSteps = project.steps.length;
    if (totalSteps === 0) return 0;
    const completedStepsCount = project.steps.filter(step => 
      step.tasks.length > 0 && step.tasks.every(t => t.isCompleted)
    ).length;
    return Math.round((completedStepsCount / totalSteps) * 100);
  };

  const fetchAiInsight = async (project: Project) => {
    setLoadingAi(true);
    const data = await getProjectInsights(project);
    setAiInsight(data.advice);
    if (data.suggestedNextAction) {
      handleUpdateProject(project.id, { nextAction: data.suggestedNextAction });
    }
    setLoadingAi(false);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const displayLogs = showAllLogs ? logs : logs.slice(0, 3);

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto bg-slate-50 relative overflow-x-hidden text-slate-900 shadow-2xl">
      {/* 通知ポップアップ */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce border border-indigo-400">
          <Bell size={18} />
          <span className="text-sm font-bold">{notification}</span>
        </div>
      )}

      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-40 px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setViewMode(ViewMode.LIST); setSelectedProjectId(null);}}>
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
            <LayoutGrid size={22} />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-slate-800">挑戦管理</h1>
        </div>
        <div className="flex items-center gap-2">
          {cloudSyncId && (
            <button 
              onClick={() => pullFromCloud(cloudSyncId)}
              className={`p-2 rounded-full transition-all active:scale-90 ${isSyncing ? 'text-indigo-600 animate-spin' : 'text-indigo-400 hover:bg-indigo-50'}`}
              title="最新データを読み込む"
            >
              <RefreshCw size={20} />
            </button>
          )}
          <button 
            onClick={() => setIsAdmin(!isAdmin)}
            className={`p-2 rounded-xl transition-all ${isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* ユーザー & クラウド状態バー */}
      <div className="bg-white px-4 py-3 border-b flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <UserCircle size={20} className="text-slate-400 shrink-0" />
          <select 
            value={currentUser}
            onChange={(e) => setCurrentUser(e.target.value)}
            className="bg-slate-100 text-xs font-bold rounded-lg px-3 py-1.5 border-none focus:ring-2 focus:ring-indigo-500 outline-none w-full max-w-[140px]"
          >
            <option value="">名前を選択</option>
            {members.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cloudSyncId ? (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <Cloud size={14} />
              <span className="text-[10px] font-black uppercase">同期中</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-400 rounded-lg">
              <CloudOff size={14} />
              <span className="text-[10px] font-black uppercase">ローカル</span>
            </div>
          )}
        </div>
      </div>

      <main className="p-4">
        {viewMode === ViewMode.LIST && (
          <div className="space-y-6">
            {/* クラウド同期の案内 */}
            {!cloudSyncId && (
              <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-sm mb-1">クラウド同期がオフです</h3>
                  <p className="text-[10px] text-indigo-100">同期IDを設定すると、全員のスマホで内容が共有されます。</p>
                </div>
                <button 
                  onClick={() => setIsAdmin(true)}
                  className="bg-white text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-black shadow-md shrink-0 active:scale-95"
                >
                  設定へ
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">プロジェクト一覧</h2>
              {isAdmin && (
                <button 
                  onClick={() => {
                    const newId = `proj-${Date.now()}`;
                    const newProj: Project = {
                      id: newId,
                      name: "新規プロジェクト",
                      goal: "達成したい目標を入力",
                      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      steps: [{ id: `${newId}-s0`, name: "企画・準備", order: 0, tasks: [] }],
                      memberNames: currentUser ? [currentUser] : [],
                      currentStepId: `${newId}-s0`,
                      nextAction: "タスクを決める",
                      issues: "特になし",
                      isArchived: false
                    };
                    setProjects([newProj, ...projects]);
                    setSelectedProjectId(newId);
                    setViewMode(ViewMode.DETAIL);
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-indigo-700 shadow-md active:scale-95 transition-all"
                >
                  <Plus size={16} /> 新規作成
                </button>
              )}
            </div>

            <div className="grid gap-4">
              {projects.map(proj => {
                const progress = calculateProgress(proj);
                return (
                  <div 
                    key={proj.id} 
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      setViewMode(ViewMode.DETAIL);
                      setAiInsight(null);
                    }}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 active:scale-[0.98] transition-all cursor-pointer group hover:border-indigo-300"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{proj.name}</h3>
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex -space-x-2">
                        {proj.memberNames.slice(0, 3).map(m => (
                          <div key={m} className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-indigo-600">
                            {m[0]}
                          </div>
                        ))}
                        {proj.memberNames.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
                            +{proj.memberNames.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{proj.memberNames.length} 名が参加中</span>
                    </div>

                    <div className="mb-2 flex justify-between items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">進捗率</span>
                      <span className="text-sm font-black text-indigo-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-50">
                      <div 
                        className="bg-indigo-500 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      <span className="flex items-center gap-1"><Calendar size={12} /> 期限: {proj.deadline}</span>
                      <span className="bg-slate-50 px-2 py-1 rounded-md">{proj.steps.length} フェーズ</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 更新履歴 */}
            <div className="mt-10 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-slate-800">最近の動き</h2>
                {logs.length > 3 && (
                  <button onClick={() => setShowAllLogs(!showAllLogs)} className="text-xs font-black text-indigo-600 flex items-center gap-1">
                    {showAllLogs ? <><ChevronUp size={16} /> 閉じる</> : <><ChevronDown size={16} /> もっと見る</>}
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 italic text-sm">まだ更新はありません</div>
                ) : (
                  displayLogs.map(log => (
                    <div key={log.id} className="flex gap-4 items-start p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="bg-white p-2 rounded-xl shadow-sm text-indigo-500"><Check size={16} strokeWidth={3} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-900 leading-snug">
                          <span className="font-black text-indigo-600">{log.memberName}</span> さんが 
                          <span className="font-bold">「{log.projectName}」</span>を更新
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                        <p className="text-xs text-slate-600 mt-2 italic font-medium">"{log.action}"</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {viewMode === ViewMode.DETAIL && selectedProject && (
          <div className="space-y-6">
            <button onClick={() => {setViewMode(ViewMode.LIST); setAiInsight(null);}} className="flex items-center gap-1 text-slate-500 text-sm font-bold hover:text-indigo-600 transition-colors">
              <ArrowLeft size={18} /> 一覧に戻る
            </button>

            {/* プロジェクトヘッダーカード */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border-t-8 border-indigo-600 relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  {isAdmin ? (
                    <input 
                      type="text"
                      value={selectedProject.name}
                      onChange={(e) => handleUpdateProject(selectedProject.id, { name: e.target.value })}
                      className="text-2xl font-black text-slate-900 bg-slate-50 border-none rounded-xl px-2 py-1 w-full focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedProject.name}</h2>
                  )}
                </div>
                {isAdmin && (
                  <button onClick={() => { if(confirm("このプロジェクトを削除しますか？")) { setProjects(projects.filter(p => p.id !== selectedProject.id)); setViewMode(ViewMode.LIST); }}} className="p-2 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">プロジェクトの目標</label>
                  {isAdmin ? (
                    <textarea 
                      value={selectedProject.goal}
                      onChange={(e) => handleUpdateProject(selectedProject.id, { goal: e.target.value })}
                      className="text-slate-700 font-bold bg-slate-50 border-none rounded-xl p-3 text-sm w-full focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                    />
                  ) : (
                    <p className="text-slate-700 font-bold leading-relaxed">{selectedProject.goal}</p>
                  )}
                </div>

                {/* 担当メンバー */}
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <Users size={14} /> 参加メンバー ({selectedProject.memberNames.length}名)
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.memberNames.map(m => (
                      <span key={m} className="bg-white text-indigo-600 text-[10px] font-black px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-1.5 shadow-sm group">
                        {m}
                        {isAdmin && (
                          <button onClick={() => handleRemoveProjectMember(selectedProject.id, m)} className="text-slate-300 hover:text-rose-500 group-hover:scale-110 transition-all">
                            <X size={12} strokeWidth={3} />
                          </button>
                        )}
                      </span>
                    ))}
                    {isAdmin && (
                      <select 
                        className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl border-none focus:ring-2 focus:ring-indigo-400 shadow-lg active:scale-95 transition-all cursor-pointer"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddProjectMember(selectedProject.id, e.target.value);
                            e.target.value = "";
                          }
                        }}
                      >
                        <option value="">+ メンバーを追加</option>
                        {members.filter(m => !selectedProject.memberNames.includes(m)).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="flex gap-8 border-t border-slate-100 pt-6">
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">最終期限</label>
                    {isAdmin ? (
                      <input 
                        type="date"
                        value={selectedProject.deadline}
                        onChange={(e) => handleUpdateProject(selectedProject.id, { deadline: e.target.value })}
                        className="text-slate-900 font-black bg-slate-50 border-none rounded-xl p-2 text-sm w-full focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-slate-900 font-black">
                        <Calendar size={16} className="text-indigo-400" />
                        <span>{selectedProject.deadline}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">現在の達成率</label>
                    <div className="text-indigo-600 font-black text-2xl flex items-baseline gap-1">
                      {calculateProgress(selectedProject)}
                      <span className="text-xs">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AIメンター */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                      <Sparkles size={20} className="text-yellow-300" />
                    </div>
                    <h3 className="font-black text-lg">AIメンターのアドバイス</h3>
                  </div>
                  {!loadingAi && (
                    <button 
                      onClick={() => fetchAiInsight(selectedProject)} 
                      className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all active:rotate-180 duration-500"
                    >
                      <RefreshCw size={18} />
                    </button>
                  )}
                </div>
                {loadingAi ? (
                  <div className="flex items-center gap-3 py-4">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm font-bold animate-pulse">プロジェクト状況を分析中...</span>
                  </div>
                ) : aiInsight ? (
                  <p className="text-sm leading-relaxed text-indigo-50 italic font-medium">"{aiInsight}"</p>
                ) : (
                  <button 
                    onClick={() => fetchAiInsight(selectedProject)} 
                    className="bg-white text-indigo-700 px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    <Sparkles size={16} /> AI分析を実行
                  </button>
                )}
              </div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl transition-all group-hover:bg-white/10"></div>
            </div>

            {/* ロードマップ */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600"><CheckCircle2 size={22} strokeWidth={3} /></div>
                  ロードマップ
                </h3>
                {isAdmin && (
                  <button 
                    onClick={() => {
                      const nextOrder = selectedProject.steps.length;
                      const newStep: Step = { id: `s-${Date.now()}`, name: `フェーズ ${nextOrder + 1}`, order: nextOrder, tasks: [] };
                      handleUpdateProject(selectedProject.id, { steps: [...selectedProject.steps, newStep] });
                    }}
                    className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100 transition-all border border-indigo-100"
                  >
                    + フェーズを追加
                  </button>
                )}
              </div>
              
              <div className="space-y-6">
                {selectedProject.steps.map((step, idx) => {
                  const isCurrentFocus = step.id === selectedProject.currentStepId;
                  const isStepDone = step.tasks.length > 0 && step.tasks.every(t => t.isCompleted);
                  
                  return (
                    <div 
                      key={step.id} 
                      className={`p-6 rounded-3xl border-2 transition-all ${
                        isCurrentFocus 
                          ? 'bg-indigo-50 border-indigo-500 shadow-xl ring-8 ring-indigo-500/5' 
                          : isStepDone 
                            ? 'bg-emerald-50/50 border-emerald-200' 
                            : 'bg-white border-slate-100'
                      }`}
                      onClick={() => handleUpdateProject(selectedProject.id, { currentStepId: step.id })}
                    >
                      <div className="flex gap-5">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all shadow-sm ${
                            isStepDone 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : isCurrentFocus 
                                ? 'bg-indigo-600 border-indigo-600 text-white animate-pulse' 
                                : 'bg-white border-slate-200 text-slate-400 font-bold'
                          }`}>
                            {isStepDone ? <Check size={20} strokeWidth={4} /> : <span>{idx + 1}</span>}
                          </div>
                          {idx < selectedProject.steps.length - 1 && (
                            <div className={`w-1 h-full my-2 rounded-full ${isStepDone ? 'bg-emerald-200' : 'bg-slate-100'}`}></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              {isAdmin ? (
                                <input 
                                  value={step.name} 
                                  onClick={(e) => e.stopPropagation()} 
                                  onChange={(e) => {
                                    handleUpdateProject(selectedProject.id, {
                                      steps: selectedProject.steps.map(s => s.id === step.id ? { ...s, name: e.target.value } : s)
                                    });
                                  }} 
                                  className="bg-transparent border-none text-lg font-black w-full p-0 focus:ring-0 text-slate-800"
                                />
                              ) : (
                                <h4 className="font-black text-lg text-slate-800">{step.name}</h4>
                              )}
                              {isCurrentFocus && (
                                <span className="bg-indigo-600 text-white text-[8px] px-2 py-0.5 rounded-md font-black mt-1 inline-block uppercase tracking-widest">現在進行中</span>
                              )}
                            </div>
                            {isAdmin && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateProject(selectedProject.id, {
                                    steps: selectedProject.steps.filter(s => s.id !== step.id)
                                  });
                                }} 
                                className="text-slate-200 hover:text-rose-500"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>

                          {/* タスク一覧 */}
                          <div className="space-y-3">
                            {step.tasks.map(task => (
                              <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-start gap-3">
                                  <button 
                                    onClick={() => handleUpdateTask(selectedProject.id, step.id, task.id, { isCompleted: !task.isCompleted })}
                                    className={`transition-all mt-0.5 shrink-0 active:scale-90 ${task.isCompleted ? 'text-emerald-500' : 'text-slate-200'}`}
                                  >
                                    {task.isCompleted ? <CheckCircle2 size={24} strokeWidth={3} /> : <Circle size={24} strokeWidth={2} />}
                                  </button>
                                  <div className="flex-1">
                                    <input 
                                      value={task.title} 
                                      onChange={(e) => handleUpdateTask(selectedProject.id, step.id, task.id, { title: e.target.value })} 
                                      className={`bg-transparent border-none text-sm font-bold w-full p-0 focus:ring-0 transition-all ${task.isCompleted ? 'line-through text-slate-300' : 'text-slate-700'}`} 
                                    />
                                    <div className="flex flex-wrap gap-3 mt-3">
                                      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100 text-[10px] font-black text-slate-500">
                                        <UserCircle size={14} className="text-indigo-300" />
                                        <select 
                                          value={task.assignee} 
                                          onChange={(e) => handleUpdateTask(selectedProject.id, step.id, task.id, { assignee: e.target.value })} 
                                          className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                                        >
                                          <option value="未定">未定</option>
                                          <optgroup label="プロジェクト内">
                                            {selectedProject.memberNames.map(m => <option key={m} value={m}>{m}</option>)}
                                          </optgroup>
                                          <optgroup label="全体メンバー">
                                            {members.filter(m => !selectedProject.memberNames.includes(m)).map(m => <option key={m} value={m}>{m}</option>)}
                                          </optgroup>
                                        </select>
                                      </div>
                                      <div className={`flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100 text-[10px] font-black ${task.deadline && new Date(task.deadline) < new Date() && !task.isCompleted ? 'text-rose-500 border-rose-100 bg-rose-50' : 'text-slate-500'}`}>
                                        <Clock size={14} className="text-indigo-300" />
                                        <input 
                                          type="date" 
                                          value={task.deadline || ""} 
                                          onChange={(e) => handleUpdateTask(selectedProject.id, step.id, task.id, { deadline: e.target.value })} 
                                          className="bg-transparent border-none p-0 focus:ring-0 text-[10px] font-black w-24"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  {isAdmin && (
                                    <button 
                                      onClick={() => {
                                        handleUpdateProject(selectedProject.id, {
                                          steps: selectedProject.steps.map(s => s.id === step.id ? { ...s, tasks: s.tasks.filter(t => t.id !== task.id) } : s)
                                        });
                                      }}
                                      className="text-slate-200 hover:text-rose-400 p-1 transition-colors"
                                    >
                                      <X size={16} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {isAdmin && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newTask = { id: `t-${Date.now()}`, title: "新しいタスク", assignee: "未定", isCompleted: false, deadline: selectedProject.deadline };
                                  handleUpdateProject(selectedProject.id, {
                                    steps: selectedProject.steps.map(s => s.id === step.id ? { ...s, tasks: [...s.tasks, newTask] } : s)
                                  });
                                }}
                                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-[10px] font-black hover:bg-slate-50 transition-all uppercase tracking-widest"
                              >
                                + タスクを追加
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ボトムフィールド */}
            <div className="grid gap-4">
              <div className="bg-amber-50 p-5 rounded-3xl border border-amber-100 shadow-sm group">
                <div className="flex items-center gap-2 mb-3 text-amber-700 font-black text-sm uppercase tracking-widest">
                  <Sparkles size={18} /> 次にやること
                </div>
                <input 
                  value={selectedProject.nextAction} 
                  onChange={(e) => handleUpdateProject(selectedProject.id, { nextAction: e.target.value })} 
                  className="bg-white border-none rounded-2xl p-4 text-sm w-full shadow-inner font-bold focus:ring-2 focus:ring-amber-300" 
                  placeholder="AI分析または手入力で設定" 
                />
              </div>
              <div className="bg-rose-50 p-5 rounded-3xl border border-rose-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-rose-700 font-black text-sm uppercase tracking-widest">
                  <AlertCircle size={18} /> 困りごと・MTG議題
                </div>
                <textarea 
                  rows={3} 
                  value={selectedProject.issues} 
                  onChange={(e) => handleUpdateProject(selectedProject.id, { issues: e.target.value })} 
                  className="bg-white border-none rounded-2xl p-4 text-sm w-full shadow-inner font-bold focus:ring-2 focus:ring-rose-300" 
                  placeholder="悩みや共有したいことを記入" 
                />
              </div>
            </div>
          </div>
        )}

        {/* 設定画面 (管理モード時に表示) */}
        {isAdmin && viewMode === ViewMode.LIST && (
          <div className="mt-8 space-y-6">
            {/* メンバー管理 */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-indigo-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-600 p-2 rounded-xl text-white"><Users size={20} strokeWidth={3} /></div>
                <h2 className="text-xl font-black text-slate-800">組織メンバーの編集</h2>
              </div>
              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  placeholder="新しい名前..." 
                  className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (() => {
                    if (!newMemberName.trim() || members.includes(newMemberName.trim())) return;
                    setMembers([...members, newMemberName.trim()]);
                    setNewMemberName("");
                  })()}
                />
                <button 
                  onClick={() => {
                    if (!newMemberName.trim() || members.includes(newMemberName.trim())) return;
                    setMembers([...members, newMemberName.trim()]);
                    setNewMemberName("");
                  }} 
                  className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg active:scale-90 transition-all"
                >
                  <UserPlus size={24} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {members.map(name => (
                  <div key={name} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-2 rounded-xl text-xs font-black border border-slate-200">
                    <span>{name}</span>
                    <button onClick={() => { if(confirm("メンバーを削除しますか？")) setMembers(members.filter(m => m !== name)); }} className="text-slate-400 hover:text-rose-500">
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* クラウド同期設定 */}
            <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 p-2 rounded-xl"><Cloud size={24} /></div>
                  <h2 className="text-xl font-black">クラウド同期設定</h2>
                </div>
                
                {cloudSyncId ? (
                  <div className="space-y-6">
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                      <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block mb-2">現在の同期ID (メンバーに共有してください)</label>
                      <div className="flex items-center gap-2">
                        <code className="bg-indigo-950 px-3 py-2 rounded-xl text-emerald-400 font-mono text-sm flex-1 truncate">{cloudSyncId}</code>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(cloudSyncId);
                            showNotification("同期IDをコピーしました");
                          }}
                          className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 active:scale-90 transition-all"
                        >
                          <Copy size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({ title: '進捗管理 同期ID', text: `このIDを「挑戦管理」アプリに入力して同期を開始してください: ${cloudSyncId}` });
                            }
                          }}
                          className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 active:scale-90 transition-all"
                        >
                          <Share2 size={18} />
                        </button>
                      </div>
                      <p className="text-[10px] text-indigo-200 mt-3 font-medium">※ 全メンバーがこのIDを入力することで、同じ画面を共有できます。</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => pushToCloud(cloudSyncId)} 
                        className={`w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${isSyncing ? 'bg-white/50 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-400'}`}
                        disabled={isSyncing}
                      >
                        <Cloud size={20} /> 今すぐクラウドを更新
                      </button>
                      <button 
                        onClick={() => setCloudSyncId("")}
                        className="text-[10px] font-black text-indigo-300 underline underline-offset-4 hover:text-white"
                      >
                        同期を切断する（ローカル保存に戻る）
                      </button>
                    </div>
                    {lastSyncTime > 0 && (
                      <p className="text-center text-[10px] text-indigo-400 font-bold">最終同期: {new Date(lastSyncTime).toLocaleString()}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                      クラウド同期を有効にすると、全員のスマホで全く同じ内容をリアルタイムに共有できるようになります。
                    </p>
                    
                    <div className="space-y-4">
                      <button 
                        onClick={createNewCloudSync} 
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-emerald-900/40 active:scale-95 transition-all"
                      >
                        新しい同期IDを作成して開始
                      </button>
                      
                      <div className="relative flex items-center gap-4 py-2">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">または 既存のIDを入力</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                      </div>

                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          id="join-sync-id"
                          placeholder="共有されたIDを入力..." 
                          className="flex-1 bg-white/10 border-white/20 border text-white rounded-2xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-indigo-400"
                        />
                        <button 
                          onClick={() => {
                            const val = (document.getElementById('join-sync-id') as HTMLInputElement).value;
                            if (val) {
                              setCloudSyncId(val);
                              pullFromCloud(val);
                            }
                          }}
                          className="bg-white text-indigo-900 px-4 py-3 rounded-2xl font-black text-sm active:scale-90 transition-all shadow-xl"
                        >
                          参加
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
            </div>
          </div>
        )}
      </main>

      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t px-8 py-4 flex justify-around items-center z-50 max-w-lg mx-auto shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[40px]">
        <button 
          onClick={() => {setViewMode(ViewMode.LIST); setSelectedProjectId(null);}} 
          className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${viewMode === ViewMode.LIST ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <LayoutGrid size={26} strokeWidth={viewMode === ViewMode.LIST ? 3 : 2} />
          <span className="text-[10px] font-black uppercase tracking-tighter">ホーム</span>
        </button>
        <button 
          onClick={() => { if (projects.length > 0) { setSelectedProjectId(selectedProjectId || projects[0].id); setViewMode(ViewMode.DETAIL); }}} 
          className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${viewMode === ViewMode.DETAIL ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <ChevronRight size={26} className="rotate-90" strokeWidth={viewMode === ViewMode.DETAIL ? 3 : 2} />
          <span className="text-[10px] font-black uppercase tracking-tighter">プロジェクト</span>
        </button>
        <button 
          onClick={() => setIsAdmin(!isAdmin)} 
          className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${isAdmin ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Settings size={26} strokeWidth={isAdmin ? 3 : 2} />
          <span className="text-[10px] font-black uppercase tracking-tighter">設定</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
