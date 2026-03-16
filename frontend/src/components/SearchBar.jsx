import React from 'react';
import { Search, Filter } from 'lucide-react';

const SearchBar = ({ searchQuery, onSearchChange, filterPriority, onFilterChange }) => {
  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => onSearchChange('')}>×</button>
        )}
      </div>
      <div className="filter-group">
        <Filter size={14} />
        <select
          value={filterPriority}
          onChange={(e) => onFilterChange(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Priorities</option>
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
      </div>
    </div>
  );
};

export default SearchBar;
