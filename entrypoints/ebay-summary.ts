// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
/* global window, document */

import { defineContentScript } from "wxt/utils/define-content-script";
import {
  triggerSidepanelToolFromContentScript,
  isSidePanelApiAvailable,
  initializeSidePanelContext,
} from "../src/lib/sidepanel-gesture";

/**
 * Adds an inline summary to eBay search result pages showing
 * the current search context (Sold vs Active, Condition).
 *
 * This script runs on eBay search pages (https://www.ebay.com/sch/*).
 */
export default defineContentScript({
  matches: ["https://www.ebay.com/sch/*"],
  runAt: "document_idle",
  allFrames: false,
  main() {
    // Early safety check: ensure we're on an eBay search page
    if (
      !window.location.hostname.includes("ebay.com") ||
      !window.location.pathname.startsWith("/sch/")
    ) {
      console.log("⚡ [Volt eBay Summary] Not on eBay search page, exiting");
      return;
    }

    // Initialize side panel context early
    initializeSidePanelContext();

    console.log("⚡ [Volt eBay Summary] SCRIPT LOADED");

    const SUMMARY_ID = "volt-ebay-summary";
    const STYLE_ID = "volt-ebay-summary-style";
    let updateQueued = false;
    let isDismissed = false;

    const log = (...args: any[]) => {
      try {
        console.log("[Volt eBay Summary]", ...args);
      } catch {}
    };

    const fallbackOpenSidepanel = (tool: string) => {
      try {
        chrome.runtime.sendMessage({
          action: "openInSidebar",
          tool,
        });
      } catch (_) {}
    };

    const openSidepanelTool = (tool: string) => {
      if (!isSidePanelApiAvailable()) {
        fallbackOpenSidepanel(tool);
        return;
      }
      try {
        triggerSidepanelToolFromContentScript(tool, {
          source: "ebay-summary",
        }).catch((err) => {
          log("sidepanel trigger failed", err?.message || err);
          fallbackOpenSidepanel(tool);
        });
      } catch (err) {
        log("sidepanel trigger threw", err?.message || err);
        fallbackOpenSidepanel(tool);
      }
    };

    const ensureStyles = () => {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        #${SUMMARY_ID} {
          width: 100%;
          padding: 12px 16px;
          padding-right: 110px; /* Make space for buttons */
          border-radius: 10px;
          margin: 12px 0 0 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
          color: #0f172a;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
          position: relative;
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        
        /* Green theme for Sold Listings */
        #${SUMMARY_ID}.volt-state-sold {
          border: 1px solid #16a34a; /* Green-600 */
          background: #f0fdf4; /* Green-50 */
        }
        
        /* Orange theme for Active/Completed Listings (Warning) */
        #${SUMMARY_ID}.volt-state-active {
          border: 1px solid #f97316; /* Orange-500 */
          background: #fff7ed; /* Orange-50 */
        }

        #${SUMMARY_ID} h2 {
          font-size: 16px;
          margin: 0;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        #${SUMMARY_ID} h2 img {
          width: 20px;
          height: 20px;
        }
        #${SUMMARY_ID} .volt-ebay-summary__content {
          font-size: 15px;
          color: #334155;
          line-height: 1.5;
          display: inline;
        }
        #${SUMMARY_ID} .volt-ebay-summary__content strong {
          color: #0f172a;
          font-weight: 700;
        }
        #${SUMMARY_ID} .volt-ebay-summary__action {
          display: inline-block;
          margin-left: 8px;
          font-weight: 600;
          text-decoration: underline;
          cursor: pointer;
          color: #c2410c; /* Orange-700 */
          font-size: 15px;
        }
        #${SUMMARY_ID} .volt-ebay-summary__action:hover {
          color: #9a3412; /* Orange-800 */
        }

        #${SUMMARY_ID} .volt-ebay-summary__links {
          display: inline;
          margin-left: 6px;
          color: #475569;
        }
        #${SUMMARY_ID} .volt-ebay-summary__links a {
          color: #15803d; /* Green-700 */
          text-decoration: underline;
          font-weight: 600;
          cursor: pointer;
        }
        #${SUMMARY_ID} .volt-ebay-summary__links a:hover {
          color: #166534; /* Green-800 */
        }

        /* Tooltip styles */
        #${SUMMARY_ID} [data-tooltip] {
          position: relative;
        }
        #${SUMMARY_ID} [data-tooltip]:hover::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
          padding: 4px 8px;
          background: #0f172a;
          color: #f8fafc;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          z-index: 20;
          pointer-events: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        #${SUMMARY_ID} .volt-ebay-summary__dismiss {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          border-radius: 6px;
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          line-height: 1;
          color: #64748b;
          transition: all 0.2s ease;
          z-index: 10;
        }
        #${SUMMARY_ID} .volt-ebay-summary__dismiss:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }
        
        #${SUMMARY_ID} .volt-ebay-summary__sidepanel {
          position: absolute;
          top: 12px;
          right: 76px;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          border-radius: 6px;
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          line-height: 1;
          color: #64748b;
          transition: all 0.2s ease;
          z-index: 10;
        }
        #${SUMMARY_ID} .volt-ebay-summary__sidepanel:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
        }
        
        #${SUMMARY_ID} .volt-ebay-summary__settings {
          position: absolute;
          top: 12px;
          right: 44px;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          border-radius: 6px;
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          line-height: 1;
          color: #64748b;
          transition: all 0.2s ease;
          z-index: 10;
        }
        #${SUMMARY_ID} .volt-ebay-summary__settings:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
        }
      `;
      document.head.appendChild(style);
    };

    const getListingState = () => {
      try {
        const url = new URL(window.location.href);
        if (!/\.ebay\./i.test(url.hostname)) return "unknown";
        if (!url.pathname.startsWith("/sch/")) return "unknown";

        const soldParam = url.searchParams.get("LH_Sold");
        const completeParam = url.searchParams.get("LH_Complete");

        const isSold = soldParam === "1" || soldParam === "true";
        const isComplete = completeParam === "1" || completeParam === "true";

        if (isSold) return "sold";
        if (isComplete) return "completed";
        return "active";
      } catch {
        return "active";
      }
    };

    const getConditionsText = (conditionParam: string | null) => {
      if (!conditionParam) return "All Conditions";

      // Decode URL encoded chars just in case (though new URL() usually handles params)
      const decoded = decodeURIComponent(conditionParam);
      const codes = decoded.split("|");

      const labels = new Set<string>();

      codes.forEach((code) => {
        // Standard eBay Condition IDs and legacy URL params
        if (["1000", "3", "10"].includes(code)) labels.add("New");
        else if (["1500", "1750"].includes(code)) labels.add("Open Box");
        else if (code >= "2000" && code <= "2500") labels.add("Refurbished");
        else if (["3000", "4", "5000", "6000"].includes(code))
          labels.add("Used");
        else if (["7000"].includes(code)) labels.add("Broken");
        else labels.add("Other");
      });

      if (labels.size === 0) return "All Conditions";

      const labelArray = Array.from(labels);
      if (labelArray.length <= 2) {
        return labelArray.join(" & ");
      }
      return labelArray.join(", ");
    };

    const removeSummary = () => {
      const existing = document.getElementById(SUMMARY_ID);
      if (existing) {
        existing.remove();
      }
    };

    const handleContainerClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const actionBtn = target.closest("[data-action]");
      if (!actionBtn) return;

      const action = actionBtn.getAttribute("data-action");
      if (!action) return;

      e.preventDefault();
      e.stopPropagation();

      if (action === "open-sidepanel") {
        openSidepanelTool("ebay-sold-tool");
      } else if (action === "settings") {
        chrome.runtime.sendMessage({
          action: "open-settings",
          section: "ebay",
        });
      } else if (action === "dismiss") {
        isDismissed = true;
        removeSummary();
      } else if (action === "switch-to-sold") {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("LH_Sold", "1");
        currentUrl.searchParams.set("LH_Complete", "1");
        window.location.href = currentUrl.toString();
      } else if (action === "filter-used") {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("LH_ItemCondition", "3000");
        window.location.href = currentUrl.toString();
      } else if (action === "filter-new") {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("LH_ItemCondition", "1000");
        window.location.href = currentUrl.toString();
      } else if (action === "filter-broken") {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("LH_ItemCondition", "7000");
        window.location.href = currentUrl.toString();
      } else if (action === "filter-all") {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete("LH_ItemCondition");
        window.location.href = currentUrl.toString();
      }
    };

    const ensureSummaryContainer = () => {
      let container = document.getElementById(SUMMARY_ID);
      if (container) {
        return container;
      }

      // 1. Try to find the carousel element (User request)
      // We look for the specific class provided
      const carouselAnswer = document.querySelector(
        ".srp-river-answer--NAVIGATION_ANSWER_COLLAPSIBLE_CAROUSEL"
      );
      if (carouselAnswer && carouselAnswer.parentElement) {
        container = document.createElement("section");
        container.id = SUMMARY_ID;
        container.addEventListener("click", handleContainerClick);

        // Insert AFTER the carousel answer
        // If carouselAnswer is the last child, appendChild works too, but insertBefore(nextSibling) is safer
        carouselAnswer.parentElement.insertBefore(
          container,
          carouselAnswer.nextSibling
        );
        log(
          "✓ Summary container inserted after .srp-river-answer--NAVIGATION_ANSWER_COLLAPSIBLE_CAROUSEL"
        );
        return container;
      }

      // 2. Try to find the srp-controls__row-2 element
      const srpControlsRow2 = document.querySelector(".srp-controls__row-2");
      if (srpControlsRow2) {
        container = document.createElement("section");
        container.id = SUMMARY_ID;
        container.addEventListener("click", handleContainerClick);
        // Insert the summary as the last child of srp-controls__row-2
        srpControlsRow2.appendChild(container);
        log("✓ Summary container inserted into .srp-controls__row-2");
        return container;
      }

      // 3. Fallback: Insert before the results river
      const river = document.getElementById("srp-river-results");
      if (river && river.parentElement) {
        container = document.createElement("section");
        container.id = SUMMARY_ID;
        container.addEventListener("click", handleContainerClick);
        river.parentElement.insertBefore(container, river);
        log(
          "✓ Summary container inserted before #srp-river-results (fallback)"
        );
        return container;
      }

      // 4. Last resort: Insert at the top of the main content if possible
      const main = document.getElementById("mainContent");
      if (main) {
        container = document.createElement("section");
        container.id = SUMMARY_ID;
        container.addEventListener("click", handleContainerClick);
        main.prepend(container);
        log("✓ Summary container inserted into #mainContent (last resort)");
        return container;
      }

      log("✗ Cannot insert summary - no suitable parent found");
      return null;
    };

    const renderSummary = async () => {
      updateQueued = false;

      // Check if the feature is enabled in settings
      try {
        const result = await chrome.storage.sync.get(["cmdkSettings"]);
        const isEnabled = result.cmdkSettings?.ebaySummary?.enabled ?? true;

        if (!isEnabled) {
          log("✗ eBay Summary feature is disabled in settings");
          removeSummary();
          return;
        }
      } catch (err) {
        log("⚠️ Failed to check settings, assuming enabled", err);
      }

      // Check if user has dismissed this summary
      if (isDismissed) {
        removeSummary();
        return;
      }

      ensureStyles();
      const container = ensureSummaryContainer();
      if (!container) {
        return;
      }

      const state = getListingState();
      const isSold = state === "sold";
      const url = new URL(window.location.href);
      const conditionParam = url.searchParams.get("LH_ItemCondition");

      // Determine state class - Green only for strictly Sold
      container.className = isSold ? "volt-state-sold" : "volt-state-active";

      let listingType = "Active Listings";
      if (state === "sold") listingType = "Sold Listings";
      else if (state === "completed")
        listingType = "Completed Listings (Sold & Unsold)";

      const conditionText = getConditionsText(conditionParam);

      // Get the Volt icon URL
      const iconUrl = chrome.runtime.getURL("assets/icons/logo-32.png");

      let contentHtml = `
        You are currently viewing <strong>${listingType}</strong> for <strong>${conditionText}</strong> items.
      `;

      if (isSold) {
        if (conditionText === "All Conditions") {
          contentHtml += `
            <span class="volt-ebay-summary__links">
              Filter by <a data-action="filter-used">Used</a>, <a data-action="filter-new">New</a>, or <a data-action="filter-broken">Broken</a>.
            </span>
          `;
        } else if (conditionText.includes("New")) {
          contentHtml += `
            <span class="volt-ebay-summary__links">
              Switch to <a data-action="filter-used">Used</a> or <a data-action="filter-broken">Broken</a>.
            </span>
          `;
        } else if (conditionText.includes("Used")) {
          contentHtml += `
            <span class="volt-ebay-summary__links">
              Switch to <a data-action="filter-new">New</a> or <a data-action="filter-broken">Broken</a>.
            </span>
          `;
        } else if (conditionText.includes("For Parts")) {
          contentHtml += `
            <span class="volt-ebay-summary__links">
              Switch to <a data-action="filter-new">New</a> or <a data-action="filter-used">Used</a>.
            </span>
          `;
        } else if (conditionText.includes("Broken")) {
          contentHtml += `
            <span class="volt-ebay-summary__links">
              Switch to <a data-action="filter-new">New</a> or <a data-action="filter-used">Used</a>.
            </span>
          `;
        }
      } else {
        contentHtml += `
          <span class="volt-ebay-summary__links">
            Ready to analyze prices? <a data-action="switch-to-sold">Switch to Sold Listings</a>.
          </span>
        `;
      }

      // Sidepanel button
      const sidepanelBtn = `
        <button class="volt-ebay-summary__sidepanel" data-action="open-sidepanel" data-tooltip="Open eBay Tool">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </button>
      `;

      // Settings button
      const settingsBtn = `
        <button class="volt-ebay-summary__settings" data-action="settings" data-tooltip="Settings">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      `;

      // Dismiss button
      const dismissBtn = `
        <button class="volt-ebay-summary__dismiss" data-action="dismiss" data-tooltip="Dismiss">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      container.innerHTML = `
        <h2>
          <img src="${iconUrl}" alt="Volt Logo" />
          eBay Summary
        </h2>
        <div class="volt-ebay-summary__content">
          ${contentHtml}
        </div>
        ${sidepanelBtn}
        ${settingsBtn}
        ${dismissBtn}
      `;
    };

    // Use MutationObserver to detect when results load
    const observer = new MutationObserver(() => {
      if (updateQueued) return;

      // Debounce updates slightly but much faster than before
      updateQueued = true;
      // Use requestAnimationFrame for smoother UI updates instead of arbitrary timeout
      requestAnimationFrame(() => {
        if (!document.getElementById(SUMMARY_ID)) {
          renderSummary();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Initial render - try immediately
    renderSummary();
  },
});
