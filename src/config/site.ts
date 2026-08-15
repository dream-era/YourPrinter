export const siteConfig = {
  name: "YourPrinter",
  description:
    "Next-Generation Cloud Printing, Print Fleet Automation, and Driverless Document Routing for Modern Enterprises.",
  url: "https://yourprinter.in",
  ogImage: "https://yourprinter.in/og.png",
  links: {
    twitter: "https://twitter.com/yourprinter",
    github: "https://github.com/yourprinter/yourprinter",
    docs: "https://docs.yourprinter.in",
  },
  mainNav: [
    { title: "Home", href: "/" },
    { title: "Features", href: "/features" },
    { title: "Pricing", href: "/pricing" },
    { title: "About", href: "/about" },
    { title: "FAQ", href: "/faq" },
    { title: "Contact", href: "/contact" },
  ],
  footerNav: {
    product: [
      { title: "Cloud Print Engine", href: "/features#cloud-engine" },
      { title: "Fleet Sync & Telemetry", href: "/features#fleet-sync" },
      { title: "Driverless BYOD", href: "/features#driverless" },
      { title: "Enterprise Security", href: "/features#security" },
      { title: "Developer API & Webhooks", href: "/features#api" },
    ],
    company: [
      { title: "About Us", href: "/about" },
      { title: "Careers", href: "/about#careers" },
      { title: "Press & News", href: "/about#press" },
      { title: "Contact Sales", href: "/contact" },
    ],
    resources: [
      { title: "Documentation", href: "#" },
      { title: "Pricing & Tiers", href: "/pricing" },
      { title: "Frequently Asked Questions", href: "/faq" },
      { title: "System Status", href: "#" },
    ],
    legal: [
      { title: "Privacy Policy", href: "/privacy" },
      { title: "Terms & Conditions", href: "/terms" },
      { title: "Cookie Policy", href: "/privacy#cookies" },
      { title: "Security & Compliance", href: "/features#security" },
    ],
  },
  stats: [
    { label: "Active Printers Synced", value: "250,000+" },
    { label: "Pages Printed Daily", value: "12.5M+" },
    { label: "Uptime SLA Guarantee", value: "99.99%" },
    { label: "Enterprise Security", value: "SOC2 & ISO" },
  ],
};

export type SiteConfig = typeof siteConfig;
