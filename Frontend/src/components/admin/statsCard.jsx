import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const StatsCard = ({ title, value, icon, change, color = "primary" }) => {
  // Determine if change is positive or negative
  const isPositive = change > 0;

  // Color classes based on theme
  const colorClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
    accent: "bg-accent/10 text-accent border-accent/20",
    info: "bg-info/10 text-info border-info/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    error: "bg-error/10 text-error border-error/20",
  };

  return (
    <div className={`card border ${colorClasses[color]} shadow-sm`}>
      <div className="card-body p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-medium opacity-70">{title}</h3>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-full bg-${color}/10`}>{icon}</div>
        </div>

        {change !== undefined && (
          <div className="mt-4 flex items-center gap-1">
            <div
              className={`badge ${
                isPositive ? "badge-success" : "badge-error"
              } gap-1`}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(change)}%
            </div>
            <span className="text-xs opacity-70">compared to average</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
