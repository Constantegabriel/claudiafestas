import { useEffect, useState } from 'react';
import { repo } from '@/data';
import { DEFAULT_SETTINGS, type StoreSettings } from './types';

export function useSettings() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    repo
      .getSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) document.title = settings.storeName;
  }, [loaded, settings.storeName]);

  return { settings, setSettings, loaded };
}
