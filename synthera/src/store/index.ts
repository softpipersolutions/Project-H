import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { User, Video, SearchFilters } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

interface VideoState {
  videos: Video[];
  featuredVideos: Video[];
  searchResults: Video[];
  currentVideo: Video | null;
  isLoading: boolean;
  error: string | null;
  searchFilters: SearchFilters;
  setVideos: (videos: Video[]) => void;
  setFeaturedVideos: (videos: Video[]) => void;
  setSearchResults: (videos: Video[]) => void;
  setCurrentVideo: (video: Video | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateSearchFilters: (filters: Partial<SearchFilters>) => void;
  clearSearchResults: () => void;
}

interface UIState {
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  videoPlayerOpen: boolean;
  currentVideoId: string | null;
  toast: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    isVisible: boolean;
  };
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  openVideoPlayer: (videoId: string) => void;
  closeVideoPlayer: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  hideToast: () => void;
}

interface UploadState {
  uploads: {
    [key: string]: {
      progress: number;
      stage: 'uploading' | 'processing' | 'generating-thumbnail' | 'complete' | 'error';
      error?: string;
    };
  };
  isUploading: boolean;
  addUpload: (id: string) => void;
  updateUpload: (id: string, progress: number, stage?: string, error?: string) => void;
  removeUpload: (id: string) => void;
  clearUploads: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: (user) =>
          set({ user, isAuthenticated: true, isLoading: false }),
        logout: () =>
          set({ user: null, isAuthenticated: false, isLoading: false }),
        updateUser: (updates) => {
          const currentUser = get().user;
          if (currentUser) {
            set({ user: { ...currentUser, ...updates } });
          }
        },
        setLoading: (loading) => set({ isLoading: loading }),
      }),
      {
        name: "synthera-auth",
        partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      }
    ),
    { name: "AuthStore" }
  )
);

export const useVideoStore = create<VideoState>()(
  devtools(
    (set, get) => ({
      videos: [],
      featuredVideos: [],
      searchResults: [],
      currentVideo: null,
      isLoading: false,
      error: null,
      searchFilters: {},
      setVideos: (videos) => set({ videos }),
      setFeaturedVideos: (videos) => set({ featuredVideos: videos }),
      setSearchResults: (videos) => set({ searchResults: videos }),
      setCurrentVideo: (video) => set({ currentVideo: video }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      updateSearchFilters: (filters) =>
        set({ searchFilters: { ...get().searchFilters, ...filters } }),
      clearSearchResults: () => set({ searchResults: [], searchFilters: {} }),
    }),
    { name: "VideoStore" }
  )
);

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        theme: 'dark',
        sidebarOpen: true,
        mobileMenuOpen: false,
        videoPlayerOpen: false,
        currentVideoId: null,
        toast: {
          message: '',
          type: 'info',
          isVisible: false,
        },
        setTheme: (theme) => set({ theme }),
        toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
        toggleMobileMenu: () => set({ mobileMenuOpen: !get().mobileMenuOpen }),
        openVideoPlayer: (videoId) =>
          set({ videoPlayerOpen: true, currentVideoId: videoId }),
        closeVideoPlayer: () =>
          set({ videoPlayerOpen: false, currentVideoId: null }),
        showToast: (message, type) =>
          set({
            toast: { message, type, isVisible: true },
          }),
        hideToast: () =>
          set({
            toast: { message: '', type: 'info', isVisible: false },
          }),
      }),
      {
        name: "synthera-ui",
        partialize: (state) => ({ theme: state.theme, sidebarOpen: state.sidebarOpen }),
      }
    ),
    { name: "UIStore" }
  )
);

export const useUploadStore = create<UploadState>()(
  devtools(
    (set, get) => ({
      uploads: {},
      isUploading: false,
      addUpload: (id) =>
        set({
          uploads: {
            ...get().uploads,
            [id]: { progress: 0, stage: 'uploading' },
          },
          isUploading: true,
        }),
      updateUpload: (id, progress, stage, error) => {
        const uploads = get().uploads;
        if (uploads[id]) {
          set({
            uploads: {
              ...uploads,
              [id]: {
                ...uploads[id],
                progress,
                stage: (stage as 'uploading' | 'processing' | 'generating-thumbnail' | 'complete' | 'error') || uploads[id].stage,
                error,
              },
            },
          });
        }
      },
      removeUpload: (id) => {
        const uploads = { ...get().uploads };
        delete uploads[id];
        set({
          uploads,
          isUploading: Object.keys(uploads).length > 0,
        });
      },
      clearUploads: () => set({ uploads: {}, isUploading: false }),
    }),
    { name: "UploadStore" }
  )
);