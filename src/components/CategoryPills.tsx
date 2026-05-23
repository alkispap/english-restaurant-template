import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Bed,
  BriefcaseBusiness,
  Ellipsis,
  HeartPulse,
  Home,
  Landmark,
  MapPin,
  Scissors,
  ShoppingBag,
  Ticket,
  Utensils,
  Wrench
} from "lucide-react";
import type { CategoryCard } from "@/lib/directory";

interface CategoryPillsProps {
  categories: CategoryCard[];
  className?: string;
}

interface CategoryStyle {
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

const DEFAULT_STYLE: CategoryStyle = {
  icon: MapPin,
  color: "text-slate-600",
  bgColor: "bg-slate-100"
};

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  accommodation: { icon: Bed, color: "text-indigo-600", bgColor: "bg-indigo-50" },
  hotel: { icon: Bed, color: "text-indigo-600", bgColor: "bg-indigo-50" },
  "food-drink": { icon: Utensils, color: "text-orange-500", bgColor: "bg-orange-50" },
  food: { icon: Utensils, color: "text-orange-500", bgColor: "bg-orange-50" },
  restaurant: { icon: Utensils, color: "text-orange-500", bgColor: "bg-orange-50" },
  health: { icon: HeartPulse, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  medical: { icon: HeartPulse, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  professional: { icon: BriefcaseBusiness, color: "text-blue-600", bgColor: "bg-blue-50" },
  services: { icon: BriefcaseBusiness, color: "text-blue-600", bgColor: "bg-blue-50" },
  "home-services": { icon: Home, color: "text-cyan-600", bgColor: "bg-cyan-50" },
  repair: { icon: Wrench, color: "text-slate-600", bgColor: "bg-slate-100" },
  beauty: { icon: Scissors, color: "text-pink-600", bgColor: "bg-pink-50" },
  shopping: { icon: ShoppingBag, color: "text-rose-500", bgColor: "bg-rose-50" },
  "art-history": { icon: Landmark, color: "text-emerald-500", bgColor: "bg-emerald-50" },
  entertainment: { icon: Ticket, color: "text-orange-600", bgColor: "bg-orange-50" }
};

function getCategoryStyle(slug: string, label: string): CategoryStyle {
  const normalizedSlug = slug.toLowerCase();
  const normalizedLabel = label.toLowerCase();

  return CATEGORY_STYLES[normalizedSlug] || CATEGORY_STYLES[normalizedLabel] || DEFAULT_STYLE;
}

export function CategoryPills({ categories, className = "" }: CategoryPillsProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="flex w-full items-center gap-3 overflow-x-auto pb-4 no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => {
          const style = getCategoryStyle(category.slug, category.label);
          const Icon = style.icon;

          return (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="group flex flex-shrink-0 items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-300"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${style.bgColor}`}>
                <Icon className={`h-5 w-5 ${style.color}`} />
              </div>
              <span className="pr-1 font-bold text-slate-800">{category.label}</span>
            </Link>
          );
        })}

        <Link
          href="/categories"
          className="group flex flex-shrink-0 items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-300"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 transition-colors">
            <Ellipsis className="h-5 w-5 text-blue-500" />
          </div>
          <span className="pr-1 font-bold text-slate-800">More</span>
        </Link>
      </div>
    </div>
  );
}
