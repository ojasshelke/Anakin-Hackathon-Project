import { create } from 'zustand';
import { Outfit, TryOnResult } from '@/types';
import type { UserWithMeasurements } from '@/hooks/useUser';

export interface PendingGarment {
  id: string;
  url: string;
  category: string;
  name: string;
}

interface AppState {
  // ─── Existing try-on state ───────────────────────────────────────────────
  userImage: string | null;
  setUserImage: (image: string | null) => void;
  selectedOutfit: Outfit | null;
  setSelectedOutfit: (outfit: Outfit | null) => void;
  isProcessing: boolean;
  setIsProcessing: (status: boolean) => void;
  processingStep: string;
  setProcessingStep: (step: string) => void;
  tryOnResult: TryOnResult | null;
  setTryOnResult: (result: TryOnResult | null) => void;
  favorites: TryOnResult[];
  addFavorite: (result: TryOnResult) => void;
  removeFavorite: (id: string) => void;

  // ─── Auth / user state ───────────────────────────────────────────────────
  /** Authenticated user with measurements from the `users` table. */
  currentUser: UserWithMeasurements | null;
  setCurrentUser: (user: UserWithMeasurements | null) => void;

  /** Public URL of the uploaded avatar photo (stored in Supabase Storage). */
  userPhotoUrl: string | null;
  setUserPhotoUrl: (url: string | null) => void;

  // ─── Pending garments (Trends → Studio) ─────────────────────────────────
  pendingGarments: PendingGarment[];
  addPendingGarment: (g: PendingGarment) => void;
  removePendingGarment: (id: string) => void;
  clearPendingGarments: () => void;
}

export const useStore = create<AppState>((set) => ({
  // ─── Try-on ──────────────────────────────────────────────────────────────
  userImage: null,
  setUserImage: (image) => set({ userImage: image }),
  selectedOutfit: null,
  setSelectedOutfit: (outfit) => set({ selectedOutfit: outfit }),
  isProcessing: false,
  setIsProcessing: (status) => set({ isProcessing: status }),
  processingStep: '',
  setProcessingStep: (step) => set({ processingStep: step }),
  tryOnResult: null,
  setTryOnResult: (result) => set({ tryOnResult: result }),
  favorites: [],
  addFavorite: (result) =>
    set((state) => {
      if (state.favorites.some((f) => f.id === result.id)) return state;
      return { favorites: [...state.favorites, result] };
    }),
  removeFavorite: (id) =>
    set((state) => ({
      favorites: state.favorites.filter((f) => f.id !== id),
    })),

  // ─── Auth ─────────────────────────────────────────────────────────────────
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  userPhotoUrl: null,
  setUserPhotoUrl: (url) => set({ userPhotoUrl: url }),

  // ─── Pending garments ─────────────────────────────────────────────────────
  pendingGarments: [],
  addPendingGarment: (g) =>
    set((state) => {
      if (state.pendingGarments.some((x) => x.id === g.id)) return state;
      return { pendingGarments: [...state.pendingGarments, g] };
    }),
  removePendingGarment: (id) =>
    set((state) => ({
      pendingGarments: state.pendingGarments.filter((g) => g.id !== id),
    })),
  clearPendingGarments: () => set({ pendingGarments: [] }),
}));
