import React, { useState, useMemo, useCallback, useRef } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import debounce from 'lodash.debounce';
import EnhancedDroneCard from './EnhancedDroneCard';
import './VirtualizedDroneGrid.css';

const VirtualizedDroneGrid = ({
    drones,
    selectedDrones,
    onSelectDrone,
    onToggleEmergency,
    onDestroy,
    onRepair,
    ultimateHeadId,
    onBulkAction
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const gridRef = useRef();

    // Debounced search to improve performance
    const debouncedSearch = useCallback(
        debounce((term) => setSearchTerm(term), 300),
        []
    );

    // Filtered and sorted drones
    const processedDrones = useMemo(() => {
        let filtered = drones.filter(drone => {
            const matchesSearch = drone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                drone.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                drone.location.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesFilter = filterType === 'all' ||
                (filterType === 'active' && drone.status === 'Active') ||
                (filterType === 'destroyed' && drone.status === 'Destroyed') ||
                (filterType === 'emergency' && drone.emergencyActive) ||
                (filterType === drone.type.toLowerCase().replace(' ', '-'));

            return matchesSearch && matchesFilter;
        });

        // Sort drones
        filtered.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        return filtered;
    }, [drones, searchTerm, filterType, sortBy, sortOrder]);

    // Calculate grid dimensions
    const getGridDimensions = (width, height) => {
        const cardWidth = 320;
        const cardHeight = 300;
        const columnsCount = Math.floor(width / cardWidth) || 1;
        const rowsCount = Math.ceil(processedDrones.length / columnsCount);

        return { columnsCount, rowsCount, cardWidth, cardHeight };
    };

    // Grid cell renderer
    const Cell = useCallback(({ columnIndex, rowIndex, style, data }) => {
        const { columnsCount, drones: cellDrones } = data;
        const index = rowIndex * columnsCount + columnIndex;
        const drone = cellDrones[index];

        if (!drone) return null;

        return (
            <div style={style}>
                <EnhancedDroneCard
                    drone={drone}
                    isSelected={selectedDrones.includes(drone.id)}
                    onSelect={onSelectDrone}
                    onToggleEmergency={onToggleEmergency}
                    onDestroy={onDestroy}
                    onRepair={onRepair}
                    isUltimateHead={drone.id === ultimateHeadId}
                    index={index}
                />
            </div>
        );
    }, [selectedDrones, onSelectDrone, onToggleEmergency, onDestroy, onRepair, ultimateHeadId]);

    // Bulk selection handlers
    const handleSelectAll = useCallback(() => {
        const allIds = processedDrones.map(drone => drone.id);
        onBulkAction('select', allIds);
    }, [processedDrones, onBulkAction]);

    const handleDeselectAll = useCallback(() => {
        onBulkAction('deselect', []);
    }, [onBulkAction]);

    const handleBulkEmergency = useCallback(() => {
        onBulkAction('emergency', selectedDrones);
    }, [selectedDrones, onBulkAction]);

    const handleBulkDestroy = useCallback(() => {
        onBulkAction('destroy', selectedDrones);
    }, [selectedDrones, onBulkAction]);

    // Keyboard shortcuts
    useHotkeys('ctrl+a', (e) => {
        e.preventDefault();
        handleSelectAll();
    });

    useHotkeys('escape', () => {
        handleDeselectAll();
        setIsMultiSelectMode(false);
    });

    useHotkeys('ctrl+f', (e) => {
        e.preventDefault();
        document.getElementById('drone-search').focus();
    });

    useHotkeys('delete', () => {
        if (selectedDrones.length > 0) {
            handleBulkDestroy();
        }
    });

    // Filter options
    const filterOptions = [
        { value: 'all', label: 'All Drones' },
        { value: 'active', label: 'Active' },
        { value: 'destroyed', label: 'Destroyed' },
        { value: 'emergency', label: 'Emergency' },
        { value: 'reconnaissance', label: 'Reconnaissance' },
        { value: 'combat', label: 'Combat' },
        { value: 'surveillance', label: 'Surveillance' },
        { value: 'heavy-combat', label: 'Heavy Combat' },
        { value: 'stealth', label: 'Stealth' },
        { value: 'multi-role', label: 'Multi-Role' }
    ];

    const sortOptions = [
        { value: 'name', label: 'Name' },
        { value: 'battery', label: 'Battery' },
        { value: 'altitude', label: 'Altitude' },
        { value: 'speed', label: 'Speed' },
        { value: 'threatLevel', label: 'Threat Level' }
    ];

    return (
        <div className="virtualized-drone-grid">
            {/* Header Controls */}
            <motion.div
                className="grid-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="search-controls">
                    <div className="search-input-wrapper">
                        <input
                            id="drone-search"
                            type="text"
                            placeholder="Search drones... (Ctrl+F)"
                            onChange={(e) => debouncedSearch(e.target.value)}
                            className="search-input"
                        />
                        <span className="search-icon">🔍</span>
                    </div>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="filter-select"
                    >
                        {filterOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <div className="sort-controls">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-select"
                        >
                            {sortOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    Sort by {option.label}
                                </option>
                            ))}
                        </select>

                        <motion.button
                            className={`sort-order-btn ${sortOrder}`}
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </motion.button>
                    </div>
                </div>

                <div className="bulk-controls">
                    <div className="selection-info">
                        <span className="drone-count">
                            {processedDrones.length} of {drones.length} drones
                        </span>
                        {selectedDrones.length > 0 && (
                            <span className="selected-count">
                                {selectedDrones.length} selected
                            </span>
                        )}
                    </div>

                    <AnimatePresence>
                        {selectedDrones.length > 0 && (
                            <motion.div
                                className="bulk-actions"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <motion.button
                                    className="bulk-btn emergency"
                                    onClick={handleBulkEmergency}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    🚨 Emergency ({selectedDrones.length})
                                </motion.button>

                                <motion.button
                                    className="bulk-btn destroy"
                                    onClick={handleBulkDestroy}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    💥 Destroy ({selectedDrones.length})
                                </motion.button>

                                <motion.button
                                    className="bulk-btn deselect"
                                    onClick={handleDeselectAll}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    ✕ Deselect All
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button
                        className="select-all-btn"
                        onClick={handleSelectAll}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Select All (Ctrl+A)
                    </motion.button>
                </div>
            </motion.div>

            {/* Virtualized Grid */}
            <div className="grid-container">
                <AutoSizer>
                    {({ height, width }) => {
                        const { columnsCount, rowsCount, cardHeight } = getGridDimensions(width, height);

                        return (
                            <Grid
                                ref={gridRef}
                                columnCount={columnsCount}
                                columnWidth={width / columnsCount}
                                height={height}
                                rowCount={rowsCount}
                                rowHeight={cardHeight}
                                width={width}
                                itemData={{
                                    columnsCount,
                                    drones: processedDrones
                                }}
                                overscanRowCount={2}
                                overscanColumnCount={1}
                            >
                                {Cell}
                            </Grid>
                        );
                    }}
                </AutoSizer>
            </div>

            {/* Keyboard Shortcuts Help */}
            <motion.div
                className="keyboard-shortcuts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 1, duration: 0.5 }}
            >
                <div className="shortcut">Ctrl+A: Select All</div>
                <div className="shortcut">Ctrl+F: Search</div>
                <div className="shortcut">Esc: Deselect</div>
                <div className="shortcut">Del: Destroy Selected</div>
            </motion.div>
        </div>
    );
};

export default VirtualizedDroneGrid;
