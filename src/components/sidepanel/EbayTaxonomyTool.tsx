import React, { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Layers, Search, Copy, Check } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface EbaySuggestion {
  categoryId: string;
  categoryName: string;
  categoryPath: string;
}

export default function EbayTaxonomyTool() {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<EbaySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const q = search.trim();
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `https://paymore-extension.vercel.app/api/ebay-categories?q=${encodeURIComponent(
            q
          )}`
        );
        const data = await res.json().catch(() => ({}));
        // The CMDK version sliced to 1, but in sidepanel we might want more?
        // "we have it built into the command menu pop" - implying functionality is similar.
        // CMDK usually shows limited results. Let's show more here since it's a dedicated tool.
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error("Failed to fetch eBay suggestions:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const t = setTimeout(fetchSuggestions, 250);
    return () => clearTimeout(t);
  }, [search]);

  const copyCategory = async (categoryPath: string, categoryId: string) => {
    try {
      await navigator.clipboard.writeText(categoryPath);
      setCopiedId(categoryId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Failed to copy eBay category:", err);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search eBay categories..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && suggestions.length === 0 && search.length >= 2 && (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No categories found</p>
          </div>
        )}

        {!loading && suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((s) => (
              <Card
                key={s.categoryId}
                className="hover:bg-accent/50 transition-colors cursor-pointer group"
                onClick={() => copyCategory(s.categoryPath, s.categoryId)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="p-2 rounded bg-purple-100 text-purple-600">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {s.categoryName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.categoryPath}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedId === s.categoryId ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

