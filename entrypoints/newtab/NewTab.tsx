import React, { useState } from "react";
import { CMDKPalette } from "../../src/components/cmdk-palette/CMDKPalette";
import { Switch } from "../../src/components/ui/switch";
import { Label } from "../../src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../src/components/ui/select";
import "../../src/components/cmdk-palette/styles.css";

export default function NewTab() {
  const [activeMode, setActiveMode] = useState<"default" | "ebay" | "pricecharting">("default");
  const [ebayCondition, setEbayCondition] = useState("3000"); // Default to Used

  const handleEbayToggle = (checked: boolean) => {
    if (checked) {
      setActiveMode("ebay");
    } else {
      setActiveMode("default");
    }
  };

  const handlePriceChartingToggle = (checked: boolean) => {
    if (checked) {
      setActiveMode("pricecharting");
    } else {
      setActiveMode("default");
    }
  };

  const handleProviderChange = (providerId: string | null) => {
    if (providerId === "ebay") {
      setActiveMode("ebay");
    } else if (providerId === "pricecharting") {
      setActiveMode("pricecharting");
    } else {
      setActiveMode("default");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-6">
        {/* Toggles Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-start gap-6">
          <img
            src="/assets/icons/logo.png"
            alt="Logo"
            className="w-8 h-8 rounded-lg"
          />
          
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center space-x-2">
            <Switch
              id="pc-mode"
              checked={activeMode === "pricecharting"}
              onCheckedChange={handlePriceChartingToggle}
              className="data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="pc-mode" className="font-medium cursor-pointer">
              PriceCharting
            </Label>
          </div>

          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center space-x-2">
            <Switch
              id="ebay-mode"
              checked={activeMode === "ebay"}
              onCheckedChange={handleEbayToggle}
              className="data-[state=checked]:bg-green-600"
            />
            <Label htmlFor="ebay-mode" className="font-medium cursor-pointer">
              eBay Sold Listings
            </Label>
          </div>

          {activeMode === "ebay" && (
            <div className="ml-auto animate-in fade-in slide-in-from-left-4 duration-200">
              <Select value={ebayCondition} onValueChange={setEbayCondition}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">New</SelectItem>
                  <SelectItem value="3000">Used</SelectItem>
                  <SelectItem value="7000">Broken</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Command Menu Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden h-[600px] relative">
          <CMDKPalette
            isOpen={true}
            onClose={() => {}} // No-op for new tab, can't close
            embedded={true}
            defaultProviderId={activeMode === "default" ? undefined : activeMode}
            ebayCondition={activeMode === "ebay" ? ebayCondition : undefined}
            onProviderChange={handleProviderChange}
          />
        </div>
      </div>
    </div>
  );
}
