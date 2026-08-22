"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import * as XLSX from "xlsx";
import BulkDataGrid from "@/components/competitions/BulkDataGrid";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

export default function CompetitionReportPage() {
  const params = useParams();
  const id = params.id as string;
  const [competition, setCompetition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<"current" | "total">("total");
  const [currentDays, setCurrentDays] = useState(3);
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
    let salesField = "", profitField = "", cupsField = "", piecesField = "", packetsField = "", revenueField = "";
    
    competition.schema.forEach((f: any) => {
      if (f.mapping === 'sales') salesField = f.id;
      if (f.mapping === 'profit') profitField = f.id;
      if (f.mapping === 'cups_sold') cupsField = f.id;
      if (f.mapping === 'pieces_sold') piecesField = f.id;
      if (f.mapping === 'packets_sold') packetsField = f.id;
      if (f.mapping === 'packet_revenue') revenueField = f.id;
    });

    let submissions = competition.submissions || [];
    
    if (viewType === "current") {
      // Basic logic to get the most recent N days based on submission dates
      const uniqueDates = Array.from(new Set(submissions.map((s: any) => new Date(s.submittedAt).toDateString()))).sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());
      const recentDates = uniqueDates.slice(0, currentDays);
      submissions = submissions.filter((s: any) => recentDates.includes(new Date(s.submittedAt).toDateString()));
    }

    // Aggregations
    let totalSales = 0, totalProfit = 0;
    const teamMap: Record<string, any> = {};
    const individualMap: Record<string, any> = {};

    submissions.forEach((sub: any) => {
      const sales = Number(sub.data[salesField] || 0);
      const profit = Number(sub.data[profitField] || 0);
      const cups = Number(sub.data[cupsField] || 0);
      const pieces = Number(sub.data[piecesField] || 0);
      const packets = Number(sub.data[packetsField] || 0);
      const revenue = Number(sub.data[revenueField] || 0);
      
      totalSales += sales;
      totalProfit += profit;

      const tName = sub.teamName || "Unknown Team";
      if (!teamMap[tName]) {
        teamMap[tName] = { name: tName, sales: 0, profit: 0, cups: 0, pieces: 0, packets: 0, revenue: 0, score: 0, submissionCount: 0 };
      }
      teamMap[tName].sales += sales;
      teamMap[tName].profit += profit;
      teamMap[tName].cups += cups;
      teamMap[tName].pieces += pieces;
      teamMap[tName].packets += packets;
      teamMap[tName].revenue += revenue;
      teamMap[tName].submissionCount += 1;

      if (sub.type === "individual") {
        const indName = sub.studentName || sub.rollNumber;
        if (!individualMap[indName]) {
          individualMap[indName] = { name: indName, roll: sub.rollNumber, team: tName, sales: 0, profit: 0, cups: 0, pieces: 0, packets: 0, score: 0, submissionCount: 0 };
        }
        individualMap[indName].sales += sales;
        individualMap[indName].profit += profit;
        individualMap[indName].cups += cups;
        individualMap[indName].pieces += pieces;
        individualMap[indName].packets += packets;
        individualMap[indName].submissionCount += 1;
      }
    });

    // Score calculation logic (basic: (sales + profit) / 2 scaled for example, or simply sum)
    Object.values(teamMap).forEach(t => { t.score = (t.sales + t.profit) / 1000; });
    Object.values(individualMap).forEach(i => { i.score = (i.sales + i.profit) / 1000; });

    const teamLeaderboard = Object.values(teamMap).sort((a: any, b: any) => b.score - a.score);
    const individualLeaderboard = Object.values(individualMap).sort((a: any, b: any) => b.score - a.score);

    const topTeam = teamLeaderboard[0]?.name || "N/A";
    const totalTeams = Object.keys(teamMap).length;
    const totalStudents = new Set(submissions.map((s:any) => s.rollNumber)).size;

    // Daily Sales Chart Data
    const dateMap: Record<string, { date: string, dailySales: number }> = {};
    submissions.forEach((sub: any) => {
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
  }, [competition, viewType, currentDays]);

  const handleDownloadExcel = () => {
    if (!competition || !reportData) return;

    // We'll create a workbook with multiple sheets
    const wb = XLSX.utils.book_new();

    // 1. Raw Submissions
    // Convert JSON schema fields to human readable columns
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
      "Pieces Sold": team.pieces,
      "Packets Sold": team.packets,
      "Packet Revenue (Tk)": team.revenue,
      "Total Sales (Tk)": team.sales,
      "Total Profit (Tk)": team.profit,
      "Score": team.score.toFixed(2),
      "Submissions Count": team.submissionCount,
    }));
    const wsTeams = XLSX.utils.json_to_sheet(teamData);
    XLSX.utils.book_append_sheet(wb, wsTeams, "Team Leaderboard");

    // 3. Individual Leaderboard
    const indData = reportData.individualLeaderboard.map((ind: any, idx: number) => ({
      "Rank": idx + 1,
      "Roll Number": ind.roll,
      "Student Name": ind.name,
      "Team": ind.team,
      "Total Sales (Tk)": ind.sales,
      "Total Profit (Tk)": ind.profit,
      "Score": ind.score.toFixed(2),
      "Submissions Count": ind.submissionCount,
    }));
    const wsInd = XLSX.utils.json_to_sheet(indData);
    XLSX.utils.book_append_sheet(wb, wsInd, "Individual Leaderboard");

    // Download the file
    XLSX.writeFile(wb, `${competition.title.replace(/\s+/g, '_')}_Report.xlsx`);
  };

  if (loading) return <div className="p-10 text-center text-xl">Loading Dashboard...</div>;
  if (!competition || !reportData) return <div className="p-10 text-center">Data not available</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🏆 {competition.title} — Live Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Batch: {competition.batchName} · Last updated: {new Date().toLocaleString()}
          </p>
        </div>
        
        <div className="flex gap-4 items-center">
          <select 
            value={viewType} 
            onChange={(e) => setViewType(e.target.value as any)}
            className="border p-2 rounded-md bg-gray-50"
          >
            <option value="total">Full Report</option>
            <option value="current">Current Report (Last {currentDays} Days)</option>
          </select>
          {viewType === "current" && (
            <input 
              type="number" 
              value={currentDays}
              onChange={e => setCurrentDays(Number(e.target.value))}
              className="w-16 border p-2 rounded-md"
              min={1}
            />
          )}
          <button onClick={() => setShowBulkEntry(true)} className="bg-emerald-600 text-white px-4 py-2 rounded shadow hover:bg-emerald-700 transition">
            📋 Bulk Entry
          </button>
          <button onClick={handleDownloadExcel} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
            📥 Export Excel
          </button>
          <button onClick={fetchData} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total Sales", value: `৳${reportData.totalSales.toLocaleString()}` },
          { label: "Total Profit", value: `৳${reportData.totalProfit.toLocaleString()}` },
          { label: "Top Team", value: reportData.topTeam },
          { label: "Total Teams", value: reportData.totalTeams },
          { label: "Total Students", value: reportData.totalStudents }
        ].map((card, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border-b-4 border-green-600">
            <h3 className="text-gray-500 text-xs font-semibold mb-2">{card.label}</h3>
            <p className="text-xl font-bold text-gray-900 leading-tight">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Team Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">🏅 Team Leaderboard</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wide border-b">
                <th className="px-6 py-3">Rank</th>
                <th className="px-6 py-3">Team</th>
                <th className="px-6 py-3 text-right">Cups Sold</th>
                <th className="px-6 py-3 text-right">Pieces Sold</th>
                <th className="px-6 py-3 text-right">Packets Sold</th>
                <th className="px-6 py-3 text-right">Packet Rev.</th>
                <th className="px-6 py-3 text-right">Total Sales</th>
                <th className="px-6 py-3 text-right">Total Profit</th>
                <th className="px-6 py-3 text-right">Score</th>
                <th className="px-6 py-3 text-right">Days Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportData.teamLeaderboard.map((team: any, idx: number) => (
                <tr key={team.name} className={idx < 3 ? "bg-orange-50/30" : "hover:bg-gray-50"}>
                  <td className="px-6 py-4 font-bold text-gray-700">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{team.name}</td>
                  <td className="px-6 py-4 text-right">{team.cups}</td>
                  <td className="px-6 py-4 text-right">{team.pieces}</td>
                  <td className="px-6 py-4 text-right">{team.packets}</td>
                  <td className="px-6 py-4 text-right">৳{team.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-medium">৳{team.sales.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-medium">৳{team.profit.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600">{team.score.toFixed(1)}</td>
                  <td className="px-6 py-4 text-right">{team.submissionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">👤 Individual Leaderboard</h2>
        </div>
        <div className="overflow-x-auto h-96">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white shadow-sm">
              <tr className="text-xs text-gray-500 uppercase tracking-wide border-b">
                <th className="px-6 py-3">Rank</th>
                <th className="px-6 py-3">Roll</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Team</th>
                <th className="px-6 py-3 text-right">Sales</th>
                <th className="px-6 py-3 text-right">Profit</th>
                <th className="px-6 py-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportData.individualLeaderboard.map((ind: any, idx: number) => (
                <tr key={ind.roll} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-700">{idx + 1}</td>
                  <td className="px-6 py-4">{ind.roll}</td>
                  <td className="px-6 py-4 font-semibold">{ind.name}</td>
                  <td className="px-6 py-4 text-gray-500">{ind.team}</td>
                  <td className="px-6 py-4 text-right">৳{ind.sales.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">৳{ind.profit.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600">{ind.score.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        
        {/* Team Ranking Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold mb-4">Team Ranking (Score)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.teamLeaderboard.slice(0,5)}>
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="score" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 10 Individuals Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold mb-4">Top 10 Individuals (Score)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.individualLeaderboard.slice(0,10)} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                <RechartsTooltip />
                <Bar dataKey="score" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team-wise Sales Share */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold mb-4">Team-wise Sales Share</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={reportData.teamLeaderboard} dataKey="sales" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80}>
                  {reportData.teamLeaderboard.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(val: any) => `৳${Number(val).toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily & Cumulative Sales */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold mb-4">Daily & Cumulative Sales</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="dailySales" stroke="#8884d8" name="Daily Sales" />
                <Line type="monotone" dataKey="cumulative" stroke="#10B981" name="Cumulative" />
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
