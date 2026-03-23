import React from 'react';
import { Bell, LayoutPanelLeft } from 'lucide-react';

const Header = ({ title, subtitle }) => {
  return (
    <div className="h-20 bg-white border-b border-border-color flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-4">
        <LayoutPanelLeft className="w-5 h-5 text-text-main -mt-1.5" />
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-text-main m-0 leading-tight">{title}</h1>
          <p className="text-[13px] text-text-muted m-0">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <button className="relative flex items-center justify-center text-text-muted hover:text-text-main transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-[1px] -right-[1px] w-2 h-2 bg-brand-green rounded-full border-[1.5px] border-white ring-0"></span>
        </button>
        <div className="w-8 h-8 bg-brand-green text-white rounded-full flex items-center justify-center font-semibold text-sm">
          A
        </div>
      </div>
    </div>
  );
};

export default Header;
