import { LayoutDashboard, Settings, Tag, Truck, Users, Wallet, Zap } from "lucide-react";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Transações",
    icon: Wallet,
    href: "/transactions",
    color: "text-violet-500",
  },
  {
    label: "Categorias",
    icon: Tag,
    href: "/categories",
    color: "text-pink-700",
  },
  {
    label: "Fornecedores",
    icon: Truck,
    href: "/suppliers",
    color: "text-orange-700",
  },
  {
    label: "Usuários",
    icon: Users,
    href: "/users",
    color: "text-emerald-500",
  },
  {
    label: "Regras",
    icon: Zap,
    href: "/rules",
    color: "text-yellow-500",
  },
  {
    label: "Perfil",
    icon: Settings,
    href: "/profiles",
  },
];

export { routes };
