"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileCheck, AlertCircle, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

export default function HomeworkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !studentName || !studentId) {
      toast.error("Please fill in all fields and select a file.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10); // Start progress

    const formData = new FormData();
    formData.append("file", file);
    formData.append("studentName", studentName);
    formData.append("studentId", studentId);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 5 : prev));
      }, 500);

      const response = await fetch("/api/homework/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok) {
        toast.success("Homework uploaded successfully!");
        setFile(null);
        setStudentName("");
        setStudentId("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast.error(data.error || "Upload failed. Please try again.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("A network error occurred. Please check your connection.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2">Homework Submission</h2>
        <p className="text-gray-500">Upload your homework files (PDF, Word, Excel, PPT, Images, ZIP)</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Student Name</label>
            <input
              type="text"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Full Name"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Student ID / Roll</label>
            <input
              type="text"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. 1024"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div
          className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all p-8 text-center ${
            dragActive ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-500"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-gray-50 rounded-full group-hover:scale-110 transition-transform">
              {file ? (
                <FileCheck className="w-8 h-8 text-emerald-500" />
              ) : (
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-emerald-500" />
              )}
            </div>
            
            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-xs text-red-500 hover:underline mt-2 flex items-center justify-center gap-1 mx-auto"
                >
                  <X className="w-3 h-3" /> Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Click to upload or drag & drop</p>
                <p className="text-xs text-gray-400">Max size 100MB</p>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isUploading || !file}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${
            isUploading || !file 
              ? "bg-gray-300 cursor-not-allowed" 
              : "bg-emerald-600 shadow-lg shadow-emerald-600/30"
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading {uploadProgress}%
            </>
          ) : (
            "Submit Homework"
          )}
        </button>

        {isUploading && (
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              className="h-full bg-emerald-500"
            />
          </div>
        )}

        <div className="flex items-start gap-2 p-4 bg-emerald-50 rounded-xl">
          <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-emerald-800 leading-relaxed">
            Ensure your file name doesn't contain special characters. Maximum file size is 100MB.
          </p>
        </div>
      </form>
    </div>
  );
}
