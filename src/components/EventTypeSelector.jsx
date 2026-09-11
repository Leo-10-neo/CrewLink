import { useState } from 'react';
import { EVENT_TYPES, getEventTypeColorClass } from '../constants/eventTypes';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

const EventTypeSelector = ({ selectedTypes, onChange, maxSelection = 5, showAll = false }) => {
  const [showMore, setShowMore] = useState(showAll);
  const displayTypes = showMore ? EVENT_TYPES : EVENT_TYPES.slice(0, 8);

  const toggleEventType = (typeId) => {
    if (selectedTypes.includes(typeId)) {
      onChange(selectedTypes.filter(id => id !== typeId));
    } else if (selectedTypes.length < maxSelection) {
      onChange([...selectedTypes, typeId]);
    }
  };

  const remainingCount = EVENT_TYPES.length - 8;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {displayTypes.map((type) => {
          const isSelected = selectedTypes.includes(type.id);
          const colorClass = getEventTypeColorClass(type.color);
          
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => toggleEventType(type.id)}
              disabled={!isSelected && selectedTypes.length >= maxSelection}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                isSelected
                  ? `${colorClass} border-current`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } ${!isSelected && selectedTypes.length >= maxSelection ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{type.emoji}</span>
                {isSelected && (
                  <div className="w-5 h-5 bg-current rounded-full flex items-center justify-center">
                    <Check className="text-white" size={12} />
                  </div>
                )}
              </div>
              <p className="font-medium text-sm text-gray-900 mb-1">
                {type.name}
              </p>
              <p className="text-xs text-gray-600 line-clamp-2">
                {type.description}
              </p>
            </button>
          );
        })}
      </div>

      {!showAll && remainingCount > 0 && (
        <button
          type="button"
          onClick={() => setShowMore(true)}
          className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
        >
          <span>Show {remainingCount} more event types</span>
          <ChevronDown size={16} />
        </button>
      )}

      {showMore && (
        <button
          type="button"
          onClick={() => setShowMore(false)}
          className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
        >
          <span>Show less</span>
          <ChevronUp size={16} />
        </button>
      )}

      {selectedTypes.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {selectedTypes.length} of {maxSelection} selected
          </span>
          {selectedTypes.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EventTypeSelector;
