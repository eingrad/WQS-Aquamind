import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Search,
  MessageCircle,
  ClipboardCopy,
  CheckCircle2,
  Send,
  Smartphone,
  Monitor,
  Users,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
} from "lucide-react";

const STEPS = [
  {
    number: 1,
    title: "Install Telegram",
    description: "Download and install Telegram on your preferred device.",
    icon: Download,
    color: "from-blue-500 to-blue-600",
    glowColor: "shadow-blue-500/20",
    content: (
      <div className="space-y-4">
        <p className="text-slate-700 text-sm leading-relaxed">
          Telegram is available on all major platforms. Choose your preferred
          option:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="https://apps.apple.com/app/telegram-messenger/id686449807"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-slate-100 hover:bg-slate-100 border border-slate-200 hover:border-blue-500/30 rounded-xl px-4 py-3 transition-all duration-300 group"
          >
            <Smartphone className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-sm font-medium text-slate-700">iOS</div>
              <div className="text-xs text-gray-500">App Store</div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-500 ml-auto" />
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=org.telegram.messenger"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-slate-100 hover:bg-slate-100 border border-slate-200 hover:border-green-500/30 rounded-xl px-4 py-3 transition-all duration-300 group"
          >
            <Smartphone className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-sm font-medium text-slate-700">Android</div>
              <div className="text-xs text-gray-500">Google Play</div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-500 ml-auto" />
          </a>
          <a
            href="https://desktop.telegram.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-slate-100 hover:bg-slate-100 border border-slate-200 hover:border-purple-500/30 rounded-xl px-4 py-3 transition-all duration-300 group sm:col-span-2"
          >
            <Monitor className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-sm font-medium text-slate-700">
                Desktop App
              </div>
              <div className="text-xs text-gray-500">Windows, macOS, Linux</div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-500 ml-auto" />
          </a>
        </div>
      </div>
    ),
  },
  {
    number: 2,
    title: "Start the AquaMind Alert Bot",
    description: "Search for our bot on Telegram and initiate a conversation.",
    icon: Search,
    color: "from-blue-500 to-emerald-500",
    glowColor: "shadow-blue-500/20",
    content: (
      <div className="space-y-4">
        <p className="text-slate-700 text-sm leading-relaxed">
          Open Telegram and follow these steps to find and start our alert bot:
        </p>
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 text-xs font-bold flex items-center justify-center mt-0.5">
              1
            </span>
            <span className="text-sm text-slate-700">
              Tap the <strong className="text-blue-600">Search icon</strong>{" "}
              (🔍) at the top of the Telegram app.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 text-xs font-bold flex items-center justify-center mt-0.5">
              2
            </span>
            <span className="text-sm text-slate-700">
              Search for{" "}
              <code className="bg-blue-900/40 text-blue-600 px-2 py-0.5 rounded text-xs font-mono">
                @AquaMindAlertBot
              </code>{" "}
              (or the bot name provided by your admin).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 text-xs font-bold flex items-center justify-center mt-0.5">
              3
            </span>
            <span className="text-sm text-slate-700">
              Tap on the bot and press the{" "}
              <strong className="text-blue-600">START</strong> button at the
              bottom of the chat.
            </span>
          </li>
        </ol>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 mt-3">
          <p className="text-xs text-blue-600 flex items-start gap-2">
            <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
            The bot will respond with a welcome message confirming the
            connection is active.
          </p>
        </div>
      </div>
    ),
  },
  {
    number: 3,
    title: "Get Your Chat ID",
    description: "Retrieve your unique Telegram Chat ID using a simple bot.",
    icon: ClipboardCopy,
    color: "from-amber-500 to-orange-500",
    glowColor: "shadow-amber-500/20",
    content: (
      <div className="space-y-4">
        <p className="text-slate-700 text-sm leading-relaxed">
          Your <strong className="text-amber-600">Chat ID</strong> is a unique
          number that lets us send alerts to your Telegram account.
        </p>
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 text-xs font-bold flex items-center justify-center mt-0.5">
              1
            </span>
            <span className="text-sm text-slate-700">
              Open Telegram and search for{" "}
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:text-amber-600 underline underline-offset-2"
              >
                @userinfobot
              </a>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 text-xs font-bold flex items-center justify-center mt-0.5">
              2
            </span>
            <span className="text-sm text-slate-700">
              Press <strong className="text-amber-600">START</strong> or send
              any message to the bot.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 text-xs font-bold flex items-center justify-center mt-0.5">
              3
            </span>
            <span className="text-sm text-slate-700">
              The bot will reply with your account info. Look for the{" "}
              <strong className="text-amber-600">Id</strong> field — that's your
              Chat ID.
            </span>
          </li>
        </ol>

        {/* Example response */}
        <div className="bg-[#ffffff] border border-slate-200 rounded-xl p-4 font-mono text-xs space-y-1">
          <div className="text-gray-500 mb-2">— Bot response —</div>
          <div className="text-slate-500">@your_username</div>
          <div className="text-amber-600 font-semibold">Id: 123456789</div>
          <div className="text-slate-500">First: Your Name</div>
          <div className="text-gray-500 text-[10px] mt-2 font-sans">
            ↑ Copy the numeric Id value
          </div>
        </div>
      </div>
    ),
  },
  {
    number: 4,
    title: "Enter Chat ID in Settings",
    description:
      "Paste your Chat ID in the settings page and test the connection.",
    icon: CheckCircle2,
    color: "from-emerald-500 to-green-500",
    glowColor: "shadow-emerald-500/20",
    content: (
      <div className="space-y-4">
        <p className="text-slate-700 text-sm leading-relaxed">
          You're almost done! Head back to the Settings page and complete the
          setup:
        </p>
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center justify-center mt-0.5">
              1
            </span>
            <span className="text-sm text-slate-700">
              Go to{" "}
              <Link
                to="/settings"
                className="text-emerald-600 hover:text-emerald-600 underline underline-offset-2"
              >
                Settings → Notification Preferences
              </Link>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center justify-center mt-0.5">
              2
            </span>
            <span className="text-sm text-slate-700">
              Enable the{" "}
              <strong className="text-emerald-600">
                Telegram Notifications
              </strong>{" "}
              toggle.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center justify-center mt-0.5">
              3
            </span>
            <span className="text-sm text-slate-700">
              Paste your <strong className="text-emerald-600">Chat ID</strong>{" "}
              into the input field.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center justify-center mt-0.5">
              4
            </span>
            <span className="text-sm text-slate-700">
              Click the <strong className="text-emerald-600">Test</strong>{" "}
              button to send a test notification.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center justify-center mt-0.5">
              5
            </span>
            <span className="text-sm text-slate-700">
              Click{" "}
              <strong className="text-emerald-600">Save Preferences</strong> to
              finalize your setup.
            </span>
          </li>
        </ol>
      </div>
    ),
  },
];

const FAQ_ITEMS = [
  {
    question: "Can I receive alerts in a Telegram group?",
    answer:
      "Yes! Add the bot to your group, then use @userinfobot in the group to get the group's Chat ID (it will be a negative number like -123456789). Enter that group Chat ID in your settings.",
  },
  {
    question: "I'm not receiving test notifications",
    answer:
      "Make sure you have pressed START on the bot before testing. Also verify that your Chat ID is correct and has no extra spaces. If problems persist, try restarting the bot conversation and getting a fresh Chat ID.",
  },
  {
    question: "Can multiple users share the same Chat ID?",
    answer:
      "Each user has a unique Chat ID. If you want multiple people to receive alerts, either have each user set up their own Chat ID, or use a group Chat ID so everyone in the group gets notified.",
  },
  {
    question: "What kind of alerts will I receive?",
    answer:
      "You will receive threshold breach alerts for all monitored parameters (SO₂, H₂S, NO₂, etc.), data quality flags, and system status notifications based on your alert threshold configuration.",
  },
];

export default function TelegramSetupGuide() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedStep, setExpandedStep] = useState<number>(0);

  return (
    <div className="bg-[#ffffff] min-h-screen text-slate-700 w-screen max-w-screen overflow-x-hidden">
      <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full">
        {/* Back Button */}
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Settings
        </Link>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#93c5fd] to-[#ffffff] border border-slate-200 p-6 sm:p-8 mb-8">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Telegram Icon */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Send className="w-8 h-8 sm:w-10 sm:h-10 text-slate-800" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-[#93c5fd]">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-800" />
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-300 via-emerald-300 to-blue-400 bg-clip-text text-transparent mb-2">
                Telegram Alert Setup
              </h1>
              <p className="text-slate-500 text-sm sm:text-base max-w-lg leading-relaxed">
                Get real-time monitoring alerts delivered straight to your
                Telegram. Follow the steps below to connect your account in just
                a few minutes.
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="relative grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-200">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">4</div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider">
                Steps
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">~3 min</div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider">
                Setup Time
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">24/7</div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider">
                Alert Delivery
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isExpanded = expandedStep === index;

            return (
              <div
                key={step.number}
                className={`rounded-2xl border transition-all duration-500 ${
                  isExpanded
                    ? `bg-[#ffffff] border-slate-200 ${step.glowColor} shadow-lg`
                    : "bg-[#ffffff] border-slate-200 hover:border-slate-200"
                }`}
              >
                {/* Step Header */}
                <button
                  onClick={() => setExpandedStep(isExpanded ? -1 : index)}
                  className="flex items-center gap-4 w-full p-4 sm:p-5 text-left"
                >
                  {/* Step number badge */}
                  <div
                    className={`relative flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg transition-transform duration-300 ${
                      isExpanded ? "scale-110" : ""
                    }`}
                  >
                    <Icon className="w-5 h-5 text-slate-800" />
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#ffffff] border border-slate-200 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-700">
                        {step.number}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-700 text-sm sm:text-base">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                      {step.description}
                    </p>
                  </div>

                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Step Content */}
                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    isExpanded
                      ? "max-h-[800px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 sm:px-5 pb-5 pt-0 ml-0 sm:ml-16">
                    {step.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Connection line decoration */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-5 py-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-600 font-medium">
              You're all set to receive alerts!
            </span>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="rounded-2xl bg-[#ffffff] border border-slate-200 overflow-hidden mb-8">
          <div className="px-5 py-4 bg-[#ffffff] border-b border-slate-200 flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h2 className="font-medium text-slate-700">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {FAQ_ITEMS.map((faq, index) => (
              <div key={index}>
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                  className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm font-medium text-slate-700 pr-4">
                    {faq.question}
                  </span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedFaq === index
                      ? "max-h-48 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="px-5 pb-4 text-sm text-slate-500 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Need more help section */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-500/5 to-blue-500/5 border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-slate-700 mb-1">
              Need more help?
            </h3>
            <p className="text-xs text-gray-500">
              Contact your system administrator or reach out to the IT support
              team for assistance with bot configuration and access.
            </p>
          </div>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
