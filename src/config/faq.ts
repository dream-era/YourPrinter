export interface FAQItem {
  id: string;
  category: "General" | "Security" | "Hardware" | "Pricing" | "Developers";
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: "general-1",
    category: "General",
    question: "What is YourPrinter and how does it work?",
    answer:
      "YourPrinter is an enterprise cloud printing and print fleet automation platform. It eliminates traditional print servers, complex drivers, and network VPN constraints by connecting your printers to a secure cloud relay. Users can submit documents from any device (iOS, Android, Windows, Mac, Linux) and print seamlessly to any connected printer globally.",
  },
  {
    id: "general-2",
    category: "General",
    question: "Do users need to install print drivers on their laptops or mobile devices?",
    answer:
      "No! YourPrinter features true driverless BYOD (Bring Your Own Device) technology. Users can send documents via native Web UI, AirPrint, Mopria, or email attachment without installing any local printer drivers.",
  },
  {
    id: "security-1",
    category: "Security",
    question: "How secure is document transmission over YourPrinter?",
    answer:
      "All documents are encrypted in-transit with TLS 1.3 and at-rest using AES-256 encryption. Additionally, our Zero-Trust architecture ensures print jobs can be held in encrypted memory until released by authorized users at the physical printer via PIN, mobile QR code, or badge swipe.",
  },
  {
    id: "security-2",
    category: "Security",
    question: "Is YourPrinter compliant with SOC2 and HIPAA regulations?",
    answer:
      "Yes. Our Enterprise tier includes SOC2 Type II compliance controls, HIPAA Business Associate Agreements (BAA), automatic document purge options, and audit logging to ensure full regulatory compliance.",
  },
  {
    id: "hardware-1",
    category: "Hardware",
    question: "What printer brands and models are supported?",
    answer:
      "YourPrinter is hardware agnostic. It supports all IPP, ESC/P, PostScript, and PCL-compliant printers from brands like HP, Canon, Epson, Xerox, Brother, Ricoh, Zebra, and Konica Minolta.",
  },
  {
    id: "hardware-2",
    category: "Hardware",
    question: "What happens if a printer runs out of paper or toner?",
    answer:
      "YourPrinter provides real-time SNMP/cloud telemetry for every connected device. Admins receive instant notification alerts when consumable levels drop below configured thresholds or hardware errors occur.",
  },
  {
    id: "pricing-1",
    category: "Pricing",
    question: "Can I try YourPrinter before purchasing?",
    answer:
      "Yes, we offer a 14-day free trial on all plans with full access to core feature sets, no credit card required.",
  },
  {
    id: "pricing-2",
    category: "Pricing",
    question: "Can I accept payments from users to monetize my public printers?",
    answer:
      "Yes! With our Razorpay integration, commercial print shops, hotels, libraries, and universities can set up pay-per-print pricing (per page color vs. B&W) and collect payments seamlessly via UPI, credit card, or QR code before releasing print jobs.",
  },
  {
    id: "developers-1",
    category: "Developers",
    question: "Does YourPrinter offer an API for programmatic print automation?",
    answer:
      "Yes! Our REST API and Webhook suite allow developers to trigger print jobs automatically from web apps, ERPs, warehouse management systems, or backend cron workers in Python, Node.js, Go, or cURL.",
  },
];
