// hooks/useAuthModal.ts
import { create } from 'zustand';

interface AuthModalStore {
  isOpen: boolean;
  triggerReason: string;
  openModal: (reason?: string) => void; // Optional argument handle karne ke liye
  closeModal: () => void;
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  triggerReason: '',
  openModal: (reason) => set({ isOpen: true, triggerReason: reason || 'general' }),
  closeModal: () => set({ isOpen: false, triggerReason: '' }),
}));
