import React, { useState, useEffect, useRef } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Search,
  History,
  RefreshCw,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";

import { ScrollArea } from "../ui/scroll-area";
import SidepanelLayout from "./SidepanelLayout";

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export default function ShopifySearch() {
  const [storeName, setStoreName] = useState<string>("");
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTabId, setSearchTabId] = useState<number | null>(null);

  // Load store name and history
  useEffect(() => {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        ["scout_shopify_store", "scout_shopify_history"],
        (result) => {
          if (result.scout_shopify_store) {
            setStoreName(result.scout_shopify_store);
          }
          if (result.scout_shopify_history) {
            setHistory(result.scout_shopify_history);
          }
        }
      );
    }
  }, []);

  // Listen for messages from content script (URL updates)
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === "SHOPIFY_SEARCH_UPDATE") {
        if (message.data.storeName) {
          setStoreName(message.data.storeName);
          // Update storage if changed
          chrome.storage.local.get(["scout_shopify_store"], (res) => {
            if (res.scout_shopify_store !== message.data.storeName) {
              chrome.storage.local.set({
                scout_shopify_store: message.data.storeName,
              });
            }
          });
        }

        // Update query input to match page if it's different and not currently being edited?
        // Actually user wants "see the current query".
        // We should probably update it, but maybe be careful about overriding typing.
        // For now, let's update it.
        if (typeof message.data.query === "string") {
          setQuery(message.data.query);
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // Update context when switching tabs
  useEffect(() => {
    const handleTabChange = async () => {
      // Re-detect store and query from new active tab
      detectStore();

      // Try to parse query from current URL
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab?.url) {
          const u = new URL(tab.url);
          // Only update query if we are on a products page
          if (u.pathname.includes("/products")) {
            const q = u.searchParams.get("query");
            if (q !== null) setQuery(q);

            // Update tracked tab to the current one
            if (tab.id) setSearchTabId(tab.id);
          }
        }
      } catch (e) {
        // ignore
      }
    };

    chrome.tabs.onActivated.addListener(handleTabChange);
    return () => chrome.tabs.onActivated.removeListener(handleTabChange);
  }, []);

  const saveStoreName = (name: string) => {
    setStoreName(name);
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ scout_shopify_store: name });
    }
  };

  const addToHistory = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const newItem = { query: searchQuery, timestamp: Date.now() };
    const newHistory = [
      newItem,
      ...history.filter((h) => h.query !== searchQuery),
    ].slice(0, 20); // Keep last 20

    setHistory(newHistory);
    chrome.storage.local.set({ scout_shopify_history: newHistory });
  };

  const removeFromHistory = (e: React.MouseEvent, itemQuery: string) => {
    e.stopPropagation();
    const newHistory = history.filter((h) => h.query !== itemQuery);
    setHistory(newHistory);
    chrome.storage.local.set({ scout_shopify_history: newHistory });
  };

  const detectStore = async () => {
    setError(null);
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.url) throw new Error("No active tab found");

      const url = tab.url;
      const unifiedMatch = url.match(/admin\.shopify\.com\/store\/([^/?]+)/);
      if (unifiedMatch && unifiedMatch[1]) {
        saveStoreName(unifiedMatch[1]);
        return;
      }

      const legacyMatch = url.match(/([^/.]+)\.myshopify\.com/);
      if (legacyMatch && legacyMatch[1]) {
        saveStoreName(legacyMatch[1]);
        return;
      }

      throw new Error("Could not detect Shopify store from current URL.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const executeSearch = async (searchQuery: string) => {
    if (!storeName) {
      setError("Please configure a Shopify store first.");
      return;
    }

    setError(null);
    addToHistory(searchQuery);

    // Construct URL
    const url = `https://admin.shopify.com/store/${storeName}/products?query=${encodeURIComponent(
      searchQuery
    )}&order=inventory_total%20desc`;

    try {
      // Check if we have a tracked tab
      if (searchTabId) {
        try {
          const tab = await chrome.tabs.get(searchTabId);
          if (tab) {
            await chrome.tabs.update(searchTabId, { url, active: true });
            return;
          }
        } catch (e) {
          // Tab closed, create new
        }
      }

      // Check if current tab is a Shopify admin tab we can hijack
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (
        activeTab?.url &&
        activeTab.url.includes(`admin.shopify.com/store/${storeName}`)
      ) {
        await chrome.tabs.update(activeTab.id!, { url });
        setSearchTabId(activeTab.id!);
        return;
      }

      // Create new tab
      const tab = await chrome.tabs.create({ url, active: true });
      if (tab.id) {
        setSearchTabId(tab.id);
      }
    } catch (err: any) {
      setError("Failed to open search tab.");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  return (
    <SidepanelLayout title="Shopify Search">
      <div className="flex flex-col h-full gap-4 p-4">
        {/* Store Config */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
              <RefreshCw className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                Active Store
              </span>
              <span
                className="text-sm font-medium truncate max-w-[200px]"
                title={storeName}
              >
                {storeName || "Not Set"}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={detectStore}
            title="Detect store from current tab URL"
            className="h-8"
          >
            Detect
          </Button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800"
          />
          <Button type="submit" disabled={!storeName}>
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {error && (
          <div className="p-2 text-sm text-red-500 bg-red-50 rounded flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* History */}
        <div className="flex-1 flex flex-col min-h-0 pt-2">
          <div className="flex items-center gap-2 pb-3 text-sm text-muted-foreground font-medium">
            <History className="h-4 w-4" />
            Previous Searches
          </div>

          <ScrollArea className="flex-1 -mr-4 pr-4">
            <div className="space-y-2 pb-4">
              {history.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No search history yet.
                </div>
              ) : (
                history.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer group"
                    onClick={() => {
                      setQuery(item.query);
                      executeSearch(item.query);
                    }}
                  >
                    <span className="text-sm font-medium truncate">
                      {item.query}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-600"
                      onClick={(e) => removeFromHistory(e, item.query)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </SidepanelLayout>
  );
}
