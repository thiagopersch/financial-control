import {
  AlertTriangle,
  BarChart3,
  Bot,
  Building2,
  Calculator,
  CalendarClock,
  CreditCard,
  DollarSign,
  FileBarChart,
  FileText,
  GitBranch,
  GitCompare,
  Landmark,
  LayoutDashboard,
  PieChart,
  RefreshCw,
  ScrollText,
  Settings,
  Sparkles,
  Tag,
  Target,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

export interface Route {
  label: string;
  icon?: any;
  href: string;
  color?: string;
}

export interface RouteGroup {
  title: string;
  icon: any;
  routes: Route[];
}

const dashboardRoutes: Route[] = [
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
];

const accountsRoutes: Route[] = [
  {
    label: "Contas",
    icon: Landmark,
    href: "/accounts",
    color: "text-blue-500",
  },
  {
    label: "Cartões",
    icon: CreditCard,
    href: "/credit-cards",
    color: "text-indigo-500",
  },
  {
    label: "Dívidas",
    icon: AlertTriangle,
    href: "/debts",
    color: "text-red-500",
  },
];

const budgetsRoutes: Route[] = [
  {
    label: "Orçamentos",
    icon: PieChart,
    href: "/budgets",
    color: "text-rose-500",
  },
  {
    label: "Metas",
    icon: Target,
    href: "/goals",
    color: "text-amber-500",
  },
];

const categoriesRoutes: Route[] = [
  {
    label: "Categorias",
    icon: Tag,
    href: "/categories",
    color: "text-pink-700",
  },
  {
    label: "Centros de Custo",
    icon: Building2,
    href: "/cost-centers",
    color: "text-cyan-500",
  },
  {
    label: "Fornecedores",
    icon: Truck,
    href: "/suppliers",
    color: "text-orange-700",
  },
];

const financialRoutes: Route[] = [
  {
    label: "Fluxo de Caixa",
    icon: TrendingUp,
    href: "/cash-flow",
    color: "text-green-500",
  },
  {
    label: "DRE",
    icon: FileText,
    href: "/dre",
    color: "text-emerald-500",
  },
  {
    label: "Insights",
    icon: BarChart3,
    href: "/insights",
    color: "text-purple-500",
  },
  {
    label: "Previsão",
    icon: Calculator,
    href: "/forecast",
    color: "text-teal-500",
  },
];

const automationRoutes: Route[] = [
  {
    label: "Automação",
    icon: GitBranch,
    href: "/automation",
    color: "text-orange-500",
  },
  {
    label: "Agendamentos",
    icon: CalendarClock,
    href: "/scheduled",
    color: "text-blue-400",
  },
  {
    label: "Regras",
    icon: Zap,
    href: "/rules",
    color: "text-yellow-500",
  },
];

const reportsRoutes: Route[] = [
  {
    label: "Relatórios",
    icon: FileBarChart,
    href: "/reports",
    color: "text-slate-500",
  },
  {
    label: "Comparativos",
    icon: GitCompare,
    href: "/comparisons",
    color: "text-violet-600",
  },
  {
    label: "Conciliação",
    icon: RefreshCw,
    href: "/reconciliation",
    color: "text-cyan-600",
  },
];

const aiRoutes: Route[] = [
  {
    label: "Assistente IA",
    icon: Bot,
    href: "/ai-assistant",
    color: "text-pink-500",
  },
  {
    label: "Auditoria",
    icon: ScrollText,
    href: "/audit",
    color: "text-gray-500",
  },
];

const systemRoutes: Route[] = [
  {
    label: "Usuários",
    icon: Users,
    href: "/users",
    color: "text-emerald-500",
  },
  {
    label: "Perfil",
    icon: Settings,
    href: "/profiles",
  },
];

export const routeGroups: RouteGroup[] = [
  {
    title: "Principal",
    icon: LayoutDashboard,
    routes: dashboardRoutes,
  },
  {
    title: "Contas",
    icon: Landmark,
    routes: accountsRoutes,
  },
  {
    title: "Orçamento",
    icon: PieChart,
    routes: budgetsRoutes,
  },
  {
    title: "Organização",
    icon: Tag,
    routes: categoriesRoutes,
  },
  {
    title: "Financeiro",
    icon: DollarSign,
    routes: financialRoutes,
  },
  {
    title: "Automação",
    icon: GitBranch,
    routes: automationRoutes,
  },
  {
    title: "Relatórios",
    icon: FileBarChart,
    routes: reportsRoutes,
  },
  {
    title: "Inteligência",
    icon: Sparkles,
    routes: aiRoutes,
  },
  {
    title: "Sistema",
    icon: Settings,
    routes: systemRoutes,
  },
];

export const flatRoutes = [
  ...dashboardRoutes,
  ...accountsRoutes,
  ...budgetsRoutes,
  ...categoriesRoutes,
  ...financialRoutes,
  ...automationRoutes,
  ...reportsRoutes,
  ...aiRoutes,
  ...systemRoutes,
];
