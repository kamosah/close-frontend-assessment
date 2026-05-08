import React, { useCallback } from "react";
import "./App.css";
const { useState, useMemo, createContext, useContext } = React;

// Implement a feature to allow item selection with the following requirements:
// 1. Clicking an item selects/unselects it.
// 2. Multiple items can be selected at a time.
// 3. Make sure to avoid unnecessary re-renders of each list item in the big list (performance).
// 4. Currently selected items should be visually highlighted.
// 5. Currently selected items' names should be shown at the top of the page.
// Feel free to change the component structure at will.

const sizes = ["tiny", "small", "medium", "large", "huge"];
const colors = [
  "navy",
  "blue",
  "aqua",
  "teal",
  "olive",
  "green",
  "lime",
  "yellow",
  "orange",
  "red",
  "maroon",
  "fuchsia",
  "purple",
  "silver",
  "gray",
  "black",
];
const fruits = [
  "apple",
  "banana",
  "watermelon",
  "orange",
  "peach",
  "tangerine",
  "pear",
  "kiwi",
  "mango",
  "pineapple",
];

interface Item {
  name: string;
  color: string;
}

const ITEMS: Item[] = sizes.reduce(
  (items, size) => [
    ...items,
    ...fruits.reduce(
      (acc, fruit) => [
        ...acc,
        ...colors.reduce(
          (acc, color) => [
            ...acc,
            {
              name: `${size} ${color} ${fruit}`,
              color,
            },
          ],
          [],
        ),
      ],
      [],
    ),
  ],
  [],
);

interface ItemsContextValue {
  colorFilters: Set<string>;
  items: Item[];
  onSearchQueryChange: (query: string) => void;
  onToggleColorFilter: (color: string) => void;
  onToggleItemSelected: (itemKey: string) => void;
  searchQuery: string;
  selectedItems: Item[];
  selectedItemsKeys: Set<string>;
  filteredItems: Item[];
}

const ItemsContext = createContext<ItemsContextValue>({
  colorFilters: new Set(),
  items: [],
  onSearchQueryChange: () => {},
  onToggleColorFilter: () => {},
  onToggleItemSelected: () => {},
  searchQuery: "",
  selectedItems: [],
  selectedItemsKeys: new Set(),
  filteredItems: [],
} as ItemsContextValue);

const ItemsProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedItemsKeys, setSelectedItemsKeys] = useState<Set<string>>(
    new Set(),
  );
  const [colorFilters, setColorFilters] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>("");

  const onSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const selectedItems = useMemo(() => {
    return ITEMS.filter((item) => selectedItemsKeys.has(item.name));
  }, [selectedItemsKeys]);

  const filteredItems = useMemo(() => {
    return ITEMS.filter((item) => {
      const matchesSearchQuery = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesColorFilter =
        colorFilters.size === 0 || colorFilters.has(item.color);
      return matchesSearchQuery && matchesColorFilter;
    });
  }, [searchQuery, colorFilters]);

  const onToggleColorFilter = useCallback(
    (color: string) => {
      const updatedColorFilters = new Set(Array.from(colorFilters));
      if (!updatedColorFilters.has(color)) {
        updatedColorFilters.add(color);
      } else {
        updatedColorFilters.delete(color);
      }
      setColorFilters(updatedColorFilters);
    },
    [colorFilters],
  );

  const onToggleItemSelected = useCallback(
    (itemKey: string) => {
      const updatedSelectedItems = new Set(Array.from(selectedItemsKeys));
      if (!updatedSelectedItems.has(itemKey)) {
        updatedSelectedItems.add(itemKey);
      } else {
        updatedSelectedItems.delete(itemKey);
      }
      setSelectedItemsKeys(updatedSelectedItems);
    },
    [selectedItemsKeys],
  );

  const value = useMemo(
    () => ({
      colorFilters,
      items: ITEMS,
      onSearchQueryChange,
      onToggleColorFilter,
      onToggleItemSelected,
      searchQuery,
      selectedItems,
      selectedItemsKeys,
      filteredItems,
    }),
    [
      colorFilters,
      onSearchQueryChange,
      onToggleColorFilter,
      onToggleItemSelected,
      searchQuery,
      selectedItems,
      selectedItemsKeys,
      filteredItems,
    ],
  );
  return (
    <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>
  );
};

const useItems = () => {
  const value = useContext(ItemsContext);
  return value;
};

interface SideRailItemProps {
  item: Item;
  onClick: (itemKey: string) => void;
  icon: React.ReactNode;
}

const SideRailItem = ({ item, onClick, icon }: SideRailItemProps) => {
  return (
    <li
      className={`SideRail__item SideRail__item--${item.color}`}
      onClick={() => onClick(item.name)}
    >
      <span
        className={`SideRail__item__Color SideRail__item__Color--${item.color}`}
        data-color={item.color}
        aria-hidden="true"
      />
      {item.name}
      <button
        className="SideRail__item__IconButton"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick(item.name);
        }}
      >
        {icon}
      </button>
    </li>
  );
};

const CloseIcon = () => (
  <div className="CloseIcon" aria-hidden="true">
    <div className="CloseIcon__Line CloseIcon__Line--1" />
    <div className="CloseIcon__Line CloseIcon__Line--2" />
  </div>
);

const SideRail = () => {
  const { selectedItems, onToggleItemSelected } = useItems();
  return (
    <aside className="SideRail">
      <div className="SideRail__Header">
        <div className="SideRail__SelectedCount__Container">
          <span className="SideRail__SelectedCount__prefix">
            Your selection
          </span>
          <span
            className={`SideRail__SelectedCount__badge ${selectedItems.length === 0 ? " SideRail__SelectedCount__badge--empty" : ""}`}
          >
            {selectedItems.length}
          </span>
        </div>
        <p className="caption">{`${selectedItems.length > 0 ? selectedItems.length : "No"} items selected`}</p>
      </div>
      <ul className="SideRail__List">
        {selectedItems.map((item) => (
          <SideRailItem
            key={item.name}
            item={item}
            onClick={() => onToggleItemSelected(item.name)}
            icon={<CloseIcon />}
          />
        ))}
      </ul>
    </aside>
  );
};

const Container = ({ children }: { children: React.ReactNode }) => {
  return <div className="Container">{children}</div>;
};

interface ColorBadgeProps {
  color: string;
  isSelected?: boolean;
  onClick: (color: string) => void;
}

const ColorBadge = ({ color, isSelected, onClick }: ColorBadgeProps) => {
  return (
    <button
      className={`ColorBadge ColorBadge--${color} ${isSelected ? "ColorBadge--selected" : ""}`}
      onClick={() => onClick(color)}
    >
      <span className="ColorBadge__Circle" data-color={color} />
      {color[0].toUpperCase() + color.slice(1)}
    </button>
  );
};

const Toolbar = () => {
  // TODO: implement search and color filters here
  const {
    filteredItems,
    colorFilters,
    onSearchQueryChange,
    onToggleColorFilter,
  } = useItems();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchQueryChange(e.target.value);
  };
  return (
    <div className="Toolbar">
      <div className="Toolbar__Search_Panel">
        <input
          className="Toolbar__Search_Input"
          type="search"
          placeholder="Search items..."
          onChange={handleChange}
        />
        <span className="Toolbar__FiltersLabel">
          {/* TODO: implement selected count and filtered total */}
          Showing <b>{filteredItems.length}</b> of {ITEMS.length}
        </span>
      </div>
      <div className="Toolbar__Filters_Panel">
        <label className="Toolbar__Filter__Label">COLOR</label>
        <div className="Toolbar__Filter_Options">
          {colors.map((color) => (
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

const CheckboxIcon = ({ isChecked }: { isChecked: boolean }) => {
  return (
    <div
      className={`Checkbox__Box ${isChecked ? "Checkbox__Box--checked" : ""}`}
      aria-hidden="true"
    >
      <div className={`${isChecked ? "Checkbox__Checkmark" : ""}`} />
    </div>
  );
};

interface ColorItemProps extends Item {
  isFocused: boolean;
  onToggle: (name: string) => void;
  isSelected: boolean;
}

const ColorItem = ({
  color,
  name,
  isFocused,
  isSelected,
  onToggle,
}: ColorItemProps) => {
  const [size, _, fruit] = name.split(" ");
  return (
    <div
      tabIndex={isFocused ? 0 : -1}
      className={`ColorItem ColorItem--${color} ${isFocused ? "ColorItem--focused" : ""} ${isSelected ? "ColorItem--selected" : ""}`}
      role="option"
      aria-selected={isSelected}
      onClick={() => onToggle(name)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onToggle(name);
        }
      }}
    >
      <div className="ColorItem__Content">
        <span
          className={`ColorItem__Color ColorItem__Color--${color}`}
          data-color={color}
          aria-hidden="true"
        />
        <div className="ColorItem__Info">
          <span className={`ColorItem__Size ColorItem__Size--${size}`}>
            {size.toUpperCase()}
          </span>
          <span className={`ColorItem__Name ColorItem__Name--${color}`}>
            {color[0].toUpperCase() + color.slice(1)}{" "}
            {fruit[0].toUpperCase() + fruit.slice(1)}
          </span>
        </div>
      </div>
      <CheckboxIcon isChecked={isSelected} />
    </div>
  );
};

const ItemsList = () => {
  const {
    searchQuery,
    colorFilters,
    items,
    onToggleItemSelected,
    selectedItemsKeys,
    filteredItems,
  } = useItems();
  const [focusedItemName, setFocusedItemName] = useState<string | null>(null);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = items.findIndex((i) => i.name === focusedItemName);
    if (items.length === 0) return;

    switch (e.key) {
      case "ArrowRight":
        break;
      case "ArrowLeft":
        break;
      case "ArrowDown":
        break;
      case "ArrowUp":
        break;
      case "Home":
        break;
      case "End":
        break;
      case "PageDown":
        break;
      case "PageUp":
        break;
      case " ":
      case "Enter": {
        break;
      }
      case "Escape":
        break;
    }
  };
  // TODO: implement color selectors
  return (
    <div
      className="ItemsList"
      role="listbox"
      aria-multiselectable="true"
      aria-label="Available items"
      onKeyDown={onKeyDown}
    >
      {filteredItems.map((item) => (
        <ColorItem
          key={item.name}
          onToggle={onToggleItemSelected}
          isFocused={focusedItemName === item.name}
          isSelected={selectedItemsKeys.has(item.name)}
          {...item}
        />
      ))}
    </div>
  );
};

const Main = () => {
  return (
    <main className="Main">
      <Toolbar />
      <ItemsList />
    </main>
  );
};

const App = () => {
  return (
    <ItemsProvider>
      <Container>
        <SideRail />
        <Main />
      </Container>
    </ItemsProvider>
  );
};

// ---------------------------------------
// Do NOT change anything below this line.
// ---------------------------------------

// const sizes = ["tiny", "small", "medium", "large", "huge"];
// const colors = [
//   "navy",
//   "blue",
//   "aqua",
//   "teal",
//   "olive",
//   "green",
//   "lime",
//   "yellow",
//   "orange",
//   "red",
//   "maroon",
//   "fuchsia",
//   "purple",
//   "silver",
//   "gray",
//   "black",
// ];
// const fruits = [
//   "apple",
//   "banana",
//   "watermelon",
//   "orange",
//   "peach",
//   "tangerine",
//   "pear",
//   "kiwi",
//   "mango",
//   "pineapple",
// ];

// const items = sizes.reduce(
//   (items, size) => [
//     ...items,
//     ...fruits.reduce(
//       (acc, fruit) => [
//         ...acc,
//         ...colors.reduce(
//           (acc, color) => [
//             ...acc,
//             {
//               name: `${size} ${color} ${fruit}`,
//               color,
//             },
//           ],
//           [],
//         ),
//       ],
//       [],
//     ),
//   ],
//   [],
// );

// const root = ReactDOM.createRoot(document.getElementById("root"));
// root.render(<Dashboard />);

export default App;
