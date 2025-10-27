import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import { ChevronDown } from 'lucide-react';

const CollapsibleSection = ({ title, isOpen, onToggle, children }) => {
  const nodeRef = useRef(null);

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center p-4 text-left"
      >
        <span className="font-semibold text-gray-900">{title}</span>
        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <CSSTransition
        in={isOpen}
        timeout={300}
        classNames="collapse"
        unmountOnExit
        nodeRef={nodeRef}
      >
        <div ref={nodeRef}>
          <div className="p-4 border-t">
            {children}
          </div>
        </div>
      </CSSTransition>
    </div>
  );
};

export default CollapsibleSection;
