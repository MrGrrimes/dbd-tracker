import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, RefreshCw, Plus, Shuffle, ChevronDown, AlertTriangle, Dices, X, Edit, Trash,  UserCircle, EyeOff, Search, Shield, Users, Sparkles, CheckCircle2, Download, Upload, Copy, Save, ExternalLink, BarChart3, CircleHelp } from 'lucide-react';

const CHALLENGES = [
  { id: 'killers', label: 'Killers', file: 'killers.json', charType: 'K', icon: KillerTypeIcon },
  { id: 'survivors', label: 'Survivors', file: 'survivors.json', charType: 'S', icon: SurvivorTypeIcon },
];


function MenuPngIcon({ src, alt, fallbackLetter, size = 18, className = '' }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <span
        className={`mode-letter-fallback ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(14, Math.round(size * 0.74)) }}
        aria-label={alt}
        role="img"
      >
        {fallbackLetter}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain opacity-90 drop-shadow-[0_0_8px_rgba(127,29,29,0.45)] ${className}`}
      draggable="false"
      onError={() => setHasError(true)}
    />
  );
}

function KillerTypeIcon(props) {
  return <MenuPngIcon src="/icons/killers.png" alt="Killers" fallbackLetter="K" {...props} />;
}

function SurvivorTypeIcon(props) {
  return <MenuPngIcon src="/icons/survivors.png" alt="Survivors" fallbackLetter="S" {...props} />;
}

function DbdHookIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M13 2.75v5.4c0 1.45.72 2.65 2.08 3.48l1.3.8c1.62 1 2.62 2.76 2.62 4.66 0 2.98-2.42 5.41-5.4 5.41-2.76 0-5.07-2.08-5.37-4.83" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.1 6.05h5.8M11.1 2.75h3.8M13 8.15c-1.7.78-3.05 2.26-3.05 4.24 0 1.83 1.48 3.31 3.31 3.31.88 0 1.68-.34 2.27-.91" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DbdFlashlightIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M4 8.5h6.2l8.3 8.3a2.15 2.15 0 0 1 0 3.04l-.66.66a2.15 2.15 0 0 1-3.04 0L6.5 12.2V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 5.2c2.5-.85 5-.85 7.5 0v4.1c-2.5.85-5 .85-7.5 0V5.2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M13.3 14.2l-2.5 2.5M15.6 16.5l-2.5 2.5M2.3 3.2l-1.2-.9M2.1 11.5l-1.3.75M10.9 3.2l1.25-.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const GRID_GAP = 12;          
const CARD_BORDER = 4;        
const MIN_TILE = 56; 
const DEFAULT_TILE = 96;
const MAX_TILE = 96;         

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function computeBestTileSize({ w, h, count }) {
  if (!w || !h || !count) return { tile: DEFAULT_TILE, cols: 6 };
  const maxCols = clamp(Math.floor((w + GRID_GAP) / (MIN_TILE + GRID_GAP)), 3, 30);
  let best = { tile: MIN_TILE, cols: 3 };
  
  for (let cols = maxCols; cols >= 3; cols--) {
    const tileW = (w - GRID_GAP * (cols - 1)) / cols;
    if (tileW < MIN_TILE) continue;
    const tile = clamp(tileW, MIN_TILE, MAX_TILE);
    const rows = Math.ceil(count / cols);
    const cardH = tile + CARD_BORDER;
    const totalH = rows * cardH + GRID_GAP * (rows - 1);
    if (totalH <= h) {
      if (tile > best.tile) best = { tile, cols };
    }
  }
  return best;
}

const safeJSONParse = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
};

const getProfileStorageKey = (challengeId) => `dbd_profiles_${challengeId}`;

const isDefaultProfile = (profile, index = 0) => Boolean(
  profile?.isDefault === true ||
  profile?.id === 'default' ||
  String(profile?.name || '').trim().toLowerCase() === DEFAULT_STREAK_NAME.toLowerCase() ||
  index === 0
);

const withProfileDefaults = (profile, index = 0) => ({
  id: profile?.id || (index === 0 ? 'default' : `prof_${Date.now()}_${index}`),
  name: profile?.name || (index === 0 ? DEFAULT_STREAK_NAME : `Streak ${index + 1}`),
  description: String(profile?.description || '').slice(0, 150),
  isDefault: isDefaultProfile(profile, index),
  globalCurrent: Number(profile?.globalCurrent) || 0,
  globalMax: Number(profile?.globalMax) || 0,
  charStats: profile?.charStats && typeof profile.charStats === 'object' ? profile.charStats : {}
});

const normalizeProfilesList = (profiles = []) => {
  const rows = Array.isArray(profiles) ? profiles : [];
  if (rows.length === 0) {
    return [{
      id: 'default',
      name: DEFAULT_STREAK_NAME,
      description: '',
      isDefault: true,
      globalCurrent: 0,
      globalMax: 0,
      charStats: {}
    }];
  }

  const normalized = rows.map(withProfileDefaults);
  return normalized.map((profile, index) => index === 0 ? { ...profile, isDefault: true } : { ...profile, isDefault: false });
};


const EXCLUSIONS_STORAGE_KEY = 'dbd_randomizer_exclusions_v2';
const DEFAULT_EXCLUSIONS = { killers: [], survivors: [], perks: [] };
const LOADOUT_HISTORY_LIMIT = 5;
const LOADOUT_HISTORY_STORAGE_KEY_PREFIX = 'dbd_loadout_history_';
const getLoadoutHistoryStorageKey = (challengeId) => `${LOADOUT_HISTORY_STORAGE_KEY_PREFIX}${challengeId}`;
const DEFAULT_CHARACTER_STATS = { wins: 0, losses: 0, maxStreak: 0, currentStreak: 0, wr: 0, firstPlayed: null, lastPlayed: null };
const MAX_CUSTOM_STREAKS_PER_MODE = 10;
const MAX_STREAK_PROFILES_PER_MODE = MAX_CUSTOM_STREAKS_PER_MODE + 1;
const DEFAULT_STREAK_NAME = 'Default Streak';
const OVERLAY_STATE_STORAGE_KEY = 'dbd_current_character_overlay_state';

const SPECIAL_SLOT_CONFIGS = {
  nothing: {
    perk: { name: 'Nothing!', ownerName: 'Empty Perk Slot', icon: '/icons/perks/nothing.png' },
    item: { name: 'Nothing!', ownerName: 'Empty Item Slot', icon: '/icons/items/nothing.png' },
    addon: { name: 'Nothing!', ownerName: 'Empty Add-on Slot', icon: '/icons/addons/nothing.png' },
    offering: { name: 'Nothing!', ownerName: 'Empty Offering Slot', icon: '/icons/offerings/nothing.png' }
  },
  wildcard: {
    perk: { name: 'Wild Card', ownerName: 'Wild Card Perk Slot', icon: '/icons/perks/wild-card.png' },
    item: { name: 'Wild Card', ownerName: 'Wild Card Item Slot', icon: '/icons/items/wild-card.png' },
    addon: { name: 'Wild Card', ownerName: 'Wild Card Add-on Slot', icon: '/icons/addons/wild-card.png' },
    offering: { name: 'Wild Card', ownerName: 'Wild Card Offering Slot', icon: '/icons/offerings/wild-card.png' }
  }
};

const SPECIAL_SLOT_KEYS = Object.keys(SPECIAL_SLOT_CONFIGS);

const BACKUP_APP_ID = 'dbd-randomizer';
const BACKUP_VERSION = 2;
const USER_STATS_SNAPSHOT_STORAGE_KEY = 'dbd_user_stats_snapshot_v1';
const BACKUP_LAST_EXPORT_STORAGE_KEY = 'dbd_backup_last_export_v1';
const BACKUP_LAST_IMPORT_STORAGE_KEY = 'dbd_backup_last_import_v1';
const RANDOMIZE_CHARACTER_DURATION_MS = 5000;
const RANDOMIZE_CHARACTER_STEPS = 24;

const buildRandomizeDelays = (steps = RANDOMIZE_CHARACTER_STEPS, totalDuration = RANDOMIZE_CHARACTER_DURATION_MS) => {
  const safeSteps = Math.max(1, steps);
  const weights = Array.from({ length: safeSteps }, (_, index) => {
    const progress = safeSteps === 1 ? 1 : index / (safeSteps - 1);
    return 0.75 + Math.pow(progress, 2.25) * 2.4;
  });
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const delays = weights.map((weight) => Math.round((weight / totalWeight) * totalDuration));
  const diff = totalDuration - delays.reduce((sum, delay) => sum + delay, 0);
  delays[delays.length - 1] += diff;
  return delays;
};

const getKnownStorageKeys = () => {
  const fixedKeys = [
    EXCLUSIONS_STORAGE_KEY,
    ...CHALLENGES.map((challenge) => `dbd_profiles_${challenge.id}`),
    ...CHALLENGES.map((challenge) => `max_streak_${challenge.id}`),
    ...CHALLENGES.map((challenge) => getLoadoutHistoryStorageKey(challenge.id)),
    USER_STATS_SNAPSHOT_STORAGE_KEY,
    'dbd_tracker_stats'
  ];

  const discoveredKeys = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('dbd_') || key.startsWith('max_streak_'))) {
        discoveredKeys.push(key);
      }
    }
  } catch (e) {
    // localStorage can be unavailable in very restricted browser contexts.
  }

  return unique([...fixedKeys, ...discoveredKeys]);
};

const createBackupPayload = (statsSnapshot = null) => {
  const data = {};
  getKnownStorageKeys().forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  });

  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    statsSnapshot,
    data
  };
};

const parseBackupPayload = (rawValue) => {
  const payload = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;

  if (!payload || payload.app !== BACKUP_APP_ID || !payload.data || typeof payload.data !== 'object') {
    throw new Error('Backup JSON non compatibile con questa app.');
  }

  return payload;
};

const downloadJsonFile = (filename, payload) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const LOADOUT_SLOT_KEYS = {
  perk0: 'perk-0',
  perk1: 'perk-1',
  perk2: 'perk-2',
  perk3: 'perk-3',
  addon0: 'addon-0',
  addon1: 'addon-1',
  item: 'item',
  itemAddon0: 'item-addon-0',
  itemAddon1: 'item-addon-1',
  offering: 'offering'
};

const createSlotAnimationKeys = () => Object.values(LOADOUT_SLOT_KEYS).reduce((acc, key) => {
  acc[key] = 0;
  return acc;
}, {});

const normalizeText = (value = '') => String(value)
  .toLowerCase()
  .replace(/^the\s+/, '')
  .replace(/[^a-z0-9]+/g, '')
  .trim();

const unique = (arr) => [...new Set(arr.filter(Boolean))];

const makeExclusionKey = (prefix, value) => {
  const normalized = normalizeText(value);
  return normalized ? `${prefix}:${normalized}` : null;
};

const normalizeExclusions = (value) => ({
  ...DEFAULT_EXCLUSIONS,
  ...(value && typeof value === 'object' ? value : {})
});

const getStoredExclusions = () => normalizeExclusions(safeJSONParse(EXCLUSIONS_STORAGE_KEY, DEFAULT_EXCLUSIONS));

const getDisplayName = (entity, fallback = 'Unknown') => entity?.displayName || entity?.name || entity?.label || fallback;

const isEntityDisabled = (entity) => entity?.disabled === true || String(entity?.disabled || '').toLowerCase() === 'true';

const createSpecialSlot = (type = 'perk', specialKey = 'nothing') => {
  const configGroup = SPECIAL_SLOT_CONFIGS[specialKey] || SPECIAL_SLOT_CONFIGS.nothing;
  const config = configGroup[type] || configGroup.perk;

  return {
    id: `${specialKey}-${type}-${Date.now()}-${Math.random()}`,
    displayName: config.name,
    isSpecialSlot: true,
    isNothing: specialKey === 'nothing',
    isWildCard: specialKey === 'wildcard',
    specialSlotKey: specialKey,
    ...config
  };
};

const createNothingSlot = (type = 'perk') => createSpecialSlot(type, 'nothing');
const createWildCardSlot = (type = 'perk') => createSpecialSlot(type, 'wildcard');

const isSpecialLoadoutSlot = (item) => Boolean(item?.isSpecialSlot || item?.isNothing || item?.isWildCard);
const getSpecialLoadoutSlotKey = (item) => item?.specialSlotKey || (item?.isWildCard ? 'wildcard' : item?.isNothing ? 'nothing' : null);

const buildSpecialSlots = (type = 'perk', blockedSpecialKeys = []) => {
  const blocked = new Set(blockedSpecialKeys.filter(Boolean));

  // Equal-weight pool: each valid JSON row has one entry, Nothing! has one entry,
  // and Wild Card has one entry. No copies, no fixed odds, no sqrt scaling.
  return SPECIAL_SLOT_KEYS
    .filter((specialKey) => !blocked.has(specialKey))
    .map((specialKey) => createSpecialSlot(type, specialKey));
};

const cloneLoadoutItem = (item) => item ? { ...item } : null;

const cloneLoadout = (loadout = {}) => ({
  perks: (loadout.perks || []).map(cloneLoadoutItem),
  addons: (loadout.addons || []).map(cloneLoadoutItem),
  item: cloneLoadoutItem(loadout.item),
  itemAddons: (loadout.itemAddons || []).map(cloneLoadoutItem),
  offering: cloneLoadoutItem(loadout.offering)
});

const normalizeAssetPath = (value) => {
  if (!value || typeof value !== 'string') return value;

  return value
    // Fix typo presente nei file JSON: /potraits/... -> /portraits/...
    .replace(/\/potraits\//gi, '/portraits/');
};

const asJSONArray = (collection) => {
  if (!collection) return [];
  if (Array.isArray(collection)) return collection.map((item, index) => ({ ...(item || {}), _key: item?.id || item?.name || String(index) }));
  return Object.entries(collection).map(([key, value]) => {
    if (value && typeof value === 'object') return { ...value, _key: key };
    return { id: key, name: String(value), _key: key };
  });
};

const normalizeRosterData = (collection, type = 'killers') => {
  const fallbackIcon = `/icons/${type}/placeholder.png`;

  return asJSONArray(collection)
    .map((char, index) => {
      const displayName = getDisplayName(char, `Character ${index + 1}`);

      const rawPortrait =
        char?.portrait ||
        char?.icon ||
        char?.image ||
        char?.imageUrl ||
        fallbackIcon;

      const portrait = normalizeAssetPath(rawPortrait);

      return {
        ...char,
        id: char?.id ?? char?._key ?? normalizeText(displayName) ?? index + 1,
        name: displayName,
        displayName,
        icon: portrait,
        portrait,
        priority: char?.priority ?? char?.order ?? index + 1,
        _key: char?._key || char?.id || displayName
      };
    })
    .filter((char) => char.id !== undefined && char.id !== null && char.displayName)
    .sort((a, b) => {
      const priorityDiff = (a.priority || 0) - (b.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return a.displayName.localeCompare(b.displayName);
    });
};

const buildCharacterKeys = (char) => unique([
  makeExclusionKey('char', char?._key),
  makeExclusionKey('char', char?.id),
  makeExclusionKey('char', char?.name),
  makeExclusionKey('char', char?.displayName),
  makeExclusionKey('char', String(char?.name || char?.displayName || '').replace(/^The\s+/i, '')),
]);

const buildPerkKeys = (perk) => unique([
  makeExclusionKey('perk', perk?._key),
  makeExclusionKey('perk', perk?.id),
  makeExclusionKey('perk', perk?.name),
]);

const hasAnyKey = (set, keys) => keys.some((key) => set.has(key));

const shuffle = (items) => [...items].sort(() => 0.5 - Math.random());

const pickWithPreference = (items, previousNames = [], count = 1) => {
  const previousSet = new Set(previousNames.filter(Boolean));
  const preferred = items.filter((item) => !previousSet.has(item?.name));
  const fallback = items.filter((item) => previousSet.has(item?.name));
  return shuffle([...preferred, ...fallback]).slice(0, Math.min(count, items.length));
};

const pickLoadoutSlots = (items, previousNames = [], count = 1, specialType = null) => {
  const previousSet = new Set(previousNames.filter(Boolean));
  const selected = [];
  const selectedRealNames = new Set();
  const selectedSpecialKeys = new Set();

  for (let i = 0; i < count; i++) {
    const realCandidates = items.filter((item) => !isSpecialLoadoutSlot(item) && !selectedRealNames.has(item?.name));
    const specialCandidates = specialType ? buildSpecialSlots(specialType, [...selectedSpecialKeys]) : [];
    const candidates = [...realCandidates, ...specialCandidates];
    if (candidates.length === 0) break;

    const preferred = candidates.filter((item) => !previousSet.has(item?.name));
    const picked = shuffle(preferred.length > 0 ? preferred : candidates)[0];
    if (!picked) break;

    selected.push(picked);
    if (isSpecialLoadoutSlot(picked)) {
      selectedSpecialKeys.add(getSpecialLoadoutSlotKey(picked));
    } else {
      selectedRealNames.add(picked.name);
    }
  }

  return selected;
};

const buildSingleSlotCandidates = (items, blockedNames = [], specialType = null) => {
  const blocked = new Set(blockedNames.filter(Boolean));
  const blockedSpecialKeys = [];
  if (blocked.has('Nothing!')) blockedSpecialKeys.push('nothing');
  if (blocked.has('Wild Card')) blockedSpecialKeys.push('wildcard');

  const realCandidates = items.filter((item) => !isSpecialLoadoutSlot(item) && !blocked.has(item?.name));
  return specialType ? [...realCandidates, ...buildSpecialSlots(specialType, blockedSpecialKeys)] : realCandidates;
};

const findMatchingRosterChar = (rosterCatalog, type, entity) => {
  const list = rosterCatalog?.[type] || [];
  const names = unique([
    entity?.id,
    entity?._key,
    entity?.name,
    entity?.displayName,
    String(entity?.name || entity?.displayName || '').replace(/^The\s+/i, ''),
  ]).map(normalizeText);

  return list.find((char) => {
    const candidates = unique([
      char?.id,
      char?.displayName,
      char?.name,
      String(char?.displayName || char?.name || '').replace(/^The\s+/i, ''),
    ]).map(normalizeText);
    return candidates.some((candidate) => names.includes(candidate));
  });
};

const resolveCharacterIcon = (entity, type, rosterCatalog) => {
  const matched = findMatchingRosterChar(rosterCatalog, type, entity);

  return normalizeAssetPath(
    entity?.portrait ||
    entity?.icon ||
    entity?.image ||
    entity?.imageUrl ||
    matched?.portrait ||
    matched?.icon ||
    `/icons/${type}/placeholder.png`
  );
};

const resolvePerkIcon = (perk) => perk?.icon || perk?.image || perk?.imageUrl || '/icons/perks/placeholder.png';

const getSlotAnimationKey = (slotType, index = 0) => {
  if (slotType === 'perk') return LOADOUT_SLOT_KEYS[`perk${index}`];
  if (slotType === 'addon') return LOADOUT_SLOT_KEYS[`addon${index}`];
  if (slotType === 'itemAddon') return LOADOUT_SLOT_KEYS[`itemAddon${index}`];
  if (slotType === 'item') return LOADOUT_SLOT_KEYS.item;
  if (slotType === 'offering') return LOADOUT_SLOT_KEYS.offering;
  return LOADOUT_SLOT_KEYS.perk0;
};

// ==========================================
// MENU A TENDINA CUSTOM (UI PREMIUM)
// ==========================================
const CustomSelect = ({ options, value, onChange, icon: Icon, className, dropdownClass }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => { if(ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.id === value);

  return (
    <div className="relative" ref={ref}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className={`flex items-center justify-between cursor-pointer outline-none transition-all ${className} ${isOpen ? 'ring-2 ring-red-800 border-transparent' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          {(() => {
            const SelectIcon = selectedOption?.icon || Icon;
            return SelectIcon ? <SelectIcon size={18} className={isOpen ? 'text-red-500' : 'text-red-600'} /> : null;
          })()}
          <span className="truncate">{selectedOption ? (selectedOption.label || selectedOption.name) : 'Select...'}</span>
        </div>
        <ChevronDown size={16} className={`transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 text-red-500' : ''}`} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-[99999] top-full left-0 w-full mt-2 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden ${dropdownClass}`}
          >
            <div className="max-h-60 overflow-y-auto custom-scroll p-1">
              {options.map((opt) => (
                <div 
                  key={opt.id} 
                  onClick={() => { onChange(opt.id); setIsOpen(false); }}
                  className={`px-4 py-3 cursor-pointer text-sm font-bold rounded-lg transition-colors my-0.5 ${value === opt.id ? 'bg-red-900/40 text-red-400' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'}`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {(() => {
                      const OptIcon = opt.icon;
                      return OptIcon ? <OptIcon size={17} className={value === opt.id ? 'text-red-400' : 'text-red-700'} /> : null;
                    })()}
                    <span className="truncate">{opt.label || opt.name}</span>
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const JSON_DATA_CACHE = new Map();

const preloadImages = (urls = []) => {
  if (typeof window === 'undefined') return;
  unique(urls)
    .filter((url) => typeof url === 'string' && url.trim())
    .forEach((url) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
    });
};

// ==========================================
// CARICAMENTO DATI JSON (cache + fallback guarded)
// ==========================================
const fetchJSONData = async (file, fallback = null) => {
  const cacheKey = String(file || '');
  if (JSON_DATA_CACHE.has(cacheKey)) return JSON_DATA_CACHE.get(cacheKey);

  const promise = (async () => {
    try {
      const url = `/data/${file}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const text = await res.text();

      if (!res.ok || /^\s*</.test(text)) {
        throw new Error(`Unable to load JSON data from ${url}`);
      }

      return JSON.parse(text);
    } catch (e) {
      console.warn(`JSON data not available: ${file}`, e);
      return fallback;
    }
  })();

  JSON_DATA_CACHE.set(cacheKey, promise);
  return promise;
};

// ==========================================
// COMPONENTE LOADOUT ICON ANIMATO & NUDO
// ==========================================
const LoadoutIcon = ({ item, type, animationId, index = 0, customSize, isGlobalRoll, onIconClick }) => {
  const isPerk = type === 'perk';
  const isOffering = type === 'offering';
  
  const fallbackPng = {
    perk: "/icons/perks/placeholder.png",
    addon: "/icons/addons/placeholder.png",
    offering: "/icons/offerings/placeholder.png",
    item: "/icons/items/placeholder.png"
  };

  const sizeClass = customSize || (isPerk ? "w-24 h-24 sm:w-28 sm:h-28" : "w-16 h-16 sm:w-20 sm:h-20");

  let tooltipAlign = "left-1/2 -translate-x-1/2"; 
  if (index === 1 || index === 4) tooltipAlign = "left-0"; 
  if (index === 2 || index === 6) tooltipAlign = "right-0"; 

  if (!item) {
    return (
      <div onClick={onIconClick} className={`relative ${sizeClass} flex items-center justify-center opacity-30 cursor-pointer hover:opacity-60 transition-opacity z-10`}>
        <div className={`absolute inset-0 border border-dashed border-neutral-600/50 ${isPerk ? 'rotate-45 rounded-sm scale-75' : isOffering ? 'rounded-full scale-90' : 'rounded-lg scale-90'}`}></div>
      </div>
    );
  }

  const handleImageError = (e) => {
    if (!e.currentTarget.src.includes("placeholder.png")) {
      e.currentTarget.src = fallbackPng[type] || fallbackPng.addon;
    } else {
      e.currentTarget.style.opacity = '0'; 
    }
  };

  const isGlobal = isGlobalRoll ?? true;
  const initialAnim = isGlobal 
    ? { y: -80, opacity: 0, filter: 'blur(5px)', scale: 0.9 }
    : { y: 0, opacity: 0, filter: 'blur(5px)', scale: 0.3 };
    
  const delayAnim = isGlobal ? index * 0.08 : 0;
  const durationAnim = isGlobal ? 0.8 : 0.4;

  return (
    <motion.div 
      key={`${type}-${index}-${item.name}-${animationId}`}
      initial={initialAnim}
      animate={{ y: 0, opacity: 1, filter: 'blur(0px)', scale: 1 }}
      transition={{ type: "spring", bounce: 0.5, duration: durationAnim, delay: delayAnim }}
      onClick={onIconClick}
      className={`relative group ${sizeClass} flex items-center justify-center cursor-pointer z-10 hover:z-[50]`}
    >
      <img 
        src={item.icon || fallbackPng[type] || fallbackPng.addon} 
        alt={item.name} 
        className="relative z-10 object-contain w-full h-full drop-shadow-[0_0_12px_rgba(0,0,0,0.9)] group-hover:scale-[1.15] group-hover:drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] transition-all duration-300" 
        style={{ imageRendering: 'high-quality' }}
        onError={handleImageError} 
      />
      
      <div className={`pointer-events-none absolute bottom-full mb-2 ${tooltipAlign} opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-neutral-900 border border-neutral-500 text-white p-2.5 rounded-xl shadow-2xl w-[150px] sm:w-[170px] text-center z-[99999] break-words`}>
        <p className="text-sm font-black text-red-400 leading-tight">{item.name}</p>
        <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1">
          {item.ownerName || 'General'}
        </p>
      </div>
    </motion.div>
  );
};


const ExclusionMenu = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  optionsByTab,
  counts,
  isExcluded,
  onToggle,
  onClearCategory
}) => {
  const tabs = [
    { id: 'killers', label: 'Killers', icon: Shield },
    { id: 'survivors', label: 'Survivors', icon: Users },
    { id: 'perks', label: 'Perks', icon: Sparkles },
  ];

  const rows = optionsByTab[activeTab] || [];
  const filteredRows = rows.filter((row) => {
    const q = normalizeText(searchTerm);
    if (!q) return true;
    return normalizeText(row.name).includes(q) || normalizeText(row.subtitle).includes(q);
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-4xl h-[82vh] bg-neutral-950 border border-neutral-700 rounded-2xl shadow-[0_0_60px_rgba(127,29,29,0.35)] overflow-hidden relative flex flex-col"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-700 to-transparent" />
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-red-900/20 blur-[90px] rounded-full pointer-events-none" />

            <div className="flex items-start sm:items-center justify-between gap-4 p-5 border-b border-neutral-800 relative z-10">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-900/70 flex items-center justify-center text-red-500">
                    <EyeOff size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Manage Your Exclusions</h3>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] flex-1 min-h-0 relative z-10">
              <aside className="border-b lg:border-b-0 lg:border-r border-neutral-800 p-4 bg-black/20">
                <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                        className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 border text-left transition-all ${active ? 'bg-red-950/50 border-red-800 text-white shadow-[0_0_18px_rgba(127,29,29,0.25)]' : 'bg-neutral-950/70 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'}`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Icon size={18} className={active ? 'text-red-400' : 'text-neutral-500'} />
                          <span className="text-xs sm:text-sm font-black uppercase tracking-wider truncate">{tab.label}</span>
                        </span>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${counts[tab.id] > 0 ? 'bg-red-900/50 text-red-300 border-red-800' : 'bg-neutral-900 text-neutral-500 border-neutral-800'}`}>
                          {counts[tab.id] || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => onClearCategory(activeTab)}
                  disabled={!counts[activeTab]}
                  className="w-full mt-4 rounded-xl border border-neutral-800 bg-neutral-950/80 px-3 py-3 text-xs font-black uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Reactivate all in tab
                </button>
              </aside>

              <section className="flex flex-col min-h-0">
                <div className="p-4 border-b border-neutral-800 bg-black/10">
                  <div className="relative">
                    <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={`Search ${tabs.find(t => t.id === activeTab)?.label || 'items'}...`}
                      className="w-full bg-black/50 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-red-800 focus:ring-2 focus:ring-red-950 transition-all placeholder:text-neutral-600"
                    />
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-4">
                  {filteredRows.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-neutral-500 text-sm font-bold">
                      No matching rows found.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredRows.map((row) => {
                        const excluded = isExcluded(activeTab, row.keys);
                        return (
                          <button
                            key={row.id}
                            onClick={() => onToggle(activeTab, row.keys)}
                            className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${excluded ? 'bg-red-950/30 border-red-900/80' : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/80'}`}
                          >
                            <div className={`w-14 h-14 rounded-xl border overflow-hidden flex-shrink-0 bg-black ${excluded ? 'border-red-800 opacity-50 grayscale' : 'border-neutral-700 group-hover:border-neutral-500'}`}>
                              <img
                                src={row.icon}
                                alt={row.name}
                                className="w-full h-full object-contain"
                                draggable="false"
                                onError={(e) => {
                                  if (e.currentTarget.src.includes(row.fallbackIcon)) {
                                    e.currentTarget.style.opacity = '0';
                                    return;
                                  }
                                  e.currentTarget.src = row.fallbackIcon;
                                }}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className={`font-black text-sm truncate ${excluded ? 'text-red-300 line-through decoration-red-500/70' : 'text-neutral-100'}`}>{row.name}</p>
                              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1 truncate">{row.subtitle}</p>
                            </div>

                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${excluded ? 'bg-red-700 border-red-500 text-white' : 'bg-neutral-900 border-neutral-700 text-neutral-500 group-hover:text-white'}`}>
                              {excluded ? <X size={17} strokeWidth={3} /> : <CheckCircle2 size={17} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const StreakMenu = ({
  isOpen,
  onClose,
  challenges = CHALLENGES,
  profilesByChallenge,
  selectedChallengeId,
  activeProfileId,
  onChangeProfile,
  onCreateProfile,
  onRenameProfile,
  onDeleteProfile,
  onResetCharacter,
  onResetAll,
  canResetCharacter = false,
  isRandomizing = false
}) => {
  const currentCombinedId = `${selectedChallengeId}:${activeProfileId || ''}`;
  const [selectedCombinedId, setSelectedCombinedId] = useState(currentCombinedId);

  const combinedOptions = useMemo(() => challenges.flatMap((challenge) => {
    const list = normalizeProfilesList(profilesByChallenge?.[challenge.id] || []);
    const prefix = challenge.id === 'killers' ? '[KILLER]' : '[SURVIVOR]';
    return list.map((profile, index) => ({
      ...profile,
      id: `${challenge.id}:${profile.id}`,
      profileId: profile.id,
      challengeId: challenge.id,
      sourceIndex: index,
      sourceProfile: profile,
      icon: challenge.icon || UserCircle,
      label: `${prefix} ${profile.name}`,
      name: `${prefix} ${profile.name}`,
      description: profile.description || '',
      isDefault: isDefaultProfile(profile, index)
    }));
  }), [challenges, profilesByChallenge]);

  useEffect(() => {
    if (!isOpen) return;
    const freshCurrent = `${selectedChallengeId}:${activeProfileId || ''}`;
    const exists = combinedOptions.some((option) => option.id === freshCurrent);
    setSelectedCombinedId(exists ? freshCurrent : combinedOptions[0]?.id || '');
  }, [isOpen, selectedChallengeId, activeProfileId, combinedOptions]);

  const selectedOption = combinedOptions.find((option) => option.id === selectedCombinedId) || combinedOptions[0] || null;
  const selectedChallenge = challenges.find((challenge) => challenge.id === selectedOption?.challengeId) || challenges.find((challenge) => challenge.id === selectedChallengeId) || challenges[0];
  const selectedList = normalizeProfilesList(profilesByChallenge?.[selectedOption?.challengeId] || []);
  const selectedProfileIndex = selectedList.findIndex((profile) => profile.id === selectedOption?.profileId);
  const canDeleteSelectedProfile = Boolean(selectedOption) && selectedList.length > 1;

  const selectedModeCustomCount = selectedList.filter((profile, index) => !isDefaultProfile(profile, index)).length;
  const createTargetChallengeId = selectedOption?.challengeId || selectedChallengeId;
  const canCreate = challenges.some((challenge) => {
    const list = normalizeProfilesList(profilesByChallenge?.[challenge.id] || []);
    const customCount = list.filter((profile, index) => !isDefaultProfile(profile, index)).length;
    return customCount < MAX_CUSTOM_STREAKS_PER_MODE;
  });

  const handleSelectCombined = (combinedId) => {
    setSelectedCombinedId(combinedId);
    const option = combinedOptions.find((row) => row.id === combinedId);
    if (option?.challengeId === selectedChallengeId) {
      onChangeProfile(option.challengeId, option.profileId);
    }
  };

  const modeSummary = challenges.map((challenge) => {
    const list = normalizeProfilesList(profilesByChallenge?.[challenge.id] || []);
    const customCount = list.filter((profile, index) => !isDefaultProfile(profile, index)).length;
    const label = challenge.id === 'killers' ? 'Killer' : 'Survivor';
    return `${label}: ${customCount}/${MAX_CUSTOM_STREAKS_PER_MODE}`;
  }).join(' • ');

  const SelectedIcon = selectedChallenge?.icon || UserCircle;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="streak-popup-shell w-full max-w-3xl max-h-[88vh] bg-neutral-950 border border-neutral-700 rounded-2xl shadow-[0_0_60px_rgba(127,29,29,0.35)] overflow-visible relative flex flex-col"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-700 to-transparent" />
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-red-900/20 blur-[90px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between gap-4 p-5 border-b border-neutral-800 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-900/70 flex items-center justify-center text-red-500">
                  <UserCircle size={20} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Manage your Streaks</h3>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-600 font-bold mt-1">{modeSummary}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="streak-popup-body p-5 relative z-[100010] bg-black/20 overflow-visible rounded-b-2xl">
              <div className="flex gap-2 items-center bg-neutral-950/70 border border-neutral-800 rounded-xl p-1.5 shadow-inner relative z-40">
                <div className="flex-1 min-w-0">
                  <CustomSelect
                    options={combinedOptions}
                    value={selectedOption?.id || ''}
                    onChange={handleSelectCombined}
                    icon={UserCircle}
                    className="w-full bg-transparent text-red-400 font-bold py-2 px-3 rounded-lg text-sm hover:text-red-300"
                    dropdownClass="w-full min-w-[280px] max-h-[300px]"
                  />
                </div>

                <span className="hidden sm:inline-flex text-[10px] font-black px-2.5 py-1 rounded-full border bg-neutral-900 text-neutral-500 border-neutral-700">
                  {combinedOptions.length}/{MAX_STREAK_PROFILES_PER_MODE * challenges.length}
                </span>
              </div>

              <div className="mt-3 rounded-xl border border-neutral-800 bg-black/30 p-3 min-h-[74px]">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Description</p>
                  {selectedOption && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${selectedOption.challengeId === 'killers' ? 'text-red-400' : 'text-blue-400'}`}>
                      <SelectedIcon size={14} /> {selectedOption.challengeId === 'killers' ? 'Killer' : 'Survivor'}
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-neutral-300 whitespace-pre-wrap break-words">
                  {selectedOption?.description?.trim() || 'No description added.'}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => onCreateProfile(createTargetChallengeId)}
                  disabled={!canCreate}
                  className="bg-green-950/20 border border-green-900/60 hover:bg-green-900/30 text-green-400 hover:text-green-300 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus size={15} /> Add Streak
                </button>
                <button
                  onClick={() => selectedOption && onRenameProfile(selectedOption.challengeId, selectedOption.profileId)}
                  disabled={!selectedOption}
                  className="bg-indigo-950/20 border border-indigo-900/60 hover:bg-indigo-900/30 text-indigo-300 hover:text-indigo-200 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Edit size={15} /> Edit Streak
                </button>
                <button
                  onClick={() => selectedOption && onDeleteProfile(selectedOption.challengeId, selectedOption.profileId)}
                  disabled={!canDeleteSelectedProfile}
                  className="bg-red-950/20 border border-red-900/60 hover:bg-red-900/30 text-red-400 hover:text-red-300 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash size={15} /> Delete Streak
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-neutral-800/70 pt-4">
                <button
                  onClick={onResetCharacter}
                  disabled={isRandomizing || !canResetCharacter}
                  className="bg-neutral-900/70 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Reset Character
                </button>
                <button
                  onClick={onResetAll}
                  disabled={isRandomizing}
                  className="bg-neutral-900/70 border border-neutral-800 hover:bg-neutral-800 text-red-500/70 hover:text-red-500 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Reset Current Streak
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const StatsMenu = ({ isOpen, onClose, stats }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-5xl max-h-[88vh] bg-neutral-950 border border-neutral-700 rounded-2xl shadow-[0_0_60px_rgba(127,29,29,0.35)] overflow-hidden relative flex flex-col"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-700 to-transparent" />
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-red-900/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-blue-950/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between gap-4 p-5 border-b border-neutral-800 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-950/60 border border-red-900/70 flex items-center justify-center text-red-500">
                  <BarChart3 size={22} />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">Stats</h3>
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-0.5">All-time Player Stats</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="stats-popup-body p-5 relative z-10 bg-black/20 overflow-y-auto custom-scroll font-sans [font-family:inherit]">
              <StatsPanel stats={stats} large />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const StatsPanel = ({ stats, large = false }) => {
  const killer = stats?.killers || {};
  const survivor = stats?.survivors || {};
  const fallbackGlobal = {
    totalGames: (killer.totalGames || 0) + (survivor.totalGames || 0),
    totalWins: (killer.totalWins || 0) + (survivor.totalWins || 0),
    totalLosses: (killer.totalLosses || 0) + (survivor.totalLosses || 0),
    bestStreak: Math.max(killer.bestStreak || 0, survivor.bestStreak || 0),
    mostWins: [killer.mostWins, survivor.mostWins].filter(Boolean).sort((a, b) => (b.value || 0) - (a.value || 0))[0] || null,
    mostLosses: [killer.mostLosses, survivor.mostLosses].filter(Boolean).sort((a, b) => (b.value || 0) - (a.value || 0))[0] || null,
    firstGamePlayedOn: [killer.firstGamePlayedOn, survivor.firstGamePlayedOn].filter(Boolean).sort()[0] || null,
    lastGamePlayedOn: [killer.lastGamePlayedOn, survivor.lastGamePlayedOn].filter(Boolean).sort().slice(-1)[0] || null
  };
  const global = stats?.global || fallbackGlobal;
  const fmt = (value) => Number.isFinite(value) ? value.toLocaleString() : '0';
  const pct = (value) => `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;
  const leader = (entry) => entry?.name ? `${entry.name} (${fmt(entry.value)})` : 'N/A';
  const dateOnly = (value) => formatCharacterLastPlayed(value);

  const renderCards = (title, cards) => (
    <div className="stats-card-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
      {cards.map((card) => (
        <div key={`${title}-${card.label}`} className="stats-card rounded-xl border border-neutral-800/90 bg-black/45 min-w-0 p-3">
          <p data-stats-label className="stats-card-label text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-neutral-500 leading-tight">{card.label}</p>
          <p data-stats-value className={`stats-card-value mt-1.5 text-sm sm:text-base break-words leading-snug font-black tracking-tight ${card.highlightClass || 'text-neutral-100'}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );

  const renderGlobalBucket = () => {
    const cards = [
      { label: 'Total Games Played', value: fmt(global.totalGames) },
      { label: 'Total Wins', value: fmt(global.totalWins) },
      { label: 'Total Loss', value: fmt(global.totalLosses) },
      { label: 'Best Streak', value: fmt(global.bestStreak) },
      { label: 'Most Wins', value: leader(global.mostWins) },
      { label: 'Most Losses', value: leader(global.mostLosses) },
      { label: 'First Game Played on', value: dateOnly(global.firstGamePlayedOn) },
      { label: 'Last Game Played on', value: dateOnly(global.lastGamePlayedOn) },
    ];

    return (
      <div className="stats-bucket stats-bucket-global rounded-2xl border border-neutral-700/90 bg-neutral-900/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="stats-bucket-header flex items-center gap-3 mb-3">
          <div className="stats-bucket-icon w-11 h-11 rounded-xl border border-neutral-700 bg-neutral-900/80 flex items-center justify-center text-neutral-300">
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="stats-section-title text-xs sm:text-sm font-black uppercase tracking-widest text-neutral-200">Global Stats</p>
          </div>
        </div>
        {renderCards('Global Stats', cards)}
      </div>
    );
  };

  const renderBucket = ({ title, subtitle, icon: Icon, tone, data, rateLabel }) => {
    const toneClasses = tone === 'killer'
      ? 'border-red-950/80 bg-red-950/10 shadow-[inset_0_1px_0_rgba(248,113,113,0.08)]'
      : 'border-blue-950/80 bg-blue-950/10 shadow-[inset_0_1px_0_rgba(96,165,250,0.08)]';
    const iconClasses = tone === 'killer'
      ? 'bg-red-950/60 border-red-900/80 text-red-400'
      : 'bg-blue-950/60 border-blue-900/80 text-blue-400';
    const accentText = tone === 'killer' ? 'text-red-400' : 'text-blue-400';

    const cards = [
      { label: 'Games Played', value: fmt(data.totalGames) },
      { label: 'Won / Lost', value: `${fmt(data.totalWins)} / ${fmt(data.totalLosses)}` },
      { label: rateLabel, value: pct(data.rate), highlightClass: accentText },
      { label: 'Best Streak', value: fmt(data.bestStreak) },
      { label: 'Most Wins', value: leader(data.mostWins) },
      { label: 'Most Losses', value: leader(data.mostLosses) },
    ];

    return (
      <div className={`stats-bucket rounded-2xl border p-4 ${toneClasses}`}>
        <div className="stats-bucket-header flex items-center gap-3 mb-3">
          <div className={`stats-bucket-icon w-11 h-11 rounded-xl border flex items-center justify-center ${iconClasses}`}>
            <Icon size={22} />
          </div>
          <div>
            <p className={`stats-section-title text-xs sm:text-sm font-black uppercase tracking-widest ${accentText}`}>{title}</p>
            <p className="stats-section-subtitle text-[10px] font-bold uppercase tracking-widest text-neutral-600 mt-0.5">{subtitle}</p>
          </div>
        </div>
        {renderCards(title, cards)}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderGlobalBucket()}
      <div className="grid grid-cols-1 gap-4">
        {renderBucket({ title: 'Killer Stats', icon: KillerTypeIcon, tone: 'killer', data: killer, rateLabel: 'Win Rate' })}
        {renderBucket({ title: 'Survivor Stats', icon: SurvivorTypeIcon, tone: 'survivor', data: survivor, rateLabel: 'Escape Rate' })}
      </div>
    </div>
  );
};

const getCharacterNameStyle = (name = '', compact = false) => {
  const words = String(name || '').split(/\s+/).filter(Boolean);
  const longestWord = words.reduce((max, word) => Math.max(max, word.length), 0);
  const totalLength = String(name || '').length;

  let size = compact ? 1.2 : 1.5;
  if (longestWord >= 14 || totalLength >= 24) size = compact ? 1.02 : 1.18;
  else if (longestWord >= 12 || totalLength >= 20) size = compact ? 1.08 : 1.28;
  else if (longestWord >= 10 || totalLength >= 17) size = compact ? 1.14 : 1.38;

  return {
    fontSize: `${size}rem`,
    lineHeight: '1.05'
  };
};

const formatCharacterLastPlayed = (value) => {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';
  return date.toLocaleDateString();
};

const getRateValueClass = (rate) => {
  if (rate > 50) return 'text-green-500';
  if (rate === 50) return 'text-neutral-300';
  return 'text-red-500';
};

const CurrentCharacterExtraStats = ({ stats, challengeId }) => {
  const wins = Number(stats?.wins) || 0;
  const losses = Number(stats?.losses) || 0;
  const gamesPlayed = wins + losses;
  const rate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;
  const rateLabel = challengeId === 'survivors' ? 'Escape Rate' : 'Win Rate';
  const pct = `${rate.toFixed(1)}%`;

  const rows = [
    { label: 'Games Played', value: gamesPlayed, valueClass: 'text-neutral-100' },
    { label: rateLabel, value: pct, valueClass: 'text-neutral-100' },
  ];

  return (
    <div className="current-character-extra-stats mt-4 pt-4 border-t border-neutral-800/70 grid grid-cols-2 gap-2.5">
      {rows.map((row) => (
        <div key={row.label} className={`rounded-lg border border-neutral-800/80 bg-black/35 px-3 py-2.5 min-w-0 ${row.wide ? 'col-span-2' : ''}`}>
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-neutral-500 leading-tight">{row.label}</p>
          <p className={`text-sm sm:text-base font-black mt-1.5 break-words leading-tight ${row.valueClass}`}>{row.value}</p>
        </div>
      ))}
    </div>
  );
};

const BackupMenu = ({
  isOpen,
  onClose,
  backupMeta,
  status,
  onExportBackup,
  onImportBackupFile,
  onOpenHelp
}) => {
  const fileInputRef = useRef(null);
  const lastExport = localStorage.getItem(BACKUP_LAST_EXPORT_STORAGE_KEY);
  const lastImport = localStorage.getItem(BACKUP_LAST_IMPORT_STORAGE_KEY);
  const formatBackupDate = (value, fallback = 'Never') => {
    if (!value) return fallback;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) onImportBackupFile(file);
    event.target.value = '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-xl bg-neutral-950 border border-neutral-700 rounded-2xl shadow-[0_0_60px_rgba(127,29,29,0.35)] overflow-hidden relative"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-700 to-transparent" />
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-red-900/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-red-950/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between gap-4 p-5 border-b border-neutral-800 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-900/70 flex items-center justify-center text-red-500">
                  <Save size={20} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Manage your Backups</h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenHelp}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-900/80 hover:bg-neutral-800 transition-colors"
                  title="Backup help"
                  aria-label="Open backup help"
                >
                  <CircleHelp size={20} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-5 relative z-10 bg-black/20 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={onExportBackup}
                  className="rounded-xl bg-red-700 border border-red-600 hover:bg-red-600 text-white py-3.5 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <Download size={17} /> Export JSON
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-white py-3.5 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload size={17} /> Import JSON
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Last Export</p>
                  <p className="text-xs font-bold text-neutral-300 mt-1">{formatBackupDate(lastExport)}</p>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Last Import</p>
                  <p className="text-xs font-bold text-neutral-300 mt-1">{formatBackupDate(lastImport)}</p>
                </div>
              </div>

              {status?.message && (
                <div className={`rounded-xl border p-3 text-xs font-bold ${status.type === 'error' ? 'bg-red-950/40 border-red-800 text-red-300' : status.type === 'success' ? 'bg-green-950/30 border-green-800 text-green-300' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}>
                  {status.message}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const HelpSectionIcon = ({ children }) => (
  <span className="inline-flex align-middle items-center justify-center w-6 h-6 rounded-lg border border-neutral-800 bg-black/50 text-red-500 mx-1 shadow-[0_0_10px_rgba(127,29,29,0.22)]">
    {children}
  </span>
);

const HelpMenu = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        onMouseDown={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="w-full max-w-4xl max-h-[88vh] bg-neutral-950 border border-neutral-700 rounded-2xl shadow-[0_0_60px_rgba(127,29,29,0.35)] overflow-hidden relative flex flex-col"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-700 to-transparent" />
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-red-900/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-red-950/20 blur-[100px] rounded-full pointer-events-none" />

          <div className="flex items-start sm:items-center justify-between gap-4 p-5 border-b border-neutral-800 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-900/70 flex items-center justify-center text-red-500">
                <CircleHelp size={20} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Help</h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-5 relative z-10 bg-black/20 overflow-y-auto custom-scroll">
            <section className="rounded-2xl border border-neutral-800 bg-black/35 p-5 space-y-5">
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-red-400 mb-3">What is DBD Tracker?</h4>
                <p className="text-sm leading-relaxed text-neutral-300">
                  This Dashboard allows to track your Dead by Daylight Streak, allowing to track multiple Streaks for each mode.
                  <br />Each Streak tracks Wins, Losses and other Stats for each Dead by Daylight Character.
                  <br />DBD Tracker is not affiliated with Dead by Daylight or Behaviour Interactive.
                  <br />All game assets are provided from the Dead by Daylight Official Wiki.
                </p>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />

              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-neutral-200 mb-3">Things to Know</h4>
                <ul className="space-y-3 text-xs sm:text-sm leading-relaxed text-neutral-400">
                    <li><span className="text-red-400 font-black">Mode</span>: click the <HelpSectionIcon><KillerTypeIcon size={15} /></HelpSectionIcon> button in the top-left corner to quickly switch between the Survivor and Killer rosters.</li>
                    <li><span className="text-red-400 font-black">Stats</span>: click the <HelpSectionIcon><BarChart3 size={15} /></HelpSectionIcon> button in the top-left corner to view Stats gathered from all your active Streaks.</li>
                    <li><span className="text-red-400 font-black">Streak</span>: click the <HelpSectionIcon><UserCircle size={15} /></HelpSectionIcon> button in the top-left corner to manage your Streaks. From here, you can create, rename, or delete up to a maximum of 5 distinct Streaks.</li>
                    <li><span className="text-red-400 font-black">Exclusions</span>: click the <HelpSectionIcon><EyeOff size={15} /></HelpSectionIcon> button in the top-left corner to manually remove specific Characters or Perks from the Randomizer. <i>Note: Excluded Characters cannot be selected manually; the Player must re-enable them first</i>.</li>
                    <li><span className="text-red-400 font-black">Streak Metrics</span>: located just above the Current Character section, these metrics display the overall progress of your active Streak across all Characters. It tracks your ongoing consecutive Wins (<i>CURRENT STREAK</i>) alongside the highest number of consecutive Wins achieved during this specific Streak (<i>MAX STREAK</i>).</li>
                    <li><span className="text-red-400 font-black">Current Character</span>: located on the left side, this is the core of your Dashboard. It displays your currently selected Character alongside their specific metrics: Total Wins (<i>WINS</i>), Total Losses (<i>LOSS</i>), Current Consecutive Wins (<i>STREAK</i>), Longest Win Streak (<i>BEST</i>), and Current World Record (<i>WR</i>). <i>Note: Each Streak tracks its own metrics, and the WR value must be updated manually</i>.</li>
                    <li><span className="text-red-400 font-black">Randomize Character</span>: click this button to let the Randomizer pick a random Character from your current roster (<i>ignoring Excluded or Disabled ones</i>) and automatically roll a complete Loadout for them.</li>
                    <li><span className="text-red-400 font-black">Loadout</span>: a new Loadout is rolled whenever you manually select a Character, switch Modes, or use the "Randomize Character" button. The Randomizer ensures no duplicate items exist within a single roll, and Excluded Perks will never appear. The Player can also re-roll a specific slot (Perk, Item, Add-on, or Offering) simply by clicking on its icon.</li>
                    <li><span className="text-red-400 font-black">Excluded vs. Disabled Characters</span>: neither will appear in your Randomizer rolls, but they differ in how they are restricted. Excluded Characters are manually chosen by the Player via the <HelpSectionIcon><EyeOff size={15} /></HelpSectionIcon> "Manage Exclusions" menu. Disabled Characters are restricted server-side for all Players (<i>typically used for unreleased or temporarily unavailable Characters</i>).</li>
                    <li><span className="text-red-400 font-black">"Nothing!" & Wildcards</span>: during any roll, the Player has a small chance to receive two special results in any category. "Nothing!" leaves that slot empty. A "Wild Card" allows the Player to manually choose any item they desire for that specific slot. The spawn chance for both is exactly 1 out of the total number of available items in that category (<i>e.g., if there are 100 available Offerings, the chance of rolling either is exactly 1%</i>).</li>
                    <li><span className="text-red-400 font-black">Backups</span>: there is no account or login system on DBD Tracker: all the Player's data is saved locally in their current browser. To secure the progress, survive a cache wipe, or move to another device, the Player must export their data as a JSON file via the <HelpSectionIcon><Save size={15} /></HelpSectionIcon> "Manage Backups" menu.</li>
                </ul>
            </div>

            <div className="rounded-xl border border-red-900/40 bg-red-950/10 p-3 text-[12px] text-red-100/70 leading-relaxed">
                ⚠ Do not manually edit the exported JSON file, as this can corrupt your save. Because there are no server-side backups, if your file is lost or corrupted, your data cannot be recovered.
                <br/>✍ For bug reports and feature requests, contact me on Discord: <b>@grrimes</b>
            </div>
            </section>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const createEmptyStatsBucket = () => ({
  totalGames: 0,
  totalWins: 0,
  totalLosses: 0,
  rate: 0,
  bestStreak: 0,
  mostWins: null,
  mostLosses: null,
  firstGamePlayedOn: null,
  lastGamePlayedOn: null,
  characters: {}
});

const getAllStoredProfiles = (selectedChallengeId, liveProfiles) => {
  return Object.fromEntries(CHALLENGES.map((challenge) => {
    const stored = safeJSONParse(`dbd_profiles_${challenge.id}`, []);
    const list = challenge.id === selectedChallengeId && Array.isArray(liveProfiles) && liveProfiles.length > 0
      ? liveProfiles
      : stored;
    return [challenge.id, Array.isArray(list) ? list : []];
  }));
};

const computeUserStats = (profilesByChallenge = {}, rosterCatalog = {}) => {
  const buildBucket = (challengeId) => {
    const profilesForType = profilesByChallenge[challengeId] || [];
    const rosterForType = rosterCatalog[challengeId] || [];
    const nameById = new Map(rosterForType.flatMap((char) => unique([char?.id, char?._key]).map((key) => [String(key), getDisplayName(char)])));
    const bucket = createEmptyStatsBucket();

    profilesForType.forEach((profile) => {
      Object.entries(profile?.charStats || {}).forEach(([charId, stats]) => {
        const normalizedStats = { ...DEFAULT_CHARACTER_STATS, ...(stats || {}) };
        const wins = Number(normalizedStats.wins) || 0;
        const losses = Number(normalizedStats.losses) || 0;
        const best = Number(normalizedStats.maxStreak) || 0;
        const key = String(charId);
        const current = bucket.characters[key] || {
          id: key,
          name: nameById.get(key) || key,
          wins: 0,
          losses: 0,
          maxStreak: 0,
          firstPlayed: null,
          lastPlayed: null
        };

        current.wins += wins;
        current.losses += losses;
        current.maxStreak = Math.max(current.maxStreak, best);
        if (normalizedStats.firstPlayed) {
          current.firstPlayed = !current.firstPlayed || normalizedStats.firstPlayed < current.firstPlayed ? normalizedStats.firstPlayed : current.firstPlayed;
          bucket.firstGamePlayedOn = !bucket.firstGamePlayedOn || normalizedStats.firstPlayed < bucket.firstGamePlayedOn ? normalizedStats.firstPlayed : bucket.firstGamePlayedOn;
        }
        if (normalizedStats.lastPlayed) {
          current.lastPlayed = !current.lastPlayed || normalizedStats.lastPlayed > current.lastPlayed ? normalizedStats.lastPlayed : current.lastPlayed;
          bucket.lastGamePlayedOn = !bucket.lastGamePlayedOn || normalizedStats.lastPlayed > bucket.lastGamePlayedOn ? normalizedStats.lastPlayed : bucket.lastGamePlayedOn;
        }
        bucket.characters[key] = current;

        bucket.totalWins += wins;
        bucket.totalLosses += losses;
        bucket.bestStreak = Math.max(bucket.bestStreak, best);
      });
    });

    bucket.totalGames = bucket.totalWins + bucket.totalLosses;
    bucket.rate = bucket.totalGames > 0 ? (bucket.totalWins / bucket.totalGames) * 100 : 0;

    const characters = Object.values(bucket.characters);
    const byWins = [...characters].sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name));
    const byLosses = [...characters].sort((a, b) => b.losses - a.losses || a.name.localeCompare(b.name));
    bucket.mostWins = byWins[0] && byWins[0].wins > 0 ? { name: byWins[0].name, value: byWins[0].wins } : null;
    bucket.mostLosses = byLosses[0] && byLosses[0].losses > 0 ? { name: byLosses[0].name, value: byLosses[0].losses } : null;

    return bucket;
  };

  const killers = buildBucket('killers');
  const survivors = buildBucket('survivors');
  const combinedCharacters = [...Object.values(killers.characters || {}), ...Object.values(survivors.characters || {})];
  const byWins = [...combinedCharacters].sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name));
  const byLosses = [...combinedCharacters].sort((a, b) => b.losses - a.losses || a.name.localeCompare(b.name));

  return {
    generatedAt: new Date().toISOString(),
    global: {
      totalGames: killers.totalGames + survivors.totalGames,
      totalWins: killers.totalWins + survivors.totalWins,
      totalLosses: killers.totalLosses + survivors.totalLosses,
      bestStreak: Math.max(killers.bestStreak, survivors.bestStreak),
      mostWins: byWins[0] && byWins[0].wins > 0 ? { name: byWins[0].name, value: byWins[0].wins } : null,
      mostLosses: byLosses[0] && byLosses[0].losses > 0 ? { name: byLosses[0].name, value: byLosses[0].losses } : null,
      firstGamePlayedOn: [killers.firstGamePlayedOn, survivors.firstGamePlayedOn].filter(Boolean).sort()[0] || null,
      lastGamePlayedOn: [killers.lastGamePlayedOn, survivors.lastGamePlayedOn].filter(Boolean).sort().slice(-1)[0] || null
    },
    killers,
    survivors
  };
};

// ==========================================
// COMPONENTE PRINCIPALE
// ==========================================
export default function App() {
  const initialOverlayState = useMemo(() => safeJSONParse(OVERLAY_STATE_STORAGE_KEY, {}), []);
  const isOverlayMode = useMemo(() => new URLSearchParams(window.location.search).get('overlay') === 'current-character', []);
  const [selectedChallengeId, setSelectedChallengeId] = useState(() => initialOverlayState.selectedChallengeId || CHALLENGES[0].id);
  const [roster, setRoster] = useState([]);
  const [activeCharId, setActiveCharId] = useState(() => initialOverlayState.activeCharId || null);

  const [profiles, setProfiles] = useState([]);
  const [profilesByChallenge, setProfilesByChallenge] = useState({});
  const [activeProfileId, setActiveProfileId] = useState(() => initialOverlayState.activeProfileId || '');

  const [isRandomizing, setIsRandomizing] = useState(false);
  const [isRandomizingLoadout, setIsRandomizingLoadout] = useState(false);

  const [equipmentDb, setEquipmentDb] = useState({ perks: null, addons: null, offerings: null, killers: null, survivors: null, items: null, itemAddons: null });
  const [dbLoading, setDbLoading] = useState(true);
  
  const [currentLoadout, setCurrentLoadout] = useState({ perks: [], addons: [], item: null, itemAddons: [], offering: null });
  const [loadoutHistory, setLoadoutHistory] = useState([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [slotAnimationKeys, setSlotAnimationKeys] = useState(() => createSlotAnimationKeys());
  const [loadoutAnimationMode, setLoadoutAnimationMode] = useState('global');

  const [exclusions, setExclusions] = useState(() => getStoredExclusions());
  const [isExclusionMenuOpen, setIsExclusionMenuOpen] = useState(false);
  const [exclusionTab, setExclusionTab] = useState('killers');
  const [exclusionSearch, setExclusionSearch] = useState('');
  const [rosterCatalog, setRosterCatalog] = useState({ killers: [], survivors: [] });

  const [isBackupMenuOpen, setIsBackupMenuOpen] = useState(false);
  const [backupMeta, setBackupMeta] = useState(null);
  const [backupStatus, setBackupStatus] = useState({ type: 'idle', message: '' });
  const [isStreakMenuOpen, setIsStreakMenuOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isModeSwitching, setIsModeSwitching] = useState(false);

  const [modalConfirm, setModalConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDestructive: false });
  const [modalPrompt, setModalPrompt] = useState({ isOpen: false, title: '', placeholder: '', onConfirm: null, showDescription: false, descriptionPlaceholder: '', showChallengeSelect: false });
  const [promptValue, setPromptValue] = useState('');
  const [promptDescription, setPromptDescription] = useState('');
  const [promptChallengeId, setPromptChallengeId] = useState(selectedChallengeId);

  const [tileSize, setTileSize] = useState(DEFAULT_TILE);
  const gridViewportRef = useRef(null);

  const selectedChallenge = useMemo(() => CHALLENGES.find(c => c.id === selectedChallengeId), [selectedChallengeId]);

  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === activeProfileId) || profiles[0] || null;
  }, [profiles, activeProfileId]);

  const activeChar = useMemo(() => {
    return roster.find(c => c.id === activeCharId) || null;
  }, [roster, activeCharId]);

  const excludedKillerSet = useMemo(() => new Set(exclusions.killers || []), [exclusions.killers]);
  const excludedSurvivorSet = useMemo(() => new Set(exclusions.survivors || []), [exclusions.survivors]);
  const excludedPerkSet = useMemo(() => new Set(exclusions.perks || []), [exclusions.perks]);

  const getCharacterExclusionSet = (challengeId = selectedChallengeId) => challengeId === 'killers' ? excludedKillerSet : excludedSurvivorSet;

  const isCharacterExcluded = (char, challengeId = selectedChallengeId) => {
    const set = getCharacterExclusionSet(challengeId);
    return hasAnyKey(set, buildCharacterKeys(char));
  };

  const isPerkExcluded = (perk) => hasAnyKey(excludedPerkSet, buildPerkKeys(perk));

  const availableRoster = useMemo(() => roster.filter((char) => !isCharacterExcluded(char) && !isEntityDisabled(char)), [roster, selectedChallengeId, excludedKillerSet, excludedSurvivorSet]);

  const exclusionOptions = useMemo(() => {
    const buildCharacterOptions = (type) => asJSONArray(equipmentDb[type]).map((char, index) => {
      const matchedRosterChar = findMatchingRosterChar(rosterCatalog, type, char);
      const name = getDisplayName(char, matchedRosterChar?.displayName || `Character ${index + 1}`);
      return {
        id: `${type}-${char.id || char._key || name}-${index}`,
        name,
        subtitle: type === 'killers' ? 'Killer' : 'Survivor',
        icon: resolveCharacterIcon(char, type, rosterCatalog),
        fallbackIcon: `/icons/${type}/placeholder.png`,
        keys: buildCharacterKeys({ ...char, displayName: matchedRosterChar?.displayName || char.displayName || char.name })
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    const perkOptions = equipmentDb.perks ? Object.entries(equipmentDb.perks).map(([name, perk], index) => {
      const ownerList = perk?.charType === 'S' ? equipmentDb.survivors : equipmentDb.killers;
      const owner = perk?.character && ownerList ? asJSONArray(ownerList).find(c => c.id === perk.character) : null;
      return {
        id: `perk-${name}-${index}`,
        name,
        subtitle: `${perk?.charType === 'S' ? 'Survivor' : perk?.charType === 'K' ? 'Killer' : 'General'} Perk${owner ? ` • ${owner.name}` : ''}`,
        icon: resolvePerkIcon(perk),
        fallbackIcon: '/icons/perks/placeholder.png',
        keys: buildPerkKeys({ ...perk, name, _key: name })
      };
    }).sort((a, b) => a.name.localeCompare(b.name)) : [];

    return {
      killers: buildCharacterOptions('killers'),
      survivors: buildCharacterOptions('survivors'),
      perks: perkOptions
    };
  }, [equipmentDb, rosterCatalog]);

  const exclusionCounts = useMemo(() => {
    const countByTab = (tab) => (exclusionOptions[tab] || []).filter(row => hasAnyKey(new Set(exclusions[tab] || []), row.keys)).length;
    return {
      killers: countByTab('killers'),
      survivors: countByTab('survivors'),
      perks: countByTab('perks')
    };
  }, [exclusionOptions, exclusions]);

  const totalExclusions = exclusionCounts.killers + exclusionCounts.survivors + exclusionCounts.perks;

  const globalStats = useMemo(() => {
    const profilesByChallenge = getAllStoredProfiles(selectedChallengeId, profiles);
    return computeUserStats(profilesByChallenge, rosterCatalog);
  }, [profiles, selectedChallengeId, rosterCatalog]);

  useEffect(() => {
    try {
      localStorage.setItem(USER_STATS_SNAPSHOT_STORAGE_KEY, JSON.stringify(globalStats));
    } catch (e) {
      // localStorage can be unavailable in very restricted browser contexts.
    }
  }, [globalStats]);

  const toggleExclusion = (category, keys) => {
    setExclusions((prev) => {
      const next = normalizeExclusions(prev);
      const currentSet = new Set(next[category] || []);
      const alreadyExcluded = keys.some((key) => currentSet.has(key));
      keys.forEach((key) => alreadyExcluded ? currentSet.delete(key) : currentSet.add(key));
      const updated = { ...next, [category]: [...currentSet] };
      localStorage.setItem(EXCLUSIONS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearExclusionsCategory = (category) => {
    setExclusions((prev) => {
      const updated = { ...normalizeExclusions(prev), [category]: [] };
      localStorage.setItem(EXCLUSIONS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const isExcludedInMenu = (category, keys) => hasAnyKey(new Set(exclusions[category] || []), keys);

  const openBackupMenu = () => {
    setBackupStatus({ type: 'idle', message: '' });
    setIsBackupMenuOpen(true);
    setBackupMeta(createBackupPayload(globalStats));
  };

  const exportBackupJson = () => {
    try {
      const exportedAt = new Date().toISOString();
      localStorage.setItem(BACKUP_LAST_EXPORT_STORAGE_KEY, exportedAt);
      const payload = createBackupPayload(globalStats);
      setBackupMeta(payload);
      downloadJsonFile(`dbd-randomizer-backup-${new Date().toISOString().slice(0, 10)}.json`, payload);
      setBackupStatus({ type: 'success', message: `Backup JSON esportato con ${Object.keys(payload.data).length} chiavi locali e snapshot Stats.` });
    } catch (e) {
      setBackupStatus({ type: 'error', message: `Impossibile esportare il backup JSON: ${e.message}` });
    }
  };

  const applyImportedBackupFile = async (file) => {
    try {
      const text = await file.text();
      const payload = parseBackupPayload(text);

      getKnownStorageKeys().forEach((key) => localStorage.removeItem(key));
      Object.entries(payload.data).forEach(([key, value]) => {
        if (typeof value === 'string') localStorage.setItem(key, value);
      });

      if (payload.statsSnapshot) {
        localStorage.setItem(USER_STATS_SNAPSHOT_STORAGE_KEY, JSON.stringify(payload.statsSnapshot));
      }

      const importedExclusions = getStoredExclusions();
      setExclusions(importedExclusions);

      const importedProfiles = safeJSONParse(`dbd_profiles_${selectedChallenge.id}`, []);
      if (Array.isArray(importedProfiles) && importedProfiles.length > 0) {
        setProfiles(importedProfiles);
        setActiveProfileId(importedProfiles[0].id);
      } else {
        const defaultProfile = {
          id: `prof_${Date.now()}`,
          name: 'Default Streak',
          globalCurrent: 0,
          globalMax: 0,
          charStats: {}
        };
        setProfiles([defaultProfile]);
        setActiveProfileId(defaultProfile.id);
        localStorage.setItem(`dbd_profiles_${selectedChallenge.id}`, JSON.stringify([defaultProfile]));
      }

      const importedLoadoutHistory = safeJSONParse(getLoadoutHistoryStorageKey(selectedChallenge.id), []);
      setLoadoutHistory(Array.isArray(importedLoadoutHistory) ? importedLoadoutHistory.slice(0, LOADOUT_HISTORY_LIMIT) : []);

      localStorage.setItem(BACKUP_LAST_IMPORT_STORAGE_KEY, new Date().toISOString());
      setBackupMeta(payload);
      setBackupStatus({
        type: 'success',
        message: `Backup importato correttamente. Ripristinate ${Object.keys(payload.data).length} chiavi dal JSON.`
      });
    } catch (e) {
      setBackupStatus({ type: 'error', message: e.message || 'JSON di backup non valido.' });
    }
  };

  const triggerGlobalLoadoutAnimation = () => {
    setLoadoutAnimationMode('global');
    setSlotAnimationKeys(() => {
      const now = Date.now() + Math.random();
      return Object.values(LOADOUT_SLOT_KEYS).reduce((acc, key, index) => {
        acc[key] = `${now}-${index}`;
        return acc;
      }, {});
    });
  };

  const triggerSingleSlotAnimation = (slotKey) => {
    setLoadoutAnimationMode('single');
    setSlotAnimationKeys((prev) => ({ ...prev, [slotKey]: Date.now() + Math.random() }));
  };

  const currentStreak = activeProfile?.globalCurrent || 0;
  const maxStreak = activeProfile?.globalMax || 0;
  
  // STATS: include anche WR modificabile manualmente per personaggio.
  const activeCharStats = useMemo(() => {
    if (!activeProfile || !activeCharId) return DEFAULT_CHARACTER_STATS;
    return { ...DEFAULT_CHARACTER_STATS, ...(activeProfile.charStats?.[activeCharId] || {}) };
  }, [activeProfile, activeCharId]);

  useEffect(() => {
    if (!selectedChallengeId || !activeProfileId || !activeCharId) return;
    localStorage.setItem(OVERLAY_STATE_STORAGE_KEY, JSON.stringify({
      selectedChallengeId,
      activeProfileId,
      activeCharId,
      updatedAt: new Date().toISOString()
    }));
  }, [selectedChallengeId, activeProfileId, activeCharId]);

  useEffect(() => {
    if (!isOverlayMode) return;

    const handleStorage = (event) => {
      if (event.key === OVERLAY_STATE_STORAGE_KEY && event.newValue) {
        try {
          const next = JSON.parse(event.newValue);
          if (next.selectedChallengeId && next.selectedChallengeId !== selectedChallengeId) setSelectedChallengeId(next.selectedChallengeId);
          if (next.activeProfileId && next.activeProfileId !== activeProfileId) setActiveProfileId(next.activeProfileId);
          if (next.activeCharId && next.activeCharId !== activeCharId) setActiveCharId(next.activeCharId);
        } catch (e) {
          // Ignore malformed overlay sync payloads.
        }
        return;
      }

      if (event.key === `dbd_profiles_${selectedChallengeId}` && event.newValue) {
        try {
          const nextProfiles = JSON.parse(event.newValue);
          if (Array.isArray(nextProfiles) && nextProfiles.length > 0) {
            setProfiles(nextProfiles);
          }
        } catch (e) {
          // Ignore malformed profile sync payloads.
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isOverlayMode, selectedChallengeId, activeProfileId, activeCharId]);

  const handleChallengeChange = (challengeId) => {
    if (challengeId === selectedChallengeId) return;
    setSelectedChallengeId(challengeId);
    setRoster([]);
    setActiveCharId(null);
    setCurrentLoadout({ perks: [], addons: [], item: null, itemAddons: [], offering: null });
    setExpandedHistoryId(null);
    triggerGlobalLoadoutAnimation();
  };


  const handleToggleChallenge = () => {
    if (isModeSwitching) return;
    setIsModeSwitching(true);
    const nextChallengeId = selectedChallengeId === 'killers' ? 'survivors' : 'killers';
    handleChallengeChange(nextChallengeId);
    window.setTimeout(() => setIsModeSwitching(false), 360);
  };

  const openCurrentCharacterOverlay = () => {
    if (!activeCharId) return;
    localStorage.setItem(OVERLAY_STATE_STORAGE_KEY, JSON.stringify({
      selectedChallengeId,
      activeProfileId,
      activeCharId,
      updatedAt: new Date().toISOString()
    }));

    const url = `${window.location.origin}${window.location.pathname}?overlay=current-character`;
    window.open(url, 'dbd-current-character-overlay', 'width=420,height=520,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no');
  };

  useEffect(() => {
    let cancelled = false;

    const loadRoster = async () => {
      const data = await fetchJSONData(selectedChallenge.file, []);
      const normalizedRoster = normalizeRosterData(data, selectedChallenge.id);
      if (!cancelled) setRoster(normalizedRoster);
    };

    loadRoster();

    return () => {
      cancelled = true;
    };
  }, [selectedChallenge]);

  useEffect(() => {
    let cancelled = false;

    const loadRosterCatalog = async () => {
      const entries = await Promise.all(CHALLENGES.map(async (challenge) => {
        const data = await fetchJSONData(challenge.file, []);
        return [challenge.id, normalizeRosterData(data, challenge.id)];
      }));

      if (!cancelled) setRosterCatalog(Object.fromEntries(entries));
    };

    loadRosterCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const allProfiles = {};

    CHALLENGES.forEach((challenge) => {
      const storageKey = getProfileStorageKey(challenge.id);
      let loadedProfiles = safeJSONParse(storageKey, []);

      if (!loadedProfiles || loadedProfiles.length === 0) {
        const legacyStats = challenge.id === selectedChallenge.id ? safeJSONParse('dbd_tracker_stats', {}) : {};
        const legacyMax = parseInt(localStorage.getItem(`max_streak_${challenge.id}`) || '0', 10);

        loadedProfiles = [{
          id: 'default',
          name: DEFAULT_STREAK_NAME,
          description: '',
          isDefault: true,
          globalCurrent: 0,
          globalMax: legacyMax || 0,
          charStats: legacyStats || {}
        }];
      }

      const normalizedProfiles = normalizeProfilesList(loadedProfiles);
      allProfiles[challenge.id] = normalizedProfiles;
      localStorage.setItem(storageKey, JSON.stringify(normalizedProfiles));
    });

    const selectedProfiles = allProfiles[selectedChallenge.id] || [];
    setProfilesByChallenge(allProfiles);
    setProfiles(selectedProfiles);
    setActiveProfileId((currentId) => selectedProfiles.some((profile) => profile.id === currentId) ? currentId : selectedProfiles[0]?.id || '');
  }, [selectedChallenge]);

  useEffect(() => {
    // Last 5 Loadouts temporarily disabled.
    setLoadoutHistory([]);
  }, [selectedChallenge.id]);

  useEffect(() => {
    const loadJSONDb = async () => {
      setDbLoading(true);

      const [
        perks,
        addons,
        offerings,
        killers,
        survivors,
        items,
        itemAddons
      ] = await Promise.all([
        fetchJSONData('perks.json', {}),
        fetchJSONData('addons.json', {}),
        fetchJSONData('offerings.json', {}),
        fetchJSONData('killers.json', []),
        fetchJSONData('survivors.json', []),
        fetchJSONData('items.json', {}),
        fetchJSONData('item-addons.json', {})
      ]);

      setEquipmentDb({
        perks,
        addons,
        offerings,
        killers: normalizeRosterData(killers, 'killers'),
        survivors: normalizeRosterData(survivors, 'survivors'),
        items,
        itemAddons
      });

      setDbLoading(false);
    };

    loadJSONDb();
  }, []);

  useEffect(() => {
    preloadImages(roster.map((char) => char?.portrait || char?.icon));
  }, [roster]);

  useEffect(() => {
    const iconUrls = [
      ...Object.values(equipmentDb.perks || {}).map(resolvePerkIcon),
      ...Object.values(equipmentDb.addons || {}).map((item) => item?.icon || item?.image || item?.imageUrl),
      ...Object.values(equipmentDb.offerings || {}).map((item) => item?.icon || item?.image || item?.imageUrl),
      ...Object.values(equipmentDb.items || {}).map((item) => item?.icon || item?.image || item?.imageUrl),
      ...Object.values(equipmentDb.itemAddons || {}).map((item) => item?.icon || item?.image || item?.imageUrl),
    ];
    preloadImages(iconUrls);
  }, [equipmentDb]);

  useLayoutEffect(() => {
    const el = gridViewportRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const { tile } = computeBestTileSize({ w: Math.max(0, rect.width), h: Math.max(0, rect.height), count: roster.length });
      setTileSize(tile);
    };
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [roster.length]);

  const saveProfilesForChallenge = (challengeId, newProfiles) => {
    const normalizedProfiles = normalizeProfilesList(newProfiles).slice(0, MAX_STREAK_PROFILES_PER_MODE);
    localStorage.setItem(getProfileStorageKey(challengeId), JSON.stringify(normalizedProfiles));
    setProfilesByChallenge((prev) => ({ ...prev, [challengeId]: normalizedProfiles }));

    if (challengeId === selectedChallenge.id) {
      setProfiles(normalizedProfiles);
      setActiveProfileId((currentId) => normalizedProfiles.some((profile) => profile.id === currentId) ? currentId : normalizedProfiles[0]?.id || '');
    }

    return normalizedProfiles;
  };

  const saveProfiles = (newProfiles) => saveProfilesForChallenge(selectedChallenge.id, newProfiles);

  const getProfilesForChallenge = (challengeId) => normalizeProfilesList(
    challengeId === selectedChallenge.id && profiles.length > 0
      ? profiles
      : profilesByChallenge[challengeId] || safeJSONParse(getProfileStorageKey(challengeId), [])
  );

  const createProfile = (challengeId = selectedChallenge.id) => {
    const allModesFull = CHALLENGES.every((challenge) => {
      const list = getProfilesForChallenge(challenge.id);
      const customCount = list.filter((profile, index) => !isDefaultProfile(profile, index)).length;
      return customCount >= MAX_CUSTOM_STREAKS_PER_MODE;
    });
    if (allModesFull) return;

    setPromptValue('');
    setPromptDescription('');
    setPromptChallengeId(challengeId);
    setModalPrompt({
      isOpen: true,
      title: 'Create New Streak',
      placeholder: 'Streak Name (e.g. 4K Only)',
      showDescription: true,
      showChallengeSelect: true,
      descriptionPlaceholder: 'Short description (optional, max 150 characters)',
      onConfirm: (val, description = '', chosenChallengeId = challengeId) => {
        const targetChallengeId = chosenChallengeId || challengeId;
        if (!val.trim()) return;
        const currentProfiles = getProfilesForChallenge(targetChallengeId);
        const currentCustomCount = currentProfiles.filter((profile, index) => !isDefaultProfile(profile, index)).length;
        if (currentCustomCount >= MAX_CUSTOM_STREAKS_PER_MODE) return;

        const newProfile = {
          id: `prof_${targetChallengeId}_${Date.now()}`,
          name: val.trim(),
          description: String(description || '').trim().slice(0, 150),
          isDefault: false,
          globalCurrent: 0,
          globalMax: 0,
          charStats: {}
        };
        const updated = [...currentProfiles, newProfile];
        saveProfilesForChallenge(targetChallengeId, updated);
        if (targetChallengeId === selectedChallenge.id) setActiveProfileId(newProfile.id);
        setModalPrompt({ isOpen: false });
      }
    });
  };

  const renameProfile = (challengeId = selectedChallenge.id, profileId = activeProfileId) => {
    const targetProfiles = getProfilesForChallenge(challengeId);
    const targetProfile = targetProfiles.find((profile) => profile.id === profileId);
    if (!targetProfile) return;

    setPromptValue(targetProfile.name || '');
    setPromptDescription(targetProfile.description || '');
    setModalPrompt({
      isOpen: true,
      title: 'Edit Streak',
      placeholder: 'Streak Name',
      showDescription: true,
      showChallengeSelect: false,
      descriptionPlaceholder: 'Short description (optional, max 150 characters)',
      onConfirm: (val, description = '') => {
        if (!val.trim()) return;
        const updated = getProfilesForChallenge(challengeId).map((profile) => profile.id === profileId
          ? { ...profile, name: val.trim(), description: String(description || '').trim().slice(0, 150) }
          : profile
        );
        saveProfilesForChallenge(challengeId, updated);
        setModalPrompt({ isOpen: false });
      }
    });
  };

  const deleteProfile = (challengeId = selectedChallenge.id, profileId = activeProfileId) => {
    const targetProfiles = getProfilesForChallenge(challengeId);
    const targetProfile = targetProfiles.find((profile) => profile.id === profileId);
    if (!targetProfile || targetProfiles.length <= 1) return;

    setModalConfirm({
      isOpen: true,
      title: 'Delete Streak',
      message: `Are you sure to delete the Streak "${targetProfile.name}"? The action cannot be undone.`,
      isDestructive: true,
      onConfirm: () => {
        const updated = getProfilesForChallenge(challengeId).filter((profile) => profile.id !== profileId);
        const savedProfiles = saveProfilesForChallenge(challengeId, updated);
        if (challengeId === selectedChallenge.id && activeProfileId === profileId) {
          setActiveProfileId(savedProfiles[0]?.id || '');
        }
        setModalConfirm({ isOpen: false });
      }
    });
  };

  // VITTORIA: Aggiorna Global e Character Current Streak
  const handleWin = () => {
    if (!activeCharId || !activeProfileId) return;
    const playedAt = new Date().toISOString();
    const updated = profiles.map(p => {
      if (p.id !== activeProfileId) return p;
      const cStats = { ...DEFAULT_CHARACTER_STATS, ...(p.charStats?.[activeCharId] || {}) };
      const newGlobalCurr = p.globalCurrent + 1;
      const newCharCurr = (cStats.currentStreak || 0) + 1;

      return {
        ...p,
        globalCurrent: newGlobalCurr,
        globalMax: Math.max(p.globalMax, newGlobalCurr),
        charStats: {
          ...(p.charStats || {}),
          [activeCharId]: {
            ...cStats,
            wins: cStats.wins + 1,
            currentStreak: newCharCurr,
            maxStreak: Math.max(cStats.maxStreak, newCharCurr),
            firstPlayed: cStats.firstPlayed || playedAt,
            lastPlayed: playedAt
          }
        }
      };
    });
    saveProfiles(updated);
  };

  // SCONFITTA: Azzera Global e Character Current Streak
  const handleLoss = () => {
    if (!activeCharId || !activeProfileId) return;
    const playedAt = new Date().toISOString();
    const updated = profiles.map(p => {
      if (p.id !== activeProfileId) return p;
      const cStats = { ...DEFAULT_CHARACTER_STATS, ...(p.charStats?.[activeCharId] || {}) };
      
      return {
        ...p,
        globalCurrent: 0,
        charStats: {
          ...(p.charStats || {}),
          [activeCharId]: { ...cStats, losses: cStats.losses + 1, currentStreak: 0, firstPlayed: cStats.firstPlayed || playedAt, lastPlayed: playedAt }
        }
      };
    });
    saveProfiles(updated);
  };

  const handleWrChange = (event) => {
    if (!activeCharId || !activeProfileId) return;

    const rawValue = String(event.target.value || '');
    const digitsOnly = rawValue.replace(/\D/g, '');
    const parsedValue = digitsOnly === '' ? 0 : Number.parseInt(digitsOnly, 10);
    const wr = Number.isFinite(parsedValue) ? parsedValue : 0;

    const updated = profiles.map(p => {
      if (p.id !== activeProfileId) return p;
      const cStats = { ...DEFAULT_CHARACTER_STATS, ...(p.charStats?.[activeCharId] || {}) };

      return {
        ...p,
        charStats: {
          ...(p.charStats || {}),
          [activeCharId]: { ...cStats, wr }
        }
      };
    });

    saveProfiles(updated);
  };

  const requestResetSingleChar = () => {
    if (!activeCharId) return;
    const charName = roster.find(c => c.id === activeCharId)?.displayName || 'questo personaggio';
    setModalConfirm({
      isOpen: true,
      title: 'Reset Character Stats',
      message: `Are you sure to reset Wins, Losses and other Streak Data for "${charName}" in the current Streak?`,
      isDestructive: false,
      onConfirm: () => {
        const updated = profiles.map(p => {
          if (p.id !== activeProfileId) return p;
          return {
            ...p,
            charStats: { ...(p.charStats || {}), [activeCharId]: { ...DEFAULT_CHARACTER_STATS } }
          };
        });
        saveProfiles(updated);
        setModalConfirm({ isOpen: false });
      }
    });
  };

  const requestResetAll = () => {
    if (!activeProfile) return;
    setModalConfirm({
      isOpen: true,
      title: 'Reset Active Streak',
      message: `Are you sure to reset the Streak "${activeProfile.name}"? The action cannot be undone.`,
      isDestructive: true,
      onConfirm: () => {
        const updated = profiles.map(p => {
          if (p.id !== activeProfileId) return p;
          return { ...p, globalCurrent: 0, globalMax: 0, charStats: {} };
        });
        saveProfiles(updated);
        setModalConfirm({ isOpen: false });
      }
    });
  };

  const addLoadoutToHistory = () => {
    // Last 5 Loadouts temporarily disabled.
  };

  const generateLoadout = (charId, excludeLoadout = null, options = {}) => {
    const { addToHistory = true } = options;
    const char = roster.find(c => c.id === charId);
    if (!char || isEntityDisabled(char) || !equipmentDb.perks) return;

    const currentRosterType = selectedChallenge.charType;
    const isSurvivor = currentRosterType === 'S';

    const prevPerks = excludeLoadout ? excludeLoadout.perks.map(p => p?.name) : [];
    const prevAddons = excludeLoadout ? excludeLoadout.addons.map(a => a?.name) : [];
    const prevItem = excludeLoadout?.item?.name || null;
    const prevItemAddons = excludeLoadout ? excludeLoadout.itemAddons.map(a => a?.name) : [];
    const prevOffering = excludeLoadout && excludeLoadout.offering ? excludeLoadout.offering.name : null;

    const allValidPerks = Object.entries(equipmentDb.perks)
      .filter(([name, p]) => !isEntityDisabled(p) && p.charType === currentRosterType && !isPerkExcluded({ ...p, name, _key: name }))
      .map(([name, p]) => {
        let ownerName = "General";
        if (p.character) {
          const charList = isSurvivor ? asJSONArray(equipmentDb.survivors) : asJSONArray(equipmentDb.killers);
          const found = charList.find(c => c.id === p.character);
          if (found) ownerName = found.name;
        }
        return { name, ownerName, ...p };
      });

    const selectedPerks = pickLoadoutSlots(allValidPerks, prevPerks, 4, 'perk');

    let selectedAddons = [];
    if (!isSurvivor && equipmentDb.addons && equipmentDb.killers) {
      const cName = getDisplayName(char).replace("The ", "");
      const killerObj = asJSONArray(equipmentDb.killers).find(k => k.name === cName || k.name === getDisplayName(char) || normalizeText(k.name) === normalizeText(cName));
      const killerIds = unique([killerObj?.id, killerObj?._key, char?.id, char?._key]).map(String);
      const allValidAddons = Object.entries(equipmentDb.addons)
        .filter(([_, a]) => !isEntityDisabled(a) && killerIds.includes(String(a.killer)))
        .map(([name, a]) => {
          const rarities = ["", "Common", "Uncommon", "Rare", "Very Rare", "Ultra Rare"];
          return { name, ownerName: rarities[a.rarity] || "Add-on", ...a };
        });

      selectedAddons = pickLoadoutSlots(allValidAddons, prevAddons, 2, 'addon');
    }

    let selectedItem = null;
    let selectedItemAddons = [];
    
    if (isSurvivor && equipmentDb.items && equipmentDb.itemAddons) {
      const allValidItems = Object.entries(equipmentDb.items).filter(([_, data]) => !isEntityDisabled(data)).map(([name, data]) => {
         const rarities = ["", "Common", "Uncommon", "Rare", "Very Rare", "Ultra Rare"];
         return { name, ownerName: rarities[data.rarity] || "Item", ...data };
      });

      selectedItem = pickLoadoutSlots(allValidItems, prevItem ? [prevItem] : [], 1, 'item')[0] || null;

      if (isSpecialLoadoutSlot(selectedItem)) {
        const specialKey = getSpecialLoadoutSlotKey(selectedItem);
        selectedItemAddons = [createSpecialSlot('addon', specialKey), createSpecialSlot('addon', specialKey)];
      } else if (selectedItem) {
        const allValidItemAddons = Object.entries(equipmentDb.itemAddons)
          .filter(([_, a]) => !isEntityDisabled(a) && a.itemsCategory === selectedItem.category)
          .map(([name, a]) => {
             const rarities = ["", "Common", "Uncommon", "Rare", "Very Rare", "Ultra Rare"];
             return { name, ownerName: rarities[a.rarity] || "Item Add-on", ...a };
          });

        selectedItemAddons = allValidItemAddons.length > 0
          ? pickLoadoutSlots(allValidItemAddons, prevItemAddons, 2, 'addon')
          : [];
      }
    }

    let selectedOffering = null;
    if (equipmentDb.offerings) {
      const allValidOfferings = Object.entries(equipmentDb.offerings)
        .filter(([_, o]) => !isEntityDisabled(o) && (!o.charType || o.charType === currentRosterType || o.charType === 'Both'))
        .map(([name, o]) => {
           const rarities = ["", "Common", "Uncommon", "Rare", "Very Rare", "Ultra Rare"];
           return { name, ownerName: rarities[o.rarity] || "Offering", ...o };
        });

      selectedOffering = pickLoadoutSlots(allValidOfferings, prevOffering ? [prevOffering] : [], 1, 'offering')[0] || null;
    }

    const nextLoadout = { 
      perks: selectedPerks, 
      addons: selectedAddons, 
      item: selectedItem, 
      itemAddons: selectedItemAddons, 
      offering: selectedOffering
    };

    triggerGlobalLoadoutAnimation();
    setCurrentLoadout(nextLoadout);
    if (addToHistory) addLoadoutToHistory(charId, nextLoadout);
  };

  const randomizeSingleSlot = (slotType, index = 0) => {
    if (!activeCharId || !equipmentDb.perks) return;

    const currentRosterType = selectedChallenge.charType;
    const isSurvivor = currentRosterType === 'S';
    const char = roster.find(c => c.id === activeCharId);
    if (!char) return;

    const slotKey = getSlotAnimationKey(slotType, index);
    let newLoadout = {
      ...currentLoadout,
      perks: [...(currentLoadout.perks || [])],
      addons: [...(currentLoadout.addons || [])],
      itemAddons: [...(currentLoadout.itemAddons || [])]
    };
    let changed = false;

    if (slotType === 'perk') {
      const otherPerks = currentLoadout.perks
        .filter((_, i) => i !== index)
        .map(p => p?.name)
        .filter(Boolean);
      const currentPerkName = currentLoadout.perks[index]?.name;

      const allValidPerks = Object.entries(equipmentDb.perks)
        .filter(([name, p]) => !isEntityDisabled(p) && p.charType === currentRosterType && !isPerkExcluded({ ...p, name, _key: name }))
        .map(([name, p]) => {
          let ownerName = "General";
          if (p.character) {
            const charList = isSurvivor ? asJSONArray(equipmentDb.survivors) : asJSONArray(equipmentDb.killers);
            const found = charList.find(c => c.id === p.character);
            if (found) ownerName = found.name;
          }
          return { name, ownerName, ...p };
        });

      const candidates = buildSingleSlotCandidates(allValidPerks, otherPerks, 'perk');
      const preferred = candidates.filter(p => p.name !== currentPerkName);
      const nextPerk = shuffle(preferred.length > 0 ? preferred : candidates)[0];
      if (nextPerk) {
        newLoadout.perks[index] = nextPerk;
        changed = true;
      }
    }
    else if (slotType === 'addon' && !isSurvivor) {
      const cName = getDisplayName(char).replace("The ", "");
      const killerObj = asJSONArray(equipmentDb.killers).find(k => k.name === cName || k.name === getDisplayName(char) || normalizeText(k.name) === normalizeText(cName));
      const otherAddons = currentLoadout.addons
        .filter((_, i) => i !== index)
        .map(a => a?.name)
        .filter(Boolean);
      const currentAddonName = currentLoadout.addons[index]?.name;
      const killerIds = unique([killerObj?.id, killerObj?._key, char?.id, char?._key]).map(String);
      const allValidAddons = Object.entries(equipmentDb.addons)
        .filter(([_, a]) => !isEntityDisabled(a) && killerIds.includes(String(a.killer)))
        .map(([name, a]) => {
          const rarities = ["", "Common", "Uncommon", "Rare", "Very Rare", "Ultra Rare"];
          return { name, ownerName: rarities[a.rarity] || "Add-on", ...a };
        });

      const candidates = buildSingleSlotCandidates(allValidAddons, otherAddons, 'addon');
      const preferred = candidates.filter(a => a.name !== currentAddonName);
      const nextAddon = shuffle(preferred.length > 0 ? preferred : candidates)[0];
      if (nextAddon) {
        newLoadout.addons[index] = nextAddon;
        changed = true;
      }
    }
    else if (slotType === 'item' && isSurvivor) {
      const prevItem = currentLoadout.item?.name;
      const allValidItems = Object.entries(equipmentDb.items).filter(([_, data]) => !isEntityDisabled(data)).map(([name, data]) => {
         const rarities = ["", "Common", "Uncommon", "Rare", "Very Rare", "Ultra Rare"];
         return { name, ownerName: rarities[data.rarity] || "Item", ...data };
      });

      const nextItem = pickLoadoutSlots(allValidItems, prevItem ? [prevItem] : [], 1, 'item')[0];
      if (nextItem) {
        newLoadout.item = nextItem;

        if (isSpecialLoadoutSlot(nextItem)) {
          const specialKey = getSpecialLoadoutSlotKey(nextItem);
          newLoadout.itemAddons = [createSpecialSlot('addon', specialKey), createSpecialSlot('addon', specialKey)];
        } else {
          const validItemAddons = Object.entries(equipmentDb.itemAddons)
            .filter(([_, a]) => !isEntityDisabled(a) && a.itemsCategory === nextItem.category)
            .map(([name, a]) => {
               const rarities = ["", "Common", "Uncommon", "Rare", "Very Rare", "Ultra Rare"];
               return { name, ownerName: rarities[a.rarity] || "Item Add-on", ...a };
            });
          
          newLoadout.itemAddons = validItemAddons.length > 0
            ? pickLoadoutSlots(validItemAddons, [], 2, 'addon')
            : [];
        }
        changed = true;
      }
    }
    else if (slotType === 'itemAddon' && isSurvivor && currentLoadout.item) {
      if (isSpecialLoadoutSlot(currentLoadout.item)) {
        const specialKey = getSpecialLoadoutSlotKey(currentLoadout.item);
        newLoadout.itemAddons = [createSpecialSlot('addon', specialKey), createSpecialSlot('addon', specialKey)];
        changed = true;
      } else {
        const validItemAddons = Object.entries(equipmentDb.itemAddons)
          .filter(([_, a]) => !isEntityDisabled(a) && a.itemsCategory === currentLoadout.item.category)
          .map(([name, a]) => {
             const rarities = ["", "Common", "Uncommon", "Rare", "Very Rare", "Ultra Rare"];
             return { name, ownerName: rarities[a.rarity] || "Item Add-on", ...a };
          });

        if (validItemAddons.length > 0) {
          const otherItemAddons = currentLoadout.itemAddons
            .filter((_, i) => i !== index)
            .map(a => a?.name)
            .filter(Boolean);
          const currentItemAddonName = currentLoadout.itemAddons[index]?.name;
          const candidates = buildSingleSlotCandidates(validItemAddons, otherItemAddons, 'addon');
          const preferred = candidates.filter(a => a.name !== currentItemAddonName);
          const nextItemAddon = shuffle(preferred.length > 0 ? preferred : candidates)[0];
          if (nextItemAddon) {
            newLoadout.itemAddons[index] = nextItemAddon;
            changed = true;
          }
        }
      }
    }
    else if (slotType === 'offering') {
      const prevOffering = currentLoadout.offering?.name;
      const allValidOfferings = Object.entries(equipmentDb.offerings)
        .filter(([_, o]) => !isEntityDisabled(o) && (!o.charType || o.charType === currentRosterType || o.charType === 'Both'))
        .map(([name, o]) => {
           const rarities = ["", "Common", "Uncommon", "Rare", "Very Rare", "Ultra Rare"];
           return { name, ownerName: rarities[o.rarity] || "Offering", ...o };
        });

      const nextOffering = pickLoadoutSlots(allValidOfferings, prevOffering ? [prevOffering] : [], 1, 'offering')[0];
      if (nextOffering) {
        newLoadout.offering = nextOffering;
        changed = true;
      }
    }

    if (changed) {
      triggerSingleSlotAnimation(slotKey);
      setCurrentLoadout(newLoadout);
      addLoadoutToHistory(activeCharId, newLoadout);
    }
  };

  // Selezionare il char adesso forza un Loadout Refresh visibile
  const handleSelectChar = (id) => {
    if (isRandomizing) return;
    const char = roster.find(c => c.id === id);
    if (!char || isEntityDisabled(char)) return;
    setActiveCharId(id);
    generateLoadout(id);
  };

  useEffect(() => {
    if (roster.length > 0 && equipmentDb.perks) {
      const activeExists = roster.some(c => c.id === activeCharId && !isEntityDisabled(c));
      if (!activeExists) {
        const firstAvailable = availableRoster[0];
        if (firstAvailable) {
          setActiveCharId(firstAvailable.id);
          generateLoadout(firstAvailable.id);
        } else {
          setActiveCharId(null);
          setCurrentLoadout({ perks: [], addons: [], item: null, itemAddons: [], offering: null });
        }
      }
    }
  }, [roster, equipmentDb.perks, activeCharId, availableRoster]);

  const handleRandomize = () => {
    if (availableRoster.length === 0 || isRandomizing) return;

    setIsRandomizing(true);
    setCurrentLoadout({ perks: [], addons: [], item: null, itemAddons: [], offering: null });
    triggerGlobalLoadoutAnimation();

    const rosterPool = [...availableRoster];
    const finalChar = rosterPool[Math.floor(Math.random() * rosterPool.length)];
    const delays = buildRandomizeDelays();

    const spin = (step) => {
      const isLastStep = step >= delays.length;
      const nextChar = isLastStep
        ? finalChar
        : rosterPool[Math.floor(Math.random() * rosterPool.length)];

      setActiveCharId(nextChar.id);

      if (isLastStep) {
        setIsRandomizing(false);
        generateLoadout(nextChar.id);
        return;
      }

      setTimeout(() => spin(step + 1), delays[step]);
    };

    spin(0);
  };

  const handleRandomizeLoadout = () => {
    if (!activeCharId || isRandomizingLoadout) return;
    setIsRandomizingLoadout(true);

    const baseLoadout = currentLoadout; 
    const maxSteps = 12;
    const spin = (step) => {
      generateLoadout(activeCharId, baseLoadout, { addToHistory: step >= maxSteps });
      if (step < maxSteps) {
        const delay = 60 + Math.pow(step / maxSteps, 3) * 200;
        setTimeout(() => spin(step + 1), delay);
      } else {
        setIsRandomizingLoadout(false);
      }
    };
    spin(0);
  };

  if (isOverlayMode) {
    return (
      <div className="current-character-overlay-page min-h-screen bg-transparent text-neutral-200 font-sans selection:bg-red-900 selection:text-white">
        <div className="current-character-overlay-shell">
          {activeChar ? (
            <div className="bg-black/55 backdrop-blur-md border border-red-950/70 rounded-2xl p-5 flex flex-col relative overflow-visible z-10 shadow-[0_0_32px_rgba(127,29,29,0.35)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/10 blur-[50px] pointer-events-none" />

              <div className="flex items-end gap-5 border-b border-neutral-800/60 pb-5 mb-5 relative">
                <div className="active-character-portrait-frame w-20 h-24 sm:w-24 sm:h-28 flex-shrink-0 relative overflow-visible z-20">
                  <div className="absolute inset-0 bg-black/80 border border-neutral-700 rounded-xl shadow-lg z-0" />
                  <img
                    src={activeChar.portrait}
                    className={`active-character-portrait absolute bottom-0 inset-x-0 mx-auto w-[115%] h-[115%] object-contain object-bottom z-10 ${isEntityDisabled(activeChar) ? 'is-disabled' : ''}`}
                    alt={getDisplayName(activeChar)}
                    decoding="sync"
                    draggable="false"
                  />
                </div>

                <div className="pr-2 flex-1 pb-1 z-20 min-w-0">
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-1">Current Character</p>
                  <h2 className="current-character-name font-black text-white drop-shadow-md" style={getCharacterNameStyle(getDisplayName(activeChar), true)}>{getDisplayName(activeChar)}</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-2">Twitch Overlay</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 relative z-20">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-black/60 border border-neutral-800 rounded-lg p-1.5 sm:p-2 text-center">
                    <p className="text-neutral-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1">WINS</p>
                    <p className="text-xl sm:text-2xl font-black text-green-500">{activeCharStats.wins}</p>
                  </div>
                  <div className="bg-black/60 border border-neutral-800 rounded-lg p-1.5 sm:p-2 text-center">
                    <p className="text-neutral-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1">LOSSES</p>
                    <p className="text-xl sm:text-2xl font-black text-neutral-400">{activeCharStats.losses}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-black/60 border border-neutral-800 rounded-lg p-1.5 sm:p-2 text-center">
                    <p className="text-neutral-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1">STREAK</p>
                    <p className="text-xl sm:text-2xl font-black text-blue-400">{activeCharStats.currentStreak || 0}</p>
                  </div>
                  <div className="bg-black/60 border border-neutral-800 rounded-lg p-1.5 sm:p-2 text-center">
                    <p className="text-neutral-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1">BEST</p>
                    <p className="text-xl sm:text-2xl font-black text-yellow-500">{activeCharStats.maxStreak}</p>
                  </div>
                  <div className="bg-black/60 border border-neutral-800 rounded-lg p-1.5 sm:p-2 text-center">
                    <p className="text-neutral-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1">WR</p>
                    <p className="text-xl sm:text-2xl font-black text-purple-400">{activeCharStats.wr ?? 0}</p>
                  </div>
                </div>

                <CurrentCharacterExtraStats stats={activeCharStats} challengeId={selectedChallengeId} />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-800 bg-black/60 p-5 text-center text-xs font-black uppercase tracking-widest text-neutral-500">
              No current character selected
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-screen text-neutral-200 font-sans flex flex-col md:flex-row p-4 gap-4 h-screen overflow-hidden selection:bg-red-900 selection:text-white z-0">
        
        <div className="fixed inset-0 z-[-1] bg-[#050000] overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-red-950/15 blur-[150px] rounded-full" />
        </div>

        {/* ==========================================
            1. PANNELLO SINISTRO (DASHBOARD)
        ========================================== */}
        <div className="left-dashboard-panel w-full md:w-[340px] flex-shrink-0 flex flex-col gap-4 overflow-y-hidden pr-2 pb-6 relative z-30">
          <header className="space-y-0">
            <div className="flex flex-col gap-4 relative z-50">
              
              <div className="flex items-stretch justify-center gap-2">
                <motion.button
                  type="button"
                  onClick={handleToggleChallenge}
                  whileTap={{ scale: 0.88, rotate: selectedChallengeId === 'killers' ? -10 : 10 }}
                  animate={isModeSwitching ? { scale: [1, 0.9, 1.08, 1], rotate: [0, -8, 8, 0] } : { scale: 1, rotate: 0 }}
                  transition={{ duration: 0.34, ease: 'easeOut' }}
                  className={`mode-toggle-button shrink-0 w-[48px] h-[54px] bg-black/50 backdrop-blur-md border border-neutral-700 text-neutral-300 hover:text-white hover:border-red-900/80 rounded-xl shadow-lg flex items-center justify-center transition-colors relative group ${isModeSwitching ? 'is-switching' : ''}`}
                  title={`Switch to ${selectedChallengeId === 'killers' ? 'Survivors' : 'Killers'}`}
                  aria-label={`Current mode: ${selectedChallenge?.label || 'Unknown'}. Click to switch mode.`}
                >
                  {selectedChallengeId === 'killers' ? (
                    <KillerTypeIcon size={28} className="group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <SurvivorTypeIcon size={28} className="group-hover:opacity-100 transition-opacity" />
                  )}
                </motion.button>

                <button
                  onClick={() => setIsStatsOpen(true)}
                  className="shrink-0 w-[48px] bg-black/50 backdrop-blur-md border border-neutral-700 text-neutral-300 hover:text-white hover:border-red-900/80 rounded-xl shadow-lg flex items-center justify-center transition-all relative group"
                  title="Stats"
                  aria-label="Open stats"
                >
                  <BarChart3 size={21} className="text-red-500 group-hover:text-red-400" />
                </button>

                <button
                  onClick={() => setIsStreakMenuOpen(true)}
                  className="shrink-0 w-[48px] bg-black/50 backdrop-blur-md border border-neutral-700 text-neutral-300 hover:text-white hover:border-red-900/80 rounded-xl shadow-lg flex items-center justify-center transition-all relative group"
                  title="Streaks"
                  aria-label="Open streak manager"
                >
                  <UserCircle size={21} className="text-red-500 group-hover:text-red-400" />
                </button>

                <button
                  onClick={() => setIsExclusionMenuOpen(true)}
                  className="shrink-0 w-[48px] bg-black/50 backdrop-blur-md border border-neutral-700 text-neutral-300 hover:text-white hover:border-red-900/80 rounded-xl shadow-lg flex items-center justify-center transition-all relative group"
                  title="Exclusions"
                  aria-label="Open exclusions"
                >
                  <EyeOff size={21} className="text-red-500 group-hover:text-red-400" />
                </button>

                <button
                  onClick={openBackupMenu}
                  className="shrink-0 w-[48px] bg-black/50 backdrop-blur-md border border-neutral-700 text-neutral-300 hover:text-white hover:border-red-900/80 rounded-xl shadow-lg flex items-center justify-center transition-all relative group"
                  title="Backup"
                  aria-label="Open backup"
                >
                  <Save size={21} className="text-red-500 group-hover:text-red-400" />
                </button>
              </div>

              <CustomSelect
                options={profiles}
                value={activeProfileId}
                onChange={setActiveProfileId}
                icon={UserCircle}
                className="w-full bg-black/50 backdrop-blur-md border border-neutral-700 text-red-400 font-black py-3 px-4 rounded-xl text-sm shadow-lg hover:border-neutral-500"
                dropdownClass="w-full"
              />
            </div>
          </header>

          <div className="grid grid-cols-2 gap-2 relative z-10">
            <div className="bg-black/30 backdrop-blur-md border border-neutral-800 rounded-xl p-2.5 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-900/50" />
              <p className="text-neutral-500 text-[10px] font-black uppercase tracking-wider mb-0.5">Current Streak</p>
              <p className={`text-2xl sm:text-3xl font-black drop-shadow-lg ${currentStreak > 0 ? 'text-red-500' : 'text-neutral-300'}`}>{currentStreak}</p>
            </div>
            <div className="bg-black/30 backdrop-blur-md border border-neutral-800 rounded-xl p-2.5 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/50" />
              <p className="text-neutral-500 text-[10px] font-black uppercase tracking-wider mb-0.5">Max Streak</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-500 drop-shadow-lg">{maxStreak}</p>
            </div>
          </div>

          {activeChar && (
            <div className="bg-black/40 backdrop-blur-md border border-neutral-800 rounded-xl p-4 flex flex-col relative overflow-visible z-10 shadow-lg mb-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/10 blur-[50px] pointer-events-none" />
              <div className="flex items-end gap-5 border-b border-neutral-800/60 pb-5 mb-5 relative">
                
                <div className="active-character-portrait-frame w-20 h-24 sm:w-24 sm:h-28 flex-shrink-0 relative overflow-visible z-20">
                  <div className="absolute inset-0 bg-black/80 border border-neutral-700 rounded-xl shadow-lg z-0" />
                  <img 
                    src={activeChar.portrait} 
                    className={`active-character-portrait absolute bottom-0 inset-x-0 mx-auto w-[115%] h-[115%] object-contain object-bottom z-10 ${isEntityDisabled(activeChar) ? 'is-disabled' : ''}`}
                    alt={getDisplayName(activeChar)}
                    decoding="sync"
                    draggable="false"
                  />
                </div>

                <div className="pr-2 flex-1 pb-1 z-20 min-w-0">
                  <div className="min-w-0 pr-7">
                    <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-1">Current Character</p>
                    <h2 className="current-character-name font-black text-white drop-shadow-md" style={getCharacterNameStyle(getDisplayName(activeChar), false)}>{getDisplayName(activeChar)}</h2>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 relative z-20">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-black/60 border border-neutral-800 rounded-lg p-1.5 sm:p-2 text-center">
                    <p className="text-neutral-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1">WINS</p>
                    <p className="text-xl sm:text-2xl font-black text-green-500">{activeCharStats.wins}</p>
                  </div>
                  <div className="bg-black/60 border border-neutral-800 rounded-lg p-1.5 sm:p-2 text-center">
                    <p className="text-neutral-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1">LOSSES</p>
                    <p className="text-xl sm:text-2xl font-black text-neutral-400">{activeCharStats.losses}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-black/60 border border-neutral-800 rounded-lg p-1.5 sm:p-2 text-center">
                    <p className="text-neutral-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1">STREAK</p>
                    <p className="text-xl sm:text-2xl font-black text-blue-400">{activeCharStats.currentStreak || 0}</p>
                  </div>
                  <div className="bg-black/60 border border-neutral-800 rounded-lg p-1.5 sm:p-2 text-center">
                    <p className="text-neutral-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1">BEST</p>
                    <p className="text-xl sm:text-2xl font-black text-yellow-500">{activeCharStats.maxStreak}</p>
                  </div>
                  <label className="bg-black/60 border border-neutral-800 rounded-lg p-1.5 sm:p-2 text-center block focus-within:border-red-700 focus-within:ring-2 focus-within:ring-red-950 transition-all">
                    <span className="block text-neutral-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1">WR</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={activeCharStats.wr ?? 0}
                      onChange={handleWrChange}
                      className="w-full bg-transparent text-xl sm:text-2xl font-black text-purple-400 text-center outline-none"
                      aria-label="WR"
                    />
                  </label>
                </div>

                <CurrentCharacterExtraStats stats={activeCharStats} challengeId={selectedChallengeId} />
              </div>
            </div>
          )}


          <div className="w-full mb-5 border-b border-neutral-800/70 pb-5 space-y-3">
            <button
              onClick={handleRandomize}
              disabled={isRandomizing || availableRoster.length === 0}
              className="w-full bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-white py-3.5 rounded-xl font-black uppercase text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shuffle size={18} /> {isRandomizing ? 'Selecting...' : availableRoster.length === 0 ? 'No Available Characters' : 'Randomize Character'}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleWin}
                disabled={isRandomizing || !activeCharId}
                className="bg-green-600 hover:bg-green-500 text-white py-3.5 rounded-xl font-black text-base transition-all shadow-[0_0_15px_rgba(22,163,74,0.3)] hover:shadow-[0_0_20px_rgba(22,163,74,0.5)] flex items-center justify-center gap-2 border border-green-500 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={18} strokeWidth={3} /> WON
              </button>
              <button
                onClick={handleLoss}
                disabled={isRandomizing || !activeCharId}
                className="bg-red-700 hover:bg-red-600 text-white py-3.5 rounded-xl font-black text-base transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2 border border-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <X size={18} strokeWidth={3} /> LOSS
              </button>
            </div>
          </div>

        </div>

        {/* ==========================================
            2. PANNELLO CENTRALE (GRIGLIA ROSTER)
        ========================================== */}
        <div className="flex-1 bg-black/20 border border-neutral-800 rounded-2xl p-5 flex flex-col shadow-2xl backdrop-blur-xl relative z-30">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-800/50 flex-shrink-0 z-50">
            <h2 className="text-sm font-black uppercase tracking-widest text-neutral-400 whitespace-nowrap">Current Roster</h2>
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="roster-help-link text-sm font-black uppercase tracking-widest text-neutral-400 whitespace-nowrap"
              aria-label="Open help"
              title="Need help?"
            >
              Need Help?
            </button>
          </div>

          <div ref={gridViewportRef} className="flex-1 min-h-0 relative z-20">
            <div
              className="grid gap-x-2 gap-y-4 h-full"
              style={{
                gridTemplateColumns: `repeat(auto-fill, ${Math.floor(tileSize)}px)`,
                gridAutoRows: `${Math.floor(tileSize)}px`,
                justifyContent: 'center',
                alignContent: 'start',
              }}
            >
              <AnimatePresence>
                {roster.map((char) => {
                  const isActive = activeCharId === char.id;
                  const isExcludedChar = isCharacterExcluded(char);
                  const isDisabledChar = isEntityDisabled(char);
                  const isDimmed = (isRandomizing && !isActive) || isExcludedChar || isDisabledChar;
                  const isLockedChar = isExcludedChar || isDisabledChar;
                  const hoverNotice = isExcludedChar
                    ? 'Character manually excluded.'
                    : isDisabledChar
                      ? 'Character currently disabled.'
                      : '';

                  return (
                    <motion.div
                      key={char.id}
                      onClick={() => !isLockedChar && handleSelectChar(char.id)}
                      title={hoverNotice || getDisplayName(char)}
                      className={`relative group/char w-full h-full rounded-xl overflow-visible transition-all duration-300 ${isLockedChar ? 'z-20 hover:z-[1000000]' : isActive ? 'z-[999] scale-[1.15]' : 'z-10 hover:z-[90] hover:-translate-y-1'} ${isRandomizing ? 'cursor-default' : isLockedChar ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className={`w-full relative rounded-xl transition-all duration-300 ${isLockedChar ? 'ring-1 ring-neutral-700/70' : isActive ? 'ring-2 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 'ring-1 ring-neutral-700/70 hover:ring-neutral-400/80'}`} style={{ aspectRatio: '1 / 1' }}>
                        
                        <div className="absolute inset-0 pointer-events-none z-0 bg-neutral-950 rounded-xl" />
                        <div className="absolute inset-0 pointer-events-none z-20 rounded-xl overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/25" />
                        </div>

                        <img
                          src={char.portrait}
                          alt={getDisplayName(char)}
                          className={`character-portrait-img absolute inset-0 w-full h-full object-cover z-10 rounded-xl transition-opacity duration-300 ${isDimmed ? 'opacity-30 grayscale' : 'opacity-100'}`}
                          loading="eager"
                          decoding="sync"
                          draggable="false"
                        />

                        {isExcludedChar && (
                          <>
                            <div className="absolute inset-0 z-[18] flex items-center justify-center pointer-events-none">
                              <img
                                src="/icons/no_entry.png"
                                alt="Excluded"
                                className="excluded-character-icon w-[42%] h-[42%] object-contain opacity-90"
                                draggable="false"
                              />
                            </div>
                            <div className="absolute inset-0 z-[19] bg-black/45 rounded-xl pointer-events-none" />
                          </>
                        )}

                        {isDisabledChar && !isExcludedChar && (
                          <>
                            <div className="absolute inset-0 z-[18] flex items-center justify-center pointer-events-none">
                              <img
                                src="/icons/hourglass.png"
                                alt="Disabled"
                                className="disabled-character-icon w-[42%] h-[42%] object-contain opacity-90"
                                draggable="false"
                              />
                            </div>
                            <div className="absolute inset-0 z-[19] bg-black/45 rounded-xl pointer-events-none" />
                          </>
                        )}
                      </div>
                      {hoverNotice && (
                        <div className="character-status-tooltip pointer-events-none absolute left-1/2 bottom-full z-[1000000] mb-2 w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-red-900/60 bg-neutral-950/98 px-3 py-2 text-center text-red-100 opacity-0 shadow-[0_16px_45px_rgba(0,0,0,0.98),0_0_18px_rgba(127,29,29,0.32)] transition-all duration-200 group-hover/char:opacity-100 group-hover/char:-translate-y-1">
                          {hoverNotice}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          <footer className="relative z-10 mt-4 pt-3 text-center border-t border-neutral-900/80 flex-shrink-0">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-600">DBD–TRACKER.VERCEL.APP</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 mt-1">Not affiliated with Dead by Daylight or Behaviour Interactive</p>
          </footer>
        </div>

        {/* ==========================================
            3. PANNELLO DESTRO (LOADOUT DIAMOND)
        ========================================== */}
        <div className="w-full md:w-[280px] lg:w-[340px] flex-shrink-0 bg-black/20 border border-neutral-800 rounded-2xl p-6 flex flex-col shadow-2xl backdrop-blur-xl overflow-y-auto overflow-x-hidden custom-scroll relative z-20">
          <div className="border-b border-neutral-800/50 pb-3 mb-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-neutral-400 text-center">Loadout</h2>
          </div>

          {dbLoading && <p className="text-xs text-yellow-500 text-center mb-4 animate-pulse">Loading JSON Database...</p>}
          {(!dbLoading && !equipmentDb.perks) && <p className="text-xs text-red-500 text-center mb-4">Error loading JSON files.<br/>Check 'public/data/' folder.</p>}

          <div className="flex-1 flex flex-col items-center mt-2 w-full">
            
            {/* PERKS (Diamond Layout Espanso) */}
            <div className="flex flex-col items-center w-full relative">
              <span className="absolute -top-6 text-[10px] font-bold text-neutral-600 uppercase tracking-widest"></span>
              
              <div className="relative w-[210px] h-[210px] sm:w-[240px] sm:h-[240px] my-2">
                <div className="absolute top-0 left-1/2 -translate-x-1/2">
                  <LoadoutIcon item={currentLoadout.perks[0]} type="perk" isGlobalRoll={loadoutAnimationMode === 'global'} animationId={slotAnimationKeys[LOADOUT_SLOT_KEYS.perk0]} index={0} onIconClick={() => randomizeSingleSlot('perk', 0)} />
                </div>
                <div className="absolute top-1/2 left-0 -translate-y-1/2">
                  <LoadoutIcon item={currentLoadout.perks[1]} type="perk" isGlobalRoll={loadoutAnimationMode === 'global'} animationId={slotAnimationKeys[LOADOUT_SLOT_KEYS.perk1]} index={1} onIconClick={() => randomizeSingleSlot('perk', 1)} />
                </div>
                <div className="absolute top-1/2 right-0 -translate-y-1/2">
                  <LoadoutIcon item={currentLoadout.perks[2]} type="perk" isGlobalRoll={loadoutAnimationMode === 'global'} animationId={slotAnimationKeys[LOADOUT_SLOT_KEYS.perk2]} index={2} onIconClick={() => randomizeSingleSlot('perk', 2)} />
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                  <LoadoutIcon item={currentLoadout.perks[3]} type="perk" isGlobalRoll={loadoutAnimationMode === 'global'} animationId={slotAnimationKeys[LOADOUT_SLOT_KEYS.perk3]} index={3} onIconClick={() => randomizeSingleSlot('perk', 3)} />
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent my-4"></div>

            {/* AREA CENTRALE: Item & Addons OPPURE Solo Addons */}
            <div className="flex flex-col items-center w-full relative">
              <span className="absolute -top-6 text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                
              </span>
              
              {selectedChallenge?.charType === 'S' ? (
                // SURVIVOR: Item Grande + 2 Add-ons Cliccabili
                <div className="flex items-center gap-3 sm:gap-4 my-2">
                  <LoadoutIcon item={currentLoadout.item} type="item" isGlobalRoll={loadoutAnimationMode === 'global'} animationId={slotAnimationKeys[LOADOUT_SLOT_KEYS.item]} index={4} customSize="w-20 h-20 sm:w-24 sm:h-24" onIconClick={() => randomizeSingleSlot('item')} />
                  
                  <div className="flex bg-black/40 p-1.5 rounded-2xl border border-neutral-800/80 shadow-inner">
                    <LoadoutIcon item={currentLoadout.itemAddons?.[0]} type="addon" isGlobalRoll={loadoutAnimationMode === 'global'} animationId={slotAnimationKeys[LOADOUT_SLOT_KEYS.itemAddon0]} index={5} customSize="w-14 h-14 sm:w-16 sm:h-16" onIconClick={() => randomizeSingleSlot('itemAddon', 0)} />
                    <div className="w-px bg-neutral-800 mx-1"></div>
                    <LoadoutIcon item={currentLoadout.itemAddons?.[1]} type="addon" isGlobalRoll={loadoutAnimationMode === 'global'} animationId={slotAnimationKeys[LOADOUT_SLOT_KEYS.itemAddon1]} index={6} customSize="w-14 h-14 sm:w-16 sm:h-16" onIconClick={() => randomizeSingleSlot('itemAddon', 1)} />
                  </div>
                </div>
              ) : (
                // KILLER: Add-ons
                <div className="flex gap-6 my-2">
                  {[0, 1].map(i => <LoadoutIcon key={`a-${i}`} item={currentLoadout.addons[i]} type="addon" isGlobalRoll={loadoutAnimationMode === 'global'} animationId={slotAnimationKeys[LOADOUT_SLOT_KEYS[`addon${i}`]]} index={4 + i} onIconClick={() => randomizeSingleSlot('addon', i)} />)}
                </div>
              )}
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent my-4"></div>

            {/* OFFERING */}
            <div className="flex flex-col items-center w-full relative my-2">
              <span className="absolute -top-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest"></span>
              <div className="mt-0">
                <LoadoutIcon item={currentLoadout.offering} type="offering" isGlobalRoll={loadoutAnimationMode === 'global'} animationId={slotAnimationKeys[LOADOUT_SLOT_KEYS.offering]} index={7} customSize="w-20 h-20 sm:w-24 sm:h-24" onIconClick={() => randomizeSingleSlot('offering')} />
              </div>
            </div>


          </div>

        </div>

      </div>

      <StreakMenu
        isOpen={isStreakMenuOpen}
        onClose={() => setIsStreakMenuOpen(false)}
        challenges={CHALLENGES}
        profilesByChallenge={{ ...profilesByChallenge, [selectedChallenge.id]: profiles }}
        selectedChallengeId={selectedChallenge.id}
        activeProfileId={activeProfileId}
        onChangeProfile={(challengeId, profileId) => {
          if (challengeId === selectedChallenge.id) setActiveProfileId(profileId);
        }}
        onCreateProfile={createProfile}
        onRenameProfile={renameProfile}
        onDeleteProfile={deleteProfile}
        onResetCharacter={requestResetSingleChar}
        onResetAll={requestResetAll}
        canResetCharacter={Boolean(activeCharId)}
        isRandomizing={isRandomizing}
      />

      <StatsMenu
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={globalStats}
      />

      <ExclusionMenu
        isOpen={isExclusionMenuOpen}
        onClose={() => setIsExclusionMenuOpen(false)}
        activeTab={exclusionTab}
        setActiveTab={setExclusionTab}
        searchTerm={exclusionSearch}
        setSearchTerm={setExclusionSearch}
        optionsByTab={exclusionOptions}
        counts={exclusionCounts}
        isExcluded={isExcludedInMenu}
        onToggle={toggleExclusion}
        onClearCategory={clearExclusionsCategory}
      />

      <BackupMenu
        isOpen={isBackupMenuOpen}
        onClose={() => setIsBackupMenuOpen(false)}
        backupMeta={backupMeta}
        status={backupStatus}
        onExportBackup={exportBackupJson}
        onImportBackupFile={applyImportedBackupFile}
        onOpenHelp={() => { setIsBackupMenuOpen(false); setIsHelpOpen(true); }}
      />

      <HelpMenu
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* ==========================================
          MODALE CONFIRM & PROMPT (MULTI-USO)
      ========================================== */}
      <AnimatePresence>
        {modalConfirm.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onMouseDown={() => setModalConfirm({ ...modalConfirm, isOpen: false })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-visible"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {modalConfirm.isDestructive && <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />}
              
              <div className="stats-bucket-header flex items-center gap-3 mb-3">
                {modalConfirm.isDestructive && <AlertTriangle className="text-red-500" size={24} />}
                <h3 className="text-xl font-black text-white">{modalConfirm.title}</h3>
              </div>
              
              <p className="text-neutral-400 mb-8 text-sm leading-relaxed">{modalConfirm.message}</p>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setModalConfirm({ ...modalConfirm, isOpen: false })} 
                  className="px-5 py-2.5 rounded-xl font-bold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
                >
                  Undo
                </button>
                <button 
                  onClick={modalConfirm.onConfirm} 
                  className={`px-5 py-2.5 rounded-xl font-bold text-white transition-colors ${modalConfirm.isDestructive ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalPrompt.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onMouseDown={() => setModalPrompt({ ...modalPrompt, isOpen: false })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-visible"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="stats-bucket-header flex items-center gap-3 mb-3">
                <Edit className="text-indigo-400" size={24} />
                <h3 className="text-xl font-black text-white">{modalPrompt.title}</h3>
              </div>
              
              <input 
                autoFocus
                type="text"
                maxLength={32}
                placeholder={modalPrompt.placeholder}
                value={promptValue}
                onChange={e => setPromptValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !modalPrompt.showDescription && modalPrompt.onConfirm(promptValue, promptDescription, promptChallengeId)}
                className={`w-full bg-black/50 border border-neutral-700 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors ${modalPrompt.showDescription ? 'mb-3' : 'mb-8'}`}
              />

              {modalPrompt.showChallengeSelect && (
                <div className="mb-3 relative z-30">
                  <CustomSelect
                    options={CHALLENGES.map((challenge) => ({ ...challenge, name: challenge.label, label: challenge.label }))}
                    value={promptChallengeId}
                    onChange={setPromptChallengeId}
                    icon={UserCircle}
                    className="w-full bg-neutral-950/70 border border-neutral-800 text-neutral-200 font-bold py-2.5 px-3 rounded-xl text-sm hover:text-white"
                    dropdownClass="w-full min-w-[220px]"
                  />
                </div>
              )}

              {modalPrompt.showDescription && (
                <div className="mb-8">
                  <textarea
                    value={promptDescription}
                    maxLength={150}
                    placeholder={modalPrompt.descriptionPlaceholder || 'Short description'}
                    onChange={e => setPromptDescription(e.target.value.slice(0, 150))}
                    className="w-full min-h-[92px] resize-none bg-black/50 border border-neutral-700 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors custom-scroll text-sm leading-relaxed"
                  />
                  <div className="mt-1 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                    {promptDescription.length}/150
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setModalPrompt({ ...modalPrompt, isOpen: false })} 
                  className="px-5 py-2.5 rounded-xl font-bold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
                >
                  Undo
                </button>
                <button 
                  onClick={() => modalPrompt.onConfirm(promptValue, promptDescription, promptChallengeId)} 
                  disabled={!promptValue.trim()}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}