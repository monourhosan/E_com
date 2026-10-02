import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Zap,
  Server,
  Layers,
} from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "CarryBee Courier API",
    description: "Automated, asynchronous order dispatch queue with retry mechanisms.",
  },
  {
    icon: ShieldCheck,
    title: "Atomic Inventory Locking",
    description: "SELECT ... FOR UPDATE prevents overselling during high-demand flash sales.",
  },
  {
    icon: Zap,
    title: "bKash & SSLCommerz",
    description: "Multi-gateway payment support with webhook idempotency protection.",
  },
  {
    icon: Server,
    title: "Redis Cache Tags",
    description: "Sub-50ms catalog responses with automated cache invalidation on stock change.",
  },
];

export function Features() {
  return (
    <section id="architecture" className="py-16 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
            <Layers className="h-3.5 w-3.5" />
            Core Architectural Principles
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Built for Extreme Reliability
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Every layer from database transaction management to asynchronous queues is structured for zero-data-loss commerce.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="flex flex-col items-start p-6 rounded-xl border bg-card hover:border-primary/40 transition-colors shadow-sm"
              >
                <div className="p-3 rounded-lg bg-primary/10 text-primary mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-base text-foreground mb-1">
                  {f.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
