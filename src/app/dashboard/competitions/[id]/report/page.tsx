"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import * as XLSX from "xlsx";
import BulkDataGrid from "@/components/competitions/BulkDataGrid";

const COLORS = ['#10B981', '#06B6D4', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function CompetitionReportPage() {
  const params = useParams();
  const id = params.id as string;
  const [competition, setCompetition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<"current" | "total">("total");
  const [showBulkEntry, setShowBulkEntry] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/competitions/${id}/report`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCompetition(data);
    } catch (e) {
      toast.error("Error loading report");
    } finally {
      setLoading(false);
    }
  };

  const reportData = useMemo(() => {
    if (!competition) return null;
    
    // Schema mapping info
    let salesField = "", profitField = "", cupsField = "", cupRevField = "", packetsField = "", revenueField = "", dayField = "";
    
    competition.schema.forEach((f: any) => {
      if (f.mapping === 'sales') salesField = f.id;
      if (f.mapping === 'profit') profitField = f.id;
      if (f.mapping === 'cups_sold') cupsField = f.id;
      if (f.mapping === 'cup_revenue') cupRevField = f.id;
      if (f.mapping === 'packets_sold') packetsField = f.id;
      if (f.mapping === 'packet_revenue') revenueField = f.id;
      if (f.mapping === 'day_number') dayField = f.id;
    });

    let submissions = competition.submissions || [];
    
    // Calculate "Yesterday"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const allDates: string[] = Array.from(new Set<string>(submissions.map((s: any) => new Date(s.submittedAt).toDateString()))).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    if (viewType === "current") {
      // Filter for strictly yesterday's data
      submissions = submissions.filter((s: any) => new Date(s.submittedAt).toDateString() === yesterdayStr);
    }

    // Aggregations
    let totalSales = 0, totalProfit = 0;
    const teamMap: Record<string, any> = {};
    const individualMap: Record<string, any> = {};

    // First, initialize teams and individuals from ALL submissions to calculate missing reports accurately even in "current" view
    const allSubmissions = competition.submissions || [];
    allSubmissions.forEach((sub: any) => {
      const tName = sub.teamName || "Unknown Team";
      if (!teamMap[tName]) {
        teamMap[tName] = { name: tName, sales: 0, profit: 0, cups: 0, cupRevenue: 0, packets: 0, revenue: 0, score: 0, submittedDates: new Set() };
      }
      teamMap[tName].submittedDates.add(new Date(sub.submittedAt).toDateString());

      if (sub.type === "individual") {
        const indName = sub.studentName || sub.rollNumber;
        if (!individualMap[indName]) {
          individualMap[indName] = { name: indName, roll: sub.rollNumber, team: tName, sales: 0, profit: 0, cups: 0, packets: 0, score: 0, submittedDates: new Set() };
        }
        individualMap[indName].submittedDates.add(new Date(sub.submittedAt).toDateString());
      }
    });

    // Determine missing dates for each team and individual
    Object.values(teamMap).forEach(t => {
      t.missingDates = allDates.filter(d => !t.submittedDates.has(d)).map(d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
      t.daysActive = t.submittedDates.size;
    });
    Object.values(individualMap).forEach(i => {
      i.missingDates = allDates.filter(d => !i.submittedDates.has(d)).map(d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
    });

    // Now calculate metrics based on filtered submissions
    submissions.forEach((sub: any) => {
      const sales = Number(sub.data[salesField] || 0);
      const profit = Number(sub.data[profitField] || 0);
      const cups = Number(sub.data[cupsField] || 0);
      const cupRevenue = Number(sub.data[cupRevField] || 0);
      const packets = Number(sub.data[packetsField] || 0);
      const revenue = Number(sub.data[revenueField] || 0);
      
      totalSales += sales;
      totalProfit += profit;

      const tName = sub.teamName || "Unknown Team";
      if (teamMap[tName]) {
        teamMap[tName].sales += sales;
        teamMap[tName].profit += profit;
        teamMap[tName].cups += cups;
        teamMap[tName].cupRevenue += cupRevenue;
        teamMap[tName].packets += packets;
        teamMap[tName].revenue += revenue;
      }

      if (sub.type === "individual") {
        const indName = sub.studentName || sub.rollNumber;
        if (individualMap[indName]) {
          individualMap[indName].sales += sales;
          individualMap[indName].profit += profit;
          individualMap[indName].cups += cups;
          individualMap[indName].packets += packets;
        }
      }
    });

    // Score calculation logic
    Object.values(teamMap).forEach(t => { t.score = t.sales + t.profit; });
    Object.values(individualMap).forEach(i => { i.score = i.cups + i.packets; });

    const teamLeaderboard = Object.values(teamMap).sort((a: any, b: any) => b.score - a.score);
    const individualLeaderboard = Object.values(individualMap).sort((a: any, b: any) => b.score - a.score);

    const topTeam = teamLeaderboard[0]?.name || "N/A";
    const totalTeams = Object.keys(teamMap).length;
    const totalStudents = new Set(allSubmissions.map((s:any) => s.rollNumber)).size;

    // Daily Sales Chart Data
    const dateMap: Record<string, { date: string, dailySales: number }> = {};
    allSubmissions.forEach((sub: any) => {
      const d = new Date(sub.submittedAt).toLocaleDateString();
      if (!dateMap[d]) dateMap[d] = { date: d, dailySales: 0 };
      dateMap[d].dailySales += Number(sub.data[salesField] || 0);
    });
    
    let cum = 0;
    const dailyChartData = Object.values(dateMap).sort((a:any, b:any) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(d => {
      cum += d.dailySales;
      return { ...d, cumulative: cum };
    });

    return {
      totalSales, totalProfit, topTeam, totalTeams, totalStudents,
      teamLeaderboard, individualLeaderboard,
      dailyChartData
    };
  }, [competition, viewType]);

  const handleDownloadExcel = () => {
    if (!competition || !reportData) return;

    const wb = XLSX.utils.book_new();

    // 1. Raw Submissions
    const rawData = competition.submissions.map((sub: any) => {
      const row: any = {
        "Submitted At": new Date(sub.submittedAt).toLocaleString(),
        "Type": sub.type,
        "Team Name": sub.teamName || "N/A",
        "Roll Number": sub.rollNumber,
        "Student Name": sub.studentName,
      };
      
      competition.schema.forEach((field: any) => {
        const val = sub.data[field.id];
        if (field.type === 'repeater' && Array.isArray(val)) {
          row[field.label] = val.map((item: any, i: number) => {
            const parts = (field.subFields || []).map((sf: any) => `${sf.label}: ${item[sf.id] || 'N/A'}`);
            return `[${i + 1}] ${parts.join(', ')}`;
          }).join(' \n');
        } else {
          row[field.label] = val;
        }
      });

      return row;
    });

    const wsRaw = XLSX.utils.json_to_sheet(rawData);
    XLSX.utils.book_append_sheet(wb, wsRaw, "Raw Submissions");

    // 2. Team Leaderboard
    const teamData = reportData.teamLeaderboard.map((team: any, idx: number) => ({
      "Rank": idx + 1,
      "Team Name": team.name,
      "Cups Sold": team.cups,
      "Cup Revenue (Tk)": team.cupRevenue,
      "Packets Sold": team.packets,
      "Packet Revenue (Tk)": team.revenue,
      "Total Sales (Tk)": team.sales,
      "Total Profit (Tk)": team.profit,
      "Score": team.score.toFixed(2),
      "Days Active": team.daysActive,
      "Missing Reports": team.missingDates.join(", ") || "None",
    }));
    const wsTeams = XLSX.utils.json_to_sheet(teamData);
    XLSX.utils.book_append_sheet(wb, wsTeams, "Team Leaderboard");

    // 3. Individual Leaderboard
    const indData = reportData.individualLeaderboard.map((ind: any, idx: number) => ({
      "Rank": idx + 1,
      "Roll Number": ind.roll,
      "Student Name": ind.name,
      "Team": ind.team,
      "Cups Sold": ind.cups,
      "Packets Sold": ind.packets,
      "Missing Reports": ind.missingDates.join(", ") || "None",
      "Score": ind.score.toFixed(2),
    }));
    const wsInd = XLSX.utils.json_to_sheet(indData);
    XLSX.utils.book_append_sheet(wb, wsInd, "Individual Leaderboard");

    XLSX.writeFile(wb, `${competition.title.replace(/\s+/g, '_')}_Report.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col justify-center items-center text-white p-6">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-4"></div>
        <p className="text-emerald-300 font-medium tracking-wide text-lg">Loading Glassmorphic Dashboard...</p>
      </div>
    );
  }

  if (!competition || !reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex justify-center items-center text-slate-300 p-6">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl text-center max-w-md shadow-2xl">
          <p className="text-xl font-semibold text-slate-200">Data not available</p>
          <p className="text-sm text-slate-400 mt-2">The competition report could not be loaded or has no active data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100 p-4 sm:p-6 md:p-8 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Glassmorphic Top Header Banner */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-emerald-500/20 p-5 sm:p-6 rounded-2xl shadow-2xl shadow-emerald-950/40 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-2">
            <span>🏆 Live Leaderboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent tracking-tight">
            {competition.title}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 flex flex-wrap items-center gap-3">
            <span className="bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-slate-700 text-slate-300 font-medium">Batch: {competition.batchName}</span>
            <span className="text-slate-500">·</span>
            <span>Last updated: <strong className="text-slate-300 font-semibold">{new Date().toLocaleTimeString()}</strong></span>
          </p>
        </div>
        
        {/* Action Controls - Mobile Responsive Wrap */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select 
            value={viewType} 
            onChange={(e) => setViewType(e.target.value as any)}
            className="bg-slate-950/90 text-slate-200 border border-slate-700/80 px-3.5 py-2.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none shadow-inner w-full sm:w-auto transition-all"
          >
            <option value="total">Full Report</option>
            <option value="current">Current Report (Yesterday)</option>
          </select>

          <button 
            onClick={() => setShowBulkEntry(true)} 
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/50 hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
          >
            <span>📋</span> Bulk Entry
          </button>

          <button 
            onClick={handleDownloadExcel} 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-950/50 hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
          >
            <span>📥</span> Export Excel
          </button>

          <button 
            onClick={fetchData} 
            className="bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80 px-4 py-2.5 rounded-xl shadow-md hover:text-white transition-all flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
          >
            <span className="text-emerald-400">↻</span> Refresh
          </button>
        </div>
      </div>

      {/* Glassmorphic Stat Cards - Responsive Grid (2 cols mobile, 3 tablet, 5 desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5 mb-8">
        {[
          { label: "Total Sales", value: `৳${reportData.totalSales.toLocaleString()}`, icon: "💰", accent: "from-emerald-500/20 to-teal-500/10", border: "border-emerald-500/30" },
          { label: "Total Profit", value: `৳${reportData.totalProfit.toLocaleString()}`, icon: "📈", accent: "from-teal-500/20 to-cyan-500/10", border: "border-teal-500/30" },
          { label: "Top Team", value: reportData.topTeam, icon: "🏆", accent: "from-amber-500/20 to-yellow-500/10", border: "border-amber-500/30" },
          { label: "Total Teams", value: reportData.totalTeams, icon: "👥", accent: "from-purple-500/20 to-indigo-500/10", border: "border-purple-500/30" },
          { label: "Total Students", value: reportData.totalStudents, icon: "🎓", accent: "from-sky-500/20 to-blue-500/10", border: "border-sky-500/30" }
        ].map((card, i) => (
          <div 
            key={i} 
            className={`bg-slate-900/70 backdrop-blur-xl border ${card.border} p-4 sm:p-5 rounded-2xl shadow-xl transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl`}
          >
            <div className={`absolute -right-4 -bottom-4 w-20 h-20 bg-gradient-to-br ${card.accent} rounded-full blur-xl group-hover:scale-125 transition-all pointer-events-none`}></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{card.label}</span>
              <span className="text-lg">{card.icon}</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white tracking-tight truncate mt-1">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Team Leaderboard Glass Table Container */}
      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl mb-8 overflow-hidden">
        <div className="bg-slate-950/80 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
            <span className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400 text-base">🏅</span>
            Team Leaderboard
          </h2>
          <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            {reportData.teamLeaderboard.length} Teams
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/90 border-b border-slate-800">
                <th className="px-5 py-3.5">Rank</th>
                <th className="px-5 py-3.5">Team</th>
                <th className="px-5 py-3.5 text-right">Cups Sold</th>
                <th className="px-5 py-3.5 text-right">Cup Rev.</th>
                <th className="px-5 py-3.5 text-right">Packets Sold</th>
                <th className="px-5 py-3.5 text-right">Packet Rev.</th>
                <th className="px-5 py-3.5 text-right">Total Sales</th>
                <th className="px-5 py-3.5 text-right">Total Profit</th>
                <th className="px-5 py-3.5 text-right">Score</th>
                <th className="px-5 py-3.5 text-right">Days Active</th>
                <th className="px-5 py-3.5 text-right text-red-400">Missing Reports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {reportData.teamLeaderboard.map((team: any, idx: number) => (
                <tr 
                  key={team.name} 
                  className={`transition-colors hover:bg-emerald-500/5 ${idx === 0 ? "bg-amber-500/10" : idx === 1 ? "bg-slate-400/5" : idx === 2 ? "bg-amber-700/10" : ""}`}
                >
                  <td className="px-5 py-4 font-bold text-slate-300">
                    {idx === 0 ? <span className="text-xl">🥇</span> : idx === 1 ? <span className="text-xl">🥈</span> : idx === 2 ? <span className="text-xl">🥉</span> : <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700">{idx + 1}</span>}
                  </td>
                  <td className="px-5 py-4 font-semibold text-white">{team.name}</td>
                  <td className="px-5 py-4 text-right text-slate-300">{team.cups}</td>
                  <td className="px-5 py-4 text-right text-emerald-400 font-medium">৳{team.cupRevenue.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right text-slate-300">{team.packets}</td>
                  <td className="px-5 py-4 text-right text-teal-400 font-medium">৳{team.revenue.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right font-bold text-emerald-300">৳{team.sales.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right font-bold text-cyan-300">৳{team.profit.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right font-black text-amber-400 text-base">{team.score.toFixed(1)}</td>
                  <td className="px-5 py-4 text-right text-slate-300">{team.daysActive}</td>
                  <td className="px-5 py-4 text-right">
                    {team.missingDates.length > 0 ? (
                      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 max-w-xs">
                        {team.missingDates.join(", ")}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Leaderboard Glass Table Container */}
      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl mb-8 overflow-hidden">
        <div className="bg-slate-950/80 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
            <span className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400 text-base">👤</span>
            Individual Leaderboard
          </h2>
          <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            {reportData.individualLeaderboard.length} Students
          </span>
        </div>
        
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="sticky top-0 bg-slate-950 z-10 border-b border-slate-800">
              <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3.5">Rank</th>
                <th className="px-5 py-3.5">Roll</th>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Team</th>
                <th className="px-5 py-3.5 text-right">Cups Sold</th>
                <th className="px-5 py-3.5 text-right">Packets Sold</th>
                <th className="px-5 py-3.5 text-right text-red-400">Missing Reports</th>
                <th className="px-5 py-3.5 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {reportData.individualLeaderboard.map((ind: any, idx: number) => (
                <tr key={ind.roll} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-400">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700">{idx + 1}</span>
                  </td>
                  <td className="px-5 py-4 text-emerald-400 font-mono font-medium">{ind.roll}</td>
                  <td className="px-5 py-4 font-semibold text-white">{ind.name}</td>
                  <td className="px-5 py-4 text-slate-400">{ind.team}</td>
                  <td className="px-5 py-4 text-right text-slate-300">{ind.cups}</td>
                  <td className="px-5 py-4 text-right text-slate-300">{ind.packets}</td>
                  <td className="px-5 py-4 text-right">
                    {ind.missingDates.length > 0 ? (
                      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 max-w-xs">
                        {ind.missingDates.join(", ")}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">None</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right font-black text-blue-400 text-base">{ind.score.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Glassmorphic Charts Section - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Team Ranking Bar Chart */}
        <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/90 shadow-xl">
          <h3 className="font-bold text-slate-200 text-base mb-4 flex items-center gap-2">
            <span>📊</span> Top Teams Ranking (Score)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.teamLeaderboard.slice(0,5)}>
                <XAxis dataKey="name" stroke="#94A3B8" tick={{fontSize: 12}} />
                <YAxis stroke="#94A3B8" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }} />
                <Bar dataKey="score" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 10 Individuals Bar Chart */}
        <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/90 shadow-xl">
          <h3 className="font-bold text-slate-200 text-base mb-4 flex items-center gap-2">
            <span>🌟</span> Top 10 Individuals (Score)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.individualLeaderboard.slice(0,10)} layout="vertical">
                <XAxis type="number" stroke="#94A3B8" />
                <YAxis dataKey="name" type="category" width={100} stroke="#94A3B8" tick={{fontSize: 11}} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }} />
                <Bar dataKey="score" fill="#3B82F6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team-wise Sales Share */}
        <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/90 shadow-xl">
          <h3 className="font-bold text-slate-200 text-base mb-4 flex items-center gap-2">
            <span>🥧</span> Team Sales Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={reportData.teamLeaderboard} dataKey="sales" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80}>
                  {reportData.teamLeaderboard.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(val: any) => `৳${Number(val).toLocaleString()}`} contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }} />
                <Legend wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily & Cumulative Sales */}
        <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/90 shadow-xl">
          <h3 className="font-bold text-slate-200 text-base mb-4 flex items-center gap-2">
            <span>📈</span> Daily & Cumulative Sales Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94A3B8" tick={{fontSize: 12}} />
                <YAxis stroke="#94A3B8" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }} />
                <Legend wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }} />
                <Line type="monotone" dataKey="dailySales" stroke="#38BDF8" strokeWidth={2.5} name="Daily Sales" />
                <Line type="monotone" dataKey="cumulative" stroke="#10B981" strokeWidth={2.5} name="Cumulative" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {showBulkEntry && (
        <BulkDataGrid 
          competition={competition} 
          onClose={() => setShowBulkEntry(false)}
          onSuccess={() => {
            setShowBulkEntry(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
