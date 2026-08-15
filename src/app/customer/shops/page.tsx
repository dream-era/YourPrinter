import { Metadata } from "next";
import MapScreenDynamic from "@/components/customer/MapScreenDynamic";

export const metadata: Metadata = {
  title: "Nearby Print Shops | YourPrinter",
  description: "Find nearby print shops",
};

export default function ShopsPage() {
  return <MapScreenDynamic />;
}
