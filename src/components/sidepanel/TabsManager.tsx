/// <reference types="chrome" />
import React, { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils";

interface Tab {
  id?: number;
  title?: string;
  favIconUrl?: string;
  active: boolean;
  url?: string;
}

export default function TabsManager() {
  const [tabs, setTabs] = useState<Tab[]>([]);

  const fetchTabs = () => {
    chrome.tabs.query({ currentWindow: true }, (result) => {
      setTabs(result);
    });
  };

  useEffect(() => {
    fetchTabs();

    const handleTabCreated = () => fetchTabs();
    const handleTabUpdated = (_tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (changeInfo.status === 'complete' || changeInfo.title || changeInfo.favIconUrl) {
        fetchTabs();
      }
    };
    const handleTabRemoved = () => fetchTabs();
    const handleTabActivated = () => fetchTabs();

    chrome.tabs.onCreated.addListener(handleTabCreated);
    chrome.tabs.onUpdated.addListener(handleTabUpdated);
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    chrome.tabs.onActivated.addListener(handleTabActivated);

    return () => {
      chrome.tabs.onCreated.removeListener(handleTabCreated);
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
      chrome.tabs.onRemoved.removeListener(handleTabRemoved);
      chrome.tabs.onActivated.removeListener(handleTabActivated);
    };
  }, []);

  const activateTab = (tabId?: number) => {
    if (tabId) {
      chrome.tabs.update(tabId, { active: true });
    }
  };

  const closeTab = (e: React.MouseEvent, tabId?: number) => {
    e.stopPropagation();
    if (tabId) {
      chrome.tabs.remove(tabId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Open Tabs ({tabs.length})</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => activateTab(tab.id)}
            className={cn(
              "group flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors text-sm",
              tab.active
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
            )}
          >
            {tab.favIconUrl ? (
              <img
                src={tab.favIconUrl}
                alt=""
                className="w-4 h-4 flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-50" />
            )}
            
            <span className="flex-1 truncate" title={tab.title}>
              {tab.title || "Untitled Tab"}
            </span>

            <button
              onClick={(e) => closeTab(e, tab.id)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background/50 rounded-full transition-all"
              title="Close tab"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
