import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./App.css";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Item {
  name: string;
  color: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SIZES = ["tiny", "small", "medium", "large", "huge"];
export const COLORS = [
  "navy", "blue", "aqua", "teal", "olive", "green", "lime",
  "yellow", "orange", "red", "maroon", "fuchsia", "purple",
  "silver", "gray", "black",
];
const FRUITS = [
  "apple", "banana", "watermelon", "orange", "peach", "tangerine",
  "pear", "kiwi", "mango", "pineapple",
];

const ITEMS: Item[] = SIZES.flatMap((size) =>
  FRUITS.flatMap((fruit) =>
    COLORS.map((color) => ({ name: `${size} ${color} ${fruit}`, color }))
  )
);

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const STORAGE_KEY = "pickline_selected_v1";

function usePersistedSelection(): [Set<string>, React.Dispatch<React.SetStateAction<Set<string>>>] {
  const [selectedItemsKeys, setSelectedItemsKeys] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return new Set(JSON.parse(raw) as string[]);
    } catch {}
    return new Set();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selectedItemsKeys)));
    } catch {}
  }, [selectedItemsKeys]);

  return [selectedItemsKeys, setSelectedItemsKeys];
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface ItemsContextValue {
  colorFilters: Set<string>;
  debouncedSearchQuery: string;
  filteredItems: Item[];
  onClearAll: () => void;
  onSearchQueryChange: (q: string) => void;
  onToggleColorFilter: (color: string) => void;
  onToggleItemSelected: (key: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchQuery: string;
  selectedItems: Item[];
  selectedItemsKeys: Set<string>;
}

const ItemsContext = createContext<ItemsContextValue>({} as ItemsContextValue);

const ItemsProvider = ({ children }: { children: React.ReactNode }) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedItemsKeys, setSelectedItemsKeys] = usePersistedSelection();
  const [colorFilters, setColorFilters] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 150);

  const onSearchQueryChange = useCallback((q: string) => setSearchQuery(q), []);

  const onToggleItemSelected = useCallback((key: string) => {
    setSelectedItemsKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const onClearAll = useCallback(() => setSelectedItemsKeys(new Set()), []);

  const onToggleColorFilter = useCallback((color: string) => {
    setColorFilters((prev) => {
      const next = new Set(prev);
      if (next.has(color)) next.delete(color);
      else next.add(color);
      return next;
    });
  }, []);

  const selectedItems = useMemo(
    () => ITEMS.filter((item) => selectedItemsKeys.has(item.name)),
    [selectedItemsKeys]
  );

  const filteredItems = useMemo(() => {
    const q = debouncedSearchQuery.toLowerCase();
    return ITEMS.filter(
      (item) =>
        item.name.includes(q) &&
        (colorFilters.size === 0 || colorFilters.has(item.color))
    );
  }, [debouncedSearchQuery, colorFilters]);

  const value = useMemo(
    () => ({
      colorFilters,
      debouncedSearchQuery,
      filteredItems,
      onClearAll,
      onSearchQueryChange,
      onToggleColorFilter,
      onToggleItemSelected,
      searchInputRef,
      searchQuery,
      selectedItems,
      selectedItemsKeys,
    }),
    [
      colorFilters,
      debouncedSearchQuery,
      filteredItems,
      onClearAll,
      onSearchQueryChange,
      onToggleColorFilter,
      onToggleItemSelected,
      searchQuery,
      selectedItems,
      selectedItemsKeys,
    ]
  );

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
};

const useItems = () => useContext(ItemsContext);

// ─── Icons ───────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <div className="CloseIcon" aria-hidden="true">
    <div className="CloseIcon__Line CloseIcon__Line--1" />
    <div className="CloseIcon__Line CloseIcon__Line--2" />
  </div>
);

const CheckboxIcon = ({ isChecked }: { isChecked: boolean }) => (
  <div
    className={`Checkbox__Box${isChecked ? " Checkbox__Box--checked" : ""}`}
    aria-hidden="true"
  >
    {isChecked && <div className="Checkbox__Checkmark" />}
  </div>
);

// ─── SideRail ────────────────────────────────────────────────────────────────

interface SideRailItemProps {
  item: Item;
  onRemove: (key: string) => void;
}

const SideRailItem = memo(({ item, onRemove }: SideRailItemProps) => (
  <li className="SideRail__item" onClick={() => onRemove(item.name)}>
    <span className="SideRail__item__Color" data-color={item.color} aria-hidden="true" />
    <span className="SideRail__item__Name">{item.name}</span>
    <button
      className="SideRail__item__IconButton"
      aria-label={`Remove ${item.name}`}
      onClick={(e) => {
        e.stopPropagation();
        onRemove(item.name);
      }}
    >
      <CloseIcon />
    </button>
  </li>
));

const EmptySelection = () => (
  <div className="SideRail__Empty" role="status">
    <div className="SideRail__Empty__Icon" aria-hidden="true">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    </div>
    <p className="SideRail__Empty__Title">Nothing selected yet</p>
    <p className="SideRail__Empty__Subtitle">
      Tap any item on the right to add it here. Your selection is saved between sessions.
    </p>
  </div>
);

const SideRail = () => {
  const { selectedItems, onToggleItemSelected, onClearAll } = useItems();
  const [confirmClear, setConfirmClear] = useState(false);
  const count = selectedItems.length;

  const handleClearClick = () => {
    if (confirmClear) {
      onClearAll();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  };

  useEffect(() => {
    if (count === 0) setConfirmClear(false);
  }, [count]);

  return (
    <aside className="SideRail" aria-label="Selected items">
      <div className="SideRail__Header">
        <div className="SideRail__Header__Row">
          <div className="SideRail__SelectedCount__Container">
            <span className="SideRail__SelectedCount__prefix">Your selection</span>
            <span
              className={`SideRail__SelectedCount__badge${count === 0 ? " SideRail__SelectedCount__badge--empty" : ""}`}
              aria-label={`${count} items selected`}
            >
              {count}
            </span>
          </div>
          {count > 0 && (
            <button
              className={`SideRail__ClearAll${confirmClear ? " SideRail__ClearAll--confirm" : ""}`}
              onClick={handleClearClick}
              onBlur={() => setConfirmClear(false)}
              aria-label={confirmClear ? "Confirm clear all" : "Clear all selected items"}
            >
              {confirmClear ? "Are you sure?" : "Clear all"}
            </button>
          )}
        </div>
        <p className="caption">
          {count === 0
            ? "No items selected"
            : `${count} ${count === 1 ? "item" : "items"} in your selection`}
        </p>
      </div>
      <div className="SideRail__Body">
        {count === 0 ? (
          <EmptySelection />
        ) : (
          <ul className="SideRail__List" aria-label="Selected items list">
            {selectedItems.map((item) => (
              <SideRailItem
                key={item.name}
                item={item}
                onRemove={onToggleItemSelected}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

// ─── Toolbar ─────────────────────────────────────────────────────────────────

interface ColorBadgeProps {
  color: string;
  isSelected: boolean;
  onClick: (color: string) => void;
}

const ColorBadge = memo(({ color, isSelected, onClick }: ColorBadgeProps) => (
  <button
    className={`ColorBadge${isSelected ? " ColorBadge--selected" : ""}`}
    aria-pressed={isSelected}
    onClick={() => onClick(color)}
  >
    <span className="ColorBadge__Circle" data-color={color} aria-hidden="true" />
    {color[0].toUpperCase() + color.slice(1)}
  </button>
));

const Toolbar = () => {
  const {
    colorFilters,
    filteredItems,
    onSearchQueryChange,
    onToggleColorFilter,
    searchInputRef,
    searchQuery,
  } = useItems();

  return (
    <div className="Toolbar" role="search">
      <div className="Toolbar__Search_Panel">
        <input
          ref={searchInputRef}
          className="Toolbar__Search_Input"
          type="search"
          placeholder={`Search ${ITEMS.length} items...`}
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          aria-label="Search items"
        />
        <span
          className="Toolbar__FiltersLabel"
          aria-live="polite"
          aria-atomic="true"
        >
          Showing <b>{filteredItems.length}</b> of {ITEMS.length}
        </span>
      </div>
      <div className="Toolbar__Filters_Panel">
        <span className="Toolbar__Filter__Label" aria-hidden="true">COLOR</span>
        <div
          className="Toolbar__Filter_Options"
          role="group"
          aria-label="Filter by color"
        >
          {COLORS.map((color) => (
            <ColorBadge
              key={color}
              color={color}
              isSelected={colorFilters.has(color)}
              onClick={onToggleColorFilter}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── ColorItem ───────────────────────────────────────────────────────────────

interface ColorItemProps {
  isFocused: boolean;
  isSelected: boolean;
  item: Item;
  onToggle: (name: string) => void;
}

const ColorItem = memo(({ isFocused, isSelected, item, onToggle }: ColorItemProps) => {
  const [size, , fruit] = item.name.split(" ");
  return (
    <div
      tabIndex={isFocused ? 0 : -1}
      className={`ColorItem${isSelected ? " ColorItem--selected" : ""}${isFocused ? " ColorItem--focused" : ""}`}
      role="option"
      aria-selected={isSelected}
      aria-label={item.name}
      onClick={() => onToggle(item.name)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(item.name);
        }
      }}
    >
      <div className="ColorItem__Content">
        <span className="ColorItem__Color" data-color={item.color} aria-hidden="true" />
        <div className="ColorItem__Info">
          <span className="ColorItem__Size">{size.toUpperCase()}</span>
          <span className="ColorItem__Name">
            {item.color[0].toUpperCase() + item.color.slice(1)}{" "}
            {fruit[0].toUpperCase() + fruit.slice(1)}
          </span>
        </div>
      </div>
      <CheckboxIcon isChecked={isSelected} />
    </div>
  );
});

// ─── ItemsList ───────────────────────────────────────────────────────────────

const ItemsList = () => {
  const {
    filteredItems,
    onToggleItemSelected,
    searchInputRef,
    selectedItemsKeys,
  } = useItems();

  const listRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    setFocusedIndex((prev) => {
      if (filteredItems.length === 0) return -1;
      return prev >= filteredItems.length ? filteredItems.length - 1 : prev;
    });
  }, [filteredItems.length]);

  useEffect(() => {
    if (focusedIndex < 0 || !listRef.current) return;
    const options = listRef.current.querySelectorAll<HTMLElement>('[role="option"]');
    options[focusedIndex]?.focus();
  }, [focusedIndex]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const len = filteredItems.length;
    if (len === 0) return;

    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        setFocusedIndex((prev) => (prev < len - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : len - 1));
        break;
      case "Home":
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case "End":
        e.preventDefault();
        setFocusedIndex(len - 1);
        break;
      case " ":
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0) onToggleItemSelected(filteredItems[focusedIndex].name);
        break;
      case "/":
        e.preventDefault();
        searchInputRef.current?.focus();
        break;
      case "Escape":
        e.preventDefault();
        setFocusedIndex(-1);
        (e.currentTarget as HTMLElement).blur();
        break;
    }
  };

  return (
    <div
      ref={listRef}
      className="ItemsList"
      role="listbox"
      aria-multiselectable="true"
      aria-label="Available items"
      onKeyDown={onKeyDown}
    >
      {filteredItems.map((item, index) => (
        <ColorItem
          key={item.name}
          isFocused={focusedIndex === index}
          isSelected={selectedItemsKeys.has(item.name)}
          item={item}
          onToggle={onToggleItemSelected}
        />
      ))}
    </div>
  );
};

// ─── Layout ──────────────────────────────────────────────────────────────────

const Main = () => (
  <main className="Main">
    <Toolbar />
    <ItemsList />
  </main>
);

const App = () => (
  <ItemsProvider>
    <div className="Container">
      <SideRail />
      <Main />
    </div>
  </ItemsProvider>
);

export default App;
