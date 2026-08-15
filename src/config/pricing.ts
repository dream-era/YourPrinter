export interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  price: {
    monthly: number;
    annual: number;
  };
  currency: string;
  isPopular?: boolean;
  ctaText: string;
  ctaHref: string;
  features: string[];
  limits: {
    printers: string;
    printJobsPerMonth: string;
    storageGB: string;
    users: string;
  };
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Ideal for small offices, boutiques, and single location businesses.",
    price: {
      monthly: 499,
      annual: 399,
    },
    currency: "₹",
    ctaText: "Start 14-Day Free Trial",
    ctaHref: "/contact?plan=starter",
    limits: {
      printers: "Up to 5 Printers",
      printJobsPerMonth: "2,500 Pages / mo",
      storageGB: "10 GB Cloud Storage",
      users: "3 Team Members",
    },
    features: [
      "Driverless Mobile & Desktop Printing",
      "Real-time Job Queue Status",
      "Standard PDF & Image Spooling",
      "Basic Cost Allocation Reports",
      "Email & Community Support",
    ],
  },
  {
    id: "pro",
    name: "Professional",
    tagline: "For growing organizations, university departments, & commercial printers.",
    price: {
      monthly: 1499,
      annual: 1199,
    },
    currency: "₹",
    isPopular: true,
    ctaText: "Get Started with Pro",
    ctaHref: "/contact?plan=pro",
    limits: {
      printers: "Up to 25 Printers",
      printJobsPerMonth: "25,000 Pages / mo",
      storageGB: "100 GB Cloud Storage",
      users: "15 Team Members",
    },
    features: [
      "Everything in Starter, plus:",
      "Automatic Toner Telemetry & Alerts",
      "Multi-location Cloud Routing",
      "Secure Pin-Code & RFID Release",
      "Razorpay / QR Pay-Per-Print Integration",
      "Custom Watermarking & Audit Trails",
      "Priority 24/7 Support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise Fleet",
    tagline: "For multi-site corporations, print shops, and high-security institutions.",
    price: {
      monthly: 4999,
      annual: 3999,
    },
    currency: "₹",
    ctaText: "Contact Enterprise Sales",
    ctaHref: "/contact?plan=enterprise",
    limits: {
      printers: "Unlimited Printers",
      printJobsPerMonth: "Unlimited Pages",
      storageGB: "1 TB Cloud Storage",
      users: "Unlimited Users",
    },
    features: [
      "Everything in Professional, plus:",
      "Dedicated On-Premise Gateway Appliance",
      "SAMLS / SSO / Active Directory Sync",
      "SOC2 Type II & HIPAA Compliance Mode",
      "Custom Webhooks & REST API Access",
      "Custom SLA & Dedicated Account Manager",
      "Zero-Trust Encrypted Print Channels",
    ],
  },
];

export const PRICING_COMPARISON = [
  {
    category: "Printing & Fleet Infrastructure",
    features: [
      { name: "Max Connected Printers", starter: "5", pro: "25", enterprise: "Unlimited" },
      { name: "Driverless BYOD Support", starter: true, pro: true, enterprise: true },
      { name: "AirPrint & Mopria Compatibility", starter: true, pro: true, enterprise: true },
      { name: "Multi-Location WAN Sync", starter: false, pro: true, enterprise: true },
      { name: "Automatic Printer Auto-Discovery", starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: "Security & Access Control",
    features: [
      { name: "End-to-End AES-256 Encryption", starter: true, pro: true, enterprise: true },
      { name: "PIN Code Secure Release", starter: false, pro: true, enterprise: true },
      { name: "Badge / RFID Card Pull-Printing", starter: false, pro: true, enterprise: true },
      { name: "SAML 2.0 / Okta / Azure AD SSO", starter: false, pro: false, enterprise: true },
      { name: "Audit Trail & Compliance Logs", starter: "7 Days", pro: "90 Days", enterprise: "7 Years" },
    ],
  },
  {
    category: "Monetization & Analytics",
    features: [
      { name: "Pay-per-Print Gateway (Razorpay)", starter: false, pro: true, enterprise: true },
      { name: "Department Quota Management", starter: false, pro: true, enterprise: true },
      { name: "Exportable CSV & PDF Reports", starter: true, pro: true, enterprise: true },
      { name: "Toner Level & Error Telemetry", starter: false, pro: true, enterprise: true },
    ],
  },
];
