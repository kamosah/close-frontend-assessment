// ─── JSFiddle setup ───────────────────────────────────────────────────────────
// HTML panel:
//   <script src="https://unpkg.com/react@18.2.0/umd/react.development.js"></script>
//   <script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.development.js"></script>
//   <div id="root"></div>
//
// CSS panel: paste contents of App.css
//
// JavaScript panel: this file  (Preprocessor → Babel + JSX)
// ─────────────────────────────────────────────────────────────────────────────

const {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} = React;

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "pickline_selected_v1";

const SIZES  = ["tiny", "small", "medium", "large", "huge"];
const COLORS = [
  "navy", "blue", "aqua", "teal", "olive", "green", "lime",
  "yellow", "orange", "red", "maroon", "fuchsia", "purple",
  "silver", "gray", "black",
];
const FRUITS = [
  "apple", "banana", "watermelon", "orange", "peach", "tangerine",
  "pear", "kiwi", "mango", "pineapple",
];

const ITEMS = SIZES.flatMap((size) =>
  FRUITS.flatMap((fruit) =>
    COLORS.map((color) => ({ name: `${size} ${color} ${fruit}`, color }))
  )
);

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function usePersistedSelection() {
  const [selectedItemsKeys, setSelectedItemsKeys] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return new Set(JSON.parse(raw));
    } catch (_e) {
      // localStorage unavailable
    }
    return new Set();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selectedItemsKeys)));
    } catch (_e) {
      // localStorage unavailable
    }
  }, [selectedItemsKeys]);

  return [selectedItemsKeys, setSelectedItemsKeys];
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ItemsContext = createContext({});

const ItemsProvider = ({ children }) => {
  const searchInputRef = useRef(null);
  const [selectedItemsKeys, setSelectedItemsKeys] = usePersistedSelection();
  const [colorFilters, setColorFilters] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 150);

  const onSearchQueryChange = useCallback((q) => setSearchQuery(q), []);

  const onToggleItemSelected = useCallback((key) => {
    setSelectedItemsKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, [setSelectedItemsKeys]);

  const onClearAll = useCallback(
    () => setSelectedItemsKeys(new Set()),
    [setSelectedItemsKeys]
  );

  const onToggleColorFilter = useCallback((color) => {
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

  const value = useMemo(() => ({
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
  }), [
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
  ]);

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

const CheckboxIcon = ({ isChecked }) => (
  <div
    className={`Checkbox__Box${isChecked ? " Checkbox__Box--checked" : ""}`}
    aria-hidden="true"
  >
    {isChecked && <div className="Checkbox__Checkmark" />}
  </div>
);

// ─── SideRail ────────────────────────────────────────────────────────────────

const SideRailItem = memo(({ item, onRemove }) => (
  <li className="SideRail__item" onClick={() => onRemove(item.name)}>
    <span className="SideRail__item__Color" data-color={item.color} aria-hidden="true" />
    <span className="SideRail__item__Name">{item.name}</span>
    <button
      className="SideRail__item__IconButton"
      aria-label={`Remove ${item.name}`}
      onClick={(e) => { e.stopPropagation(); onRemove(item.name); }}
    >
      <CloseIcon />
    </button>
  </li>
));

const EmptySelection = () => (
  <div className="SideRail__Empty" role="status">
    <div className="SideRail__Empty__Icon" aria-hidden="true" />
    <p className="SideRail__Empty__Title">Nothing selected yet</p>
    <p className="SideRail__Empty__Subtitle">
      Tap any item to add it here. Your selection is saved between sessions.
    </p>
  </div>
);

const SideRail = () => {
  const { selectedItems, onToggleItemSelected, onClearAll } = useItems();
  const [confirmClear, setConfirmClear] = useState(false);
  const count = selectedItems.length;

  if (confirmClear && count === 0) setConfirmClear(false);

  const handleClearClick = () => {
    if (confirmClear) {
      onClearAll();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  };

  return (
    <aside className="SideRail" aria-label="Selected items" data-has-items={count > 0}>
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
              <SideRailItem key={item.name} item={item} onRemove={onToggleItemSelected} />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

// ─── Toolbar ─────────────────────────────────────────────────────────────────

const ColorBadge = memo(({ color, isSelected, onClick }) => (
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
        <span className="Toolbar__FiltersLabel" aria-live="polite" aria-atomic="true">
          Showing <b>{filteredItems.length}</b> of {ITEMS.length}
        </span>
      </div>
      <div className="Toolbar__Filters_Panel">
        <span className="Toolbar__Filter__Label" aria-hidden="true">COLOR</span>
        <div className="Toolbar__Filter_Options" role="group" aria-label="Filter by color">
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

const ColorItem = memo(({ isFocused, isSelected, item, onToggle }) => {
  const [size, , fruit] = item.name.split(" ");
  return (
    <div
      tabIndex={isFocused ? 0 : -1}
      className={`ColorItem${isSelected ? " ColorItem--selected" : ""}${isFocused ? " ColorItem--focused" : ""}`}
      role="option"
      aria-selected={isSelected}
      aria-label={item.name}
      onClick={() => onToggle(item.name)}
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

const NoResults = ({ onClearSearch }) => (
  <div className="NoResults" role="status" aria-live="polite">
    <div className="NoResults__Icon" aria-hidden="true" />
    <p className="NoResults__Title">No matches</p>
    <p className="NoResults__Subtitle">Try a different search or adjust the color filter.</p>
    <button className="NoResults__ClearButton" onClick={onClearSearch}>
      Clear search
    </button>
  </div>
);

const ItemsList = () => {
  const {
    colorFilters,
    filteredItems,
    onSearchQueryChange,
    onToggleColorFilter,
    onToggleItemSelected,
    searchInputRef,
    selectedItemsKeys,
  } = useItems();

  const listRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const effectiveFocusedIndex =
    filteredItems.length === 0 ? -1
    : focusedIndex >= filteredItems.length ? filteredItems.length - 1
    : focusedIndex;

  useEffect(() => {
    if (effectiveFocusedIndex < 0 || !listRef.current) return;
    const options = listRef.current.querySelectorAll('[role="option"]');
    if (options[effectiveFocusedIndex]) options[effectiveFocusedIndex].focus();
  }, [effectiveFocusedIndex]);

  const onKeyDown = (e) => {
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
        if (effectiveFocusedIndex >= 0)
          onToggleItemSelected(filteredItems[effectiveFocusedIndex].name);
        break;
      case "/":
        e.preventDefault();
        if (searchInputRef.current) searchInputRef.current.focus();
        break;
      case "Escape":
        e.preventDefault();
        setFocusedIndex(-1);
        e.currentTarget.blur();
        break;
    }
  };

  const handleClearSearch = useCallback(() => {
    onSearchQueryChange("");
    colorFilters.forEach((c) => onToggleColorFilter(c));
    if (searchInputRef.current) searchInputRef.current.focus();
  }, [onSearchQueryChange, colorFilters, onToggleColorFilter]);

  if (filteredItems.length === 0) {
    return (
      <div className="ItemsList ItemsList--empty">
        <NoResults onClearSearch={handleClearSearch} />
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="ItemsList"
      role="listbox"
      tabIndex={effectiveFocusedIndex >= 0 ? -1 : 0}
      aria-multiselectable="true"
      aria-label="Available items"
      onKeyDown={onKeyDown}
      onFocus={(e) => {
        if (e.target === e.currentTarget && filteredItems.length > 0) {
          setFocusedIndex(0);
        }
      }}
    >
      {filteredItems.map((item, index) => (
        <ColorItem
          key={item.name}
          isFocused={effectiveFocusedIndex === index}
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

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
