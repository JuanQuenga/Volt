import { useState, useEffect, useRef } from "react";
import {
  Command,
  MousePointer,
  Gamepad2,
  Settings,
  Keyboard,
  Search,
  ArrowRight,
  CheckCircle,
  Github,
  TrendingUp,
  Barcode,
  Shield,
  Download,
  Star,
  Users,
  ChevronUp,
  Menu,
  X,
  Pin,
  ExternalLink,
  Info,
} from "lucide-react";
import { Dialog, DialogContent } from "../ui/dialog";

// Component to render text with keyboard shortcuts
const renderTextWithKbd = (text: string) => {
  const parts = text.split(
    /(CMD\+Shift\+K|CTRL\+Shift\+K|CMD\+K|CTRL\+K|Tab|Enter|CMD|CTRL|Shift|K|eb|arrow keys)/
  );

  return parts.map((part, index) => {
    if (
      [
        "CMD+Shift+K",
        "CTRL+Shift+K",
        "CMD+K",
        "CTRL+K",
        "CMD",
        "CTRL",
        "Shift",
        "K",
        "Tab",
        "Enter",
        "ebay",
        "upc",
        "price charting",
        "arrow keys",
      ].includes(part)
    ) {
      return <kbd key={index}>{part}</kbd>;
    }
    return part;
  });
};

export default function ThankYouPage() {
  const [version, setVersion] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isStickyNavVisible, setIsStickyNavVisible] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get extension version
    const manifest = chrome.runtime.getManifest();
    setVersion(manifest.version);

    // Handle scroll events
    const handleScroll = () => {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const progress = (currentScroll / scrollHeight) * 100;
      setScrollProgress(progress);

      // Show/hide sticky nav based on scroll position
      setIsStickyNavVisible(currentScroll > 300);

      // Update active section based on scroll position
      const sections = [
        { ref: heroRef, name: "hero" },
        { ref: featuresRef, name: "features" },
      ];

      for (const section of sections) {
        if (section.ref.current) {
          const { offsetTop, offsetHeight } = section.ref.current;
          if (
            currentScroll >= offsetTop - 100 &&
            currentScroll < offsetTop + offsetHeight - 100
          ) {
            setActiveSection(section.name);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCopyLink = () => {
    const installUrl =
      "https://chromewebstore.google.com/detail/volt/bmgghhmlflbhlnomgnoodpidekpaaifk";
    navigator.clipboard.writeText(installUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNavClick = (sectionName: string) => {
    const sectionRef = {
      hero: heroRef,
      features: featuresRef,
    }[sectionName];

    if (sectionRef?.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  // All features with individual sections
  const mainFeatures = [
    {
      id: 1,
      title: "Quick Actions",
      description:
        "Highlight text and instantly search for Sold Listings on eBay, MPN codes (Google), UPC codes (UPCItemDB & Google), or PriceCharting pricing data.",
      image: "/assets/images/quick-actions.png",
      icon: MousePointer,
      howToUse: [
        "Highlight/select the text for a product anywhere on the page.",
        "Right click the selection to open the context menu.",
        "Choose the search you need: Sold eBay Listings, UPC Item DB, Google UPC/MPN, or PriceCharting.",
      ],
    },
    {
      id: 2,
      title: "Command Menu Popup",
      description:
        "Arc-style command palette for quick navigation, tab switching, and multi-provider search with 14 integrated search providers.",
      image: "/assets/images/command-menu.png",
      icon: Command,
      howToUse: [
        "Pin the Volt extension icon to your toolbar (or use CMD+Shift+K / CTRL+Shift+K).",
        "Click the Volt extension icon to open the command menu instantly.",
        "Type to filter through tabs, quick links, bookmarks, history, or search providers.",
        "Use Tab or arrow keys to navigate, hit Enter to select, or type a trigger word (like 'ebay' + Tab) to search.",
      ],
      subsections: [
        {
          title: "14 Search Providers",
          description:
            "Type a trigger word (like 'ebay', 'amazon', 'youtube') + Tab to activate a search provider, then type your query and hit Enter to search.",
          subSubsections: [
            {
              title: "E-commerce",
              description:
                "Amazon, Best Buy, eBay (sold listings), Home Depot, Lowe's, Menards, Micro Center, Price Charting",
            },
            {
              title: "Product Data",
              description:
                "UPC Item DB (barcode lookup), eBay Taxonomy API (category suggestions)",
            },
          ],
        },
        {
          title: "Quick Links & Quick Navigation",
          description:
            "Access custom links from Google Sheets (30-min cache) with categories. Configure custom CSV URL in settings or download the template to create your own.",
        },
        {
          title: "Tab Switching & Bookmarks",
          description:
            "Switch between open tabs, access your 20 most recent bookmarks (with folder filtering), and browse last 30 visited pages.",
        },
        {
          title: "eBay Category API",
          description:
            "Live eBay category suggestions as you type. Click any category to copy the category ID to clipboard instantly.",
        },
      ],
    },
    {
      id: 3,
      title: "Built-In Controller Testing",
      description:
        "Real-time controller testing with visual feedback. Press CMD+J / CTRL+J to open the sidepanel and test any gamepad.",
      image: "/assets/images/controller-testing.png",
      icon: Gamepad2,
      features: [
        "Test all 20 buttons, analog sticks, and triggers with real-time visualization",
        "Color-coded feedback: Green (light input), Orange (medium input), Red (strong input)",
        "Customizable thresholds in settings for personalized sensitivity",
        "Auto-detects and connects to Xbox, PlayStation, and generic controllers",
        "SVG-based controller diagram with live input highlighting",
        "Automatically opens when a new controller is connected",
      ],
    },
    {
      id: 4,
      title: "eBay Summary",
      description:
        "Get instant context on eBay search pages with an inline summary showing whether you're viewing Sold or Active listings, plus current condition filters. Color-coded indicators help you quickly understand your search context.",
      image: "/assets/images/ebay-summary.png",
      icon: Info,
      features: [
        "Inline summary banner appears automatically on eBay search result pages",
        "Displays current listing type (Sold, Active, or Completed) and condition filters",
        "Quick action to switch from Active to Sold listings with one click",
        "Condition filter shortcuts: Switch between Used, New, or For Parts filters",
      ],
    },
    {
      id: 5,
      title: "UPC Highlighter",
      description:
        "Automatically detects and highlights 12-digit UPC codes on any webpage. Click any highlighted code to copy it to your clipboard.",
      image: "/assets/images/upc-highlighter.png",
      icon: Barcode,
      features: [
        "Detects 12-digit UPC codes automatically across all websites",
        "Highlights codes with distinctive styling for easy identification",
        "Click-to-copy functionality with visual confirmation",
        "Hover tooltip shows 'Click to copy' instruction",
        "Works on dynamic content and AJAX-loaded pages",
        "Toggle on/off in settings (enabled by default)",
      ],
    },
    {
      id: 6,
      title: "Shopify Buttons",
      description:
        "Quick action buttons to quickly view market pricing for products on eBay and PriceCharting.",
      image: "/assets/images/shopify-buttons.png",
      icon: Shield,
      features: [
        "PriceCharting button to quickly view prices via the UPC code.",
        "eBay button to quickly view prices via the MPN code.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Progress Indicator */}
      <div
        className="progress-indicator"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Sticky Navigation */}
      <nav
        className={`sticky-nav bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-all duration-300 ${
          isStickyNavVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/assets/icons/logo.png"
                alt="Volt"
                className="w-8 h-8 rounded-lg"
              />
              <span className="font-semibold text-slate-900 dark:text-white">
                Volt
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              {[
                { name: "hero", label: "Home" },
                { name: "features", label: "Features" },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.name)}
                  className={`text-sm font-medium transition-colors ${
                    activeSection === item.name
                      ? "text-green-600 dark:text-green-400"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-900 dark:text-white" />
              ) : (
                <Menu className="w-5 h-5 text-slate-900 dark:text-white" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 md:hidden">
          <div className="flex flex-col p-6 pt-20">
            {[
              { name: "hero", label: "Home" },
              { name: "features", label: "Features" },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.name)}
                className={`text-lg font-medium py-3 text-left transition-colors ${
                  activeSection === item.name
                    ? "text-green-600 dark:text-green-400"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Viewer Dialog */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-transparent border-0 shadow-none">
          <img
            src={selectedImage}
            alt="Enlarged view"
            className="w-full h-full object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>

      {/* Hero Section - Thank You Message */}
      <section ref={heroRef} className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <img
              src="/assets/icons/logo.png"
              alt="Volt"
              className="w-20 h-20 rounded-lg mx-auto mb-6"
            />
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Thank You for Installing Volt
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
              We're excited to have you on board! Volt's Chrome Extension is now
              ready to enhance your workflow with powerful productivity tools
              and features.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-8 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Pin className="w-8 h-8 text-green-600 dark:text-green-400" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Please Pin Volt's Chrome Extension to Your Toolbar
              </h2>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
              For quick access to all Volt's Chrome Extension features, we
              recommend pinning the extension to your Chrome toolbar:
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 text-left max-w-2xl mx-auto">
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm flex items-center justify-center font-medium">
                    1
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Click the <strong>Extensions icon</strong> (puzzle piece) in
                    the Chrome toolbar
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm flex items-center justify-center font-medium">
                    2
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Find <strong>Volt's Chrome Extension</strong> in the list of
                    extensions
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm flex items-center justify-center font-medium">
                    3
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Click the <strong>pin icon</strong> next to Volt's Chrome
                    Extension
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm flex items-center justify-center font-medium">
                    4
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Volt's Chrome Extension icon will now appear in your toolbar
                    for quick access!
                  </span>
                </li>
              </ol>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={() => handleNavClick("features")}
              className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-3 text-lg font-semibold"
            >
              <Search className="w-5 h-5" />
              Explore Features
            </button>
            <button
              onClick={() =>
                chrome.tabs.create({ url: "chrome://extensions/shortcuts" })
              }
              className="px-8 py-4 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-3 text-lg font-semibold"
            >
              <Keyboard className="w-5 h-5" />
              Customize Shortcuts
            </button>
          </div>

          <div className="flex items-center justify-center">
            <a
              href="https://github.com/JuanQuenga/volt-chrome-extension"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>Contribute on GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section - Each Feature in its Own Section */}
      <section ref={featuresRef} className="py-4 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Volt's Chrome Extension Features
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Everything you need to enhance your workflow with our extension.
            </p>
          </div>

          {mainFeatures.map((feature, index) => (
            <div
              key={feature.id}
              className="feature-card bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-16"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <feature.icon className="w-8 h-8 text-slate-700 dark:text-slate-300" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {feature.id}. {feature.title}
                  </h3>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                    {feature.description}
                  </p>

                  <div className="space-y-4">
                    {feature.howToUse && (
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <ArrowRight className="w-4 h-4" />
                          How To Use
                        </h4>
                        <ul className="space-y-2">
                          {feature.howToUse.map((step, stepIndex) => (
                            <li
                              key={stepIndex}
                              className="flex items-start gap-3"
                            >
                              <span className="flex-shrink-0 w-6 h-6 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full text-xs flex items-center justify-center mt-0.5 font-medium">
                                {stepIndex + 1}
                              </span>
                              <span className="text-slate-600 dark:text-slate-400 text-sm flex flex-wrap items-center gap-1">
                                {renderTextWithKbd(step)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feature.subsections && (
                      <div className="space-y-4">
                        {feature.subsections.map((subsection, subIndex) => (
                          <div
                            key={subIndex}
                            className="border-l-2 border-slate-300 dark:border-slate-600 pl-4"
                          >
                            <h5 className="font-semibold text-slate-900 dark:text-white mb-2">
                              {subsection.title}
                            </h5>
                            <p className="text-slate-600 dark:text-slate-400 text-sm flex flex-wrap items-center gap-1">
                              {renderTextWithKbd(subsection.description)}
                            </p>
                            {subsection.subSubsections && (
                              <div className="mt-3 ml-4 space-y-3">
                                {subsection.subSubsections.map(
                                  (subSub, subSubIndex) => (
                                    <div
                                      key={subSubIndex}
                                      className="border-l-2 border-slate-300 dark:border-slate-600 pl-3"
                                    >
                                      <h6 className="font-medium text-slate-800 dark:text-slate-200 mb-1 text-sm">
                                        {subSub.title}
                                      </h6>
                                      <p className="text-slate-600 dark:text-slate-400 text-sm flex flex-wrap items-center gap-1">
                                        {renderTextWithKbd(subSub.description)}
                                      </p>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {feature.features && (
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          Key Features
                        </h4>
                        <ul className="space-y-2">
                          {feature.features.map((featureItem, featureIndex) => (
                            <li
                              key={featureIndex}
                              className="flex items-start gap-3"
                            >
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-600 dark:text-slate-400 text-sm">
                                {featureItem}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div
                    onClick={() => handleImageClick(feature.image)}
                    className="cursor-pointer"
                  >
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-auto rounded-lg shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/icons/logo.png"
                alt="Volt's Chrome Extension"
                className="w-8 h-8 rounded-lg"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Volt Chrome Extension
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Powerful Chrome Extension
                  {version && (
                    <span className="ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                      v{version}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/JuanQuenga/volt-chrome-extension"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <span>Made with ❤️ by Juan Quenga</span>
                <Github className="w-4 h-4" />
              </a>
              <span className="text-xs text-slate-500 dark:text-slate-500">
                AGPL-3.0 License
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <button
        onClick={scrollToTop}
        className={`fab bg-green-600 text-white transition-all duration-300 ${
          scrollProgress > 20
            ? "translate-y-0 opacity-100"
            : "translate-y-16 opacity-0"
        }`}
      >
        <ChevronUp className="w-6 h-6" />
      </button>
    </div>
  );
}
