/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  UserPlus, 
  Heart, 
  MoreHorizontal, 
  Gift, 
  Smile, 
  Send, 
  Zap, 
  Plus,
  Eye,
  Trophy, 
  Gamepad2,
  Dices,
  Target,
  ChevronDown, 
  ChevronUp,
  Mic, 
  Video, 
  VideoOff,
  Settings,
  RefreshCw,
  Sparkles,
  Volume2,
  Flag,
  Music,
  Shield,
  Users,
  User,
  Share2,
  MessageSquare,
  Image as ImageIcon,
  Check,
  ChevronRight,
  Layout,
  Circle,
  Columns,
  Layers,
  Search,
  Flame,
  Star,
  Crown,
  Maximize2,
  MicOff,
  Clock,
  Power,
  UserMinus,
  Pin,
  Upload,
  Brain,
  TrendingUp,
  BarChart3,
  History,
  Award,
  Coffee
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  aiService, 
  PKPrediction, 
  PKAssistantSuggestion, 
  ViewerAnalysis, 
  RematchRecommendation, 
  LeaderboardEntry 
} from './services/aiService';
// ============================================
// BADILIKO #1: ONGEZA IMPORT YA SUPABASE
// ============================================
import { supabase } from './lib/supabaseClient';

// --- Types ---

interface Message {
  id: string;
  user: string;
  avatar?: string;
  level?: number;
  text: string;
  type: 'chat' | 'gift' | 'system';
  giftIcon?: string;
  count?: number;
  replyTo?: string;
  isHighlighted?: boolean;
  isPinned?: boolean;
  statusTitle?: string;
  squadRank?: string;
  vipTier?: 'Basic' | 'VIP' | 'ELITE';
}

interface Mission {
  id: string;
  title: string;
  progress: number;
  target: number;
  reward: number;
  type: 'gift' | 'time' | 'join';
  isCompleted: boolean;
}

interface JoinNotification {
  id: string;
  user: string;
  level: number;
  avatar: string;
}

interface Guest {
  id: string;
  name: string;
  avatar: string;
  coins: number;
  isMuted: boolean;
  isCameraOff: boolean;
  isPinned?: boolean;
  isFollowed?: boolean;
}

const musicTracks = [
  { name: 'Acoustic Vibes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: '2:55' },
  { name: 'Deep House', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: '6:00' },
  { name: 'Lofi Chill', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: '4:30' },
  { name: 'Upbeat Pop', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: '3:15' },
];

interface HeartItem {
  id: string;
  x: number;
  color: string;
}

// --- Constants ---

const LEVEL_THRESHOLDS = [
  0, 25, 100, 250, 500, 850, 1300, 1900, 2600, 3500,
  4500, 5800, 7200, 8900, 10800, 13000, 15500, 18300, 21500, 25000,
  29000, 33500, 38500, 44000, 50000, 56500, 63500, 71000, 79000, 87500,
  96500, 106000, 116000, 126500, 137500, 149000, 161000, 173500, 186500, 200000,
  220000, 245000, 275000, 310000, 350000, 400000, 460000, 530000, 610000, 700000,
  820000, 960000, 1120000, 1300000, 1500000, 1750000, 2050000, 2400000, 2800000, 3250000,
  3750000, 4300000, 4900000, 5600000, 6400000, 7300000, 8300000, 9400000, 10600000, 12000000,
  13500000, 15200000, 17000000, 19000000, 21200000, 23600000, 26200000, 29000000, 32000000, 35500000,
  39500000, 44000000, 49000000, 54500000, 60500000, 67000000, 74000000, 81500000, 89500000, 98000000,
  107000000, 116500000, 126500000, 137000000, 148000000, 159500000, 171500000, 184000000, 197000000, 210000000
];

const calculateLevel = (totalSpent: number) => {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalSpent >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
};

const getNextLevelThreshold = (level: number) => {
  if (level >= 100) return null;
  return LEVEL_THRESHOLDS[level];
};

const SKYLOOK_PERKS = [
  { level: 5, name: 'Status Badge', icon: '✨', description: 'Exclusive badge next to your name' },
  { level: 15, name: 'Colored Chat', icon: '🎨', description: 'Your messages stand out in chat' },
  { level: 25, name: 'Gift Discount', icon: '💎', description: '5% off on selected gifts' },
  { level: 40, name: 'Custom Emoji', icon: '😎', description: 'Unlock unique emojis for chat' },
  { level: 60, name: 'Special Entrance', icon: '⚡', description: 'Flashy entrance when you join' },
  { level: 80, name: 'Host Shoutout', icon: '📣', description: 'Automatic highlight for host' },
];

const NEXUS_MILESTONES = [
  { level: 45, reward: 'Elite Frame', icon: '🖼️' },
  { level: 50, reward: 'Legend Emblem', icon: '🛡️' },
  { level: 60, reward: 'Mythic Badge', icon: '🌟' },
  { level: 75, reward: 'God Tier Status', icon: '👑' },
  { level: 90, reward: 'Skylook Immortal', icon: '🌌' },
];

// --- Helpers ---

const getStatusTier = (level: number) => {
  if (level >= 31) return { title: 'Legend', color: 'text-amber-400', glow: 'status-glow-legend', badge: '💎' };
  if (level >= 21) return { title: 'King / Queen', color: 'text-purple-400', glow: 'status-glow-icon', badge: '👑' };
  if (level >= 11) return { title: 'Influencer', color: 'text-blue-400', glow: 'status-glow-star', badge: '🔥' };
  if (level >= 6) return { title: 'Rising Star', color: 'text-emerald-400', glow: '', badge: '⭐' };
  return { title: 'Starter', color: 'text-slate-400', glow: '', badge: '🌱' };
};

const getSquadRank = (spent: number) => {
  if (spent >= 500) return { title: 'Inner Circle', color: 'text-rose-500', badge: '👑' };
  if (spent >= 200) return { title: 'VIP', color: 'text-amber-400', badge: '💎' };
  if (spent >= 50) return { title: 'Active Fan', color: 'text-blue-400', badge: '🔥' };
  return { title: 'Member', color: 'text-white/60', badge: '✨' };
};

// --- Components ---

const ParticipantCell = ({ 
  participant, 
  onRemove, 
  onPin, 
  onMute, 
  onCamera, 
  onInvite, 
  onFollow, 
  onClick, 
  variant = 'default', 
  isJoined = false,
  crownSender,
  lastGift,
  isViewerView = false,
  customBackground
}: { 
  participant: any, 
  key?: any,
  onRemove?: (id: string) => void, 
  onPin?: (id: string) => void,
  onMute?: (id: string) => void,
  onCamera?: (id: string) => void,
  onInvite?: () => void,
  onFollow?: (id: string) => void,
  onClick?: (participant: any) => void,
  variant?: 'default' | 'background',
  isJoined?: boolean,
  crownSender?: string | null,
  lastGift?: { emoji: string; count: number } | null,
  isViewerView?: boolean,
  customBackground?: string
}) => {
  if (participant.isEmpty) {
    if (isViewerView) return <div className="guest-cell bg-black/20 rounded-2xl border border-white/5" />;
    return (
      <div className={`guest-cell flex items-center justify-center bg-white/5 border border-white/10 transition-all hover:bg-white/10 ${isJoined ? 'rounded-none' : 'rounded-2xl border-dashed border-2'}`}>
        <button onClick={onInvite} className="flex flex-col items-center gap-1 text-white/20 hover:text-white/40 transition-all">
          <UserPlus size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Invite</span>
        </button>
      </div>
    );
  }

  const isHost = participant.isHost;
  const isPinned = participant.isPinned;
  const isBackground = variant === 'background';

  return (
    <motion.div 
      layoutId={`participant-${participant.id}`}
      initial={{ scale: isBackground ? 1 : 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onClick={() => onClick?.(participant)}
      className={`guest-cell relative overflow-hidden transition-all duration-300 group h-full w-full cursor-pointer ${
        isBackground ? 'rounded-0 border-0' : 
        (isPinned ? 'pinned-class border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] border' : 
        isHost ? 'host-class border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] border' : 
        'border-white/5 glass-dark border')
      } ${isJoined ? 'rounded-none border-white/10' : 'rounded-2xl'}`}
    >
      {isHost && crownSender && (
        <motion.div 
          initial={{ y: -50, opacity: 0, scale: 0.5 }}
          animate={{ y: -20, opacity: 1, scale: 1, rotateY: [0, 360] }}
          transition={{ duration: 0.5, rotateY: { repeat: Infinity, duration: 3, ease: "linear" } }}
          className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="relative">
            <Crown size={32} className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" fill="currentColor" />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-400 text-black text-[8px] font-black px-2 py-0.5 rounded-full shadow-xl ring-2 ring-white/20">
              {crownSender}
            </div>
          </div>
        </motion.div>
      )}

      {participant.isCameraOff ? (
        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
          <VideoOff size={32} className="text-white/10" />
        </div>
      ) : (
        <img 
          src={customBackground || participant.avatar} 
          className={`w-full h-full ${isBackground ? 'object-contain' : 'object-cover group-hover:scale-110'} opacity-90 transition-transform duration-700`} 
          alt={participant.name} 
          referrerPolicy="no-referrer" 
        />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      
      {/* Top Overlay (Badges & Coins) */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {isPinned && (
              <div className="bg-amber-400 text-black px-1.5 py-0.5 rounded-[4px] text-[7px] font-black tracking-widest flex items-center gap-1 shadow-lg">
                <Zap size={8} fill="currentColor" />
                PINNED
              </div>
            )}
          </div>
        </div>

        {/* Coins at the top right */}
        {!isBackground && (
          <div className={`flex items-center gap-1 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-lg border border-white/20 ${isHost ? 'bg-rose-500/90' : 'bg-black/40'}`}>
            <Zap size={8} className="text-amber-300" fill="currentColor" />
            <span className="text-[9px] font-black text-white">{participant.coins}</span>
          </div>
        )}
      </div>

      {/* Un-expand button for spotlighted background */}
      {isBackground && !isHost && !isViewerView && (
        <button 
          onClick={(e) => { e.stopPropagation(); onPin?.(participant.id); }}
          className="absolute top-12 right-4 z-30 p-2 glass-dark rounded-full border border-white/20 text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90"
          title="Un-expand"
        >
          <Maximize2 size={18} className="rotate-180" />
        </button>
      )}

      {/* Info Overlay */}
      <div className={`absolute ${isBackground ? 'top-24 left-4' : 'bottom-2 left-2 right-2'} flex flex-col gap-1`}>
        {lastGift && (
          <motion.div
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -20 }}
            className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-amber-400/50 self-start mb-1"
          >
            <span className="text-lg drop-shadow-lg">{lastGift.emoji}</span>
            <span className="text-[10px] font-black text-amber-400 italic">x{lastGift.count}</span>
          </motion.div>
        )}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1.5 ${isBackground ? 'max-w-none bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10' : 'max-w-[90%]'}`}>
            {isBackground && <Flame size={12} className="text-amber-400 animate-pulse" fill="currentColor" />}
            <span className={`${isBackground ? 'text-xs' : 'text-[10px]'} font-black text-white truncate drop-shadow-md flex items-center gap-1 ${getStatusTier(participant.level || 5).color}`}>
              <span className="animate-bounce-slow text-[8px]">{getStatusTier(participant.level || 5).badge}</span>
              {participant.name}
            </span>
            {!isHost && !participant.isFollowed && (
              <button 
                onClick={(e) => { e.stopPropagation(); onFollow?.(participant.id); }}
                className="bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors shadow-lg"
              >
                <Plus size={8} />
              </button>
            )}
            {participant.isMuted && <Mic size={10} className="text-rose-500" />}
          </div>
        </div>
      </div>

    </motion.div>
  );
};

const PKAIAssistant = ({ 
  show, 
  onClose, 
  prediction, 
  suggestion, 
  analysis, 
  rematch,
  leaderboard,
  onRefresh
}: { 
  show: boolean; 
  onClose: () => void; 
  prediction: PKPrediction | null; 
  suggestion: PKAssistantSuggestion | null; 
  analysis: ViewerAnalysis | null;
  rematch: RematchRecommendation | null;
  leaderboard: LeaderboardEntry[];
  onRefresh: () => void;
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute inset-x-0 bottom-0 z-[300] h-[70%] bg-slate-950/95 backdrop-blur-2xl rounded-t-[40px] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-rose-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Brain size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">AI PK Assistant</h2>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Real-time Battle Insights</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={onRefresh}
                className="p-2 rounded-full bg-white/5 text-white/60 hover:bg-white/10 transition-all active:scale-90"
              >
                <RefreshCw size={18} />
              </button>
              <button 
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 text-white/60 hover:bg-white/10 transition-all active:scale-90"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {/* Prediction Card */}
            {prediction && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-3xl p-5 border border-white/10 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp size={64} />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-4 bg-amber-400 rounded-full" />
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">Winner Prediction</span>
                </div>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <span className="text-3xl font-black text-white tracking-tighter">{prediction.predictedWinner}</span>
                    <span className="text-sm font-bold text-white/40 ml-2">to win</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-400">{prediction.confidence}</span>
                    <p className="text-[8px] font-bold text-white/40 uppercase">Confidence</p>
                  </div>
                </div>
                <p className="text-xs text-white/70 leading-relaxed italic">"{prediction.reason}"</p>
              </motion.div>
            )}

            {/* Strategy Suggestion */}
            {suggestion && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-rose-500/10 to-purple-500/10 rounded-3xl p-5 border border-rose-500/20"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-4 bg-rose-500 rounded-full" />
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Strategy Suggestion</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
                    <p className="text-[8px] font-bold text-white/40 uppercase mb-1">Recommended Gift</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎁</span>
                      <span className="text-xs font-black text-white">{suggestion.giftType}</span>
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
                    <p className="text-[8px] font-bold text-white/40 uppercase mb-1">Target Amount</p>
                    <div className="flex items-center gap-1">
                      <Zap size={12} className="text-amber-400" fill="currentColor" />
                      <span className="text-xs font-black text-white">{suggestion.coins} Coins</span>
                    </div>
                  </div>
                </div>
                <div className="bg-rose-500/20 rounded-2xl p-4 border border-rose-500/30">
                  <p className="text-[8px] font-bold text-rose-300 uppercase mb-2">Motivational Message</p>
                  <p className="text-xs text-white font-medium leading-relaxed">"{suggestion.message}"</p>
                </div>
              </motion.div>
            )}

            {/* Viewer Analysis */}
            {analysis && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 rounded-3xl p-5 border border-white/10"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-4 bg-blue-400 rounded-full" />
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Viewer Behavior</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[8px] font-bold text-white/40 uppercase mb-1">Summary</p>
                    <p className="text-xs text-white/80">{analysis.viewerTypeSummary}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <p className="text-[8px] font-bold text-blue-300 uppercase mb-1">Persuasion Tips</p>
                    <p className="text-[11px] text-white/90">{analysis.persuasionTips}</p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-bold text-white/60">Comeback Potential</span>
                    <span className="text-xs font-black text-blue-400">{analysis.comebackAssessment}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rematch Advice */}
            {rematch && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-400/10 rounded-3xl p-5 border border-amber-400/20"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-4 bg-amber-400 rounded-full" />
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">Post-Battle Advice</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-black text-white">Recommend Rematch?</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${rematch.recommendRematch === 'Ndio' ? 'bg-green-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {rematch.recommendRematch}
                  </span>
                </div>
                <p className="text-xs text-white/70 mb-4 italic">"{rematch.reason}"</p>
                <div className="flex flex-col gap-3">
                  <div className="bg-black/20 rounded-2xl p-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/40">Suggested Wait</span>
                    <span className="text-xs font-black text-amber-400">{rematch.suggestedWaitTime}</span>
                  </div>
                  <button 
                    onClick={async () => {
                      const msg = await aiService.getRematchNotification();
                      onClose();
                      // Simulate sending message
                      alert(`Rematch Notification Sent: ${msg}`);
                    }}
                    className="w-full py-3 bg-amber-400 text-black rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Send Rematch Invite
                  </button>
                </div>
              </motion.div>
            )}

            {/* AI Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-4 bg-purple-400 rounded-full" />
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Top Performers (AI Analysis)</span>
                </div>
                {leaderboard.map((entry, idx) => (
                  <div key={idx} className="bg-white/5 rounded-2xl p-3 flex items-center justify-between border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-[10px] font-black text-white border border-white/10">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">{entry.username}</p>
                        <p className="text-[8px] font-bold text-purple-400 uppercase">{entry.specialAward}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-amber-400">{entry.totalCoins} Coins</p>
                      <p className="text-[8px] font-bold text-white/40 uppercase">{entry.pkWins} PK Wins</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-6 bg-black/40 border-t border-white/5">
            <button 
              onClick={onRefresh}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-rose-600 rounded-2xl text-white text-sm font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} className={false ? 'animate-spin' : ''} />
              Refresh AI Insights
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', user: 'System', text: 'Welcome to Skylook Live! ❤️', type: 'system' },
    { id: '2', user: 'Sara_M', avatar: 'https://i.pravatar.cc/150?u=sara', level: 15, text: 'Hello @Amina_Juma 😍', type: 'chat' },
  ]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCoinPurchaseModal, setShowCoinPurchaseModal] = useState(false);
  const [profileTab, setProfileTab] = useState<'info' | 'nexus' | 'status'>('info');
  const [selectedUser, setSelectedUser] = useState<{ name: string; avatar: string; level: number; bio: string; isMe?: boolean } | null>(null);
  const [hearts, setHearts] = useState<HeartItem[]>([]);
  const [combo, setCombo] = useState<{ gift: string; count: number; user: string } | null>(null);
  const [isGuestLive, setIsGuestLive] = useState(false);
  const [guestControlsOpen, setGuestControlsOpen] = useState(false);
  const [host1CamOn, setHost1CamOn] = useState(true);
  const [host2CamOn, setHost2CamOn] = useState(true);
  const [isPKActive, setIsPKActive] = useState(false);
  const [currentChallenger, setCurrentChallenger] = useState<any>(null);
  const [showPKSelection, setShowPKSelection] = useState(false);
  const [searchChallenger, setSearchChallenger] = useState('');
  const [musicVolume, setMusicVolume] = useState(50);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [liveHosts] = useState([
    { id: 'h1', name: 'Pepelle', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', level: 55, viewers: '12.4k' },
    { id: 'h2', name: 'Diamond_Platnumz', avatar: 'https://i.pravatar.cc/150?u=diamond', level: 99, viewers: '85.2k' },
    { id: 'h3', name: 'Nandy_Africa', avatar: 'https://i.pravatar.cc/150?u=nandy', level: 48, viewers: '9.1k' },
    { id: 'h4', name: 'Harmonize_TZ', avatar: 'https://i.pravatar.cc/150?u=harmonize', level: 62, viewers: '15.3k' },
    { id: 'h5', name: 'Ali_Kiba', avatar: 'https://i.pravatar.cc/150?u=alikiba', level: 58, viewers: '11.8k' },
  ]);
  const [isFollowed, setIsFollowed] = useState(false);
  const [crownSender, setCrownSender] = useState<string | null>(null);
  const [userName, setUserName] = useState("Pepelle");
  const [isMember, setIsMember] = useState(false);
  const [streak] = useState(7); // 7-day streak
  const [userLevel, setUserLevel] = useState(1);
  const [totalSpent, setTotalSpent] = useState(0);
  const [showNexus, setShowNexus] = useState(false);
  const [showSkylookStatus, setShowSkylookStatus] = useState(false);
  const [showSkylookLegends, setShowSkylookLegends] = useState(false);
  const [coins, setCoins] = useState(1240);
  const [hostCoins, setHostCoins] = useState(4200);
  const [showPKErrorModal, setShowPKErrorModal] = useState(false);
  const [activeGifterPopup, setActiveGifterPopup] = useState<{ name: string; avatar: string; level: number; gift: string; count: number } | null>(null);
  const [lastGifts, setLastGifts] = useState<Record<string, { emoji: string; count: number }>>({});
  const [bigGift, setBigGift] = useState<{ emoji: string; name: string } | null>(null);
  const [showViewerList, setShowViewerList] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [showMVP, setShowMVP] = useState(false);
  const [isMutedHost, setIsMutedHost] = useState(false);
  const [isRequestingToJoin, setIsRequestingToJoin] = useState(false);
  const [publicLevelUp, setPublicLevelUp] = useState<{ user: string; level: number } | null>(null);
  const [selectedGuestForGift, setSelectedGuestForGift] = useState<any | null>(null);
  const [isMutedChallenger, setIsMutedChallenger] = useState(false);
  const [hostGifters] = useState([
    "https://i.pravatar.cc/150?u=g1",
    "https://i.pravatar.cc/150?u=g2",
    "https://i.pravatar.cc/150?u=g3"
  ]);
  const [challengerGifters] = useState([
    "https://i.pravatar.cc/150?u=g4",
    "https://i.pravatar.cc/150?u=g5"
  ]);
  const [joinNotifications, setJoinNotifications] = useState<JoinNotification[]>([]);
  const [showHostControl, setShowHostControl] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [activeBackground, setActiveBackground] = useState<string | null>("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeMusic, setActiveMusic] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (activeMusic) {
      const track = musicTracks.find(t => t.name === activeMusic);
      if (track) {
        if (audioRef.current) {
          audioRef.current.src = track.url;
          audioRef.current.volume = musicVolume / 100;
          audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [activeMusic]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume / 100;
    }
  }, [musicVolume]);
  const [guestRequests, setGuestRequests] = useState([
    { id: 'r1', name: 'Juma_99', avatar: 'https://i.pravatar.cc/150?u=juma', level: 12 },
    { id: 'r2', name: 'Aisha_Vibes', avatar: 'https://i.pravatar.cc/150?u=aisha', level: 25 },
    { id: 'r3', name: 'Zaid_King', avatar: 'https://i.pravatar.cc/150?u=zaid', level: 8 },
    { id: 'r4', name: 'Mariam_Cool', avatar: 'https://i.pravatar.cc/150?u=mariam', level: 15 },
    { id: 'r5', name: 'Bakari_TZ', avatar: 'https://i.pravatar.cc/150?u=bakari', level: 30 },
    { id: 'r6', name: 'Fatma_Star', avatar: 'https://i.pravatar.cc/150?u=fatma', level: 22 },
    { id: 'r7', name: 'Hassan_Pro', avatar: 'https://i.pravatar.cc/150?u=hassan', level: 18 },
    { id: 'r8', name: 'Neema_Joy', avatar: 'https://i.pravatar.cc/150?u=neema', level: 10 },
    { id: 'r9', name: 'Omari_Vlog', avatar: 'https://i.pravatar.cc/150?u=omari', level: 28 },
    { id: 'r10', name: 'Rehema_G', avatar: 'https://i.pravatar.cc/150?u=rehema', level: 14 },
    { id: 'r11', name: 'Said_Music', avatar: 'https://i.pravatar.cc/150?u=said', level: 35 },
    { id: 'r12', name: 'Tausi_Queen', avatar: 'https://i.pravatar.cc/150?u=tausi', level: 20 },
  ]);
  const [activeHostTab, setActiveHostTab] = useState<'main' | 'background' | 'music' | 'requests' | 'grid' | 'guests' | 'peak-hours'>('main');
  const [isViewerView, setIsViewerView] = useState(false);
  const [activeGuests, setActiveGuests] = useState<Guest[]>([]);
  const [sessionCoins, setSessionCoins] = useState<Record<string, number>>({});
  const [gridLayout, setGridLayout] = useState<'grid' | 'spotlight' | 'horizontal' | 'bento' | 'bubbles' | 'sidebar' | 'stacked' | 'dynamic' | 'dual' | null>(null);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [maxRooms, setMaxRooms] = useState(1);
  const [selectedGuestForControl, setSelectedGuestForControl] = useState<any | null>(null);
  const [customBackgrounds, setCustomBackgrounds] = useState<Record<string, string>>({});
  const [targetGuest, setTargetGuest] = useState<any | null>(null);
  
  // --- AI State ---
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [pkPrediction, setPkPrediction] = useState<PKPrediction | null>(null);
  const [pkSuggestion, setPkSuggestion] = useState<PKAssistantSuggestion | null>(null);
  const [viewerAnalysis, setViewerAnalysis] = useState<ViewerAnalysis | null>(null);
  const [rematchAdvice, setRematchAdvice] = useState<RematchRecommendation | null>(null);
  const [aiLeaderboard, setAiLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [peakHourData, setPeakHourData] = useState<string[]>([]);
  
  // --- New High-Retention State ---
  const [energy, setEnergy] = useState(0);
  const [totalSpentInLive, setTotalSpentInLive] = useState(0);
  const [fomoEvent, setFomoEvent] = useState<{ type: string; endTime: number } | null>(null);
  const [missions, setMissions] = useState<Mission[]>([
    { id: 'm1', title: 'Send 10 Gifts', progress: 0, target: 10, reward: 50, type: 'gift', isCompleted: false },
    { id: 'm2', title: 'Stay for 10 Mins', progress: 0, target: 10, reward: 100, type: 'time', isCompleted: false },
    { id: 'm3', title: 'Join 3 Lives', progress: 1, target: 3, reward: 30, type: 'join', isCompleted: false },
  ]);
  const [vipTier, setVipTier] = useState<'Basic' | 'VIP' | 'ELITE'>('Basic');
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [spotlightedUser, setSpotlightedUser] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([]);
  const [energyMilestoneBurst, setEnergyMilestoneBurst] = useState(false);

  // ============================================
  // BADILIKO #2: ONGEZA STATE HIZI MBILI
  // ============================================
  const [supabaseUsers, setSupabaseUsers] = useState<any[]>([]);
  const [supabaseLeaderboard, setSupabaseLeaderboard] = useState<any[]>([]);

  const addToast = (text: string) => {
    const id = generateId();
    setToasts(prev => [...prev, { id, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  useEffect(() => {
    const newLevel = calculateLevel(totalSpent);
    if (newLevel > userLevel) {
      setUserLevel(newLevel);
      setPublicLevelUp({ user: userName, level: newLevel });
      setTimeout(() => setPublicLevelUp(null), 5000);
    }
  }, [totalSpent, userLevel]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const giftTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeLeft > 0 && isPKActive) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && isPKActive) {
      setShowMVP(true);
      setTimeout(() => setShowMVP(false), 5000);
    }
  }, [timeLeft, isPKActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ============================================
  // BADILIKO #3: ONGEZA USEFFECT HUU
  // ============================================
  useEffect(() => {
    const loadSupabaseData = async () => {
      try {
        const { data: users } = await supabase.from('users').select('*');
        if (users) setSupabaseUsers(users);
        const { data: leaderboard } = await supabase.from('leaderboard').select('*').limit(5);
        if (leaderboard) setSupabaseLeaderboard(leaderboard);
      } catch (err) {
        console.error('Supabase error:', err);
      }
    };
    loadSupabaseData();
  }, []);

  const startPKWithChallenger = (challenger: any) => {
    if (activeGuests.length > 0) {
      setShowPKErrorModal(true);
      return;
    }
    setCurrentChallenger(challenger);
    setIsPKActive(true);
    setShowPKSelection(false);
    setMessages(prev => [...prev, { 
      id: generateId(), 
      user: 'System', 
      text: `⚔️ PK Battle imeanza dhidi ya ${challenger.name}!`, 
      type: 'system' 
    }]);
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setActiveBackground(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRefreshAI = async () => {
    setIsAILoading(true);
    try {
      const giftHistory = messages
        .filter(m => m.type === 'gift')
        .slice(-10)
        .map(m => `${m.user} sent ${m.giftIcon} x${m.count}`)
        .join(', ');

      const [pred, sug, anal, lead] = await Promise.all([
        aiService.predictWinner({
          hostPoints: hostCoins,
          challengerPoints: 5800,
          timeLeft,
          giftHistory: giftHistory || "Hakuna zawadi bado"
        }),
        aiService.getPKAssistantSuggestion({
          difference: hostCoins - 5800,
          timeLeft,
          winningSide: hostCoins > 5800 ? "Host" : "Challenger"
        }),
        aiService.analyzeViewerBehavior({
          totalCoins: hostCoins + 5800,
          highValueGiftersCount: 10,
          sideSwitchersCount: 3
        }),
        aiService.generateLeaderboard(JSON.stringify(messages.filter(m => m.type === 'gift').slice(-20)))
      ]);

      setPkPrediction(pred);
      setPkSuggestion(sug);
      setViewerAnalysis(anal);
      setAiLeaderboard(lead);
    } catch (error) {
      console.error("AI Refresh failed:", error);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleRefreshPeakHours = async () => {
    setIsAILoading(true);
    try {
      const peaks = await aiService.getPeakHourRecommendations({
        peakHours: "20:00 - 23:00",
        peakDays: "Ijumaa, Jumamosi",
        giftTypes: "Universe, Lion, Whale"
      });
      setPeakHourData(peaks);
    } catch (error) {
      addToast("⚠️ Imeshindwa kupata data ya Peak Hours");
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const status = getStatusTier(userLevel);
    const squad = getSquadRank(totalSpentInLive);
    
    const newMessage: Message = {
      id: generateId(),
      user: userName,
      avatar: 'https://i.pravatar.cc/150?u=you',
      level: userLevel,
      text: inputText,
      type: 'chat',
      replyTo: replyingTo?.user,
      statusTitle: status.title,
      squadRank: squad.title,
      vipTier: vipTier,
      isHighlighted: inputText.startsWith('!boost') || inputText.length > 50 // Example logic
    };
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setReplyingTo(null);
  };

  const handleBoost = (type: 'highlight' | 'pin' | 'spotlight' | 'effect') => {
    const costs = { highlight: 5, pin: 10, spotlight: 20, effect: 50 };
    const cost = costs[type];
    if (coins < cost) {
      addToast("❌ Not enough coins!");
      return;
    }

    setCoins(prev => prev - cost);
    setTotalSpentInLive(prev => prev + cost);

    if (type === 'highlight') {
      addToast("✨ Next message will be highlighted!");
    } else if (type === 'pin') {
      addToast("📌 Message Pinned!");
      // Pin logic
    } else if (type === 'spotlight') {
      addToast("🔦 You are in the Spotlight!");
      setSpotlightedUser('You');
      setTimeout(() => setSpotlightedUser(null), 10000);
    } else if (type === 'effect') {
      addToast("🎆 Live Effect Triggered!");
    }
  };

  // FOMO Event System
  useEffect(() => {
    const interval = setInterval(() => {
      if (!fomoEvent) {
        if (Math.random() < 0.2) {
          addToast("🔥 Double Rewards for 30s!");
          setFomoEvent({ type: 'double', endTime: Date.now() + 30000 });
          setTimeout(() => setFomoEvent(null), 30000);
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [fomoEvent]);

  // Mission Time Tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setMissions(prev => prev.map(m => {
        if (m.type === 'time' && !m.isCompleted) {
          const nextProgress = m.progress + 1;
          if (nextProgress >= m.target) {
            addToast(`✅ Mission Complete: ${m.title}`);
            setCoins(c => c + m.reward);
            return { ...m, progress: nextProgress, isCompleted: true };
          }
          return { ...m, progress: nextProgress };
        }
        return m;
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const triggerHeart = () => {
    const newHeart: HeartItem = {
      id: generateId(),
      x: Math.random() * 40 - 20,
      color: ['#ec4899', '#f43f5e', '#ef4444', '#f97316'][Math.floor(Math.random() * 4)]
    };
    setHearts(prev => [...prev, newHeart]);
    
    // Energy System
    setEnergy(prev => {
      const multiplier = energyMilestoneBurst ? 3 : 1; // 3x multiplier during burst
      const next = prev + (1 * multiplier);
      const milestones = [100, 500, 1000, 5000];
      if (milestones.some(m => prev < m && next >= m)) {
        addToast("🔥 Energy Boost Unlocked!");
        setEnergyMilestoneBurst(true);
        setTimeout(() => setEnergyMilestoneBurst(false), 3000); // Longer burst
      }
      return next;
    });

    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 2000);
  };

  const sendGift = (gift: { name: string; emoji: string; price: number }) => {
    if (coins < gift.price) {
      setShowCoinPurchaseModal(true);
      return;
    }
    
    setCoins(prev => prev - gift.price);
    setTotalSpent(prev => prev + gift.price);
    setTotalSpentInLive(prev => prev + gift.price);

    // Energy System (Gifts give 2x Energy, or 4x during FOMO event)
    const energyMultiplier = fomoEvent?.type === 'double' ? 4 : 2;
    const energyGain = gift.price * energyMultiplier;
    
    setEnergy(prev => {
      const next = prev + energyGain;
      const milestones = [100, 500, 1000, 5000];
      milestones.forEach(m => {
        if (prev < m && next >= m) {
          addToast("🔥 Energy Boost Unlocked!");
          setEnergyMilestoneBurst(true);
          setTimeout(() => setEnergyMilestoneBurst(false), 1000);
        }
      });
      return next;
    });

    // Mission Tracking
    setMissions(prev => prev.map(m => {
      if (m.type === 'gift' && !m.isCompleted) {
        const nextProgress = m.progress + 1;
        if (nextProgress >= m.target) {
          addToast(`✅ Mission Complete: ${m.title}`);
          setCoins(c => c + m.reward);
          return { ...m, progress: nextProgress, isCompleted: true };
        }
        return { ...m, progress: nextProgress };
      }
      return m;
    }));
    
    // Update recipient coins
    const targetId = targetGuest?.id || 'host';
    if (targetId === 'host') {
      setHostCoins(prev => prev + gift.price);
    } else if (targetId === 'challenger') {
      // Challenger coins (simulated)
    } else {
      setActiveGuests(prev => prev.map(g => 
        g.id === targetGuest?.id ? { ...g, coins: g.coins + gift.price } : g
      ));
    }

    // Update last gift for recipient
    setLastGifts(prev => ({
      ...prev,
      [targetId]: { 
        emoji: gift.emoji, 
        count: (prev[targetId]?.emoji === gift.emoji ? prev[targetId].count + 1 : 1) 
      }
    }));
    
    let currentCount = 1;
    setCombo(prev => {
      if (prev && prev.gift === gift.emoji) {
        currentCount = prev.count + 1;
        setActiveGifterPopup({ name: userName, avatar: 'https://i.pravatar.cc/150?u=pepelle', level: userLevel, gift: gift.emoji, count: currentCount });
        return { ...prev, count: currentCount };
      }
      setActiveGifterPopup({ name: userName, avatar: 'https://i.pravatar.cc/150?u=pepelle', level: userLevel, gift: gift.emoji, count: 1 });
      return { gift: gift.emoji, count: 1, user: userName };
    });

    // Clear popup after 3 seconds
    if (giftTimeoutRef.current) clearTimeout(giftTimeoutRef.current);
    giftTimeoutRef.current = setTimeout(() => {
      setActiveGifterPopup(null);
      setLastGifts(prev => {
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
    }, 3000);

    // Big Gift Animation
    if (gift.price >= 500) {
      setBigGift({ emoji: gift.emoji, name: gift.name });
      setTimeout(() => setBigGift(null), 4000);
      
      // Trigger AI Celebration for big gifts
      if (gift.price >= 1000) {
        aiService.getTopGifterCelebration(userName, totalSpent).then(msg => {
          setMessages(prev => [...prev, {
            id: generateId(),
            user: 'AI Assistant',
            text: msg,
            type: 'system'
          }]);
        });
      }
    }

    // Spotlight Moment for high-value gifts
    if (gift.price >= 50) {
      // addToast(`👑 SPOTLIGHT: You sent a ${gift.name}!`); // Removed as per request
    }
    
    // Add to chat
    const giftMsg: Message = {
      id: generateId(),
      user: userName,
      avatar: 'https://i.pravatar.cc/150?u=you',
      level: userLevel,
      text: `sent ${gift.name} to ${targetGuest?.name || 'Pepelle'}`,
      type: 'gift',
      giftIcon: gift.emoji,
      count: combo?.gift === gift.emoji ? combo.count + 1 : 1,
      statusTitle: getStatusTier(userLevel).title,
      squadRank: getSquadRank(totalSpentInLive + gift.price).title,
      vipTier: vipTier
    };
    
    // Update or add message
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.type === 'gift' && lastMsg.giftIcon === gift.emoji && lastMsg.user === userName) {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...giftMsg,
          count: (lastMsg.count || 1) + 1
        };
        return newMessages;
      }
      return [...prev, giftMsg];
    });

    // ============================================
    // BADILIKO #4: ONGEZA MSTARI HUU MWISHONI MWA sendGift
    // ============================================
    supabase.from('gifts').insert({
      sender_name: userName,
      receiver_name: targetGuest?.name || 'Pepelle',
      gift_name: gift.name,
      gift_emoji: gift.emoji,
      coins: gift.price
    }).catch(console.error);

    // Reset combo after delay
    if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
    comboTimeoutRef.current = setTimeout(() => setCombo(null), 3000);
  };

  const triggerJoinNotification = (user: string, level: number, avatar: string) => {
    const id = generateId();
    setJoinNotifications(prev => [...prev, { id, user, level, avatar }]);
    setTimeout(() => {
      setJoinNotifications(prev => prev.filter(n => n.id !== id));
    }, 3500);
  };

  // Simulate high-level user joining for demo
  useEffect(() => {
    const levels = [15, 35, 55, 12, 42, 88];
    const names = ["Noble_User", "Elite_Gifter", "Legendary_King", "Rising_Star", "Aura_Master", "God_Tier"];
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < levels.length) {
        const name = names[index];
        const level = levels[index];
        triggerJoinNotification(name, level, `https://i.pravatar.cc/150?u=${name}`);
        
        // AI Welcome for high level users
        if (level >= 50) {
          aiService.getWelcomeMessage(1).then(msg => {
            setMessages(prev => [...prev, {
              id: generateId(),
              user: 'AI Assistant',
              text: msg,
              type: 'system'
            }]);
          });
        }
        index++;
      } else {
        index = 0; // Loop for demo
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // AI PK Prediction & Suggestion during PK
  useEffect(() => {
    if (isPKActive && timeLeft % 30 === 0 && timeLeft > 0) {
      // Every 30 seconds, get AI insights
      const giftHistory = messages
        .filter(m => m.type === 'gift')
        .slice(-5)
        .map(m => `${m.user} sent ${m.giftIcon} x${m.count}`)
        .join(', ');

      aiService.predictWinner({
        hostPoints: hostCoins,
        challengerPoints: 5800, // Simulated challenger points
        timeLeft,
        giftHistory: giftHistory || "Hakuna zawadi bado"
      }).then(setPkPrediction);

      aiService.getPKAssistantSuggestion({
        difference: hostCoins - 5800,
        timeLeft,
        winningSide: hostCoins > 5800 ? "Host" : "Challenger"
      }).then(setPkSuggestion);
      
      aiService.analyzeViewerBehavior({
        totalCoins: hostCoins + 5800,
        highValueGiftersCount: 10, // Simulated
        sideSwitchersCount: 3 // Simulated
      }).then(setViewerAnalysis);
    }
  }, [isPKActive, timeLeft]);

  // AI Rematch Advice when PK ends
  useEffect(() => {
    if (!isPKActive && timeLeft === 0) {
      aiService.recommendRematch({
        winner: hostCoins > 5800 ? "Host" : "Challenger",
        pointDifference: Math.abs(hostCoins - 5800),
        duration: "5:00",
        bigGifts: messages.filter(m => m.type === 'gift' && (m.count || 0) > 10).length
      }).then(setRematchAdvice);
    }
  }, [isPKActive, timeLeft]);

  // Sync maxRooms with activeGuests count to ensure it always matches the room count
  useEffect(() => {
    if (maxRooms < activeGuests.length + 1) {
      setMaxRooms(activeGuests.length + 1);
    }
  }, [activeGuests.length, maxRooms]);

  const addGuest = (request: { id: string; name: string; avatar: string }) => {
    if (isPKActive) {
      addToast("⚠️ Huwezi kuongeza mgeni wakati wa PK Battle!");
      return;
    }
    if (activeGuests.length >= 11) {
      // Add system message about limit
      setMessages(prev => [...prev, {
        id: generateId(),
        user: 'System',
        text: 'Guest limit reached (Max 11 guests). Remove a guest to add more.',
        type: 'chat'
      }]);
      return;
    }
    const existingCoins = sessionCoins[request.id] || 0;
    const newGuest: Guest = {
      id: request.id,
      name: request.name,
      avatar: request.avatar,
      coins: existingCoins,
      isMuted: false,
      isCameraOff: false
    };
    setActiveGuests(prev => [...prev, newGuest]);
    setGuestRequests(prev => prev.filter(r => r.id !== request.id));
  };

  const removeGuest = (guestId: string) => {
    const guest = activeGuests.find(g => g.id === guestId);
    if (guest) {
      setSessionCoins(prev => ({ ...prev, [guestId]: guest.coins }));
    }
    setActiveGuests(prev => prev.filter(g => g.id !== guestId));
    if (spotlightId === guestId) setSpotlightId(null);
  };

  const moveGuestUp = (id: string) => {
    setActiveGuests(prev => {
      const idx = prev.findIndex(g => g.id === id);
      if (idx <= 0) return prev;
      const newArr = [...prev];
      [newArr[idx - 1], newArr[idx]] = [newArr[idx], newArr[idx - 1]];
      return newArr;
    });
  };

  const moveGuestDown = (id: string) => {
    setActiveGuests(prev => {
      const idx = prev.findIndex(g => g.id === id);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const newArr = [...prev];
      [newArr[idx + 1], newArr[idx]] = [newArr[idx], newArr[idx + 1]];
      return newArr;
    });
  };

  const togglePin = (id: string) => {
    setActiveGuests(prev => prev.map(g => ({
      ...g,
      isPinned: g.id === id ? !g.isPinned : false
    })));
  };

  const toggleMuteGuest = (id: string) => {
    if (id === 'host') {
      setIsMicOn(!isMicOn);
      return;
    }
    setActiveGuests(prev => prev.map(g => g.id === id ? { ...g, isMuted: !g.isMuted } : g));
  };

  const toggleCameraGuest = (id: string) => {
    if (id === 'host') {
      setHost1CamOn(!host1CamOn);
      return;
    }
    setActiveGuests(prev => prev.map(g => g.id === id ? { ...g, isCameraOff: !g.isCameraOff } : g));
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (selectedGuestForControl) {
          setCustomBackgrounds(prev => ({
            ...prev,
            [selectedGuestForControl.id]: base64String
          }));
          addToast("Background updated!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const resetBackground = (id: string) => {
    setCustomBackgrounds(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    addToast("Restored profile picture");
  };

  const viewers = [
    { id: 'v1', name: 'Sara_M', avatar: 'https://i.pravatar.cc/150?u=sara', level: 15 },
    { id: 'v2', name: 'Aisha_Vibes', avatar: 'https://i.pravatar.cc/150?u=aisha', level: 25 },
    { id: 'v3', name: 'Zaid_King', avatar: 'https://i.pravatar.cc/150?u=zaid', level: 8 },
    { id: 'v4', name: 'Mariam_Cool', avatar: 'https://i.pravatar.cc/150?u=mariam', level: 15 },
    { id: 'v5', name: 'Bakari_TZ', avatar: 'https://i.pravatar.cc/150?u=bakari', level: 30 },
    { id: 'v6', name: 'Fatma_Star', avatar: 'https://i.pravatar.cc/150?u=fatma', level: 22 },
    { id: 'v7', name: 'Hassan_Pro', avatar: 'https://i.pravatar.cc/150?u=hassan', level: 18 },
    { id: 'v8', name: 'Neema_Joy', avatar: 'https://i.pravatar.cc/150?u=neema', level: 10 },
  ];

  const getOrderedParticipants = () => {
    const hostObj = { 
      id: 'host', 
      name: 'Pepelle', 
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', 
      coins: hostCoins, 
      isMuted: !isMicOn, 
      isCameraOff: !host1CamOn, 
      isHost: true 
    };

    const guests = activeGuests;
    let result: any[] = [];

    if (spotlightId) {
      const spotlighted = guests.find(g => g.id === spotlightId);
      const otherGuests = guests.filter(g => g.id !== spotlightId);
      if (spotlighted) {
        // Spotlighted guest takes index 0, Host moves to index 1
        result = [spotlighted, hostObj, ...otherGuests];
      } else {
        result = [hostObj, ...guests];
      }
    } else {
      const pinned = guests.find(g => g.isPinned);
      const otherGuests = guests.filter(g => !g.isPinned);
      if (pinned) {
        // Pinned guest takes index 0, Host moves to index 1
        result = [pinned, hostObj, ...otherGuests];
      } else {
        result = [hostObj, ...guests];
      }
    }
    
    // Only fill with empty slots if explicitly requested or for specific grid layouts that require a fixed structure
    // But per user request: "USIWEKE ROOMS ZISIZOKUWA NA WATU"
    // So we only return the actual participants.
    
    return result;
  };

  const orderedParticipants = getOrderedParticipants();
  const isCurrentUserHost = !isViewerView && orderedParticipants.find(p => p.name === userName)?.isHost;

  const handleParticipantClick = (p: any) => {
    if (isCurrentUserHost) {
      // Host can see the control modal for everyone
      setSelectedGuestForControl(p);
    } else {
      // Guest perspective
      if (p.name === userName) {
        // Clicking self -> Guest Control
        setSelectedGuestForControl(p);
      } else {
        // Clicking someone else -> Direct to Gift Panel
        setTargetGuest(p);
        setShowGiftPanel(true);
      }
    }
  };

  const toggleFollowGuest = (guestId: string) => {
    setActiveGuests(prev => prev.map(g => 
      g.id === guestId ? { ...g, isFollowed: !g.isFollowed } : g
    ));
    // Add system message
    const guest = activeGuests.find(g => g.id === guestId);
    if (guest && !guest.isFollowed) {
      setMessages(prev => [...prev, {
        id: generateId(),
        user: 'System',
        text: `You followed ${guest.name}! 💖`,
        type: 'chat'
      }]);
    }
  };

  const toggleSpotlight = (guestId: string) => {
    setSpotlightId(prev => prev === guestId ? null : guestId);
  };

  // Simulate coin earning for guests
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveGuests(prev => prev.map(g => ({
        ...g,
        coins: g.coins + Math.floor(Math.random() * 5)
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const openProfile = (name: string, avatar: string, level: number, bio: string) => {
    setSelectedUser({ name, avatar, level, bio, isMe: name === userName });
    setShowProfileModal(true);
  };

  const handleFollowClick = () => {
    if (!isFollowed) {
      setIsFollowed(true);
    } else if (!isMember && coins >= 1) {
      setIsMember(true);
      setCoins(prev => prev - 1);
      // Add system message
      setMessages(prev => [...prev, {
        id: generateId(),
        user: 'System',
        text: 'You joined Pepelle\'s team! 🎖️',
        type: 'chat'
      }]);
    }
  };


  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      {/* iPhone Canvas Container */}
      <div className="relative w-[390px] h-[844px] bg-slate-900 overflow-hidden shadow-2xl">
        
        {/* MAIN CANVAS BACKGROUND (IMAGE + GRADIENT) */}
        <div className="absolute inset-0 z-0">
          {(!gridLayout || gridLayout === 'sidebar') ? (
            <ParticipantCell 
              participant={orderedParticipants[0]} 
              variant="background"
              onPin={toggleSpotlight}
              onFollow={toggleFollowGuest}
              onClick={(p) => handleParticipantClick(p)}
              crownSender={crownSender}
              lastGift={lastGifts[orderedParticipants[0]?.id || 'host']}
              isViewerView={isViewerView}
              customBackground={customBackgrounds[orderedParticipants[0]?.id || 'host']}
            />
          ) : (
            <>
              {activeBackground && (
                <img 
                  src={activeBackground} 
                  className="w-full h-full object-contain opacity-40 transition-all duration-1000" 
                  alt="background"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-3xl" />
              <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 via-transparent to-blue-500/10" />
            </>
          )}
        </div>

        {/* PK BATTLE UI */}
        {isPKActive && (
          <div className="absolute inset-x-0 top-[75px] z-30 flex flex-col items-center px-3">
            {/* PK HEADER (Timer, Scores, VS) */}
            <div className="w-full flex flex-col items-center mb-2">
              {/* Timer Badge */}
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-black/60 backdrop-blur-md px-3 py-0.5 rounded-full border border-white/10 shadow-xl">
                  <span className="text-[9px] font-black text-white tracking-[0.3em]">{formatTime(timeLeft)}</span>
                </div>
                {pkPrediction && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-amber-400 text-black px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg"
                  >
                    <Brain size={8} fill="currentColor" />
                    AI: {pkPrediction.predictedWinner} ({pkPrediction.confidence})
                  </motion.div>
                )}
              </div>
              
              {/* Scores & VS Row */}
              <div className="w-full flex justify-between items-center px-8 mb-1 relative">
                {/* Host Score */}
                <div className="flex flex-col items-center">
                  <span className={`text-[8px] font-black uppercase tracking-widest mb-1 ${hostCoins >= 5000 ? 'text-amber-400' : 'text-rose-500'}`}>
                    {hostCoins >= 5000 ? 'Winning' : 'Losing'}
                  </span>
                  <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-full border border-rose-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-lg font-black text-white drop-shadow-md tracking-tighter">{(hostCoins/1000).toFixed(1)}k</span>
                  </div>
                </div>

                {/* VS Badge - Floating in center */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-600 via-purple-600 to-blue-600 p-[1.5px] shadow-[0_0_15px_rgba(147,51,234,0.4)]">
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                    <span className="text-xs font-black text-white italic tracking-tighter">VS</span>
                  </div>
                </div>

                {/* Challenger Score */}
                <div className="flex flex-col items-center">
                  <span className={`text-[8px] font-black uppercase tracking-widest mb-1 ${5800 > hostCoins ? 'text-blue-400' : 'text-slate-500'}`}>
                    {5800 > hostCoins ? 'Winning' : 'Losing'}
                  </span>
                  <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-full border border-blue-500/20">
                    <span className="text-lg font-black text-white drop-shadow-md tracking-tighter">5.8k</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* PK Progress Bar */}
              <div className="w-full h-3 bg-slate-900/80 rounded-full overflow-hidden border border-white/10 shadow-2xl flex relative">
                <motion.div 
                  animate={{ width: `${(hostCoins / (hostCoins + 5800)) * 100}%` }}
                  className="h-full bg-gradient-to-r from-rose-600 to-rose-400 relative transition-all duration-1000"
                >
                  <motion.div 
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                  />
                </motion.div>
                <motion.div 
                  animate={{ width: `${(5800 / (hostCoins + 5800)) * 100}%` }}
                  className="h-full bg-gradient-to-l from-blue-600 to-blue-400 relative transition-all duration-1000"
                >
                  <motion.div 
                    animate={{ x: ['100%', '-100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  />
                </motion.div>
                
                {/* Center Glow */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white/40 blur-sm z-10" />
              </div>
            </div>

            {/* PK VIDEO CARDS (The "Room Boxes") */}
            <div 
              className="w-full flex gap-2 h-[320px]"
            >
              {/* Host Card */}
              <div 
                onClick={() => setTargetGuest({ id: 'host', name: 'Pepelle', avatar: 'https://i.pravatar.cc/150?u=host', level: 42, coins: hostCoins, isHost: true })}
                className={`relative flex-1 group cursor-pointer transition-all duration-300 ${targetGuest?.id === 'host' ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-black rounded-[28px]' : ''}`}
              >
                <div className="relative h-full overflow-hidden rounded-[28px] border-2 border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.2)] transition-all duration-500 group-hover:border-rose-500/60">
                  {host1CamOn ? (
                    <img 
                      src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1000&q=80" 
                      className="w-full h-full object-contain transition-transform duration-700" 
                      alt="host 1"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                      <VideoOff size={32} className="text-white/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
                  
                  {/* Host Info Overlay */}
                  <div className="absolute top-3 left-3 z-20">
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full pl-1 pr-3 py-1 border border-white/10">
                      <img src="https://i.pravatar.cc/150?u=host" className="w-5 h-5 rounded-full border border-rose-500/50" alt="" referrerPolicy="no-referrer" />
                      <span className="text-[8px] font-bold text-white tracking-tight">Pepelle</span>
                    </div>
                  </div>

                  {/* Last Gift Overlay */}
                  <AnimatePresence>
                    {lastGifts['host'] && (
                      <motion.div 
                        initial={{ scale: 0.5, opacity: 0, y: 20 }}
                        animate={{ scale: 1.2, opacity: 1, y: 0 }}
                        exit={{ scale: 1.5, opacity: 0, y: -20 }}
                        className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[30] pointer-events-none"
                      >
                        <div className="relative">
                          <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{lastGifts['host'].emoji}</span>
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black px-1.5 rounded-full border border-white shadow-lg"
                          >
                            x{lastGifts['host'].count}
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Host Status Label */}
                  <div className="absolute bottom-4 left-4 z-20">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] drop-shadow-lg">HOST</span>
                      <div className="flex items-center gap-1 bg-rose-500/20 backdrop-blur-sm px-2 py-0.5 rounded-md border border-rose-500/30">
                        <div className="w-1 h-1 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-[6px] font-bold text-rose-200">LIVE</span>
                      </div>
                    </div>
                  </div>

                  {/* End Battle Action */}
                  {!isViewerView && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsPKActive(false); }}
                      className="absolute top-3 right-3 z-20 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:bg-rose-500/20 hover:text-rose-500 transition-all active:scale-90"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Challenger Card */}
              <motion.div 
                onClick={() => setTargetGuest({ id: 'challenger', name: currentChallenger?.name || 'Kevin K.', avatar: currentChallenger?.avatar || 'https://i.pravatar.cc/150?u=challenger', level: 38, coins: 5800, isHost: false })}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={`relative flex-1 group cursor-pointer transition-all duration-300 ${targetGuest?.id === 'challenger' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black rounded-[28px]' : ''}`}
              >
                <div className="relative h-full overflow-hidden rounded-[28px] border-2 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-500 group-hover:border-blue-500/60">
                  {host2CamOn ? (
                    <img 
                      src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1000&q=80" 
                      className="w-full h-full object-contain transition-transform duration-700" 
                      alt="host 2"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                      <VideoOff size={32} className="text-white/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

                  {/* Challenger Info Overlay */}
                  <div className="absolute top-3 left-3 z-20">
                    <div 
                      className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full pl-1 pr-3 py-1 border border-white/10 cursor-pointer active:opacity-60 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentChallenger) {
                          openProfile(currentChallenger.name, currentChallenger.avatar, currentChallenger.level, "Top Challenger | Let's Battle! 🔥");
                        } else {
                          openProfile("Kevin K.", "https://i.pravatar.cc/150?u=challenger", 38, "Top Challenger | Let's Battle! 🔥");
                        }
                      }}
                    >
                      <img src={currentChallenger?.avatar || "https://i.pravatar.cc/150?u=challenger"} className="w-5 h-5 rounded-full border border-blue-500/50" alt="" referrerPolicy="no-referrer" />
                      <span className="text-[8px] font-bold text-white tracking-tight truncate max-w-[60px]">{currentChallenger?.name || "Kevin K."}</span>
                    </div>
                  </div>

                  {/* Last Gift Overlay */}
                  <AnimatePresence>
                    {lastGifts['challenger'] && (
                      <motion.div 
                        initial={{ scale: 0.5, opacity: 0, y: 20 }}
                        animate={{ scale: 1.2, opacity: 1, y: 0 }}
                        exit={{ scale: 1.5, opacity: 0, y: -20 }}
                        className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[30] pointer-events-none"
                      >
                        <div className="relative">
                          <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{lastGifts['challenger'].emoji}</span>
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-black px-1.5 rounded-full border border-white shadow-lg"
                          >
                            x{lastGifts['challenger'].count}
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Challenger Status Label */}
                  <div className="absolute bottom-4 right-4 z-20 text-right">
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] drop-shadow-lg">CHALLENGER</span>
                      <div className="flex items-center gap-1 bg-blue-500/20 backdrop-blur-sm px-2 py-0.5 rounded-md border border-blue-500/30">
                        <span className="text-[6px] font-bold text-blue-200">AWAY</span>
                        <div className="w-1 h-1 rounded-full bg-blue-400" />
                      </div>
                    </div>
                  </div>

                  {/* Close Action */}
                  {!isViewerView && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsPKActive(false); }}
                      className="absolute top-3 right-3 z-20 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:bg-rose-500/20 hover:text-rose-500 transition-all active:scale-90"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* AUTO LAYOUT (Default when no gridLayout is selected) */}
        {!isPKActive && !gridLayout && activeGuests.length > 0 && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* Right Column (5 slots) */}
            <div className="absolute right-2 top-24 bottom-[320px] w-24 flex flex-col gap-0 pointer-events-auto overflow-y-auto no-scrollbar">
              {(() => {
                const rightGuests = orderedParticipants.slice(1, 6).filter(p => !p.isEmpty);
                return rightGuests.map((p) => (
                  <div key={p.id} className="w-24 h-24 shrink-0 overflow-hidden border border-white/20 shadow-lg">
                    <ParticipantCell 
                      participant={p} 
                      onClick={(part) => handleParticipantClick(part)}
                      onFollow={toggleFollowGuest}
                      crownSender={crownSender}
                      isJoined={true}
                      lastGift={lastGifts[p.id]}
                      isViewerView={isViewerView}
                      customBackground={customBackgrounds[p.id]}
                    />
                  </div>
                ));
              })()}
            </div>
            {/* Left Column (5 slots) */}
            <div className="absolute left-2 top-24 bottom-[320px] w-24 flex flex-col gap-0 pointer-events-auto overflow-y-auto no-scrollbar">
              {(() => {
                const leftGuests = orderedParticipants.slice(6, 11).filter(p => !p.isEmpty);
                return leftGuests.map((p) => (
                  <div key={p.id} className="w-24 h-24 shrink-0 overflow-hidden border border-white/20 shadow-lg">
                    <ParticipantCell 
                      participant={p} 
                      onClick={(part) => handleParticipantClick(part)}
                      onFollow={toggleFollowGuest}
                      crownSender={crownSender}
                      isJoined={true}
                      lastGift={lastGifts[p.id]}
                      isViewerView={isViewerView}
                      customBackground={customBackgrounds[p.id]}
                    />
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* AUTO GRID LAYOUT SYSTEM */}
        {!isPKActive && gridLayout === 'dynamic' && orderedParticipants.length > 0 && (
          <div className="absolute left-0 right-0 z-10 p-0 transition-all duration-500 flex items-center justify-center top-40 bottom-[380px]">
            {(() => {
              const displayParticipants = orderedParticipants.filter(p => !p.isEmpty);
              const count = displayParticipants.length;
              const cols = count <= 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;
              
              const gridColsClass = cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-4';

              return (
                <div className={`w-full max-w-md mx-auto grid gap-0 p-0 overflow-y-auto no-scrollbar ${gridColsClass}`}>
                  {displayParticipants.map((p) => (
                    <div key={p.id} className="relative border border-white/5 aspect-square">
                      <ParticipantCell 
                        participant={p} 
                        onRemove={p.isHost ? undefined : removeGuest}
                        onPin={togglePin}
                        onMute={toggleMuteGuest}
                        onCamera={toggleCameraGuest}
                        onClick={(p) => handleParticipantClick(p)}
                        onInvite={() => { setActiveHostTab('requests'); setShowHostControl(true); }}
                        onFollow={toggleFollowGuest}
                        isJoined={true}
                        crownSender={crownSender}
                        lastGift={lastGifts[p.id]}
                        isViewerView={isViewerView}
                        customBackground={customBackgrounds[p.id]}
                      />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* BIG SCREEN LAYOUT SYSTEM */}
        {!isPKActive && gridLayout === 'spotlight' && orderedParticipants.length > 0 && (
          <div className="absolute left-0 right-0 z-10 p-0 transition-all duration-500 flex items-center justify-center top-48 bottom-[380px]">
            <div className={`w-full max-w-md mx-auto grid gap-0 p-0 grid-cols-4 overflow-visible`}>
              {(() => {
                const displayParticipants = orderedParticipants.filter(p => !p.isEmpty);
                
                return displayParticipants.map((p, idx) => (
                  <div 
                    key={p.id} 
                    className={`relative border border-white/5 ${
                      idx === 0 
                        ? (displayParticipants.length === 1 ? 'col-span-4 row-span-4 aspect-square' : 'col-span-3 row-span-3 aspect-square')
                        : 'col-span-1 aspect-square'
                    }`}
                  >
                    <ParticipantCell 
                      participant={p} 
                      onRemove={p.isHost ? undefined : removeGuest}
                      onPin={togglePin}
                      onMute={toggleMuteGuest}
                      onCamera={toggleCameraGuest}
                      onClick={(p) => handleParticipantClick(p)}
                      onInvite={() => { setActiveHostTab('requests'); setShowHostControl(true); }}
                      onFollow={toggleFollowGuest}
                      variant={displayParticipants.length === 1 ? 'background' : 'default'}
                      isJoined={true}
                      crownSender={crownSender}
                      lastGift={lastGifts[p.id]}
                      isViewerView={isViewerView}
                      customBackground={customBackgrounds[p.id]}
                    />
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* GUEST GRID SYSTEM (Other layouts) */}
        {!isPKActive && gridLayout && gridLayout !== 'dynamic' && gridLayout !== 'spotlight' && (
          <div className={`absolute z-10 transition-all duration-500 px-0 ${
            gridLayout === 'sidebar' 
              ? 'right-0 top-32 bottom-32 w-auto flex flex-col items-end' 
              : 'left-0 right-0 top-40 bottom-[380px] flex items-center justify-center'
          }`}>
            <div className={`w-full max-w-md overflow-visible ${
              gridLayout === 'sidebar' ? 'mr-0 ml-auto' : 'mx-auto'
            } ${
              gridLayout === 'horizontal' 
                ? 'flex overflow-x-auto no-scrollbar pb-0 gap-0 items-center' 
                : gridLayout === 'sidebar'
                ? (orderedParticipants.length - 1 > 7 
                    ? 'grid grid-cols-2 gap-0 pr-0' 
                    : 'flex flex-col gap-0 items-end pr-0')
                : gridLayout === 'bubbles'
                ? 'flex flex-wrap items-center justify-center gap-0'
                : gridLayout === 'stacked'
                ? 'grid grid-cols-10 gap-0 p-0'
                : gridLayout === 'bento'
                ? 'grid grid-cols-6 gap-0 p-0'
                : 'grid gap-0 p-0 ' + (
                    orderedParticipants.length <= 1 ? 'grid-cols-1' : 
                    orderedParticipants.length <= 4 ? 'grid-cols-2' :
                    'grid-cols-3'
                  )
            }`}>
              {(() => {
                const displayParticipants = (gridLayout === 'sidebar' ? orderedParticipants.slice(1) : [...orderedParticipants]).filter(p => !p.isEmpty);

                return displayParticipants.map((p, idx) => {
                  const isGrid = !['horizontal', 'sidebar', 'bubbles', 'stacked', 'bento'].includes(gridLayout || '');
                  const isJoinedStyle = ['horizontal', 'sidebar', 'bento', 'grid', 'bubbles', 'stacked'].includes(gridLayout || '') || isGrid;
                  const cols = gridLayout === 'bento' ? 6 : gridLayout === 'stacked' ? 10 : (displayParticipants.length <= 1 ? 1 : displayParticipants.length <= 4 ? 2 : 3);
                  const N = displayParticipants.length - 1;
                  const hostSpan = (N % cols === 0 && N > 0) ? (displayParticipants.length === 1 ? 1 : cols) : (cols - (N % cols));
                  
                  return (
                  <div 
                    key={p.id}
                    className={`relative transition-all duration-300 ${
                      gridLayout === 'bubbles' 
                        ? 'w-24 h-24 p-1' 
                        : gridLayout === 'sidebar'
                        ? (displayParticipants.length > 7 
                            ? (idx === displayParticipants.length - 1 && idx % 2 === 0 
                                ? 'col-span-2 w-48 h-24' 
                                : 'w-24 h-24')
                            : 'w-24 h-24')
                        : gridLayout === 'stacked'
                        ? (idx === 0 || idx === 1
                            ? 'col-span-5 row-span-5 aspect-square'
                            : 'col-span-2 row-span-2 aspect-square')
                        : gridLayout === 'bento'
                        ? (idx === 0 
                            ? 'col-span-4 row-span-4 aspect-square' 
                            : (idx >= 1 && idx <= 3) 
                               ? 'col-span-2 row-span-2 aspect-square' 
                               : 'col-span-1 row-span-1 aspect-square')
                        : gridLayout === 'horizontal'
                        ? 'w-32 h-32 shrink-0'
                        : `w-full aspect-square ${idx === 0 ? (hostSpan === 3 ? 'col-span-3' : hostSpan === 2 ? 'col-span-2' : '') : ''}`
                    }`}
                    style={gridLayout === 'stacked' ? { 
                      transform: `translateX(${idx * 12}px) translateY(${idx * 8}px) rotate(${idx * 1.5}deg)`,
                      zIndex: 10 - idx
                    } : {}}
                  >
                    <ParticipantCell 
                      participant={p}
                      onRemove={removeGuest}
                      onPin={togglePin}
                      onMute={toggleMuteGuest}
                      onCamera={toggleCameraGuest}
                      onClick={(p) => handleParticipantClick(p)}
                      onInvite={() => { setActiveHostTab('requests'); setShowHostControl(true); }}
                      onFollow={toggleFollowGuest}
                      variant={gridLayout === 'bubbles' ? 'default' : 'default'}
                      isJoined={isJoinedStyle}
                      crownSender={crownSender}
                      lastGift={lastGifts[p.id]}
                      isViewerView={isViewerView}
                      customBackground={customBackgrounds[p.id]}
                    />
                  </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* CROWN HIGHLIGHT OVERLAY */}
        <AnimatePresence>
          {crownSender && (
            <motion.div 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 20, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
            >
              <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 p-[2px] rounded-full shadow-[0_0_30px_rgba(251,191,36,0.5)]">
                <div className="bg-black/80 backdrop-blur-xl px-6 py-2 rounded-full flex items-center gap-3 border border-white/10">
                  <Crown size={20} className="text-amber-400 animate-bounce-slow" fill="currentColor" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Crown Giver</span>
                    <span className="text-sm font-black text-white uppercase tracking-tighter">{crownSender}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
                    <Zap size={16} className="text-black" fill="currentColor" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BIG GIFT FULL SCREEN EFFECT */}
        <AnimatePresence>
          {bigGift && (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -45 }}
              animate={{ scale: [0, 1.5, 1], opacity: 1, rotate: 0 }}
              exit={{ scale: 5, opacity: 0 }}
              className="absolute inset-0 z-[200] flex flex-col items-center justify-center pointer-events-none"
            >
              <div className="relative">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-[120px] drop-shadow-[0_0_50px_rgba(251,191,36,0.8)]"
                >
                  {bigGift.emoji}
                </motion.div>
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap"
                >
                  <span className="text-2xl font-black text-white uppercase tracking-tighter bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 bg-clip-text text-transparent drop-shadow-2xl">
                    {bigGift.name} UNLOCKED!
                  </span>
                </motion.div>
              </div>
              
              {/* Particle Burst Simulation */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{ 
                    x: Math.cos(i * 30 * Math.PI / 180) * 200,
                    y: Math.sin(i * 30 * Math.PI / 180) * 200,
                    opacity: 0,
                    scale: 0
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute w-4 h-4 text-amber-400"
                >
                  <Star fill="currentColor" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* GIFTER POPUP (Long and Thin) */}
        <AnimatePresence>
          {activeGifterPopup && (
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="absolute left-4 top-[30%] z-[100] pointer-events-none"
            >
              <div className="w-14 h-56 bg-gradient-to-b from-amber-400 via-rose-500 to-purple-600 rounded-full p-[2px] shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                <div className="w-full h-full bg-black/80 backdrop-blur-xl rounded-full flex flex-col items-center py-6 justify-between border border-white/10">
                  <div className="relative">
                    <img 
                      src={activeGifterPopup.avatar} 
                      className="w-10 h-10 rounded-full border-2 border-amber-400 object-cover" 
                      alt="gifter"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[7px] font-black px-1 rounded-sm shadow-lg">
                      LV.{activeGifterPopup.level}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                    >
                      {activeGifterPopup.gift}
                    </motion.div>
                    <div className="flex flex-col items-center leading-none">
                      <span className="text-[10px] font-black text-white italic">x{activeGifterPopup.count}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[8px] font-black text-amber-400 uppercase tracking-tighter truncate w-10 text-center">
                      {activeGifterPopup.name}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PROMINENT COMBO BURST EFFECT */}
        <AnimatePresence mode="popLayout">
          {combo && combo.count > 1 && (
            <motion.div
              key={`${combo.gift}-${combo.count}`}
              initial={{ scale: 0, opacity: 0, rotate: -20, x: 50 }}
              animate={{ scale: 1, opacity: 1, rotate: 0, x: 0 }}
              exit={{ scale: 2, opacity: 0, x: -100 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 15,
                duration: 0.4
              }}
              className="absolute right-4 top-24 z-[200] pointer-events-none"
            >
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [-5, 5, -5]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-7xl mb-2 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                >
                  {combo.gift}
                </motion.div>
                
                <div className="relative">
                  <motion.span 
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    className="text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-rose-500 to-purple-600 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                    style={{ WebkitTextStroke: '1px rgba(255,255,255,0.2)' }}
                  >
                    x{combo.count}
                  </motion.span>
                  
                  {/* Dynamic Glow Ring */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 border-4 border-rose-500 rounded-full blur-md"
                  />
                </div>

                {/* Achievement Badge for high combos */}
                {combo.count >= 10 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mt-2 px-3 py-1 bg-black/60 backdrop-blur-md border border-amber-400/50 rounded-full"
                  >
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest animate-pulse">
                      {combo.count >= 50 ? '🔥 UNSTOPPABLE' : combo.count >= 20 ? '⚡ MEGA COMBO' : '✨ SUPER COMBO'}
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOP LEFT: HOST INFO PILL */}
        <div className="absolute top-12 left-4 z-20 flex flex-col gap-2">
          <div className="flex items-center gap-2 glass-dark rounded-full pl-1 pr-3 py-1 shadow-lg">
            <div className="relative">
              <img 
                src={liveHosts[0].avatar} 
                className="w-7 h-7 rounded-full border border-pink-500" 
                alt="host"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />
            </div>
            <div 
              className="flex flex-col leading-none cursor-pointer active:opacity-60 transition-opacity max-w-[60px]"
              onClick={() => setShowProfileModal(true)}
            >
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-white truncate">{liveHosts[0].name}</span>
                {!isMicOn && <Volume2 size={8} className="text-rose-500 shrink-0" />}
              </div>
              <span className="text-[8px] text-white/60 truncate">1.2k viewers</span>
            </div>
            <button 
              onClick={() => {
                if (isFollowed) {
                  if (coins >= 1) {
                    setCoins(prev => prev - 1);
                    setCrownSender(userName);
                    setTimeout(() => setCrownSender(null), 5000);
                  }
                } else {
                  setIsFollowed(true);
                }
              }}
              className={`${isFollowed ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-rose-500'} text-[8px] font-black px-2.5 py-1 rounded-full ml-1 active:scale-95 transition-all text-white shadow-lg flex items-center gap-1`}
            >
              {isFollowed ? (
                <>
                  <Crown size={8} fill="currentColor" />
                  CROWN POINTS
                </>
              ) : 'FOLLOW'}
            </button>
          </div>
        </div>

        {/* TOP RIGHT: MINI SOCIAL + CLOSE */}
        <div className="absolute top-12 right-4 z-20 flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {/* Viewer Avatars & Count */}
            <div 
              onClick={() => setShowViewerList(true)}
              className="flex items-center glass-dark rounded-full pl-1 pr-2 py-0.5 border border-white/10 cursor-pointer active:scale-95 transition-all"
            >
              <div className="flex -space-x-1.5 mr-1.5">
                {[1, 2, 3].map(i => (
                  <img 
                    key={i}
                    src={`https://i.pravatar.cc/150?u=v${i}`} 
                    className="w-4 h-4 rounded-full border border-black object-cover" 
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <span className="text-[9px] font-black text-white">1.2k</span>
            </div>

            {!isViewerView && (
              <button 
                onClick={() => setShowCloseConfirm(true)}
                className="flex items-center justify-center bg-rose-500/80 hover:bg-rose-600 backdrop-blur-md w-10 h-10 rounded-full border border-white/20 shadow-lg active:scale-95 transition-all group"
                title="End Live"
              >
                <Power size={18} className="text-white group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>

          {/* FOMO EVENT INDICATOR (Subtle Improvement) */}
          <AnimatePresence>
            {fomoEvent && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg px-2 py-1 flex items-center gap-1.5 border border-amber-400/50 shadow-lg"
              >
                <Flame size={12} className="text-white animate-bounce" />
                <span className="text-[8px] font-black text-white uppercase tracking-tighter">2X ENERGY!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* GUEST MINI VIDEO */}
        <div className={`absolute left-4 z-20 transition-all duration-500 ${
          isPKActive ? 'top-52' : 'top-28'
        }`}>
          <motion.div 
            initial={false}
            animate={{ height: isGuestLive ? 120 : 0, opacity: isGuestLive ? 1 : 0 }}
            className="w-20 bg-slate-800 rounded-xl overflow-hidden border-2 neon-pink relative"
          >
            {isGuestLive && (
              <>
                <img 
                  src="https://i.pravatar.cc/150?u=guest" 
                  className="w-full h-full object-cover" 
                  alt="guest"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-1.5 left-1.5 bg-rose-500 text-[6px] font-black px-1 py-0.5 rounded">LIVE</div>
                <button 
                  onClick={() => setGuestControlsOpen(!guestControlsOpen)}
                  className="absolute bottom-1.5 right-1.5 glass-dark p-0.5 rounded"
                >
                  <ChevronDown size={10} className={guestControlsOpen ? 'rotate-180' : ''} />
                </button>
              </>
            )}
          </motion.div>
          
          {isGuestLive && guestControlsOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex gap-1 glass-dark p-1 rounded-full w-fit"
            >
              <button className="p-1 text-white/60 hover:text-white"><Mic size={12} /></button>
              <button className="p-1 text-white/60 hover:text-white"><Video size={12} /></button>
              <button onClick={() => setShowSettings(true)} className="p-1 text-white/60 hover:text-white"><Settings size={12} /></button>
            </motion.div>
          )}
        </div>

        {/* HORIZONTAL WIDGETS (POLL & GOAL) - POSITIONED BELOW VIDEO CARDS & MVP AREA */}
        <AnimatePresence>
          {isPKActive && (
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              className="absolute top-[540px] left-3 right-3 z-20 flex gap-2"
            >
              {/* POLL PILL */}
              <div className="flex-1 glass-dark rounded-xl p-1.5 border border-white/10 shadow-xl">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 text-rose-400">
                    <Zap size={6} fill="currentColor" />
                    <span className="text-[6px] font-black tracking-widest uppercase">POLL</span>
                  </div>
                  <span className="text-[6px] font-bold text-white/40">02:14</span>
                </div>
                <div className="flex gap-1">
                  <div className="flex-1 h-2 bg-rose-500/20 rounded-sm border border-rose-500/20 flex items-center px-1 justify-between">
                    <span className="text-[5px] font-bold text-white">Yes</span>
                    <span className="text-[5px] font-black text-white">64%</span>
                  </div>
                  <div className="flex-1 h-2 bg-white/5 rounded-sm border border-white/5 flex items-center px-1 justify-between">
                    <span className="text-[5px] font-bold text-white">No</span>
                    <span className="text-[5px] font-black text-white">36%</span>
                  </div>
                </div>
              </div>

              {/* LIVE GOAL PILL */}
              <div className="flex-1 glass-dark rounded-xl p-1.5 border border-white/10 shadow-xl">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Trophy size={6} />
                    <span className="text-[6px] font-black tracking-widest uppercase">GOAL</span>
                  </div>
                  <span className="text-[6px] font-bold text-white/40">85%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-sm border border-white/5 relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 w-[85%] shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[5px] font-black text-white drop-shadow-sm">850/1k</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CENTER EFFECTS: GIFT COMBO */}
        <AnimatePresence>
          {showMVP && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
            >
              <div className="flex gap-12">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-rose-500 blur-2xl opacity-50 animate-pulse" />
                    <img src={hostGifters[0]} className="w-16 h-16 rounded-full border-4 border-amber-400 relative z-10" alt="mvp" referrerPolicy="no-referrer" />
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 bg-amber-400 text-black text-[8px] font-black px-2 py-0.5 rounded-full">MVP</div>
                  </div>
                  <span className="text-white font-black text-[10px] mt-2 tracking-widest uppercase">Host MVP</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-50 animate-pulse" />
                    <img src={challengerGifters[0]} className="w-16 h-16 rounded-full border-4 border-amber-400 relative z-10" alt="mvp" referrerPolicy="no-referrer" />
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 bg-amber-400 text-black text-[8px] font-black px-2 py-0.5 rounded-full">MVP</div>
                  </div>
                  <span className="text-white font-black text-[10px] mt-2 tracking-widest uppercase">Challenger MVP</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* OLD COMBO DISPLAY REMOVED */}
        </AnimatePresence>

        {/* JOIN NOTIFICATIONS (FLYING ANIMATION) - POSITIONED JUST ABOVE CHAT FEED */}
        <div className={`absolute left-4 z-40 pointer-events-none overflow-visible transition-all duration-500 max-w-[280px] ${
          isPKActive ? 'bottom-60' : 'bottom-68'
        }`}>
          <AnimatePresence mode="popLayout">
            {joinNotifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ x: -100, opacity: 0, scale: 0.8 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: 200, opacity: 0, scale: 1.2 }}
                transition={{ type: "spring", damping: 15, stiffness: 100 }}
                className="mb-1.5"
              >
                <div className={`relative flex items-center gap-2.5 p-0.5 pr-5 rounded-full border shadow-2xl overflow-hidden h-9 ${
                  notif.level >= 50 
                    ? 'bg-gradient-to-r from-purple-600/90 via-rose-500/90 to-amber-500/90 border-amber-400/40' 
                    : notif.level >= 30 
                    ? 'bg-gradient-to-r from-amber-600/90 to-orange-500/90 border-amber-400/40' 
                    : 'bg-gradient-to-r from-blue-600/90 to-cyan-500/90 border-blue-400/40'
                }`}>
                  {/* Animated Background Shine */}
                  <motion.div 
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                  />

                  <div className="relative z-10 shrink-0">
                    <img 
                      src={notif.avatar} 
                      className="w-7 h-7 rounded-full border border-white/40 object-cover shadow-md" 
                      alt="avatar" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 bg-white text-slate-900 text-[7px] font-black px-1 rounded-full shadow-sm border border-black/20">
                      {notif.level}
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-white font-black text-[9px] tracking-tight drop-shadow-md truncate">
                        {notif.user}
                      </span>
                      <Sparkles size={8} className="text-amber-300 animate-pulse shrink-0" />
                    </div>
                    <span className="text-white/90 text-[7px] font-bold italic tracking-tighter truncate">
                      {notif.level >= 50 ? 'Legendary Gifter Joined!' : notif.level >= 30 ? 'Elite Gifter Joined!' : 'Noble Gifter Joined!'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* PUBLIC LEVEL UP POPUP */}
        <AnimatePresence>
          {publicLevelUp && (
            <motion.div
              initial={{ y: -100, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -100, opacity: 0, scale: 0.5 }}
              className="absolute top-40 left-1/2 -translate-x-1/2 z-[250] pointer-events-none"
            >
              <div className="glass px-8 py-4 rounded-3xl border-2 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.5)] flex flex-col items-center gap-2 overflow-hidden relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 via-transparent to-rose-500/20"
                />
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-[0.3em] mb-1">New Milestone!</span>
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    <span className="text-amber-400">{publicLevelUp.user}</span>
                    <span className="text-white/60">reached</span>
                    <span className="text-rose-500">LV.{publicLevelUp.level}</span>
                  </h3>
                  <div className="flex gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <motion.span 
                        key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ delay: i * 0.1, repeat: Infinity }}
                        className="text-amber-400 text-lg"
                      >
                        ⭐
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LEFT BOTTOM: CHAT FEED */}
        <div className={`absolute left-4 w-64 z-10 flex flex-col transition-all duration-500 ${
          isPKActive ? 'bottom-20 h-28' : 'bottom-20 h-48'
        }`}>
          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2 pb-2 pt-16">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  onClick={() => msg.type === 'chat' && setReplyingTo(msg)}
                  className={`p-1 max-w-[95%] cursor-pointer active:scale-95 transition-transform ${
                    msg.isHighlighted ? 'chat-highlight' : ''
                  } ${
                    msg.type === 'gift' 
                      ? 'border-l-2 border-l-rose-500' 
                      : msg.type === 'system'
                      ? 'border-l-2 border-l-rose-400'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {msg.avatar && (
                      <div className="relative shrink-0">
                        <img 
                          src={msg.avatar} 
                          className={`w-7 h-7 rounded-full border border-white/20 object-cover ${msg.statusTitle ? getStatusTier(msg.level || 1).glow : ''}`} 
                          alt="avatar" 
                          referrerPolicy="no-referrer"
                        />
                        {msg.level && (
                          <div className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[7px] font-black px-1 rounded-full border border-black/10 shadow-sm">
                            {msg.level}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        {msg.statusTitle && (
                          <span className={`text-[7px] font-black px-1 rounded-full text-white uppercase tracking-tighter flex items-center gap-0.5 ${getStatusTier(msg.level || 1).color} ${getStatusTier(msg.level || 1).glow}`}>
                            <span className="animate-bounce-slow">{getStatusTier(msg.level || 1).badge}</span>
                            {msg.statusTitle}
                          </span>
                        )}
                        {msg.squadRank && msg.squadRank !== 'Member' && (
                          <span className="text-[7px] font-black px-1 rounded-full bg-white/10 text-white/60 uppercase tracking-tighter border border-white/5">
                            {msg.squadRank}
                          </span>
                        )}
                        <span className={`text-[10px] font-black truncate ${msg.type === 'gift' ? 'text-rose-200' : 'text-rose-300'}`}>
                          {msg.user}
                        </span>
                        {msg.replyTo && (
                          <span className="text-[8px] text-white/40 font-bold italic">
                            replied to @{msg.replyTo}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] leading-tight break-words flex items-center gap-1 flex-wrap ${msg.isHighlighted ? 'text-white font-bold' : 'text-white/90'}`}>
                        {msg.text}
                        {msg.type === 'gift' && (
                          <span className="flex items-center gap-0.5 ml-1">
                            <span className="text-sm">{msg.giftIcon}</span>
                            {msg.count && msg.count > 1 && (
                              <span className="text-rose-400 font-black italic text-[10px]">x{msg.count}</span>
                            )}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Viewer Chat Input & Boost Actions (Removed as per request - only host reply is visible) */}
        </div>

        {/* VIEWER ACTIONS (Bottom Right) - Removed as per request */}

        {/* REPLY INPUT (Only visible when host is replying) */}
        <AnimatePresence>
          {replyingTo && !isViewerView && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="absolute bottom-24 left-4 right-4 z-[90] glass rounded-2xl p-3 border border-rose-500/30 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-rose-500 rounded-full" />
                  <span className="text-[10px] font-bold text-rose-300">Replying to @{replyingTo.user}</span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-white/40 hover:text-white">
                  <X size={14} />
                </button>
              </div>
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input 
                  autoFocus
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-rose-500/50"
                />
                <button 
                  type="submit"
                  className="bg-rose-500 text-white p-2 rounded-xl hover:bg-rose-600 transition-all active:scale-90"
                >
                  <Send size={16} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RIGHT SIDE: HEARTS AREA */}
        <div className="absolute bottom-28 right-4 w-16 h-48 pointer-events-none z-20 overflow-hidden">
          {hearts.map((heart) => (
            <motion.div
              key={heart.id}
              initial={{ y: 0, opacity: 1, scale: 0.5, x: 0 }}
              animate={{ y: -200, opacity: 0, scale: 2, x: heart.x }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2"
              style={{ color: heart.color }}
            >
              <Heart size={20} fill="currentColor" />
            </motion.div>
          ))}
        </div>

        {/* BOTTOM BAR: HOST ONLY CONTROLS */}
        {!isViewerView && (
          <div className="absolute bottom-0 left-0 right-0 p-4 z-30">
            <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
            {/* Mic Toggle */}
            <button 
              onClick={() => setIsMicOn(!isMicOn)}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                isMicOn ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'glass text-white/40'
              }`}
              title="Toggle Microphone"
            >
              {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            {/* Camera Toggle */}
            <button 
              onClick={() => setHost1CamOn(!host1CamOn)}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                host1CamOn ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'glass text-white/40'
              }`}
              title="Toggle Camera"
            >
              {host1CamOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            {/* Host Control Center (Shield) */}
            <button 
              onClick={() => setShowHostControl(true)}
              className="w-16 h-16 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-rose-500/30 active:scale-95 transition-all -mt-6 border-4 border-white"
              title="Host Control Center"
            >
              <Shield size={28} fill="white" />
            </button>

            {/* Guest Requests */}
            <button 
              onClick={() => { setActiveHostTab('requests'); setShowHostControl(true); }}
              className="w-11 h-11 rounded-full glass flex items-center justify-center text-cyan-400 active:scale-90 transition-all relative"
              title="Guest Requests"
            >
              <Users size={20} />
              {guestRequests.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[8px] font-black text-white border-2 border-slate-900">
                  {guestRequests.length}
                </div>
              )}
            </button>

            {/* PK Battle Toggle */}
            <button 
              onClick={() => {
                if (isPKActive) {
                  setIsPKActive(false);
                } else {
                  if (activeGuests.length > 0) {
                    setShowPKErrorModal(true);
                  } else {
                    setShowPKSelection(true);
                  }
                }
              }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                isPKActive ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'glass text-rose-400'
              }`}
              title="Toggle PK Battle"
            >
              <Zap size={20} fill={isPKActive ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
        )}

        {/* AI ASSISTANT MODAL */}
        <PKAIAssistant 
          show={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          prediction={pkPrediction}
          suggestion={pkSuggestion}
          analysis={viewerAnalysis}
          rematch={rematchAdvice}
          leaderboard={aiLeaderboard}
          onRefresh={handleRefreshAI}
        />

        {/* VIEWER VIEW BOTTOM BAR */}
        {isViewerView && (
          <div className="absolute bottom-0 left-0 right-0 p-4 z-[100] flex flex-col gap-4">
            {/* Gift History (Counting after modal close) */}
            <AnimatePresence>
              {Object.keys(lastGifts).length > 0 && !showGiftPanel && (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="flex flex-col gap-2 max-w-[200px]"
                >
                  {(Object.entries(lastGifts) as [string, { emoji: string; count: number }][]).map(([id, g]) => (
                    <motion.div 
                      key={id}
                      initial={{ scale: 0.8, x: -20 }}
                      animate={{ scale: 1, x: 0 }}
                      className="glass rounded-full px-3 py-1.5 flex items-center gap-2 border border-amber-400/30 shadow-lg shadow-amber-400/10"
                    >
                      <span className="text-lg">{g.emoji}</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">Gift</span>
                        <span className="text-[9px] font-bold text-amber-400">x{g.count} SENT</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Back to Host View (Floating above) */}
            <motion.button 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => setIsViewerView(false)}
              className="mx-auto glass px-4 py-2 rounded-full border border-rose-500/30 flex items-center gap-2 shadow-xl active:scale-95 transition-all"
            >
              <Shield size={14} className="text-rose-500" fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Exit Viewer Mode</span>
            </motion.button>

            <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
              {/* Reply Indicator for Viewer */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    className="glass rounded-xl p-2 border border-rose-500/30 flex items-center justify-between"
                  >
                    <span className="text-[9px] font-bold text-rose-300 truncate">Replying to @{replyingTo.user}</span>
                    <button onClick={() => setReplyingTo(null)} className="text-white/40">
                      <X size={12} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between gap-3">
                {/* Real Chat Input */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat(e);
                  }}
                  className="flex-1 glass rounded-full px-4 py-2.5 flex items-center gap-2 border border-white/10"
                >
                  <MessageSquare size={18} className="text-white/40" />
                  <input 
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Say something..."
                    className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/40 font-medium w-full"
                  />
                  {inputText.trim() && (
                    <button 
                      type="submit"
                      className="text-rose-500 hover:text-rose-400 transition-colors"
                    >
                      <Send size={18} />
                    </button>
                  )}
                </form>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Share Button */}
                  <button 
                    onClick={() => {
                      addToast("Sharing link copied!");
                    }}
                    className="w-10 h-10 rounded-full glass flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all"
                    title="Share"
                  >
                    <Share2 size={18} />
                  </button>

                  {/* Request to Join / Mic & Cam Controls if Live */}
                  {activeGuests.some(g => g.name === userName) ? (
                    <>
                      <button 
                        onClick={() => {
                          const isMuted = activeGuests.find(g => g.name === userName)?.isMuted;
                          setActiveGuests(prev => prev.map(g => g.name === userName ? { ...g, isMuted: !isMuted } : g));
                        }}
                        className={`w-10 h-10 rounded-full glass flex items-center justify-center active:scale-90 transition-all border ${activeGuests.find(g => g.name === userName)?.isMuted ? 'text-rose-500 border-rose-500/40' : 'text-green-400 border-green-400/40'}`}
                        title="Toggle Mic"
                      >
                        {activeGuests.find(g => g.name === userName)?.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                      </button>
                      <button 
                        onClick={() => {
                          const isCameraOff = activeGuests.find(g => g.name === userName)?.isCameraOff;
                          setActiveGuests(prev => prev.map(g => g.name === userName ? { ...g, isCameraOff: !isCameraOff } : g));
                        }}
                        className={`w-10 h-10 rounded-full glass flex items-center justify-center active:scale-90 transition-all border ${activeGuests.find(g => g.name === userName)?.isCameraOff ? 'text-rose-500 border-rose-500/40' : 'text-blue-400 border-blue-400/40'}`}
                        title="Toggle Camera"
                      >
                        {activeGuests.find(g => g.name === userName)?.isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => {
                        setIsRequestingToJoin(true);
                        const newRequest = {
                          id: Date.now().toString(),
                          name: userName,
                          avatar: `https://i.pravatar.cc/150?u=${userName}`,
                          level: userLevel
                        };
                        setGuestRequests(prev => [...prev, newRequest]);
                        setTimeout(() => {
                          addToast("Request sent to host!");
                        }, 500);
                      }}
                      disabled={isRequestingToJoin}
                      className={`w-10 h-10 rounded-full glass flex items-center justify-center active:scale-90 transition-all border ${isRequestingToJoin ? 'text-amber-400 border-amber-400/40 animate-pulse' : 'text-white border-white/20'}`}
                      title="Request to Join"
                    >
                      {isRequestingToJoin ? <Clock size={18} /> : <UserPlus size={18} />}
                    </button>
                  )}

                  {/* Gift */}
                  <button 
                    onClick={() => {
                      setSelectedGuestForGift(null); // Default to host
                      setShowGiftPanel(true);
                    }}
                    className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white active:scale-90 transition-all shadow-lg shadow-rose-500/20"
                    title="Gift"
                  >
                    <Gift size={18} />
                  </button>

                  {/* Like (Heart) */}
                  <button 
                    onClick={triggerHeart}
                    className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-white active:scale-90 transition-all shadow-xl shadow-rose-500/30 border-2 border-white/20"
                    title="Like"
                  >
                    <Heart size={24} fill="white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PUBLIC LEVEL UP POPUP */}
        <AnimatePresence>
          {publicLevelUp && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center pointer-events-none p-4">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.5, opacity: 0, y: -50 }}
                className="glass-premium rounded-[32px] p-8 border-2 border-amber-400/50 shadow-[0_0_50px_rgba(251,191,36,0.3)] flex flex-col items-center gap-4 max-w-xs w-full text-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent animate-pulse" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 rounded-full border-4 border-dashed border-amber-400/30 flex items-center justify-center relative z-10"
                >
                  <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-black text-2xl font-black italic shadow-lg shadow-amber-400/50">
                    LV.{publicLevelUp.level}
                  </div>
                </motion.div>
                <div className="relative z-10">
                  <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-1">LEVEL UP!</h4>
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                    Congratulations <span className="text-white">@{publicLevelUp.user}</span>
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="text-amber-400" fill="currentColor" />
                    ))}
                  </div>
                </div>
                {/* Confetti-like particles */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0], 
                        scale: [0, 1, 0],
                        x: (Math.random() - 0.5) * 200,
                        y: (Math.random() - 0.5) * 200
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                      className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-amber-400"
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* TOAST NOTIFICATIONS (TOP CENTER) */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-xs items-center">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ y: -20, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.9 }}
                className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3 w-full"
              >
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                  <Zap size={20} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest truncate">Notification</span>
                  <span className="text-[9px] text-white/60 font-medium leading-tight">{toast.text}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* MODALS: HOST CONTROL PANEL */}
        <AnimatePresence>
          {showHostControl && (
            <div className="absolute inset-0 z-[100] flex items-end">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setShowHostControl(false); setActiveHostTab('main'); }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`w-full glass rounded-t-[32px] p-6 z-10 ${
                  activeHostTab === 'background' ? 'overflow-visible' : 'max-h-[80%] overflow-y-auto'
                } text-white`}
              >
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
                
                {activeHostTab === 'main' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                        <Shield size={20} className="text-amber-400" />
                        HOST CONTROL
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                          <Eye size={14} className={isViewerView ? "text-rose-500" : "text-white/40"} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Viewer View</span>
                          <button 
                            onClick={() => setIsViewerView(!isViewerView)}
                            className={`w-8 h-4 rounded-full relative transition-all ${isViewerView ? 'bg-rose-500' : 'bg-white/20'}`}
                          >
                            <motion.div 
                              animate={{ x: isViewerView ? 18 : 2 }}
                              className="absolute top-1 w-2 h-2 bg-white rounded-full shadow-sm"
                            />
                          </button>
                        </div>
                        <button onClick={() => setShowHostControl(false)} className="p-2 glass rounded-full">
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Mic Toggle */}
                      <button 
                        onClick={() => setIsMicOn(!isMicOn)}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                          isMicOn ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-white/5 border-white/10 text-white/40'
                        }`}
                      >
                        <Mic size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Mic {isMicOn ? 'ON' : 'OFF'}</span>
                      </button>

                      {/* Camera Toggle */}
                      <button 
                        onClick={() => setHost1CamOn(!host1CamOn)}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                          host1CamOn ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-white/40'
                        }`}
                      >
                        {host1CamOn ? <Video size={24} /> : <VideoOff size={24} />}
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Cam {host1CamOn ? 'ON' : 'OFF'}</span>
                      </button>

                      {/* Backgrounds */}
                      <button 
                        onClick={() => setActiveHostTab('background')}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2 hover:bg-white/10 transition-all"
                      >
                        <ImageIcon size={24} className="text-purple-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Background</span>
                      </button>

                      {/* Music */}
                      <button 
                        onClick={() => setActiveHostTab('music')}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2 hover:bg-white/10 transition-all"
                      >
                        <Music size={24} className="text-rose-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Music</span>
                      </button>

                      {/* Requests */}
                      <button 
                        onClick={() => setActiveHostTab('requests')}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2 hover:bg-white/10 transition-all relative"
                      >
                        <Users size={24} className="text-cyan-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Requests</span>
                        {guestRequests.length > 0 && (
                          <div className="absolute top-4 right-4 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                        )}
                      </button>

                      {/* Guest Management */}
                      <button 
                        onClick={() => setActiveHostTab('guests')}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2 hover:bg-white/10 transition-all"
                      >
                        <UserPlus size={24} className="text-green-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Manage Guests</span>
                      </button>

                      {/* Simulate Host Gifting */}
                      <button 
                        onClick={() => {
                          const randomGift = [
                            { name: 'Rose', emoji: '🌹', price: 1 },
                            { name: 'Heart', emoji: '❤️', price: 5 },
                            { name: 'Crown', emoji: '👑', price: 200 },
                            { name: 'Rocket', emoji: '🚀', price: 1000 }
                          ][Math.floor(Math.random() * 4)];
                          
                          const target = activeGuests.length > 0 ? activeGuests[Math.floor(Math.random() * activeGuests.length)] : null;
                          const targetName = target ? target.name : 'Audience';
                          const targetId = target ? target.id : 'host'; // Default to host if no guests

                          setActiveGifterPopup({ 
                            name: liveHosts[0].name, 
                            avatar: liveHosts[0].avatar, 
                            level: liveHosts[0].level, 
                            gift: randomGift.emoji, 
                            count: 1 
                          });

                          setLastGifts(prev => ({
                            ...prev,
                            [targetId]: { emoji: randomGift.emoji, count: 1 }
                          }));

                          setMessages(prev => [...prev, {
                            id: generateId(),
                            user: liveHosts[0].name,
                            avatar: liveHosts[0].avatar,
                            level: liveHosts[0].level,
                            text: `sent ${randomGift.name} to ${targetName}! 🎁`,
                            type: 'gift',
                            giftIcon: randomGift.emoji,
                            count: 1,
                            statusTitle: getStatusTier(liveHosts[0].level).title,
                            squadRank: 'Host',
                            vipTier: 'ELITE'
                          }]);

                          if (randomGift.price >= 500) {
                            setBigGift({ emoji: randomGift.emoji, name: randomGift.name });
                            setTimeout(() => setBigGift(null), 4000);
                          }

                          setTimeout(() => {
                            setActiveGifterPopup(null);
                            setLastGifts(prev => {
                              const next = { ...prev };
                              delete next[targetId];
                              return next;
                            });
                          }, 3000);
                          
                          setShowHostControl(false);
                        }}
                        className="p-4 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 border border-white/20 flex flex-col items-center gap-2 hover:opacity-90 transition-all shadow-lg"
                      >
                        <Gift size={24} className="text-white" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Simulate Gift</span>
                      </button>

                      {/* Grid Layouts */}
                      <button 
                        onClick={() => setActiveHostTab('grid')}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2 hover:bg-white/10 transition-all"
                      >
                        <RefreshCw size={24} className="text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Grid Layout</span>
                      </button>

                      {/* AI Peak Hours */}
                      <button 
                        onClick={() => {
                          setActiveHostTab('peak-hours');
                          if (peakHourData.length === 0) {
                            handleRefreshPeakHours();
                          }
                        }}
                        className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex flex-col items-center gap-2 hover:bg-purple-500/20 transition-all"
                      >
                        <Clock size={24} className="text-purple-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Peak Hours</span>
                      </button>

                      {/* AI Assistant Button */}
                      <button 
                        onClick={() => {
                          setShowHostControl(false);
                          setShowAIAssistant(true);
                          handleRefreshAI();
                        }}
                        className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-rose-500 border border-white/20 flex flex-col items-center gap-2 hover:opacity-90 transition-all shadow-lg"
                      >
                        <Brain size={24} className="text-white" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">AI Assistant</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeHostTab === 'peak-hours' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setActiveHostTab('main')} className="p-2 glass rounded-full">
                          <ChevronRight size={16} className="rotate-180" />
                        </button>
                        <h3 className="text-lg font-black tracking-tight">AI PEAK HOURS</h3>
                      </div>
                      <button 
                        onClick={handleRefreshPeakHours}
                        className="p-2 glass rounded-full text-purple-400 hover:bg-purple-500/20 transition-all"
                        title="Refresh Data"
                      >
                        <RefreshCw size={16} className={isAILoading ? 'animate-spin' : ''} />
                      </button>
                    </div>
                    
                    {isAILoading ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <RefreshCw className="text-purple-400" size={32} />
                        </motion.div>
                        <p className="text-sm font-bold text-white/60">Inachambua data ya Peak Hours...</p>
                      </div>
                    ) : (
                      <div className="bg-purple-500/10 rounded-3xl p-6 border border-purple-500/20">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-2xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Brain size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">AI Analysis</p>
                            <p className="text-sm font-bold text-white">Saa Bora za Kuanzisha PK</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {peakHourData.length > 0 ? (
                            peakHourData.map((time, idx) => (
                              <div key={idx} className="bg-black/40 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-black text-purple-400">#{idx + 1}</span>
                                  <span className="text-sm font-bold text-white">{time}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-black text-green-400 uppercase">
                                  <TrendingUp size={12} /> High Reach
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-sm text-white/40">Hakuna data iliyopatikana. Bonyeza tena kitufe cha Peak Hours.</p>
                            </div>
                          )}
                        </div>
                        
                        <p className="mt-6 text-[10px] text-white/40 italic leading-relaxed">
                          * Uchambuzi huu unategemea tabia ya watazamaji wako katika siku 7 zilizopita.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeHostTab === 'background' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setActiveHostTab('main')} className="p-2 glass rounded-full">
                        <ChevronRight size={16} className="rotate-180" />
                      </button>
                      <h3 className="text-lg font-black tracking-tight">CHANGE BACKGROUND</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* None Option */}
                      <button 
                        onClick={() => setActiveBackground(null)}
                        className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all flex flex-col items-center justify-center gap-2 bg-white/5 group ${
                          activeBackground === null ? 'border-amber-400 scale-95' : 'border-white/10'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <X size={16} className="text-white/40" />
                        </div>
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">None</span>
                        {activeBackground === null && (
                          <div className="absolute top-2 right-2 bg-amber-400 text-black p-0.5 rounded-full">
                            <Check size={8} />
                          </div>
                        )}
                      </button>

                      {/* Upload from Device */}
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-white/20 hover:border-amber-400/50 transition-all flex flex-col items-center justify-center gap-2 bg-white/5 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-400/20 transition-colors">
                          <Upload size={16} className="text-white/40 group-hover:text-amber-400" />
                        </div>
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest group-hover:text-white">Upload from Device</span>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleBackgroundUpload}
                        />
                      </button>

                      {[
                        { name: 'Abstract Pink', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80' },
                        { name: 'Cyberpunk City', url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=1920&q=80' },
                        { name: 'Deep Ocean', url: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&w=1920&q=80' },
                        { name: 'Sunset Vibes', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80' },
                        { name: 'Galaxy Night', url: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=1920&q=80' },
                        { name: 'Minimalist', url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1920&q=80' }
                      ].map((bg) => (
                        <button 
                          key={bg.name}
                          onClick={() => setActiveBackground(bg.url)}
                          className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                            activeBackground === bg.url ? 'border-amber-400 scale-95' : 'border-transparent'
                          }`}
                        >
                          <img src={bg.url} className="w-full h-full object-cover" alt={bg.name} referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/20" />
                          <span className="absolute bottom-2 left-2 text-[8px] font-black text-white uppercase tracking-widest">{bg.name}</span>
                          {activeBackground === bg.url && (
                            <div className="absolute top-2 right-2 bg-amber-400 text-black p-0.5 rounded-full">
                              <Check size={8} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeHostTab === 'music' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setActiveHostTab('main')} className="p-2 glass rounded-full">
                        <ChevronRight size={16} className="rotate-180" />
                      </button>
                      <h3 className="text-lg font-black tracking-tight">BACKGROUND MUSIC</h3>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                      {musicTracks.map((track) => (
                        <button 
                          key={track.name}
                          onClick={() => setActiveMusic(activeMusic === track.name ? null : track.name)}
                          className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${
                            activeMusic === track.name ? 'bg-rose-500/20 border border-rose-500/50' : 'bg-white/5 border border-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeMusic === track.name ? 'bg-rose-500 animate-spin-slow' : 'bg-white/10'}`}>
                              <Music size={14} className="text-white" />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold text-white">{track.name}</p>
                              <p className="text-[10px] text-white/80">{track.duration}</p>
                            </div>
                          </div>
                          {activeMusic === track.name && (
                            <div className="flex gap-0.5 items-end h-3">
                              <div className="w-0.5 h-full bg-rose-500 animate-bounce" style={{ animationDelay: '0s' }} />
                              <div className="w-0.5 h-2/3 bg-rose-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                              <div className="w-0.5 h-full bg-rose-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Volume Control */}
                    <div className="glass-dark p-4 rounded-2xl border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Volume2 size={14} className="text-rose-500" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Music Volume</span>
                        </div>
                        <span className="text-[10px] font-black text-rose-500">{musicVolume}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={musicVolume}
                        onChange={(e) => setMusicVolume(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>
                  </div>
                )}

                {activeHostTab === 'requests' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setActiveHostTab('main')} className="p-2 glass rounded-full text-white">
                        <ChevronRight size={16} className="rotate-180" />
                      </button>
                      <h3 className="text-lg font-black tracking-tight text-white">GUEST REQUESTS</h3>
                    </div>
                    {guestRequests.length > 0 ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                        {guestRequests.map((req) => (
                          <div key={req.id} className="p-3 glass rounded-2xl flex items-center justify-between border border-white/10">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img src={req.avatar} className="w-10 h-10 rounded-full border border-white/20" alt={req.name} referrerPolicy="no-referrer" />
                                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[7px] font-black px-1 rounded-full">Lv.{req.level}</div>
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-bold text-white">{req.name}</p>
                                <p className="text-[9px] text-white/80">Wants to join as guest</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setGuestRequests(prev => prev.filter(r => r.id !== req.id))}
                                className="p-2 bg-white/5 hover:bg-rose-500/20 text-rose-500 rounded-full transition-all"
                              >
                                <X size={14} />
                              </button>
                              <button 
                                onClick={() => addGuest(req)}
                                className="p-2 bg-green-500 text-white rounded-full shadow-lg shadow-green-500/20 active:scale-90 transition-all"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center gap-3 opacity-40 text-white">
                        <Users size={48} />
                        <p className="text-xs font-bold">No pending requests</p>
                      </div>
                    )}
                  </div>
                )}

                {activeHostTab === 'guests' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setActiveHostTab('main')} className="p-2 glass rounded-full">
                        <ChevronRight size={16} className="rotate-180" />
                      </button>
                      <h3 className="text-lg font-black tracking-tight">MANAGE GUESTS</h3>
                    </div>
                    {activeGuests.length > 0 ? (
                      <div className="space-y-3">
                        {activeGuests.map((guest) => (
                          <div key={guest.id} className="p-3 glass rounded-2xl flex items-center justify-between border border-white/5">
                            <div className="flex items-center gap-3">
                              <img src={guest.avatar} className="w-10 h-10 rounded-full border border-white/20" alt={guest.name} referrerPolicy="no-referrer" />
                              <div className="text-left">
                                <p className="text-xs font-bold text-white">{guest.name}</p>
                                <p className="text-[9px] text-amber-400 font-black flex items-center gap-1">
                                  <Zap size={8} fill="currentColor" /> {guest.coins} Coins
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setActiveGuests(prev => prev.map(g => g.id === guest.id ? { ...g, isMuted: !g.isMuted } : g));
                                }}
                                className={`p-2 rounded-full transition-all ${guest.isMuted ? 'bg-rose-500/20 text-rose-500' : 'bg-white/5 text-white/60'}`}
                                title={guest.isMuted ? "Unmute" : "Mute"}
                              >
                                {guest.isMuted ? <Mic size={14} /> : <Volume2 size={14} />}
                              </button>
                              <button 
                                onClick={() => toggleSpotlight(guest.id)}
                                className={`p-2 rounded-full transition-all ${spotlightId === guest.id ? 'bg-amber-500 text-black' : 'bg-white/5 text-white/60'}`}
                                title="Spotlight"
                              >
                                <Video size={14} />
                              </button>
                              <button 
                                onClick={() => removeGuest(guest.id)}
                                className="p-2 bg-rose-500/20 text-rose-500 rounded-full"
                                title="Remove"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center gap-3 opacity-80 text-white">
                        <UserPlus size={48} />
                        <p className="text-xs font-bold">No active guests</p>
                      </div>
                    )}
                  </div>
                )}

                {activeHostTab === 'grid' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setActiveHostTab('main')} className="p-2 glass rounded-full text-white">
                        <ChevronRight size={16} className="rotate-180" />
                      </button>
                      <h3 className="text-lg font-black tracking-tight text-white">GRID LAYOUTS</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex flex-col gap-3">
                        <span className="text-[10px] font-black text-white/80 uppercase tracking-widest px-1">Max Participants (Rooms)</span>
                        <div className="grid grid-cols-6 gap-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
                            const isDisabled = activeGuests.length > 0 && num < activeGuests.length;
                            return (
                              <button 
                                key={num}
                                onClick={() => {
                                  if (isDisabled) {
                                    addToast(`⚠️ You cannot select fewer than ${activeGuests.length} rooms. Please remove guests first.`);
                                    return;
                                  }
                                  setMaxRooms(num);
                                }}
                                className={`aspect-square rounded-2xl font-black text-xs transition-all flex items-center justify-center border ${
                                  maxRooms === num 
                                    ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]' 
                                    : isDisabled
                                    ? 'bg-white/5 border-white/5 text-white/10 cursor-not-allowed'
                                    : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                                }`}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Layout Style</span>
                          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                            {gridLayout === 'dynamic' ? 'Auto Grid' : 
                             gridLayout === 'grid' ? 'Standard' : 
                             gridLayout === 'spotlight' ? 'Big Screen' : 
                             gridLayout === 'horizontal' ? 'Horizontal' : 
                             gridLayout === 'bento' ? 'Bento' : 
                             gridLayout === 'bubbles' ? 'Bubbles' : 
                             gridLayout === 'sidebar' ? 'Side Rail' : 
                             gridLayout === 'stacked' ? 'Dual Spotlight' : 'None'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: null, name: 'None', icon: <X size={18} /> },
                            { id: 'dynamic', name: 'Auto Grid', icon: <RefreshCw size={18} /> },
                            { id: 'spotlight', name: 'Big Screen', icon: <Video size={18} /> },
                            { id: 'stacked', name: 'Dual Spotlight', icon: <Users size={18} /> },
                            { id: 'bento', name: 'Bento Grid', icon: <Layout size={18} /> },
                            { id: 'horizontal', name: 'Horizontal Scroll', icon: <ChevronRight size={18} /> },
                            { id: 'bubbles', name: 'Floating Bubbles', icon: <Circle size={18} /> },
                            { id: 'sidebar', name: 'Side Rail', icon: <Columns size={18} /> }
                          ].map(layout => (
                            <button 
                              key={layout.id || 'none'}
                              onClick={() => setGridLayout(layout.id as any)}
                              className={`p-4 rounded-3xl border flex flex-col items-center justify-center gap-2 transition-all aspect-[4/3] group relative overflow-hidden ${
                                gridLayout === layout.id 
                                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.1)]' 
                                  : 'bg-white/5 border-white/5 text-white/80 hover:bg-white/10 hover:border-white/10'
                              }`}
                            >
                              {gridLayout === layout.id && (
                                <motion.div 
                                  layoutId="active-layout-bg"
                                  className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none"
                                />
                              )}
                              <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
                                gridLayout === layout.id 
                                  ? 'bg-amber-500 text-black scale-110 shadow-[0_0_15px_rgba(251,191,36,0.5)]' 
                                  : 'bg-white/10 text-white/60 group-hover:scale-110 group-hover:bg-white/20'
                              }`}>
                                {layout.icon}
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight z-10">{layout.name}</span>
                              {gridLayout === layout.id && (
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* PK ERROR MODAL (HOST ONLY) */}
        <AnimatePresence>
          {showPKErrorModal && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center px-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPKErrorModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-xs glass-dark rounded-[32px] p-8 z-10 border border-white/10 text-center shadow-2xl relative overflow-hidden"
              >
                {/* Decorative Background Glow */}
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-rose-500/20 blur-3xl rounded-full" />
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/20 blur-3xl rounded-full" />

                <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/30">
                  <Zap size={32} className="text-rose-500 animate-pulse" fill="currentColor" />
                </div>
                
                <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight">PK Battle Restricted</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-8">
                  ⚠️ You cannot start PK while you have Guests. Please remove them first.
                </p>
                
                <button 
                  onClick={() => setShowPKErrorModal(false)}
                  className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-rose-500/20 active:scale-95 transition-all uppercase tracking-widest"
                >
                  Understood
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ACTIVE GAME OVERLAY REMOVED */}

        {/* MODALS: VIEWER LIST */}
        <AnimatePresence>
          {showViewerList && (
            <div className="absolute inset-0 z-[120] flex items-end justify-center">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowViewerList(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full glass-dark rounded-t-[32px] p-6 z-10 border-t border-white/10 max-h-[70%] flex flex-col"
              >
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 shrink-0" />
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="text-lg font-black tracking-tight text-white uppercase">Viewers (1.2k)</h3>
                  <button 
                    onClick={() => setShowViewerList(false)}
                    className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-6">
                  {viewers.map((viewer, idx) => (
                    <div key={viewer.id} className="flex items-center gap-3 group">
                      <div className="relative">
                        <img src={viewer.avatar} className={`w-10 h-10 rounded-full object-cover border border-white/10 ${getStatusTier(viewer.level).glow}`} alt="" referrerPolicy="no-referrer" />
                        <div className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[8px] font-black px-1 rounded-full border border-black/10">
                          {viewer.level}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-white">{viewer.name}</p>
                          <span className={`text-[8px] font-black px-1 rounded-full text-white uppercase tracking-tighter flex items-center gap-0.5 ${getStatusTier(viewer.level).color}`}>
                            {getStatusTier(viewer.level).badge} {getStatusTier(viewer.level).title}
                          </span>
                          {idx === 0 && <span className="text-[7px] font-black bg-amber-400 text-black px-1 rounded-full">👑 King Supporter</span>}
                          {idx === 1 && <span className="text-[7px] font-black bg-blue-400 text-white px-1 rounded-full">💎 VIP</span>}
                          {idx === 2 && <span className="text-[7px] font-black bg-rose-500 text-white px-1 rounded-full">🔥 Loyal Fan</span>}
                        </div>
                        <p className="text-[10px] text-white/40">Viewer #{idx + 1}</p>
                      </div>
                      <button className="bg-rose-500/10 text-rose-500 text-[9px] font-black px-3 py-1.5 rounded-full border border-rose-500/20 hover:bg-rose-500/20 transition-all">
                        FOLLOW
                      </button>
                    </div>
                  ))}
                  {/* Mock more viewers */}
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 opacity-60">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <User size={16} className="text-white/20" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 w-20 bg-white/10 rounded-full mb-1" />
                        <div className="h-1.5 w-12 bg-white/5 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODALS: GIFT PANEL */}
        <AnimatePresence>
          {showGiftPanel && (
            <div className="absolute inset-0 z-[110] flex items-end">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setShowGiftPanel(false); setTargetGuest(null); }}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full glass-dark rounded-t-[32px] p-6 z-10 border-t border-white/10"
              >
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
                
                {targetGuest && (
                  <div className="flex items-center gap-4 mb-6 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="relative">
                      <img src={targetGuest.avatar} className="w-12 h-12 rounded-xl object-cover border border-rose-500/50" alt="" referrerPolicy="no-referrer" />
                      <div className="absolute -top-1 -right-1 bg-amber-400 text-black text-[7px] font-black px-1 rounded-full">LV.{targetGuest.level || 5}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-black text-sm uppercase tracking-widest truncate">{targetGuest.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-[8px] font-bold uppercase tracking-widest">{Math.floor(Math.random() * 1000) + 100} Followers</span>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-rose-400 text-[8px] font-black uppercase tracking-widest">Top Gifter</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                      <Zap size={12} className="text-amber-400" fill="currentColor" />
                      <span className="text-xs text-amber-400 font-bold">{coins.toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={() => toggleFollowGuest(targetGuest.id)}
                      className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
                        targetGuest.isFollowed 
                          ? 'bg-white/10 text-white/40' 
                          : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                      }`}
                    >
                      {targetGuest.isFollowed ? 'FOLLOWED' : 'FOLLOW'}
                    </button>
                  </div>
                )}

                {/* Private Progress Section */}
                  <div className="mb-6 bg-gradient-to-r from-rose-500/10 to-purple-500/10 rounded-2xl p-3 border border-white/10 relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-2 relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-400 text-sm font-black shadow-inner">
                          {userLevel}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Gifter Level</span>
                          <span className="text-[10px] font-black text-rose-400 uppercase tracking-tighter">SKYLOOK STATUS</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block">Remaining</span>
                        <span className="text-[10px] font-bold text-amber-400">
                          {getNextLevelThreshold(userLevel) ? (getNextLevelThreshold(userLevel)! - totalSpent).toLocaleString() : 0} 🪙
                        </span>
                      </div>
                    </div>
                    
                    <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5 border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (totalSpent - LEVEL_THRESHOLDS[userLevel - 1]) / (LEVEL_THRESHOLDS[userLevel] - LEVEL_THRESHOLDS[userLevel - 1]) * 100)}%` }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-rose-500"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center relative z-10">
                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-tighter">LV.{userLevel}</span>
                      <span className="text-[8px] font-bold text-rose-400 uppercase tracking-widest">
                        {getNextLevelThreshold(userLevel) ? `Need ${(getNextLevelThreshold(userLevel)! - totalSpent).toLocaleString()} to LV.${userLevel + 1}` : 'MAX LEVEL'}
                      </span>
                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-tighter">LV.{userLevel + 1}</span>
                    </div>
                  </div>
                <div className="grid grid-cols-4 gap-2 mb-8 max-h-64 overflow-y-auto no-scrollbar p-1">
                  {[
                    { name: 'Rose', emoji: '🌹', price: 1 },
                    { name: 'Heart', emoji: '❤️', price: 5 },
                    { name: 'Finger', emoji: '👆', price: 10 },
                    { name: 'Star', emoji: '⭐', price: 20 },
                    { name: 'Teddy', emoji: '🧸', price: 50 },
                    { name: 'Cake', emoji: '🎂', price: 100 },
                    { name: 'Crown', emoji: '👑', price: 200 },
                    { name: 'Diamond', emoji: '💎', price: 500 },
                    { name: 'Rocket', emoji: '🚀', price: 1000 },
                    { name: 'Car', emoji: '🏎️', price: 2500 },
                    { name: 'Plane', emoji: '✈️', price: 5000 },
                    { name: 'Castle', emoji: '🏰', price: 9999 }
                  ].map((gift) => (
                    <button 
                      key={gift.name}
                      onClick={() => sendGift(gift)}
                      className="bg-white/5 hover:bg-white/10 active:scale-90 transition-all p-3 rounded-2xl border border-white/5 flex flex-col items-center gap-1 relative overflow-hidden group"
                    >
                      <motion.span 
                        whileTap={{ scale: 1.5, rotate: 15 }}
                        className="text-2xl z-10"
                      >
                        {gift.emoji}
                      </motion.span>
                      <div className="text-center text-white z-10">
                        <p className="text-[8px] font-bold opacity-60">{gift.name}</p>
                        <p className="text-[9px] text-amber-500 font-black">{gift.price}</p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
                
                {/* OLD COMBO DISPLAY IN PANEL REMOVED */}

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowCoinPurchaseModal(true)}
                    className="flex-1 py-4 bg-white/5 text-white hover:bg-white/10 transition-colors rounded-2xl font-black text-sm border border-white/10 uppercase tracking-widest"
                  >
                    RECHARGE
                  </button>
                  <button 
                    onClick={() => { setShowGiftPanel(false); setTargetGuest(null); }}
                    className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-rose-500/20 uppercase tracking-widest"
                  >
                    CLOSE
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* SKYLOOK LEGENDS MODAL */}
        <AnimatePresence>
          {showSkylookLegends && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSkylookLegends(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                className="w-full max-w-md glass rounded-[40px] p-0 z-10 border border-amber-500/30 relative overflow-hidden shadow-[0_0_50px_rgba(251,191,36,0.2)] flex flex-col max-h-[85vh]"
              >
                {/* Header with 3D-like effect */}
                <div className="p-8 pb-4 text-center relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/20 blur-[60px] rounded-full" />
                  <motion.div 
                    animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block mb-4 text-5xl drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]"
                  >
                    ⚡
                  </motion.div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-1 italic">Skylook Legends</h3>
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em] opacity-80">Hall of Fame</p>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-8 space-y-3">
                  {[
                    { rank: 1, name: 'Legendary_King', level: 98, spent: 184000000, badge: '🌌', avatar: 'https://i.pravatar.cc/150?u=legend' },
                    { rank: 2, name: 'Sky_Master', level: 92, spent: 116500000, badge: '👑', avatar: 'https://i.pravatar.cc/150?u=sky' },
                    { rank: 3, name: 'God_Tier', level: 85, spent: 60500000, badge: '🛡️', avatar: 'https://i.pravatar.cc/150?u=god' },
                    { rank: 4, name: 'Elite_Gifter', level: 78, spent: 29000000, badge: '🌟', avatar: 'https://i.pravatar.cc/150?u=elite' },
                    { rank: 5, name: 'Rising_Star', level: 65, spent: 6400000, badge: '✨', avatar: 'https://i.pravatar.cc/150?u=star' },
                    { rank: 6, name: 'Noble_User', level: 55, spent: 1500000, badge: '💎', avatar: 'https://i.pravatar.cc/150?u=noble' },
                  ].map((legend) => (
                    <motion.div 
                      key={legend.rank}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: legend.rank * 0.1 }}
                      className="flex items-center gap-4 p-4 glass-dark rounded-3xl border border-white/5 hover:border-amber-500/30 transition-all group"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                        legend.rank === 1 ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 
                        legend.rank === 2 ? 'bg-slate-300 text-black' : 
                        legend.rank === 3 ? 'bg-amber-700 text-white' : 'text-white/40'
                      }`}>
                        {legend.rank}
                      </div>
                      <div className="relative">
                        <img src={legend.avatar} className="w-12 h-12 rounded-2xl object-cover border border-white/10 group-hover:scale-105 transition-transform" alt="" referrerPolicy="no-referrer" />
                        <div className="absolute -bottom-1 -right-1 text-lg drop-shadow-lg">{legend.badge}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-white truncate uppercase tracking-tight">{legend.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-amber-400 italic">LV.{legend.level}</span>
                          <span className="text-[8px] text-white/40 font-black uppercase tracking-widest">{legend.spent.toLocaleString()} Coins</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-8 pt-4 border-t border-white/5 bg-black/40">
                  <p className="text-[9px] text-white/40 text-center uppercase font-bold leading-relaxed">
                    Top-tier gifters on Skylook Live can recharge to unlock special status
                  </p>
                  <button 
                    onClick={() => setShowSkylookLegends(false)}
                    className="w-full mt-6 py-4 bg-amber-500 text-black rounded-2xl font-black shadow-2xl shadow-amber-500/30 uppercase tracking-widest text-xs active:scale-95 transition-all"
                  >
                    CLOSE LEGENDS
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* GUEST CONTROL MODAL */}
        <AnimatePresence>
          {showCoinPurchaseModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCoinPurchaseModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm glass-dark rounded-[32px] border border-white/10 p-6 relative z-10 shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600" />
                
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Buy Coins</h3>
                  <button 
                    onClick={() => setShowCoinPurchaseModal(false)}
                    className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { amount: 100, price: '$0.99', bonus: '0' },
                    { amount: 500, price: '$4.99', bonus: '50' },
                    { amount: 1200, price: '$9.99', bonus: '150' },
                    { amount: 2500, price: '$19.99', bonus: '400' },
                    { amount: 6500, price: '$49.99', bonus: '1200' },
                    { amount: 15000, price: '$99.99', bonus: '3500' }
                  ].map((pack) => (
                    <button 
                      key={pack.amount}
                      onClick={() => {
                        setCoins(prev => prev + pack.amount + parseInt(pack.bonus));
                        addToast(`✅ Purchased ${pack.amount} Coins!`);
                        setShowCoinPurchaseModal(false);
                      }}
                      className="bg-white/5 hover:bg-white/10 active:scale-95 transition-all p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-1 relative group"
                    >
                      <Zap size={20} className="text-amber-400 mb-1" fill="currentColor" />
                      <span className="text-lg font-black text-white">{pack.amount.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-amber-400/80">+{pack.bonus} Bonus</span>
                      <div className="mt-2 px-3 py-1 bg-rose-500 rounded-full text-[10px] font-black text-white shadow-lg shadow-rose-500/20">
                        {pack.price}
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-white/40 text-center font-medium">
                  Secure payment via App Store / Play Store. 
                  <br />By purchasing, you agree to our Terms of Service.
                </p>
              </motion.div>
            </div>
          )}

          {selectedGuestForControl && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-10">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedGuestForControl(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="w-full max-w-md glass-dark rounded-[32px] border border-white/10 p-6 relative z-10 shadow-2xl"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <img src={selectedGuestForControl.avatar} className="w-16 h-16 rounded-2xl object-cover border-2 border-rose-500" alt="" referrerPolicy="no-referrer" />
                    {selectedGuestForControl.isHost && (
                      <div className="absolute -top-2 -left-2 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">HOST</div>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-col">
                      <h3 className="text-white font-black text-lg uppercase tracking-widest">
                        {selectedGuestForControl.name}
                      </h3>
                      <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest -mt-1">
                        {selectedGuestForControl.name === userName 
                          ? (selectedGuestForControl.isHost ? 'HOST CONTROL' : 'GUEST CONTROL') 
                          : (isCurrentUserHost ? 'ADMIN MODE' : 'VIEW MODE')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="bg-amber-400 text-black px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1">
                        <Zap size={10} fill="currentColor" /> {selectedGuestForControl.coins}
                      </div>
                      <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Level {selectedGuestForControl.level || 5}</span>
                      <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">• {Math.floor(Math.random() * 1000) + 100} Followers</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedGuestForControl(null)}
                    className="ml-auto p-2 bg-white/5 rounded-full text-white/40 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* 1. GUEST SELF CONTROLS (Guest clicking themselves) */}
                  {selectedGuestForControl.name === userName && !selectedGuestForControl.isHost && (
                    <>
                      <button 
                        onClick={() => { toggleMuteGuest(selectedGuestForControl.id); setSelectedGuestForControl(null); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                      >
                        {selectedGuestForControl.isMuted ? <MicOff size={24} className="text-rose-500" /> : <Mic size={24} className="text-green-400" />}
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{selectedGuestForControl.isMuted ? 'Unmute' : 'Mute'}</span>
                      </button>
                      <button 
                        onClick={() => { toggleCameraGuest(selectedGuestForControl.id); setSelectedGuestForControl(null); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                      >
                        {selectedGuestForControl.isCameraOff ? <VideoOff size={24} className="text-rose-500" /> : <Video size={24} className="text-blue-400" />}
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{selectedGuestForControl.isCameraOff ? 'Cam On' : 'Cam Off'}</span>
                      </button>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                      >
                        <ImageIcon size={24} className="text-purple-400" />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest text-center">Change BG</span>
                      </button>
                      <button 
                        onClick={() => {
                          resetBackground(selectedGuestForControl.id);
                          setSelectedGuestForControl(null);
                        }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                      >
                        <User size={24} className="text-cyan-400" />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest text-center">Profile Pic</span>
                      </button>
                    </>
                  )}

                  {/* 2. HOST SELF CONTROLS (Host clicking themselves) */}
                  {selectedGuestForControl.name === userName && selectedGuestForControl.isHost && (
                    <>
                      <button 
                        onClick={() => { setIsMicOn(!isMicOn); setSelectedGuestForControl(null); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                      >
                        {isMicOn ? <Mic size={24} className="text-green-400" /> : <MicOff size={24} className="text-rose-500" />}
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{isMicOn ? 'Mute' : 'Unmute'}</span>
                      </button>
                      <button 
                        onClick={() => { setHost1CamOn(!host1CamOn); setSelectedGuestForControl(null); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                      >
                        {host1CamOn ? <Video size={24} className="text-blue-400" /> : <VideoOff size={24} className="text-rose-500" />}
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Camera</span>
                      </button>
                      <button 
                        onClick={() => { setActiveHostTab('main'); setShowHostControl(true); setSelectedGuestForControl(null); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                      >
                        <Settings size={24} className="text-amber-400" />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Host Panel</span>
                      </button>
                    </>
                  )}

                  {/* 3. HOST CONTROL OVER GUEST (Host clicking a guest) */}
                  {isCurrentUserHost && selectedGuestForControl.name !== userName && !selectedGuestForControl.isHost && (
                    <>
                      <button 
                        onClick={() => { toggleSpotlight(selectedGuestForControl.id); setSelectedGuestForControl(null); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                      >
                        <Maximize2 size={24} className={spotlightId === selectedGuestForControl.id ? 'text-amber-400' : 'text-cyan-400'} />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                          {spotlightId === selectedGuestForControl.id ? 'Shrink' : 'Expand'}
                        </span>
                      </button>
                      <button 
                        onClick={() => { toggleMuteGuest(selectedGuestForControl.id); setSelectedGuestForControl(null); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                      >
                        {selectedGuestForControl.isMuted ? <MicOff size={24} className="text-rose-500" /> : <Mic size={24} className="text-green-400" />}
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Mute Guest</span>
                      </button>
                      <button 
                        onClick={() => { toggleCameraGuest(selectedGuestForControl.id); setSelectedGuestForControl(null); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                      >
                        {selectedGuestForControl.isCameraOff ? <VideoOff size={24} className="text-rose-500" /> : <Video size={24} className="text-blue-400" />}
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Stop Video</span>
                      </button>
                      <button 
                        onClick={() => { togglePin(selectedGuestForControl.id); setSelectedGuestForControl(null); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                      >
                        <Zap size={24} className={selectedGuestForControl.isPinned ? 'text-amber-400' : 'text-white/20'} fill={selectedGuestForControl.isPinned ? 'currentColor' : 'none'} />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{selectedGuestForControl.isPinned ? 'Unpin' : 'Pin'}</span>
                      </button>
                      <button 
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                      >
                        <Clock size={24} className="text-purple-400" />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Timer</span>
                      </button>
                      <button 
                        onClick={() => { moveGuestUp(selectedGuestForControl.id); setSelectedGuestForControl(null); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                      >
                        <ChevronUp size={24} className="text-cyan-400" />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Move Up</span>
                      </button>
                      <button 
                        onClick={() => { moveGuestDown(selectedGuestForControl.id); setSelectedGuestForControl(null); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                      >
                        <ChevronDown size={24} className="text-cyan-400" />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Move Down</span>
                      </button>
                      <button 
                        onClick={() => { removeGuest(selectedGuestForControl.id); setSelectedGuestForControl(null); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 transition-all border border-rose-500/20"
                      >
                        <UserMinus size={24} className="text-rose-500" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Remove</span>
                      </button>
                    </>
                  )}

                  {/* 4. GUEST INTERACTION (Guest clicking another guest) */}
                  {!isCurrentUserHost && selectedGuestForControl.name !== userName && (
                    <>
                      <button 
                        onClick={() => { toggleFollowGuest(selectedGuestForControl.name); setSelectedGuestForControl(null); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 transition-all border border-blue-500/20"
                      >
                        <UserPlus size={24} className="text-blue-400" />
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Follow</span>
                      </button>

                      <button 
                        onClick={() => { setTargetGuest(selectedGuestForControl); setShowGiftPanel(true); setSelectedGuestForControl(null); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 transition-all border border-rose-500/20"
                      >
                        <Gift size={24} className="text-rose-500" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Send Gift</span>
                      </button>
                    </>
                  )}

                  {/* 5. VIEWER INFO */}
                  {selectedGuestForControl.isHost && isViewerView && (
                    <div className="col-span-2 p-4 text-center text-white/40 text-[10px] font-black uppercase tracking-widest">
                      Host Controls are in the Main Panel
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODALS: SETTINGS */}
        <AnimatePresence>
          {showSettings && (
            <div className="absolute inset-0 z-50 flex items-end">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettings(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full glass rounded-t-[32px] p-8 z-10"
              >
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />
                <h3 className="text-center text-base font-black mb-8 uppercase tracking-widest">SETTINGS</h3>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-2xl border border-white/5 active:scale-95">
                    <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center text-rose-500">
                      <RefreshCw size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase">Flip Camera</p>
                  </button>
                  <button className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-2xl border border-white/5 active:scale-95">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white/40">
                      <Sparkles size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase text-white/40">Filters</p>
                  </button>
                </div>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black shadow-2xl shadow-rose-500/30 uppercase tracking-widest text-sm"
                >
                  SAVE CHANGES
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODALS: OPTIONS */}
        <AnimatePresence>
          {showOptions && (
            <div className="absolute inset-0 z-50 flex items-end">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowOptions(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full glass rounded-t-[32px] p-8 z-10"
              >
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />
                <div className="space-y-3">
                  <button 
                    onClick={() => { setShowSkylookLegends(true); setShowOptions(false); }}
                    className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-amber-500/10 to-rose-500/10 hover:from-amber-500/20 hover:to-rose-500/20 rounded-2xl text-sm font-bold border border-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.1)] group"
                  >
                    <span className="text-amber-400 group-hover:scale-110 transition-transform"><Trophy size={20} fill="currentColor" /></span> 
                    <div className="flex flex-col items-start">
                      <span className="text-white uppercase tracking-widest text-[10px] font-black">Skylook Legends</span>
                      <span className="text-[8px] text-amber-400/60 uppercase">Top Gifter Leaderboard</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => { 
                      if (!isPKActive && activeGuests.length > 0) {
                        setShowPKErrorModal(true);
                        setShowOptions(false);
                        return;
                      }
                      setIsPKActive(!isPKActive); 
                      setShowOptions(false); 
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold border border-white/5"
                  >
                    <span className="text-rose-500"><Zap size={20} /></span> {isPKActive ? 'End PK Battle' : 'Start PK Battle'}
                  </button>
                  <button className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold border border-white/5">
                    <span className="text-white/40"><Volume2 size={20} /></span> Mute Host
                  </button>
                  <button className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold border border-white/5">
                    <span className="text-white/40"><Settings size={20} /></span> Stream Quality
                  </button>
                  <button className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold border border-white/5">
                    <span className="text-rose-500"><Flag size={20} /></span> Report Stream
                  </button>
                </div>
                <button 
                  onClick={() => setShowOptions(false)}
                  className="w-full mt-8 py-3 text-white/20 font-black uppercase tracking-widest text-[10px]"
                >
                  CLOSE
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODALS: USER PROFILE */}
        <AnimatePresence>
          {showCloseConfirm && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCloseConfirm(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-xs glass rounded-[32px] p-8 z-10 border border-white/20 text-center relative overflow-hidden"
              >
                <div className="absolute -top-12 -left-12 w-24 h-24 bg-rose-500/20 blur-3xl rounded-full" />
                
                <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/30">
                  <X size={32} className="text-rose-500" />
                </div>
                
                <h3 className="text-xl font-black text-white mb-2 tracking-tight">END LIVE STREAM?</h3>
                <p className="text-white/60 text-xs mb-8 leading-relaxed">Are you sure you want to end your live session? All viewers will be disconnected.</p>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
                  >
                    Yes, End Live
                  </button>
                  <button 
                    onClick={() => setShowCloseConfirm(false)}
                    className="w-full py-4 glass text-white/60 rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all border border-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {showPKSelection && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPKSelection(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-sm glass rounded-[32px] p-6 z-10 border border-white/20 relative overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-white tracking-tight">CHOOSE CHALLENGER</h3>
                  <button onClick={() => setShowPKSelection(false)} className="p-2 glass rounded-full text-white/40"><X size={18} /></button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search live hosts..." 
                    value={searchChallenger}
                    onChange={(e) => setSearchChallenger(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-rose-500/50 transition-all"
                  />
                </div>

                {/* AI Recommendation */}
                <button 
                  onClick={async () => {
                    const advice = await aiService.shouldAutoStartPK({
                      viewerCount: 1200,
                      newViewers: 50,
                      timeSinceLastPK: "20 mins ago",
                      bigGiftersCount: 5
                    });
                    addToast(`🤖 AI Advice: ${advice.decision.toUpperCase()} - ${advice.reason}`);
                  }}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between mb-3 group active:scale-95 transition-all hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Brain size={20} className="text-purple-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-white">AI RECOMMENDATION</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Best time to start?</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-white/20 group-hover:text-white transition-colors" />
                </button>

                {/* Automatic Option */}
                <button 
                  onClick={() => startPKWithChallenger({ name: 'Random Host', avatar: 'https://i.pravatar.cc/150?u=random' })}
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-purple-600 flex items-center justify-between mb-6 group active:scale-95 transition-all shadow-lg shadow-rose-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Zap size={20} className="text-white animate-pulse" fill="currentColor" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-white">AUTOMATIC MATCH</p>
                      <p className="text-[10px] text-white/70">Find any available challenger</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-white/40 group-hover:text-white transition-colors" />
                </button>

                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 px-2">Live Hosts</div>
                
                {/* Hosts List */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                  {liveHosts
                    .filter(h => h.name.toLowerCase().includes(searchChallenger.toLowerCase()))
                    .map((host) => (
                    <button 
                      key={host.id}
                      onClick={() => startPKWithChallenger(host)}
                      className="w-full p-3 glass-dark rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-all active:scale-95"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={host.avatar} className="w-10 h-10 rounded-full border border-white/20" alt="" referrerPolicy="no-referrer" />
                          <div className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[7px] font-black px-1 rounded-full">Lv.{host.level}</div>
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-white">{host.name}</p>
                          <p className="text-[9px] text-white/60">{host.viewers} viewers</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-rose-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Live</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {showProfileModal && selectedUser && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setShowProfileModal(false); setProfileTab('info'); }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-sm glass rounded-[32px] p-0 z-10 border border-white/20 relative overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
              >
                {/* Profile Background Glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/30 blur-[80px] rounded-full animate-pulse" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/30 blur-[80px] rounded-full animate-pulse" />

                {/* Tabs Header */}
                {selectedUser.isMe && (
                  <div className="flex border-b border-white/10 relative z-20">
                    {['info', 'nexus', 'status'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setProfileTab(tab as any)}
                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                          profileTab === tab ? 'text-white' : 'text-white/40 hover:text-white/60'
                        }`}
                      >
                        {tab === 'info' ? 'Profile' : tab === 'nexus' ? '⭐ Nexus' : '👑 Status'}
                        {profileTab === tab && (
                          <motion.div 
                            layoutId="profileTabActive"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-8 overflow-y-auto no-scrollbar relative z-10">
                  {profileTab === 'info' && (
                    <div className="relative flex flex-col items-center text-center">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-tr from-rose-500 to-blue-500 rounded-full blur-xl opacity-40 animate-spin-slow" />
                        <img 
                          src={selectedUser.avatar} 
                          className="w-28 h-28 rounded-full border-4 border-white/20 shadow-2xl relative z-10 object-cover" 
                          alt="profile"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg border border-white/20 z-20 flex items-center gap-1">
                          <Trophy size={10} />
                          Lv.{selectedUser.level}
                        </div>
                      </div>

                      <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{selectedUser.name}</h3>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[8px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 uppercase tracking-widest">Verified Host</span>
                        <span className="text-[8px] font-black text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20 uppercase tracking-widest">Top Gifter</span>
                      </div>
                      
                      <p className="text-white/60 text-xs mb-8 px-4 leading-relaxed italic">
                        "{selectedUser.bio}"
                      </p>

                      <div className="grid grid-cols-3 gap-3 w-full mb-8">
                        <div className="glass-dark p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                          <p className="text-[8px] text-amber-400 uppercase font-black mb-1">Streak</p>
                          <div className="flex items-center gap-1">
                            <Flame size={10} className="text-amber-400" fill="currentColor" />
                            <p className="text-sm font-black text-white">{streak}D</p>
                          </div>
                        </div>
                        <div className="glass-dark p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                          <p className="text-[8px] text-white/40 uppercase font-black mb-1">Followers</p>
                          <p className="text-sm font-black text-white">12.4k</p>
                        </div>
                        <div className="glass-dark p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                          <p className="text-[8px] text-white/40 uppercase font-black mb-1">Gifting</p>
                          <p className="text-sm font-black text-amber-400">Top 1%</p>
                        </div>
                      </div>

                      <div className="flex gap-3 w-full">
                        <button 
                          onClick={handleFollowClick}
                          className="flex-1 py-4 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-rose-500/20 uppercase tracking-[0.2em] active:scale-95 transition-all"
                        >
                          {isMember ? 'TEAM MEMBER' : isFollowed ? 'BECOME MEMBER' : 'FOLLOW'}
                        </button>
                        <button 
                          onClick={() => { setShowProfileModal(false); setTargetGuest(selectedUser as any); setShowGiftPanel(true); }}
                          className="flex-1 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20"
                        >
                          Send Gift
                        </button>
                      </div>
                    </div>
                  )}

                  {profileTab === 'nexus' && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h4 className="text-amber-400 font-black text-lg uppercase tracking-widest mb-1">The Nexus</h4>
                        <p className="text-[10px] text-white/40 uppercase font-bold">Level Milestones & Rewards</p>
                      </div>

                      <div className="space-y-4">
                        {NEXUS_MILESTONES.map((milestone) => {
                          const isUnlocked = userLevel >= milestone.level;
                          const progress = Math.min(100, (userLevel / milestone.level) * 100);
                          
                          return (
                            <div key={milestone.level} className="glass-dark p-4 rounded-2xl border border-white/5 relative overflow-hidden group">
                              {!isUnlocked && <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Locked: LV.{milestone.level}</span>
                              </div>}
                              
                              <div className="flex items-center gap-4 relative z-0">
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/5">
                                  {milestone.icon}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-end mb-1">
                                    <span className="text-xs font-black text-white uppercase tracking-tight">{milestone.reward}</span>
                                    <span className="text-[10px] font-bold text-amber-400">LV.{milestone.level}</span>
                                  </div>
                                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${progress}%` }}
                                      className={`h-full bg-gradient-to-r ${isUnlocked ? 'from-amber-400 to-orange-500' : 'from-white/20 to-white/10'}`}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {profileTab === 'status' && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h4 className="text-rose-500 font-black text-lg uppercase tracking-widest mb-1">Skylook Status</h4>
                        <p className="text-[10px] text-white/40 uppercase font-bold">Your Perks & Benefits</p>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Current Level</span>
                          <span className="text-xl font-black text-white italic">LV.{userLevel}</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(totalSpent / LEVEL_THRESHOLDS[userLevel]) * 100}%` }}
                            className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {SKYLOOK_PERKS.map((perk) => {
                          const isUnlocked = userLevel >= perk.level;
                          return (
                            <div 
                              key={perk.name} 
                              className={`p-3 rounded-2xl border transition-all ${
                                isUnlocked 
                                  ? 'bg-rose-500/10 border-rose-500/30' 
                                  : 'bg-white/5 border-white/5 opacity-40'
                              }`}
                            >
                              <div className="text-xl mb-1">{perk.icon}</div>
                              <p className="text-[10px] font-black text-white uppercase tracking-tight leading-none mb-1">{perk.name}</p>
                              <p className="text-[8px] text-white/40 leading-tight">{isUnlocked ? perk.description : `Unlocks at LV.${perk.level}`}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <audio ref={audioRef} loop />

        {/* Hidden File Input for Backgrounds */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleBackgroundChange}
        />
      </div>
    </div>
  );
}