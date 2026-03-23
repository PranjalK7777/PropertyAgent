import { Ionicons } from '@expo/vector-icons';
import type { Conversation, LeadScore } from '@property-agent/types';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';

export const AppGradient = cssInterop(LinearGradient, {
  className: 'style',
});

export const theme = {
  colors: {
    canvas: '#f9f1e7',
    canvasAlt: '#ead8c6',
    surface: '#fffbf6',
    input: '#f7efe6',
    ink: '#1f1a17',
    muted: '#6f6257',
    brand: '#b85c38',
    brandStrong: '#8f3d20',
    brandSoft: '#f1d6c5',
    sage: '#2f5d50',
    lineSoft: 'rgba(72, 56, 45, 0.16)',
    lineBrand: 'rgba(184, 92, 56, 0.14)',
    danger: '#dc2626',
    warning: '#d97706',
    success: '#15803d',
    info: '#0369a1',
  },
  gradients: {
    page: ['#f9f1e7', '#f3e5d7', '#ead8c6'] as [string, string, string],
    brand: ['#b85c38', '#a24b2d', '#8f3d20'] as [string, string, string],
    sage: ['#4b7b6f', '#2f5d50'] as [string, string],
  },
} as const;

type Tone = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  soft: string;
  border: string;
};

export const leadTones: Record<LeadScore | 'escalated', Tone> = {
  hot: {
    label: 'Hot',
    icon: 'flame',
    color: '#dc2626',
    soft: 'rgba(254, 226, 226, 0.88)',
    border: 'rgba(248, 113, 113, 0.35)',
  },
  warm: {
    label: 'Warm',
    icon: 'sunny',
    color: '#d97706',
    soft: 'rgba(254, 243, 199, 0.88)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  cold: {
    label: 'Cold',
    icon: 'snow',
    color: '#0369a1',
    soft: 'rgba(224, 242, 254, 0.88)',
    border: 'rgba(56, 189, 248, 0.3)',
  },
  rejected: {
    label: 'Rented',
    icon: 'checkmark-circle',
    color: '#15803d',
    soft: 'rgba(220, 252, 231, 0.9)',
    border: 'rgba(74, 222, 128, 0.3)',
  },
  needs_human: {
    label: 'Review',
    icon: 'alert-circle',
    color: '#d97706',
    soft: 'rgba(255, 247, 237, 0.92)',
    border: 'rgba(251, 191, 36, 0.3)',
  },
  escalated: {
    label: 'Needs You',
    icon: 'warning',
    color: '#b45309',
    soft: 'rgba(255, 247, 237, 0.92)',
    border: 'rgba(245, 158, 11, 0.35)',
  },
};

export function getLeadTone(leadScore: Conversation['leadScore'], needsHumanReview = false) {
  if (needsHumanReview) {
    return leadTones.escalated;
  }

  return leadTones[leadScore] ?? leadTones.cold;
}
