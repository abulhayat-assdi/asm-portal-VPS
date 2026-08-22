"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface Competition {
  id: string;
  title: string;
  batchName: string;
  isActive: boolean;
  startDate: string;
  createdAt: string;
}

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const res = await fetch("/api/competitions");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCompetitions(data);
    } catch (error) {
      toast.error("Error loading competitions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Competitions (Battle of Cups)</h1>
        <Link
          href="/dashboard/competitions/create"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow transition"
        >
          + Create New
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : competitions.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
          No competitions found. Create one to get started!
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {competitions.map((comp) => (
                <tr key={comp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{comp.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comp.batchName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${comp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {comp.isActive ? 'Active' : 'Ended'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(comp.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <Link href={`/dashboard/competitions/${comp.id}/report`} className="text-blue-600 hover:text-blue-900">
                      Report
                    </Link>
                    <Link href={`/competitions/${comp.id}/submit`} className="text-green-600 hover:text-green-900" target="_blank">
                      Form Link
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
