'use client';

import React, { useState, useEffect } from 'react';
import { resumeApi } from '@/lib/api';
import { History, RotateCcw, Eye, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface VersionItem {
  id: number;
  version: number;
  content: any;
  changeNotes: string | null;
  createdAt: string;
}

interface Props {
  resumeId: string;
  visible: boolean;
  onClose: () => void;
  onRestore: () => void;
}

type DialogState =
  | { kind: 'none' }
  | { kind: 'restore'; versionId: number }
  | { kind: 'create' };

export default function VersionPanel({ resumeId, visible, onClose, onRestore }: Props) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ kind: 'none' });
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const refreshVersions = async () => {
    const res = await resumeApi.getVersions(resumeId);
    const data = res.data?.data || res.data;
    setVersions(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (!visible || !resumeId) return;
    setLoading(true);
    refreshVersions()
      .catch(() => setVersions([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, resumeId]);

  const handleRestore = async (versionId: number) => {
    setRestoring(true);
    try {
      await resumeApi.restoreVersion(versionId);
      onRestore();
      setToast({ type: 'success', msg: '已恢复到所选版本' });
      setDialog({ kind: 'none' });
      await refreshVersions();
    } catch {
      setToast({ type: 'error', msg: '恢复失败，请稍后重试' });
    } finally {
      setRestoring(false);
    }
  };

  const createNewVersion = async () => {
    setCreating(true);
    try {
      await resumeApi.createVersion(resumeId, { changeNotes: newVersionNotes.trim() });
      setNewVersionNotes('');
      setDialog({ kind: 'none' });
      setToast({ type: 'success', msg: '新版本已创建' });
      await refreshVersions();
    } catch {
      setToast({ type: 'error', msg: '创建版本失败，请稍后重试' });
    } finally {
      setCreating(false);
    }
  };

  // Simple text diff: show lines that differ
  const getContentSummary = (version: VersionItem) => {
    if (!version.content) return '(无内容)';
    if (typeof version.content === 'string') return version.content.substring(0, 100);
    try {
      return JSON.stringify(version.content).substring(0, 100);
    } catch {
      return '(无法解析)';
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="glass-card p-6 w-full max-w-2xl max-h-[80vh] flex flex-col relative"
        style={{ background: 'rgba(15, 15, 46, 0.95)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History size={20} className="text-purple-400" />
            版本历史
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNewVersionNotes('');
                setDialog({ kind: 'create' });
              }}
              className="text-xs text-purple-400 hover:text-purple-300 border border-purple-500/30 rounded-lg px-3 py-1"
            >
              + 保存当前版本
            </button>
            <button onClick={onClose} className="text-white/40 hover:text-white/70">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            {toast.msg}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-purple-400" />
          </div>
        ) : versions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
            暂无版本历史，编辑简历后点击&ldquo;保存当前版本&rdquo;来创建第一份记录
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {versions.map((v) => (
              <div
                key={v.id}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedVersion?.id === v.id
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                }`}
                onClick={() => setSelectedVersion(v)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white text-sm font-medium">v{v.version}</span>
                    <span className="text-white/30 text-xs ml-2">
                      {new Date(v.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVersion(v);
                      }}
                      className="text-white/30 hover:text-white/60 p-1"
                      title="查看"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDialog({ kind: 'restore', versionId: v.id });
                      }}
                      disabled={restoring}
                      className="text-white/30 hover:text-emerald-400 p-1 disabled:opacity-30"
                      title="恢复"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>
                {v.changeNotes && (
                  <p className="text-white/40 text-xs mt-1">{v.changeNotes}</p>
                )}
                {/* Expand selected version content */}
                {selectedVersion?.id === v.id && (
                  <div className="mt-2 p-2 rounded-lg bg-black/20 text-white/60 text-xs max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {getContentSummary(v)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Restore confirmation dialog ── */}
        {dialog.kind === 'restore' && (
          <InlineDialog
            title="确认恢复版本"
            message="确定要恢复到该版本吗？当前未保存的更改将丢失。"
            confirmLabel="确认恢复"
            confirmIcon={<RotateCcw size={15} />}
            loading={restoring}
            confirmTone="emerald"
            onCancel={() => setDialog({ kind: 'none' })}
            onConfirm={() => handleRestore(dialog.versionId)}
          />
        )}

        {/* ── Create version dialog (with notes input) ── */}
        {dialog.kind === 'create' && (
          <InlineDialog
            title="保存当前版本"
            confirmLabel="创建版本"
            loading={creating}
            confirmTone="purple"
            onCancel={() => setDialog({ kind: 'none' })}
            onConfirm={createNewVersion}
          >
            <label className="block text-white/50 text-xs mb-1.5">版本说明（可选）</label>
            <input
              type="text"
              value={newVersionNotes}
              autoFocus
              onChange={(e) => setNewVersionNotes(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createNewVersion();
              }}
              placeholder="例如：投递前定稿 / 优化了项目经历"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-purple-500/40"
            />
          </InlineDialog>
        )}
      </div>
    </div>
  );
}

// ── Reusable inline dialog (modal-within-modal) ──
function InlineDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = '取消',
  confirmIcon,
  loading = false,
  confirmTone = 'purple',
  onCancel,
  onConfirm,
  children,
}: {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmIcon?: React.ReactNode;
  loading?: boolean;
  confirmTone?: 'purple' | 'emerald';
  onCancel: () => void;
  onConfirm: () => void;
  children?: React.ReactNode;
}) {
  const tone =
    confirmTone === 'emerald'
      ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
      : 'bg-purple-500 hover:bg-purple-400 text-white';
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-sm mx-4 p-5 rounded-2xl border border-white/10 shadow-2xl"
        style={{ background: 'rgba(20, 18, 50, 0.98)' }}
      >
        <h3 className="text-white font-semibold text-sm mb-2">{title}</h3>
        {message && <p className="text-white/50 text-xs mb-4 leading-relaxed">{message}</p>}
        {children && <div className="mb-4">{children}</div>}
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white/90 hover:bg-white/5 border border-white/10 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-60 ${tone}`}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : confirmIcon}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
