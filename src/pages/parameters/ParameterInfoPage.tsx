import { useState } from "react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import { useParametersWithUnits } from "../../data/constants";
import {
  Wind,
  Thermometer,
  Droplets,
  Gauge,
  CloudRain,
  Compass,
  Sun,
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
  category: "Environmental Compound" | "Meteorological";
  icon: JSX.Element;
  source: string;
  atmosphericBehaviour: string;
  meteorologicalInteraction: string;
  relatedPollutants: string;
  environmentalSignificance: string;
};

const ICON_CLASS = "w-6 h-6";

const PARAMETER_INFO: ParameterInfo[] = [
  // ── Environmental Compounds ────────────────────────────────────────────
  {
    key: "so2",
    description:
      "Sulfur dioxide (SO\u2082) is a combustion-related gas generated from sulfur-containing fuels and crude oil processing. It is widely used as a key indicator for refinery emissions, particularly those related to sulfur handling and fuel combustion.",
    category: "Environmental Compound",
    icon: <FlaskConical className={ICON_CLASS} />,
    source:
      "In the Pengerang refinery area, SO\u2082 is mainly generated from sulfur recovery units, boilers, heaters, and flaring activities. Additional contributions may come from marine and support operations.",
    atmosphericBehaviour:
      "SO\u2082 is moderately reactive and undergoes oxidation to form sulfate aerosols. This process contributes to secondary particulate matter (PM\u2082.\u2085), which can remain suspended in the atmosphere over a longer period. In humid environments, SO\u2082 can form acidic compounds that influence ambient air quality. Its dispersion is strongly dependent on wind conditions and atmospheric stability.",
    meteorologicalInteraction:
      "High relative humidity, typical of coastal environments such as Pengerang, enhances the conversion of SO\u2082 into sulfate particles through aqueous-phase reactions. Low wind speed conditions may result in localized accumulation near emission sources, especially within or around the refinery boundary. Solar radiation increases oxidation rates, while rainfall promotes removal through wet deposition. Atmospheric stability, particularly under high-pressure conditions, may limit vertical mixing and lead to higher ground-level concentrations.",
    relatedPollutants:
      "SO\u2082 reacts with ammonia (NH\u2083) to form ammonium sulfate, a major component of PM\u2082.\u2085. It is often observed alongside nitrogen oxides (NO\u2093), as both originate from combustion processes. These interactions contribute to the formation of secondary pollutants and regional haze conditions.",
    environmentalSignificance:
      "SO\u2082 monitoring provides a direct indication of sulfur-related emissions from refinery operations. When combined with meteorological data, it supports identification of emission sources, evaluation of dispersion patterns, and assessment of potential impacts on surrounding environments.",
  },
  {
    key: "no2",
    description:
      "Nitrogen dioxide (NO\u2082) is a reactive gas formed during high-temperature combustion and is a major component of nitrogen oxides (NO\u2093). It is commonly used as an indicator of combustion efficiency and emission intensity.",
    category: "Environmental Compound",
    icon: <FlaskConical className={ICON_CLASS} />,
    source:
      "NO\u2082 is mainly produced from refinery combustion units, flaring systems, power generation equipment, and heavy-duty vehicles.",
    atmosphericBehaviour:
      "NO\u2082 plays a key role in atmospheric chemistry. Under sunlight, it undergoes photolysis to form nitric oxide (NO) and atomic oxygen, which subsequently contributes to ozone (O\u2083) formation. This process is a major pathway for photochemical smog development.",
    meteorologicalInteraction:
      "Solar radiation is a primary driver for NO\u2082 photochemical reactions, particularly in ozone formation. Higher temperatures enhance reaction rates, while low wind speeds can lead to accumulation of NO\u2082 near emission sources. Rainfall contributes to atmospheric cleansing, reducing NO\u2082 levels. Atmospheric stability also affects how NO\u2082 is distributed vertically and horizontally.",
    relatedPollutants:
      "NO\u2082 reacts with volatile organic compounds (VOCs), including BTEX, to form ozone and secondary organic aerosols. It is also linked with particulate matter formation through reactions with ammonia and other atmospheric compounds.",
    environmentalSignificance:
      "NO\u2082 monitoring provides insight into combustion-related emissions and allows assessment of ozone formation potential. It is also useful for identifying emission patterns associated with refinery operations and transport activities.",
  },
  {
    key: "btex",
    description:
      "BTEX refers to a group of volatile organic compounds (VOCs) \u2014 Benzene, Toluene, Ethylbenzene, and Xylene \u2014 commonly present in petroleum products. These compounds are important indicators of hydrocarbon emissions in refinery environments.",
    category: "Environmental Compound",
    icon: <FlaskConical className={ICON_CLASS} />,
    source:
      "BTEX emissions are mainly from storage tanks, fuel handling systems, loading activities, and fugitive emissions from pipelines and equipment.",
    atmosphericBehaviour:
      "BTEX compounds are highly volatile and can disperse quickly depending on wind conditions. Their atmospheric lifetime varies; benzene is more stable, while toluene and xylene degrade more rapidly. These compounds participate in photochemical reactions and contribute to secondary pollutant formation.",
    meteorologicalInteraction:
      "Temperature plays a significant role in BTEX emissions, with higher temperatures increasing evaporation rates. Solar radiation promotes reactions with NO\u2082, leading to ozone formation. Low wind speeds may result in localized accumulation, while higher wind speeds enhance dispersion. Atmospheric mixing height also influences vertical distribution.",
    relatedPollutants:
      "BTEX reacts with NO\u2082 in the presence of sunlight to form ozone and contributes to photochemical smog. It is also closely associated with total VOC (TVOC) levels and hydrocarbon emission profiles.",
    environmentalSignificance:
      "BTEX monitoring is essential for identifying fugitive emissions and evaluating hydrocarbon release from refinery operations. It also supports assessment of photochemical pollution potential and overall air quality conditions.",
  },
  {
    key: "h2s",
    description:
      "Hydrogen sulfide (H\u2082S) is a sulfur-containing gas commonly associated with petroleum processing and organic decomposition processes.",
    category: "Environmental Compound",
    icon: <FlaskConical className={ICON_CLASS} />,
    source:
      "H\u2082S is generated from crude processing units, sulfur recovery systems, and wastewater treatment facilities.",
    atmosphericBehaviour:
      "H\u2082S is generally short-lived and disperses rapidly but is often detected close to its source. It can be oxidized into sulfur dioxide and other sulfur compounds over time.",
    meteorologicalInteraction:
      "Wind direction is critical for identifying emission sources and determining transport pathways. Low wind speeds may lead to accumulation and increased odour impact. Higher temperatures can increase emission rates from process systems. Humidity may influence odour perception and gas behaviour.",
    relatedPollutants:
      "H\u2082S is part of the sulfur cycle and may contribute to SO\u2082 formation through oxidation. It is often associated with odour-related pollutants and may occur together with other reduced sulfur compounds.",
    environmentalSignificance:
      "H\u2082S monitoring is important for early detection of sulfur-related emissions and for assessing odour impact in the refinery area. It also supports identification of process-related emission events.",
  },

  // ── Meteorological Parameters ──────────────────────────────────────────
  {
    key: "temperature",
    description:
      "Temperature represents the thermal condition of the atmosphere.",
    category: "Meteorological",
    icon: <Thermometer className={ICON_CLASS} />,
    source: "Solar heating, atmospheric circulation, and land use patterns.",
    atmosphericBehaviour:
      "Temperature directly affects the release of volatile compounds such as BTEX from refinery systems and controls the rate of chemical reactions in the atmosphere.",
    meteorologicalInteraction:
      "Higher temperatures increase evaporation from storage and process units, leading to higher concentrations of VOCs. They also enhance photochemical reactions, contributing to ozone formation. In contrast, lower temperatures under stable conditions may limit dispersion. Temperature works closely with solar radiation and humidity in controlling reaction rates and pollutant transformation.",
    relatedPollutants:
      "Temperature influences emission rates of VOCs (especially BTEX) and controls photochemical reaction rates involving NO\u2082 and ozone formation.",
    environmentalSignificance:
      "Temperature is measured to understand how emission rates and atmospheric reactions vary under different conditions. It is a fundamental driver of atmospheric chemistry and pollutant dispersion behaviour.",
  },
  {
    key: "humidity",
    description:
      "Relative humidity indicates the amount of moisture present in the air.",
    category: "Meteorological",
    icon: <Droplets className={ICON_CLASS} />,
    source:
      "Evaporation from water bodies, transpiration from vegetation, and atmospheric processes.",
    atmosphericBehaviour:
      "Humidity influences chemical transformation and particle formation in the atmosphere, particularly in coastal environments such as Pengerang.",
    meteorologicalInteraction:
      "High humidity enhances the conversion of SO\u2082 into sulfate particles and may influence the formation of secondary particulate matter. It can also increase the perception of odorous gases such as H\u2082S. Humidity interacts with temperature and pressure to determine atmospheric conditions and pollutant behaviour.",
    relatedPollutants:
      "Humidity is closely linked to SO\u2082-to-sulfate conversion, secondary PM\u2082.\u2085 formation, and H\u2082S odour perception.",
    environmentalSignificance:
      "Humidity is measured to evaluate its influence on chemical transformation and particle formation in the atmosphere, particularly in coastal environments such as Pengerang.",
  },
  {
    key: "windSpeed",
    description: "Wind speed is the rate at which air moves across a location.",
    category: "Meteorological",
    icon: <Wind className={ICON_CLASS} />,
    source: "Pressure gradients, thermal convection, and geographic features.",
    atmosphericBehaviour:
      "Wind speed directly controls the dispersion and dilution of pollutants emitted from the refinery. It determines how far and how quickly emissions travel from their source.",
    meteorologicalInteraction:
      "Low wind speeds may lead to accumulation of pollutants near the refinery boundary, resulting in higher localized concentrations. Higher wind speeds promote dispersion and reduce pollutant levels but may transport pollutants over a wider area. Wind speed works together with wind direction to define pollutant transport and dispersion patterns.",
    relatedPollutants:
      "Wind speed affects the ground-level concentrations of all emitted pollutants including SO\u2082, NO\u2082, H\u2082S, and BTEX.",
    environmentalSignificance:
      "Wind speed is measured to assess the dispersion and dilution of pollutants emitted from the refinery. It is critical for dispersion modelling and emission impact assessment.",
  },
  {
    key: "windDirection",
    description:
      "Wind direction indicates the direction from which the wind originates.",
    category: "Meteorological",
    icon: <Compass className={ICON_CLASS} />,
    source:
      "Synoptic weather patterns, sea-land breezes, and topographic channelling.",
    atmosphericBehaviour:
      "Wind direction determines the transport pathway of pollutants from emission sources to receptor areas. It is essential for source attribution analysis.",
    meteorologicalInteraction:
      "By correlating pollutant concentration with wind direction, it is possible to confirm whether emissions originate from specific refinery units or external sources. Wind direction, combined with wind speed, forms the basis of dispersion analysis and source identification.",
    relatedPollutants:
      "Wind direction is used alongside all pollutant measurements for source identification and transport pathway analysis.",
    environmentalSignificance:
      "Wind direction is measured to identify potential emission sources and determine pollutant transport pathways in the refinery area.",
  },
  {
    key: "pressure",
    description:
      "Atmospheric pressure represents the force exerted by the air in the atmosphere.",
    category: "Meteorological",
    icon: <Gauge className={ICON_CLASS} />,
    source: "Atmospheric dynamics, weather systems, and altitude.",
    atmosphericBehaviour:
      "Pressure indicates atmospheric stability and mixing conditions, which directly influence how pollutants are distributed vertically and horizontally.",
    meteorologicalInteraction:
      "High-pressure systems are associated with stable conditions that may trap pollutants near the ground, while low-pressure systems enhance mixing and dispersion. Pressure affects temperature profiles, wind patterns, and overall atmospheric stability.",
    relatedPollutants:
      "Pressure influences the dispersion of all monitored pollutants through its effect on atmospheric stability and mixing height.",
    environmentalSignificance:
      "Pressure is measured to understand atmospheric stability and mixing conditions, which influence how pollutants are distributed in the Pengerang area.",
  },
  {
    key: "solar",
    description:
      "Solar radiation is the energy from sunlight reaching the Earth's surface.",
    category: "Meteorological",
    icon: <Sun className={ICON_CLASS} />,
    source:
      "Solar electromagnetic radiation. Varies with time of day, cloud cover, and season.",
    atmosphericBehaviour:
      "Solar radiation drives photochemical reactions in the atmosphere, particularly those involving refinery emissions. It is the primary energy source for ozone-forming reactions.",
    meteorologicalInteraction:
      "Higher solar radiation increases ozone formation through reactions involving NO\u2082 and BTEX. It also enhances overall atmospheric reactivity, particularly during daytime. Solar radiation works together with temperature to control reaction intensity and pollutant transformation.",
    relatedPollutants:
      "Solar radiation is the key driver of NO\u2082 photolysis, ozone formation, and photochemical reactions involving BTEX.",
    environmentalSignificance:
      "Solar radiation is measured as it drives photochemical reactions in the atmosphere, particularly those involving refinery emissions.",
  },
  {
    key: "rain",
    description: "Precipitation refers to rainfall over a given period.",
    category: "Meteorological",
    icon: <CloudRain className={ICON_CLASS} />,
    source:
      "Atmospheric moisture condensation, convective and frontal weather systems.",
    atmosphericBehaviour:
      "Rain reduces concentrations of gases and particles through wet deposition. This results in temporary improvement in air quality, depending on the intensity and duration of rainfall.",
    meteorologicalInteraction:
      "Rainfall is influenced by humidity, temperature, and pressure, and directly affects pollutant removal processes. It is a natural air-cleansing mechanism that removes particulates and soluble gases from the atmosphere.",
    relatedPollutants:
      "Rain removes SO\u2082, NO\u2082, particulate matter, and other soluble pollutants through wet deposition. Acid rain can form from dissolved SO\u2082 and NO\u2082.",
    environmentalSignificance:
      "Rainfall is measured to assess its role in removing pollutants from the atmosphere through wet deposition.",
  },
];

const CATEGORIES = ["Environmental Compound", "Meteorological"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  "Environmental Compound": "bg-red-500/10 text-red-400 border-red-500/20",
  Meteorological: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

/* ── Section config for expanded detail ────────────────────────────────────── */

const DETAIL_SECTIONS: {
  field: keyof ParameterInfo;
  label: string;
  icon: JSX.Element;
}[] = [
  {
    field: "source",
    label: "WHERE DOES IT COME FROM",
    icon: <Factory className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />,
  },
  {
    field: "atmosphericBehaviour",
    label: "ATMOSPHERIC BEHAVIOUR",
    icon: <Cloud className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />,
  },
  {
    field: "meteorologicalInteraction",
    label: "METEOROLOGICAL INTERACTION",
    icon: <Wind className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />,
  },
  {
    field: "relatedPollutants",
    label: "RELATED POLLUTANTS",
    icon: <Link2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />,
  },
  {
    field: "environmentalSignificance",
    label: "ENVIRONMENTAL SIGNIFICANCE",
    icon: <Leaf className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />,
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
    <div className="flex bg-[#050b0b] min-h-screen text-gray-100 overflow-x-hidden min-w-0 font-sans selection:bg-teal-500/30">
      <Sidebar
        active="Knowledge Center"
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />

      <div className="flex flex-col flex-1 min-w-0 relative">
        {/* Ambient atmospheric glows */}
        <div className="fixed top-0 left-[20%] w-[40rem] h-[40rem] bg-teal-900/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-0 right-[10%] w-[30rem] h-[30rem] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

        <Topbar
          title="Parameter Information"
          onMenuToggle={() => setSidebarOpen(true)}
        />

        <div className="flex-1 p-4 sm:p-8 space-y-8 min-w-0 relative z-10 max-w-[1600px] 2xl:max-w-[1800px] mx-auto w-full">
          {/* Hero Section */}
          <div className="flex flex-col gap-4 bg-white/[0.02] border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-700 pointer-events-none">
              <Info className="w-64 h-64" />
            </div>
            <div className="relative z-10">
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-3">
                Parameter{" "}
                <span className="font-semibold text-teal-400">
                  Reference Guide
                </span>
              </h1>
              <p className="text-gray-400 text-base sm:text-lg max-w-3xl leading-relaxed">
                Comprehensive specifications for all environmental and
                meteorological parameters monitored at station in SK Pengerang.
              </p>
            </div>
          </div>

          {/* Controls: Search + Category Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-[#0b1212]/80 backdrop-blur-md p-2 rounded-[1.5rem] border border-white/5 sticky top-4 z-40 shadow-2xl">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500/70" />
              <input
                type="text"
                placeholder="Search parameters or descriptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-transparent border-none rounded-xl text-sm sm:text-base text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-0 transition-all font-medium"
              />
              {/* Animated bottom border for input */}
              <div
                className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-teal-500/0 via-teal-500/30 to-teal-500/0 scale-x-0 transition-transform duration-500 origin-left block"
                style={{ transform: search ? "scaleX(1)" : "scaleX(0)" }}
              />
            </div>

            <div className="w-[1px] h-8 bg-white/10 hidden lg:block mx-2" />

            <div className="flex gap-2 flex-wrap items-center px-2 pb-2 lg:pb-0">
              <button
                onClick={() => setActiveCategory(null)}
                className={`relative px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 overflow-hidden ${
                  !activeCategory
                    ? "text-white shadow-[0_0_20px_rgba(20,184,166,0.3)]"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}
              >
                {!activeCategory && (
                  <div className="absolute inset-0 bg-teal-500/20 backdrop-blur-sm" />
                )}
                {!activeCategory && (
                  <div className="absolute inset-0 border border-teal-400/50 rounded-xl" />
                )}
                <span className="relative z-10">All Parameters</span>
              </button>
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                const isEnv = cat === "Environmental Compound";
                const activeColorClass = isEnv
                  ? "text-red-100 shadow-[0_0_20px_rgba(248,113,113,0.2)]"
                  : "text-blue-100 shadow-[0_0_20px_rgba(96,165,250,0.2)]";
                const activeBg = isEnv ? "bg-red-500/20" : "bg-blue-300/20";
                const activeBorder = isEnv
                  ? "border-red-400/50"
                  : "border-blue-300/50";

                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(isActive ? null : cat)}
                    className={`relative px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 overflow-hidden ${
                      isActive
                        ? activeColorClass
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
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
              const isEnv = info.category === "Environmental Compound";

              return (
                <div
                  key={info.key}
                  className={`group relative bg-[#0b1212]/40 backdrop-blur-sm border rounded-3xl overflow-hidden transition-all duration-500 hover:bg-[#0b1212]/80 ${
                    isExpanded ? "2xl:col-span-2" : "2xl:col-span-1"
                  } ${
                    isExpanded
                      ? isEnv
                        ? "border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.06)]"
                        : "border-blue-400/30 shadow-[0_0_40px_rgba(96,165,250,0.06)]"
                      : "border-white/5 hover:border-white/10"
                  }`}
                  style={{
                    animationFillMode: "both",
                    animationDelay: `${idx * 50}ms`,
                  }}
                >
                  {/* Subtle Top Gradient Line */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      isEnv
                        ? "bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0"
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
                        isEnv
                          ? isExpanded
                            ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]"
                            : "bg-red-500/5 border-red-500/10 text-red-400/70 group-hover:bg-red-500/10 group-hover:border-red-500/20 group-hover:text-red-400 group-hover:shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]"
                          : isExpanded
                            ? "bg-blue-400/10 text-blue-400 border-blue-400/20 shadow-[inset_0_0_20px_rgba(96,165,250,0.2)]"
                            : "bg-blue-400/5 border-blue-400/10 text-blue-400/70 group-hover:bg-blue-400/10 group-hover:border-blue-400/20 group-hover:text-blue-400 group-hover:shadow-[inset_0_0_20px_rgba(96,165,250,0.1)]"
                      }`}
                    >
                      <div className="transform scale-110">{info.icon}</div>
                    </div>

                    <div className="flex-1 min-w-0 pt-1 sm:pt-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
                        <h3 className="text-[14px] sm:text-[15px] font-bold tracking-tight text-gray-50 flex items-center gap-3">
                          {param?.label ?? info.key.toUpperCase()}
                          {param?.unit && (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono font-medium text-gray-400">
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
                        className={`text-[14px] sm:text-[15px] text-gray-400/90 leading-relaxed font-normal max-w-4xl ${isExpanded ? "" : "line-clamp-1"}`}
                      >
                        {info.description}
                      </p>
                    </div>

                    <div
                      className={`absolute top-6 right-6 sm:relative sm:top-0 sm:right-0 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500 ${
                        isExpanded
                          ? isEnv
                            ? "bg-red-500/10 border-red-500/30 text-red-400 rotate-180"
                            : "bg-blue-500/10 border-blue-500/30 text-blue-400 rotate-180"
                          : "bg-transparent border-white/5 text-gray-500 group-hover:bg-white/5 group-hover:text-gray-300"
                      }`}
                    >
                      <ChevronDown className={`w-5 h-5 transition-colors`} />
                    </div>
                  </button>

                  {/* Expanded Details with CSS Grid animation */}
                  <div
                    className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="p-6 sm:p-8 pt-0 border-t border-white/5 bg-black/10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                          {DETAIL_SECTIONS.map(({ field, label, icon }) => (
                            <div
                              key={field}
                              className="group/section flex gap-5 p-6 rounded-2xl bg-[#0b1212]/60 border border-white/[0.03] hover:border-white/10 hover:bg-[#0b1212]/90 hover:shadow-lg transition-all duration-300"
                            >
                              <div className="h-max p-3 rounded-xl bg-white/[0.03] text-gray-400 border border-white/[0.05] group-hover/section:scale-110 group-hover/section:bg-white/[0.08] transition-all duration-300">
                                {icon}
                              </div>
                              <div>
                                <h4 className="text-[14px] font-bold tracking-[0.2em] text-gray-500 mb-2 uppercase">
                                  {label}
                                </h4>
                                <p className="text-[14px] text-gray-300 leading-relaxed font-light">
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
              <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-sm">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <Search className="w-10 h-10 text-gray-500/50" />
                </div>
                <h3 className="text-xl font-semibold text-gray-200 mb-2">
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
                  className="mt-8 px-6 py-2.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 hover:border-teal-500/40 rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.15)] text-sm font-semibold tracking-wide"
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
