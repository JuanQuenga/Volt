import React, { useState, useEffect, useRef } from "react";
import SidepanelLayout from "./SidepanelLayout";
import { MousePointerClick, RefreshCcw, X, ExternalLink, Loader2, Trash2, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

interface PriceChartingItem {
  id: string;
  title: string;
  console: string;
  price: number;
  condition: string; // 'loose', 'cib', 'new'
  url: string;
}

export default function PriceChartingTool() {
  const [query, setQuery] = useState("");
  const [savedItems, setSavedItems] = useState<PriceChartingItem[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstRender = useRef(true);

  // Load saved items on mount
  useEffect(() => {
    const saved = localStorage.getItem("scout_saved_pricecharting_lot");
    if (saved) {
      try {
        setSavedItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved lot", e);
      }
    }

    const handleMessage = (message: any) => {
      if (message.type === "PC_ITEM_SELECTED" && message.data) {
        setSavedItems((prev) => {
          const newItems = [...prev, message.data];
          localStorage.setItem("scout_saved_pricecharting_lot", JSON.stringify(newItems));
          return newItems;
        });
        // Don't turn off selecting automatically to allow multiple picks? 
        // Or turn off? User wants to "pin/save games together". 
        // Maybe keep it on or offer a toggle. For now, let's keep it on until they manually stop or we can add a "Finish" button.
        // Actually, Ebay tool turns it off. Let's turn it off for now to be safe, or maybe keep it on for "lot building".
        // Let's keep it on! But we need a way to stop.
        // Actually, let's just notify and stay in selection mode.
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const findPriceChartingTabId = async () => {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id && activeTab.url?.includes("pricecharting.com")) {
      return activeTab.id;
    }

    const pcTabs = await chrome.tabs.query({});
    const fallbackTab = pcTabs.find(
      (tab) => tab.id !== undefined && tab.url?.includes("pricecharting.com")
    );
    if (fallbackTab?.id) {
      return fallbackTab.id;
    }

    throw new Error("Open a PriceCharting tab to control it from the sidepanel.");
  };

  const buildPriceChartingUrl = () => {
    const baseUrl = "https://www.pricecharting.com/search-products";
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    params.append("type", "videogames");
    return `${baseUrl}?${params.toString()}`;
  };

  const handleSearch = async () => {
    setError(null);
    setIsNavigating(true);
    try {
      const url = buildPriceChartingUrl();
      let tabId: number;
      try {
         tabId = await findPriceChartingTabId();
         await chrome.tabs.update(tabId, { url });
      } catch (e) {
         // If no tab found, create one
         const tab = await chrome.tabs.create({ url });
         // We can't update it immediately if it's new, but it's already navigating.
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update PriceCharting tab");
    } finally {
      setIsNavigating(false);
    }
  };

  const enableSelectionMode = async () => {
    if (isSelecting) {
        setIsSelecting(false);
        // TODO: Send message to cleanup? Or just rely on page refresh. 
        // For now, we re-inject cleanup logic if we can, or just let it be.
        // Since we can't easily "un-inject" listeners without keeping track in content script, 
        // we might just reload the page or inject a cleanup script.
        try {
            const tabId = await findPriceChartingTabId();
            await chrome.scripting.executeScript({
                target: { tabId },
                func: () => {
                    document.body.classList.remove('scout-pc-selection-mode');
                    // Remove our style
                    const style = document.getElementById('scout-pc-select-style');
                    if (style) style.remove();
                    // We can't easily remove anonymous event listeners. 
                    // Usually we'd reload or use a named function in a content script context.
                    // For simplicity, we might just leave them or rely on page navigation.
                }
            });
        } catch(e) {}
        return;
    }

    setIsSelecting(true);
    setError(null);
    try {
      const tabId = await findPriceChartingTabId();
      await chrome.scripting.executeScript({
        target: { tabId },
        func: injectSelectionScript,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to enable selection mode");
      setIsSelecting(false);
    }
  };

  // Injected script
  const injectSelectionScript = () => {
    const styleId = "scout-pc-select-style";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            .scout-selectable-row {
                cursor: copy !important;
                position: relative;
            }
            .scout-selectable-row:hover {
                background-color: rgba(34, 197, 94, 0.1) !important;
            }
            /* Highlight specific price cells on hover */
            .scout-selectable-row td.price:hover {
                background-color: rgba(34, 197, 94, 0.3) !important;
                outline: 2px solid #22c55e !important;
                cursor: pointer;
                position: relative;
            }
            /* Tooltip for price cells */
            .scout-selectable-row td.price:hover::after {
                content: attr(data-condition);
                position: absolute;
                z-index: 100;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: #22c55e;
                color: white;
                padding: 2px 6px;
                font-size: 10px;
                border-radius: 4px;
                pointer-events: none;
                white-space: nowrap;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
        `;
        document.head.appendChild(style);
    }

    document.body.classList.add('scout-pc-selection-mode');

    // PriceCharting tables
    // Search results: #games_table tr
    const rows = document.querySelectorAll("table#games_table tr");
    
    const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const row = e.currentTarget as HTMLTableRowElement;
        const titleEl = row.querySelector(".title a");
        const consoleEl = row.querySelector(".console");
        
        // Determine clicked element
        const target = e.target as HTMLElement;
        const clickedCell = target.closest("td");
        
        // Parse a price string like "$12.50"
        const parsePrice = (str: string) => {
            const match = str.match(/[\\d,.]+/);
            return match ? parseFloat(match[0].replace(/,/g, "")) : 0;
        };

        let price = 0;
        let condition = 'loose';

        // Check if a specific price cell was clicked
        if (clickedCell) {
            if (clickedCell.classList.contains("used_price")) {
                condition = 'loose';
                price = parsePrice(clickedCell.textContent || "");
            } else if (clickedCell.classList.contains("cib_price")) {
                condition = 'cib';
                price = parsePrice(clickedCell.textContent || "");
            } else if (clickedCell.classList.contains("new_price")) {
                condition = 'new';
                price = parsePrice(clickedCell.textContent || "");
            }
        }

        // If no valid price found from specific click (or clicked 0), fallback to default heuristic
        if (price === 0) {
             const priceCells = row.querySelectorAll("td.price");
             // Default to loose if available, else CIB, else New
             if (priceCells.length > 0) {
                // First price column is typically Loose/Used
                const p1Text = row.querySelector("td.used_price")?.textContent || priceCells[0].textContent || "";
                const p1 = parsePrice(p1Text);
                
                if (p1 > 0) {
                    price = p1;
                    condition = 'loose';
                } else {
                    // Try CIB
                    const p2Text = row.querySelector("td.cib_price")?.textContent || (priceCells.length > 1 ? priceCells[1].textContent : "") || "";
                    const p2 = parsePrice(p2Text);
                    if (p2 > 0) {
                        price = p2;
                        condition = 'cib';
                    } else {
                        // Try New
                        const p3Text = row.querySelector("td.new_price")?.textContent || (priceCells.length > 2 ? priceCells[2].textContent : "") || "";
                        const p3 = parsePrice(p3Text);
                        if (p3 > 0) {
                            price = p3;
                            condition = 'new';
                        }
                    }
                }
            }
        }

        if (titleEl) {
            const data = {
                id: Math.random().toString(36).substring(7),
                title: titleEl.textContent?.trim() || "Unknown",
                console: consoleEl?.textContent?.trim() || "",
                price,
                condition,
                url: (titleEl as HTMLAnchorElement).href
            };
            
            chrome.runtime.sendMessage({ type: "PC_ITEM_SELECTED", data });
            
            // Visual feedback
            const originalBg = row.style.backgroundColor;
            row.style.backgroundColor = "#dcfce7"; // light green
            setTimeout(() => {
                row.style.backgroundColor = originalBg;
            }, 500);
        }
    };

    rows.forEach(row => {
        // Skip header
        if (row.querySelector("th")) return;
        
        row.classList.add("scout-selectable-row");
        
        // Add data-condition attributes for the CSS tooltip
        const used = row.querySelector("td.used_price");
        if (used) used.setAttribute("data-condition", "Loose");
        
        const cib = row.querySelector("td.cib_price");
        if (cib) cib.setAttribute("data-condition", "CIB");
        
        const newItem = row.querySelector("td.new_price");
        if (newItem) newItem.setAttribute("data-condition", "New");
        
        // Remove old listener to avoid dupes if re-run
        row.removeEventListener("click", handleClick as any, true);
        row.addEventListener("click", handleClick as any, true);
    });
  };

  const removeItem = (id: string) => {
    setSavedItems(prev => {
        const next = prev.filter(item => item.id !== id);
        localStorage.setItem("scout_saved_pricecharting_lot", JSON.stringify(next));
        return next;
    });
  };

  const clearAll = () => {
    if (confirm("Clear all saved items?")) {
        setSavedItems([]);
        localStorage.removeItem("scout_saved_pricecharting_lot");
    }
  };

  const getItemPrice = (item: PriceChartingItem) => {
    const value = typeof item.price === "number" ? item.price : Number(item.price);
    return Number.isFinite(value) ? value : 0;
  };

  const totalValue = savedItems.reduce((acc, item) => acc + getItemPrice(item), 0);

  return (
    <SidepanelLayout className="h-full flex flex-col">
      <div className="p-4 space-y-4 border-b bg-background z-10">
        <div className="flex gap-2">
          <Input
            placeholder="Search games..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <Button
            onClick={handleSearch}
            disabled={isNavigating}
            size="icon"
            title="Search on PriceCharting"
          >
            {isNavigating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          </Button>
        </div>

        <Button 
          variant={isSelecting ? "destructive" : "default"}
          className="w-full" 
          onClick={enableSelectionMode}
        >
          {isSelecting ? (
            <>
                Stop Selecting
                <X className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
                Select Games to Add
                <MousePointerClick className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        
        {isSelecting && (
             <div className="text-xs text-muted-foreground text-center animate-pulse">
                 Click on any game row in PriceCharting to add it.
             </div>
        )}

        {error && <div className="text-xs text-destructive">{error}</div>}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between p-4 pb-2">
            <h3 className="font-semibold text-sm">Lot Items ({savedItems.length})</h3>
            {savedItems.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 px-2 text-destructive hover:text-destructive">
                    Clear All
                </Button>
            )}
        </div>

        <ScrollArea className="flex-1 px-4">
            <div className="space-y-3 pb-4">
                {savedItems.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8 text-sm">
                        No games added yet.
                    </div>
                ) : (
                    savedItems.map((item, i) => (
                        <Card key={item.id} className="p-3 relative group">
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                    <a href={item.url} target="_blank" rel="noreferrer" className="font-medium text-sm hover:underline line-clamp-2 block" title={item.title}>
                                        {item.title}
                                    </a>
                                    <div className="text-xs text-muted-foreground">
                                        {item.console} • {item.condition}
                                    </div>
                                </div>
                                <div className="font-bold text-sm">
                                    ${getItemPrice(item).toFixed(2)}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background shadow-sm border opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeItem(item.id)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Card>
                    ))
                )}
            </div>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/20">
            <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Total Value</span>
                <span className="font-bold text-lg text-green-600">${totalValue.toFixed(2)}</span>
            </div>
        </div>
      </div>
    </SidepanelLayout>
  );
}
