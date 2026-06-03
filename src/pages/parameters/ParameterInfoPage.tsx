import { useState } from "react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import { useParametersWithUnits } from "../../data/constants";
import {
  Thermometer,
  Droplets,
  FlaskConical,
  Search,
  ChevronDown,
  Factory,
  Cloud,
  Link2,
  Leaf,
  Info,
} from "lucide-react";
import type { JSX } from "react";

/* ── Parameter reference data ──────────────────────────────────────────────── */

type ParameterInfo = {
  key: string;
  description: string;
  category: "Water Quality" | "Physical";
  icon: JSX.Element;
  source: string;
  atmosphericBehaviour: string;
  meteorologicalInteraction: string;
  relatedPollutants: string;
  environmentalSignificance: string;
};

const ICON_CLASS = "w-6 h-6";

const PARAMETER_INFO: ParameterInfo[] = [
  // ── Water Quality Parameters ───────────────────────────────────────────
  {
    key: "ph",
    description:
      "pH measures the hydrogen ion concentration of water, indicating acidity or alkalinity on a scale of 0–14. Values below 7 are acidic; above 7 are alkaline. It is a fundamental indicator of overall water chemistry.",
    category: "Water Quality",
    icon: <FlaskConical className={ICON_CLASS} />,
    source:
      "Natural sources include geological composition, organic matter decomposition, and dissolved CO₂. Anthropogenic sources include industrial discharges, agricultural runoff with fertilisers, and acid rain inputs to the catchment.",
    atmosphericBehaviour:
      "pH affects the solubility and bioavailability of nutrients, metals, and dissolved gases. Extreme values impair aquatic life and disrupt biochemical processes. Diurnal fluctuations occur due to photosynthesis (raising pH during daylight) and respiration (lowering pH at night).",
    meteorologicalInteraction:
      "Elevated temperatures generally lower pH due to changes in CO₂ solubility and biological activity. Rainfall runoff introduces acidity or alkalinity depending on catchment geology. Industrial and agricultural discharges are primary anthropogenic drivers of pH deviation.",
    relatedPollutants:
      "Closely linked to dissolved oxygen (DO) and ammonia-nitrogen (NH₃-N). Higher pH increases the proportion of toxic free ammonia. Alkalinity and hardness interact with pH to determine buffering capacity. Correlated with BOD during decomposition events.",
    environmentalSignificance:
      "Malaysia NWQS Class II: 6.0–9.0. Sustained deviations beyond this range impair aquatic ecosystems, affect fish reproduction, and may indicate industrial or agricultural pollution. Monitoring supports early detection of acid or alkaline discharge events.",
  },
  {
    key: "do",
    description:
      "Dissolved oxygen (DO) measures the concentration of oxygen dissolved in water. It is the most critical indicator of water body health, directly supporting aerobic aquatic life and governing the rate of organic matter decomposition.",
    category: "Water Quality",
    icon: <FlaskConical className={ICON_CLASS} />,
    source:
      "Oxygen enters water through atmospheric diffusion at the surface and photosynthesis by aquatic plants and algae. It is consumed by respiration of aquatic organisms, microbial oxidation of organic and inorganic matter, and chemical oxygen demand.",
    atmosphericBehaviour:
      "DO concentrations are highly dynamic, varying with temperature, salinity, turbulence, and biological activity. Stratification in deeper water bodies can create hypoxic or anoxic zones in bottom layers that persist seasonally.",
    meteorologicalInteraction:
      "Temperature inversely affects DO — warm water holds less oxygen. Periods of low flow, stagnation, or high organic loading deplete DO rapidly. Rainfall events can temporarily elevate DO through turbulent re-aeration and dilution of organic load.",
    relatedPollutants:
      "Low DO is strongly correlated with high BOD and COD, indicating elevated organic pollution load. NH₃-N oxidation through nitrification consumes additional DO. Algal blooms cause extreme diurnal DO swings — supersaturation by day, crash at night.",
    environmentalSignificance:
      "Malaysia NWQS Class II: ≥7 mg/L. DO below 5 mg/L stresses most fish species; below 2 mg/L causes fish kills. A critical indicator for detecting organic pollution, eutrophication, and the health of aquatic ecosystems.",
  },
  {
    key: "nh3n",
    description:
      "Ammoniacal nitrogen (NH₃-N) represents the total concentration of ammonia (NH₃) and ammonium (NH₄⁺) in water, expressed as nitrogen equivalents. It is a key indicator of organic nitrogen pollution and sewage contamination.",
    category: "Water Quality",
    icon: <FlaskConical className={ICON_CLASS} />,
    source:
      "Primary sources include domestic sewage, livestock and aquaculture effluents, industrial wastewater from food processing and chemical plants, and decomposition of nitrogenous organic matter such as plant material and animal waste.",
    atmosphericBehaviour:
      "NH₃ and NH₄⁺ exist in dynamic equilibrium in water, with the ratio determined by pH and temperature. At higher pH (>8) and elevated temperatures, the toxic un-ionized free ammonia (NH₃) fraction predominates, increasing toxicity to aquatic life without a change in total concentration.",
    meteorologicalInteraction:
      "Rising temperatures shift equilibrium toward toxic free ammonia, amplifying ecological impact. Rainfall dilutes NH₃-N in receiving waters, while low-flow dry periods cause accumulation near discharge points. Nitrification (biological oxidation of NH₃) is temperature-dependent and slows in cold conditions.",
    relatedPollutants:
      "Strongly linked to DO depletion through nitrification, which consumes approximately 4.6 mg O₂ per mg NH₃-N oxidised. High NH₃-N correlates with BOD and COD in sewage-polluted waters. Elevated NH₃-N is also associated with phosphorus inputs that drive eutrophication.",
    environmentalSignificance:
      "Malaysia NWQS Class II: <0.3 mg/L. Ammonia is acutely toxic to fish at sub-mg/L concentrations. Monitoring detects sewage discharge, agricultural runoff, and aquaculture pond effluents. A primary driver of eutrophication and oxygen depletion in receiving waters.",
  },
  {
    key: "cod",
    description:
      "Chemical oxygen demand (COD) measures the total amount of oxygen required to chemically oxidise all organic matter — both biodegradable and recalcitrant — in a water sample. It provides a rapid, comprehensive measure of organic pollution load.",
    category: "Water Quality",
    icon: <FlaskConical className={ICON_CLASS} />,
    source:
      "Industrial effluents, agricultural runoff, domestic wastewater, leachate from waste disposal sites, and natural organic matter decomposition. Recalcitrant industrial organics that resist biological breakdown contribute significantly to COD above BOD.",
    atmosphericBehaviour:
      "COD reflects the total oxidisable organic loading of a water body. Unlike BOD, it captures refractory compounds not susceptible to biological breakdown. High COD with persistent elevated readings indicates continuous or chronic organic pollution from industrial or domestic sources.",
    meteorologicalInteraction:
      "Rainfall dilution temporarily reduces COD concentrations but increases total pollutant load through runoff. Low-flow dry periods concentrate organics, elevating COD. Industrial discharge events cause acute COD spikes identifiable before BOD tests can be completed.",
    relatedPollutants:
      "COD is always ≥ BOD₅ for a given sample; the COD:BOD ratio indicates biodegradability. High COD with a normal BOD ratio suggests presence of recalcitrant industrial organics. Correlated with TSS when significant particulate organic matter is present.",
    environmentalSignificance:
      "Malaysia NWQS Class II: <25 mg/L. COD monitoring enables rapid detection of industrial and domestic pollution events. Essential for effluent compliance assessment and estimation of oxygen demand on receiving water bodies.",
  },
  {
    key: "bod",
    description:
      "Biochemical oxygen demand (BOD₅) measures the amount of dissolved oxygen consumed by microorganisms to biologically decompose organic matter over a standard 5-day incubation at 20°C. It quantifies the biodegradable organic fraction.",
    category: "Water Quality",
    icon: <FlaskConical className={ICON_CLASS} />,
    source:
      "Domestic sewage, food and beverage processing effluents, agricultural runoff carrying organic matter, and naturally decomposing plant material. Treated wastewater effluent still carries residual BOD that exerts oxygen demand on receiving waters.",
    atmosphericBehaviour:
      "BOD reflects the biodegradable fraction of organic matter in water. Elevated BOD drives oxygen depletion in receiving waters through microbial respiration, creating hypoxic conditions. Organic loading from a single event can depress DO for extended periods downstream.",
    meteorologicalInteraction:
      "Temperature strongly affects BOD — warmer conditions accelerate biological degradation, increasing oxygen consumption rate. Low-flow periods during dry seasons concentrate BOD load and reduce re-aeration, compounding DO depletion. Wet season turbulence aids re-aeration but increases total organic load.",
    relatedPollutants:
      "BOD is directly linked to DO depletion — each unit of BOD5 exerts oxygen demand consuming approximately 1 mg/L of DO. High BOD correlates with elevated NH₃-N through decomposition of nitrogenous organics. Also associated with bacterial indicators of sewage contamination.",
    environmentalSignificance:
      "Malaysia NWQS Class II: <3 mg/L. BOD is the primary indicator of domestic sewage and organic pollution. Sustained high BOD leads to oxygen crashes, fish kills, and eutrophication. BOD monitoring is essential for effluent consent compliance and catchment water quality management.",
  },
  {
    key: "tss",
    description:
      "Total suspended solids (TSS) measures the mass of all inorganic and organic particles retained on a 0.45 µm filter, expressed in mg/L. It directly represents the particulate matter load and turbidity of the water body.",
    category: "Water Quality",
    icon: <FlaskConical className={ICON_CLASS} />,
    source:
      "Soil erosion from construction sites and disturbed land, agricultural runoff, storm water from impervious surfaces, industrial discharge, algal growth and biomass, and resuspension of bottom sediments during high-flow events.",
    atmosphericBehaviour:
      "Elevated TSS increases water turbidity, reducing light penetration and inhibiting submerged plant photosynthesis. Suspended particles serve as transport vectors for adsorbed pollutants including heavy metals, phosphorus, and pesticides, extending their downstream reach.",
    meteorologicalInteraction:
      "Rainfall events and high flow velocities cause bed sediment resuspension and surface runoff, sharply increasing TSS. Extended dry periods promote settling and clarity. Active land clearing or construction dramatically and persistently elevates TSS in downstream waters.",
    relatedPollutants:
      "High TSS correlates with elevated COD and BOD when particles carry organic matter. Adsorbed phosphorus transported by TSS contributes to downstream eutrophication. Turbidity from TSS suppresses DO through reduced photosynthesis and increases treatment costs for water supply.",
    environmentalSignificance:
      "Malaysia NWQS Class II: <50 mg/L. TSS monitoring identifies erosion impacts, construction and industrial discharge, and storm event responses. High turbidity degrades aquatic habitat, impacts drinking water treatment, and signals wider catchment disturbance.",
  },

  // ── Physical Parameters ────────────────────────────────────────────────
  {
    key: "temperature",
    description:
      "Water temperature measures the thermal state of the water body, governing all physical, chemical, and biological processes. It is a master variable that controls reaction rates and the metabolic function of aquatic organisms.",
    category: "Physical",
    icon: <Thermometer className={ICON_CLASS} />,
    source:
      "Solar radiation, atmospheric heat exchange, groundwater inputs, and thermal effluent from industrial cooling systems. Riparian shading and flow rate influence the degree of solar heating along a watercourse.",
    atmosphericBehaviour:
      "Temperature governs dissolved oxygen solubility (inversely), chemical reaction rates, and the metabolic activity of aquatic organisms. Thermal stratification in deeper water bodies creates distinct layers with differing oxygen and chemical profiles.",
    meteorologicalInteraction:
      "Solar radiation is the dominant driver of diurnal and seasonal temperature variation. Prolonged hot weather raises water temperature, reducing DO capacity and accelerating biological processes. Industrial thermal discharges cause localised thermal pollution that disrupts aquatic communities.",
    relatedPollutants:
      "Temperature amplifies the impact of all water quality stressors: warmer water holds less DO, increases free ammonia toxicity from NH₃-N, accelerates BOD decomposition, and enhances algal bloom development driving eutrophication.",
    environmentalSignificance:
      "Not a standalone NWQS parameter but critically influences all others. Essential for interpreting DO, NH₃-N toxicity, and BOD data. Monitoring detects thermal pollution from industrial cooling water discharge and supports prediction of seasonal water quality trends.",
  },
  {
    key: "depth",
    description:
      "Water depth at the monitoring station, derived from the pressure sensor reading and sensor installation depth. It indicates the volume of water above the sensor and provides continuous hydrological context for all water quality measurements.",
    category: "Physical",
    icon: <Droplets className={ICON_CLASS} />,
    source:
      "Determined by the flow regime, rainfall catchment response, tidal influence, reservoir and dam operations, and the channel or estuary morphology at the monitoring site.",
    atmosphericBehaviour:
      "Depth directly affects mixing dynamics, stratification potential, and light penetration to the bed. Shallow water is more susceptible to rapid thermal changes and pollutant concentration fluctuations than deep water with greater buffering volume.",
    meteorologicalInteraction:
      "Rainfall events cause rapid depth increases as runoff enters the channel. Extended dry periods reduce depth, concentrating all dissolved and suspended parameters. Tidal cycles create predictable and regular depth variations at estuarine and coastal monitoring stations.",
    relatedPollutants:
      "Low depth concentrates dissolved and suspended parameters, amplifying apparent pollution. High depth after storm events dilutes pollutants but significantly increases TSS through bank erosion and bed scour. Depth is essential context for interpreting all concentration measurements.",
    environmentalSignificance:
      "Depth monitoring enables flow estimation (using rating curves), flood early warning, and pollutant load calculations. Continuous depth data reveals the hydrological dynamics driving water quality variability and is essential for understanding pollutant transport in receiving waters.",
  },
];

const CATEGORIES = ["Water Quality", "Physical"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  "Water Quality": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Physical: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

/* ── Section config for expanded detail ────────────────────────────────────── */

const DETAIL_SECTIONS: {
  field: keyof ParameterInfo;
  label: string;
  icon: JSX.Element;
}[] = [
  {
    field: "source",
    label: "SOURCE OF CONTAMINATION",
    icon: <Factory className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />,
  },
  {
    field: "atmosphericBehaviour",
    label: "BEHAVIOUR IN WATER",
    icon: <Droplets className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />,
  },
  {
    field: "meteorologicalInteraction",
    label: "INFLUENCING FACTORS",
    icon: <Cloud className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />,
  },
  {
    field: "relatedPollutants",
    label: "RELATED PARAMETERS",
    icon: <Link2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />,
  },
  {
    field: "environmentalSignificance",
    label: "REGULATORY SIGNIFICANCE",
    icon: <Leaf className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />,
  },
];

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function ParameterInfoPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const parameters = useParametersWithUnits();

  const filtered = PARAMETER_INFO.filter((p) => {
    const matchesSearch =
      !search ||
      p.key.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getParam = (key: string) => parameters.find((p) => p.key === key);

  return (
    <div className="flex bg-[#f1f5f9] min-h-screen text-slate-700 overflow-x-hidden min-w-0 font-sans selection:bg-blue-500/30">
      <Sidebar
        active="Knowledge Center"
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />

      <div className="flex flex-col flex-1 min-w-0 relative">
        {/* Ambient glows */}
        <div className="fixed top-0 left-[20%] w-[40rem] h-[40rem] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-0 right-[10%] w-[30rem] h-[30rem] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

        <Topbar
          title="Parameter Information"
          onMenuToggle={() => setSidebarOpen(true)}
        />

        <div className="flex-1 p-4 sm:p-8 space-y-8 min-w-0 relative z-10 max-w-[1600px] 2xl:max-w-[1800px] mx-auto w-full">
          {/* Hero Section */}
          <div className="flex flex-col gap-4 bg-white/[0.02] border border-slate-200 p-6 sm:p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-700 pointer-events-none">
              <Info className="w-64 h-64" />
            </div>
            <div className="relative z-10">
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-slate-800 mb-3">
                Parameter{" "}
                <span className="font-semibold text-blue-600">
                  Reference Guide
                </span>
              </h1>
              <p className="text-slate-500 text-base sm:text-lg max-w-3xl leading-relaxed">
                Comprehensive specifications for all water quality and physical
                parameters monitored at the continuous water quality monitoring
                station (Malaysia NWQS Class II).
              </p>
            </div>
          </div>

          {/* Controls: Search + Category Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-[#f1f5f9]/80 backdrop-blur-md p-2 rounded-[1.5rem] border border-slate-200 sticky top-4 z-40 shadow-2xl">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500/70" />
              <input
                type="text"
                placeholder="Search parameters or descriptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-transparent border-none rounded-xl text-sm sm:text-base text-slate-700 placeholder:text-gray-500 focus:outline-none focus:ring-0 transition-all font-medium"
              />
              <div
                className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 scale-x-0 transition-transform duration-500 origin-left block"
                style={{ transform: search ? "scaleX(1)" : "scaleX(0)" }}
              />
            </div>

            <div className="w-[1px] h-8 bg-slate-100 hidden lg:block mx-2" />

            <div className="flex gap-2 flex-wrap items-center px-2 pb-2 lg:pb-0">
              <button
                onClick={() => setActiveCategory(null)}
                className={`relative px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 overflow-hidden ${
                  !activeCategory
                    ? "text-slate-800 shadow-[0_0_20px_rgba(37, 99, 235,0.3)]"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                {!activeCategory && (
                  <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm" />
                )}
                {!activeCategory && (
                  <div className="absolute inset-0 border border-blue-400/50 rounded-xl" />
                )}
                <span className="relative z-10">All Parameters</span>
              </button>
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                const isWq = cat === "Water Quality";
                const activeColorClass = isWq
                  ? "text-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                  : "text-blue-700 shadow-[0_0_20px_rgba(96,165,250,0.2)]";
                const activeBg = isWq ? "bg-blue-500/20" : "bg-blue-300/20";
                const activeBorder = isWq
                  ? "border-blue-400/50"
                  : "border-blue-300/50";

                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(isActive ? null : cat)}
                    className={`relative px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 overflow-hidden ${
                      isActive
                        ? activeColorClass
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {isActive && (
                      <div
                        className={`absolute inset-0 ${activeBg} backdrop-blur-sm`}
                      />
                    )}
                    {isActive && (
                      <div
                        className={`absolute inset-0 border ${activeBorder} rounded-xl`}
                      />
                    )}
                    <span className="relative z-10">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parameter Cards Grid */}
          <div className="grid grid-cols-1 2xl:grid-cols-2 items-start gap-6 pb-20">
            {filtered.map((info, idx) => {
              const param = getParam(info.key);
              const isExpanded = expandedKey === info.key;
              const isWq = info.category === "Water Quality";

              return (
                <div
                  key={info.key}
                  className={`group relative bg-[#f1f5f9]/40 backdrop-blur-sm border rounded-3xl overflow-hidden transition-all duration-500 hover:bg-[#f1f5f9]/80 ${
                    isExpanded ? "2xl:col-span-2" : "2xl:col-span-1"
                  } ${
                    isExpanded
                      ? isWq
                        ? "border-blue-500/30 shadow-[0_0_40px_rgba(37, 99, 235,0.06)]"
                        : "border-blue-400/30 shadow-[0_0_40px_rgba(96,165,250,0.06)]"
                      : "border-slate-200 hover:border-slate-200"
                  }`}
                  style={{
                    animationFillMode: "both",
                    animationDelay: `${idx * 50}ms`,
                  }}
                >
                  {/* Subtle Top Gradient Line */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      isWq
                        ? "bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0"
                        : "bg-gradient-to-r from-blue-400/0 via-blue-400/50 to-blue-400/0"
                    }`}
                  />

                  {/* Card Header */}
                  <button
                    onClick={() => setExpandedKey(isExpanded ? null : info.key)}
                    className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 sm:p-8 text-left outline-none cursor-pointer"
                  >
                    <div
                      className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                        isWq
                          ? isExpanded
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-[inset_0_0_20px_rgba(37, 99, 235,0.2)]"
                            : "bg-blue-500/5 border-blue-500/10 text-blue-600 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 group-hover:text-blue-600 group-hover:shadow-[inset_0_0_20px_rgba(37, 99, 235,0.1)]"
                          : isExpanded
                            ? "bg-blue-400/10 text-blue-600 border-blue-400/20 shadow-[inset_0_0_20px_rgba(96,165,250,0.2)]"
                            : "bg-blue-400/5 border-blue-400/10 text-blue-600 group-hover:bg-blue-400/10 group-hover:border-blue-400/20 group-hover:text-blue-600 group-hover:shadow-[inset_0_0_20px_rgba(96,165,250,0.1)]"
                      }`}
                    >
                      <div className="transform scale-110">{info.icon}</div>
                    </div>

                    <div className="flex-1 min-w-0 pt-1 sm:pt-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
                        <h3 className="text-[14px] sm:text-[15px] font-bold tracking-tight text-slate-800 flex items-center gap-3">
                          {param?.label ?? info.key.toUpperCase()}
                          {param?.unit && (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono font-medium text-slate-500">
                              {param.unit}
                            </span>
                          )}
                        </h3>
                        <div className="hidden sm:block h-1.5 w-1.5 rounded-full bg-gray-600" />
                        <span
                          className={`inline-flex items-center w-max px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${CATEGORY_COLORS[info.category]}`}
                        >
                          {info.category}
                        </span>
                      </div>
                      <p
                        className={`text-[14px] sm:text-[15px] text-slate-500 leading-relaxed font-normal max-w-4xl ${isExpanded ? "" : "line-clamp-1"}`}
                      >
                        {info.description}
                      </p>
                    </div>

                    <div
                      className={`absolute top-6 right-6 sm:relative sm:top-0 sm:right-0 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500 ${
                        isExpanded
                          ? isWq
                            ? "bg-blue-500/10 border-blue-500/30 text-blue-600 rotate-180"
                            : "bg-blue-500/10 border-blue-500/30 text-blue-600 rotate-180"
                          : "bg-transparent border-slate-200 text-gray-500 group-hover:bg-slate-100 group-hover:text-slate-700"
                      }`}
                    >
                      <ChevronDown className="w-5 h-5 transition-colors" />
                    </div>
                  </button>

                  {/* Expanded Details */}
                  <div
                    className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="p-6 sm:p-8 pt-0 border-t border-slate-200 bg-black/10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                          {DETAIL_SECTIONS.map(({ field, label, icon }) => (
                            <div
                              key={field}
                              className="group/section flex gap-5 p-6 rounded-2xl bg-[#f1f5f9]/60 border border-slate-200/[0.03] hover:border-slate-200 hover:bg-[#f1f5f9]/90 hover:shadow-lg transition-all duration-300"
                            >
                              <div className="h-max p-3 rounded-xl bg-white/[0.03] text-slate-500 border border-slate-200/[0.05] group-hover/section:scale-110 group-hover/section:bg-white/[0.08] transition-all duration-300">
                                {icon}
                              </div>
                              <div>
                                <h4 className="text-[14px] font-bold tracking-[0.2em] text-gray-500 mb-2 uppercase">
                                  {label}
                                </h4>
                                <p className="text-[14px] text-slate-700 leading-relaxed font-light">
                                  {info[field]}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white/[0.02] border border-slate-200 rounded-3xl backdrop-blur-sm">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <Search className="w-10 h-10 text-gray-500/50" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  No parameters found
                </h3>
                <p className="text-base text-gray-500 max-w-sm">
                  We couldn't find anything matching your search. Try adjusting
                  the query or category filter.
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setActiveCategory(null);
                  }}
                  className="mt-8 px-6 py-2.5 bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 rounded-xl transition-all shadow-[0_0_15px_rgba(37, 99, 235,0.15)] text-sm font-semibold tracking-wide"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
