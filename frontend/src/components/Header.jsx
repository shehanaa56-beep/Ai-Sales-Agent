import React from 'react';
import { Bell, LayoutPanelLeft, Menu, X } from 'lucide-react';

const Header = ({ title, subtitle, onMenuClick, isSidebarOpen }) => {
  return (
    <div className="h-20 bg-white border-b border-border-color flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-text-muted hover:text-brand-green transition-colors"
        >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="flex items-center gap-3 md:gap-4">
            <LayoutPanelLeft className="hidden sm:block w-5 h-5 text-text-main -mt-1.5" />
            <div className="flex flex-col">
                <h1 className="text-base md:text-lg font-semibold text-text-main m-0 leading-tight">{title}</h1>
                <p className="hidden xs:block text-[11px] md:text-[13px] text-text-muted m-0">{subtitle}</p>
            </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <button className="relative flex items-center justify-center text-text-muted hover:text-text-main transition-colors p-2">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-brand-green rounded-full border-[1.5px] border-white"></span>
        </button>
        <div className="w-8 h-8 md:w-9 md:h-9 bg-brand-green text-white rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-sm">
          A
        </div>
      </div>
    </div>
  );
};

export default Header;
