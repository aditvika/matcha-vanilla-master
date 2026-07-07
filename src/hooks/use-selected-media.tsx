import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type SelectedMediaKind = "photo" | "video";

export type SelectedMedia = {
  file: File;
  kind: SelectedMediaKind;
  url: string;
  pickedAt: number;
};

type SelectedMediaContextValue = {
  media: SelectedMedia | null;
  setMedia: (file: File, kind: SelectedMediaKind) => void;
  clear: () => void;
};

const SelectedMediaContext = createContext<SelectedMediaContextValue | null>(null);

export function SelectedMediaProvider({ children }: { children: ReactNode }) {
  const [media, setMediaState] = useState<SelectedMedia | null>(null);

  const setMedia = useCallback((file: File, kind: SelectedMediaKind) => {
    setMediaState((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { file, kind, url: URL.createObjectURL(file), pickedAt: Date.now() };
    });
  }, []);

  const clear = useCallback(() => {
    setMediaState((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  const value = useMemo(() => ({ media, setMedia, clear }), [media, setMedia, clear]);

  return (
    <SelectedMediaContext.Provider value={value}>{children}</SelectedMediaContext.Provider>
  );
}

export function useSelectedMedia() {
  const ctx = useContext(SelectedMediaContext);
  if (!ctx) throw new Error("useSelectedMedia must be used within SelectedMediaProvider");
  return ctx;
}
