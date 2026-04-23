"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  Repeat,
  Users,
  Database,
  ArrowRightLeft,
} from "lucide-react";
import { Customer360Row } from "@/types/customer360";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PIE_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#9333ea", "#ef4444", "#14b8a6"];

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  tone?: "default" | "blue" | "green" | "amber";
}) {
  const toneClasses = {
    default: "from-slate-50 to-white border-slate-200",
    blue: "from-blue-50 to-white border-blue-200",
    green: "from-green-50 to-white border-green-200",
    amber: "from-amber-50 to-white border-amber-200",
  };

  return (
    <Card className={`rounded-2xl shadow-sm bg-gradient-to-br ${toneClasses[tone]}`}>
      <CardContent className="p-5 flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-semibold mt-1 text-slate-900">{value}</p>
          <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
        </div>
        <div className="p-3 rounded-2xl bg-white border border-slate-200">
          <Icon className="w-5 h-5 text-slate-700" />
        </div>
      </CardContent>
    </Card>
  );
}

function TransitionBadge({ value }: { value: string | null }) {
  const v = value ?? "Unknown";
  const className =
    v === "Same"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-amber-100 text-amber-800 border-amber-200";

  return <Badge className={`border ${className}`}>{v}</Badge>;
}

export default function Customer360Dashboard({
  rows,
}: {
  rows: Customer360Row[];
}) {
  const [search, setSearch] = useState("");
  const [changeType, setChangeType] = useState("all");
  const [category, setCategory] = useState("all");
  const [groupLabel, setGroupLabel] = useState("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => {
      if (row.category_t6) set.add(row.category_t6);
      if (row.category_t7) set.add(row.category_t7);
    });
    return ["all", ...Array.from(set).sort()];
  }, [rows]);

  const groups = useMemo(() => {
    return [
      "all",
      ...Array.from(new Set(rows.map((d) => d.group_label).filter(Boolean) as string[])).sort(),
    ];
  }, [rows]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchSearch =
        !keyword ||
        String(row.user_id).includes(keyword) ||
        (row.most_search_t6 ?? "").toLowerCase().includes(keyword) ||
        (row.most_search_t7 ?? "").toLowerCase().includes(keyword) ||
        (row.category_t6 ?? "").toLowerCase().includes(keyword) ||
        (row.category_t7 ?? "").toLowerCase().includes(keyword) ||
        (row.group_label ?? "").toLowerCase().includes(keyword);

      const matchType = changeType === "all" || row.change_type === changeType;
      const matchCategory =
        category === "all" ||
        row.category_t6 === category ||
        row.category_t7 === category;

      const matchGroup = groupLabel === "all" || row.group_label === groupLabel;

      return matchSearch && matchType && matchCategory && matchGroup;
    });
  }, [rows, search, changeType, category, groupLabel]);

  const summary = useMemo(() => {
    const total = filtered.length;
    const changed = filtered.filter((d) => d.change_type === "Changed").length;
    const same = filtered.filter((d) => d.change_type === "Same").length;
    const changedRate = total ? Math.round((changed / total) * 100) : 0;

    return { total, changed, same, changedRate };
  }, [filtered]);

  const groupChartData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((row) => {
      const key = row.group_label ?? "Unknown";
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filtered]);

  const typePieData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((row) => {
      const key = row.change_type ?? "Unknown";
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const categoryTransitionData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((row) => {
      const key = `${row.category_t6 ?? "Unknown"} → ${row.category_t7 ?? "Unknown"}`;
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filtered]);

  const resetFilters = () => {
    setSearch("");
    setChangeType("all");
    setCategory("all");
    setGroupLabel("all");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Database className="w-4 h-4" />
              CMS360 • Search Behavior Analytics • Live Supabase App
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold mt-1 tracking-tight">
              Customer 360 Search Shift Dashboard
            </h1>
            <p className="text-slate-600 mt-2 max-w-3xl">
              June vs July user search behavior dashboard powered by Next.js, Supabase, and Vercel.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="rounded-full bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1">
              Live data from Supabase
            </Badge>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          <StatCard title="Total Users" value={summary.total} subtitle="Filtered result set" icon={Users} tone="blue" />
          <StatCard title="Changed Users" value={summary.changed} subtitle="Interest changed between T6 and T7" icon={Repeat} tone="amber" />
          <StatCard title="Same Users" value={summary.same} subtitle="Stayed in the same category" icon={TrendingUp} tone="green" />
          <StatCard title="Change Rate" value={`${summary.changedRate}%`} subtitle="Changed / Total users" icon={ArrowRightLeft} tone="default" />
        </motion.div>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </CardTitle>
            <CardDescription>
              Search by user, content, category, or group label. Use filters to focus on changed behavior patterns.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <div className="xl:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user_id, content, category..."
                className="pl-9 rounded-2xl"
              />
            </div>

            <Select value={changeType} onValueChange={(value) => setChangeType(value ?? "all")}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder="Change type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All change types</SelectItem>
                <SelectItem value="Same">Same</SelectItem>
                <SelectItem value="Changed">Changed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={(value) => setCategory(value ?? "all")}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all" ? "All categories" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select value={groupLabel} onValueChange={(value) => setGroupLabel(value ?? "all")}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g === "all" ? "All groups" : g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={resetFilters} className="rounded-2xl px-3">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="rounded-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Table</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>Change Type Distribution</CardTitle>
                  <CardDescription>
                    How many users stayed in the same category vs changed between months.
                  </CardDescription>
                </CardHeader>

                <CardContent className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={typePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
                        {typePieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>Top Group Labels</CardTitle>
                  <CardDescription>
                    Most common grouped outcomes after comparing category_t6 and category_t7.
                  </CardDescription>
                </CardHeader>

                <CardContent className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupChartData} layout="vertical" margin={{ left: 12, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Top Category Transitions</CardTitle>
                <CardDescription>
                  Most frequent category movement patterns from June to July.
                </CardDescription>
              </CardHeader>

              <CardContent className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryTransitionData} margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" height={70} interval={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0f766e" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>User-level Result Table</CardTitle>
                <CardDescription>
                  Review June vs July most searched content and inspect each user transition.
                </CardDescription>
              </CardHeader>

              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Most Search T6</TableHead>
                      <TableHead>Most Search T7</TableHead>
                      <TableHead>Category T6</TableHead>
                      <TableHead>Category T7</TableHead>
                      <TableHead>Change Type</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filtered.map((row) => (
                      <TableRow key={row.user_id}>
                        <TableCell className="font-medium">{row.user_id}</TableCell>
                        <TableCell>{row.most_search_t6}</TableCell>
                        <TableCell>{row.most_search_t7}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="rounded-full">
                            {row.category_t6 ?? "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="rounded-full">
                            {row.category_t7 ?? "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TransitionBadge value={row.change_type} />
                        </TableCell>
                        <TableCell>{row.group_label}</TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger
                              render={
                                <Button variant="outline" className="rounded-2xl">
                                  View detail
                                </Button>
                              }
                            />

                            <DialogContent className="max-w-2xl rounded-2xl">
                              <DialogHeader>
                                <DialogTitle>User {row.user_id}</DialogTitle>
                                <DialogDescription>
                                  Search interest comparison from June to July.
                                </DialogDescription>
                              </DialogHeader>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <Card className="rounded-2xl">
                                  <CardHeader>
                                    <CardTitle className="text-base">June Snapshot</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2 text-sm">
                                    <div>
                                      <p className="text-slate-500">Most searched content</p>
                                      <p className="font-medium">{row.most_search_t6}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-500">Category</p>
                                      <p className="font-medium">{row.category_t6}</p>
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card className="rounded-2xl">
                                  <CardHeader>
                                    <CardTitle className="text-base">July Snapshot</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2 text-sm">
                                    <div>
                                      <p className="text-slate-500">Most searched content</p>
                                      <p className="font-medium">{row.most_search_t7}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-500">Category</p>
                                      <p className="font-medium">{row.category_t7}</p>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              <Card className="rounded-2xl mt-4 bg-slate-50 border-dashed">
                                <CardContent className="p-4 flex items-center justify-between gap-4">
                                  <div>
                                    <p className="text-sm text-slate-500">Behavior result</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <TransitionBadge value={row.change_type} />
                                      <Badge className="rounded-full bg-slate-100 text-slate-700 border-slate-200">
                                        {row.group_label}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div className="text-right text-sm text-slate-600">
                                    <p>Recommendation idea</p>
                                    <p className="font-medium text-slate-900">
                                      {row.change_type === "Same"
                                        ? "Keep reinforcing this category"
                                        : "Recommend cross-category content"}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filtered.length === 0 && (
                  <div className="text-center py-10 text-slate-500">
                    No records matched the current filters.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}