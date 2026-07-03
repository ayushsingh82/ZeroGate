import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    apis: [
      { id: "weather",     name: "Weather Oracle", description: "Real-time weather data. The provider never learns your location or query patterns.", price: "$0.10", period: "month", endpoint: "/api/weather",  icon: "weather",     tag: "Oracle",  callsPerMonth: "10,000" },
      { id: "price-feed",  name: "Price Feed",     description: "Crypto asset prices — BTC, ETH, XLM. Your trading queries stay completely private.",   price: "$0.50", period: "month", endpoint: "/api/prices",   icon: "price-feed",  tag: "Finance", callsPerMonth: "50,000" },
      { id: "ai-analysis", name: "AI Analysis",    description: "Private AI inference. Submit queries without linking your identity to the content.",    price: "$1.00", period: "month", endpoint: "/api/analyze",  icon: "ai-analysis", tag: "AI",      callsPerMonth: "1,000"  },
    ],
  });
}
