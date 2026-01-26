"use client";

import { Circle, CheckCircle, User, Phone, MessageSquare } from "lucide-react";
import { useLocale } from "next-intl";
import { formatDateTime } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  type: "created" | "assigned" | "contact" | "resolved";
  title: string;
  description: string;
  timestamp: string;
}

interface CaseTimelineProps {
  events?: TimelineEvent[];
}

const eventIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  created: Circle,
  assigned: User,
  contact: Phone,
  resolved: CheckCircle,
};

const eventColors: Record<string, string> = {
  created: "bg-blue-500",
  assigned: "bg-purple-500",
  contact: "bg-green-500",
  resolved: "bg-emerald-500",
};

export function CaseTimeline({ events = [] }: CaseTimelineProps) {
  const locale = useLocale();

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">Timeline</h3>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

        <div className="space-y-6">
          {events.length === 0 ? (
            <p className="text-sm text-slate-500 ml-12">
              No timeline events available.
            </p>
          ) : (
            events.map((event, index) => {
              const Icon = eventIcons[event.type] || MessageSquare;
              const colorClass = eventColors[event.type] || "bg-slate-500";

              return (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 ${index !== events.length - 1 ? "pb-6" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900">
                        {event.title}
                      </h4>
                      <span className="text-xs text-slate-500">
                        {formatDateTime(event.timestamp, locale)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {event.description}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
