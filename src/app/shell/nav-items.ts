import { IconName } from '../shared/icon/icon';

export interface NavItem {
  path: string;
  label: string;
  icon: IconName;
}

const LIBRARY: NavItem = { path: '/library', label: 'Library', icon: 'library' };
const COLLECTIONS: NavItem = { path: '/collections', label: 'Collections', icon: 'collections' };
const SEARCH: NavItem = { path: '/search', label: 'Search', icon: 'search' };
const IMPORT: NavItem = { path: '/import', label: 'Import', icon: 'import' };
const SYNC: NavItem = { path: '/sync', label: 'Sync', icon: 'sync' };
const SETTINGS: NavItem = { path: '/settings', label: 'Settings', icon: 'settings' };

/** Side rail (tablet and desktop): Library, Collections, Search, Import at the top. */
export const RAIL_TOP: readonly NavItem[] = [LIBRARY, COLLECTIONS, SEARCH, IMPORT];
/** Side rail: Sync and Settings at the bottom. */
export const RAIL_BOTTOM: readonly NavItem[] = [SYNC, SETTINGS];
/** Bottom bar (phone). Import opens from the + in the Library header instead. */
export const BOTTOM_BAR: readonly NavItem[] = [LIBRARY, COLLECTIONS, SEARCH, SYNC, SETTINGS];
