/**
 * @file        AdminEmployees.jsx
 * @module      pages/admin
 * @description Page component displaying employee roster lists and detailed appraisal scorecard reviews.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useEffect, useState } from 'react';
import employeeService from '../../services/employeeService';
import { Users, Star, Award, MessageSquare, ThumbsUp, Calendar } from 'lucide-react';

/**
 * @function  AdminEmployees
 * @summary   Appraisal dashboard for evaluating chef and driver performance scorecards
 * @returns   {React.ReactElement} AdminEmployees layout markup
 */
function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState(201); // Defaults to Marco
  const [selectedEmpData, setSelectedEmpData] = useState(null);
  
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);

  // Load employee roster list on mount
  useEffect(() => {
    async function loadList() {
      try {
        setLoadingList(true);
        // Fallback checks list from localStorage
        const data = JSON.parse(localStorage.getItem('mock_employees') || '[]');
        setEmployees(data);
      } catch (err) {
        setError('Failed to load employee list.');
      } finally {
        setLoadingList(false);
      }
    }
    loadList();
  }, []);

  // Fetch detailed scorecard when selected employee changes
  useEffect(() => {
    async function loadDetails() {
      if (!selectedEmpId) return;
      try {
        setLoadingDetails(true);
        const data = await employeeService.getEmployeeById(selectedEmpId);
        setSelectedEmpData(data);
      } catch (err) {
        console.error('Failed to load employee details:', err);
      } finally {
        setLoadingDetails(false);
      }
    }
    loadDetails();
  }, [selectedEmpId]);

  if (loadingList) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-1">Staff Scorecards</h1>
        <p className="text-xs text-brand-light/60">Monitor performance scores, customer praise tags, and written feedback logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Employee List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-light/50 px-2 flex items-center gap-1.5">
            <Users size={14} />
            <span>Roster List</span>
          </h3>

          <div className="space-y-3">
            {employees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => setSelectedEmpId(emp.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center space-x-3.5 ${
                  selectedEmpId === emp.id
                    ? 'bg-brand-primary/10 border-brand-primary/40'
                    : 'bg-brand-darker border-white/5 hover:border-white/10'
                }`}
              >
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white text-xs font-extrabold uppercase shrink-0">
                  {emp.name.split(' ')[0][0]}
                  {emp.name.split(' ')[1]?.[0] || ''}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white truncate">{emp.name}</h4>
                    {emp.isEmployeeOfWeek && (
                      <span className="p-0.5 rounded bg-brand-primary/10 text-brand-primary text-[8px] font-bold uppercase tracking-wider">
                        EOTW
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-brand-light/40 truncate">{emp.role}</p>
                </div>
                <div className="flex items-center space-x-0.5 text-[10px] font-extrabold text-brand-primary shrink-0">
                  <Star size={10} fill="currentColor" />
                  <span>{emp.score}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Detailed Scorecard */}
        <div className="lg:col-span-2">
          {loadingDetails || !selectedEmpData ? (
            <div className="glass-card p-12 flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Employee Bio Header */}
              <div className="glass-card p-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="h-16 w-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary text-xl font-extrabold uppercase">
                    {selectedEmpData.name.split(' ')[0][0]}
                    {selectedEmpData.name.split(' ')[1]?.[0] || ''}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <h2 className="text-lg font-bold text-white">{selectedEmpData.name}</h2>
                      <span className="flex items-center space-x-0.5 text-[10px] text-brand-primary font-bold">
                        <Star size={12} fill="currentColor" />
                        <span>{selectedEmpData.score}</span>
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider block">{selectedEmpData.role}</span>
                    <p className="text-xs text-brand-light/60 max-w-md leading-relaxed mt-1">{selectedEmpData.bio}</p>
                  </div>
                </div>

                {selectedEmpData.isEmployeeOfWeek && (
                  <span className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-wider">
                    <Award size={14} />
                    <span>Employee of the Week</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Praise Tags Card */}
                <div className="glass-card p-6 sm:col-span-1 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-light/50 border-b border-white/5 pb-2 flex items-center gap-1.5">
                    <ThumbsUp size={14} />
                    <span>Praise Tags</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {Object.entries(selectedEmpData.praiseTags || {}).map(([tag, count]) => (
                      <div key={tag} className="flex justify-between items-center text-xs">
                        <span className="text-brand-light/60 font-semibold">{tag}</span>
                        <span className="px-2 py-0.5 rounded bg-white/5 font-extrabold text-white">{count}x</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review Feed list */}
                <div className="glass-card p-6 sm:col-span-2 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-light/50 border-b border-white/5 pb-2 flex items-center gap-1.5">
                    <MessageSquare size={14} />
                    <span>Customer Comments</span>
                  </h3>

                  <div className="space-y-4 divide-y divide-white/5 max-h-64 overflow-y-auto pr-2">
                    {selectedEmpData.ratingsFeed.map((feedItem) => (
                      <div key={feedItem.id} className="pt-4 first:pt-0 space-y-1.5 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">{feedItem.customerName}</span>
                            <span className="flex items-center space-x-0.5 text-[10px] text-brand-primary font-bold">
                              <Star size={10} fill="currentColor" />
                              <span>{feedItem.rating}</span>
                            </span>
                          </div>
                          <span className="text-[9px] text-brand-light/30 flex items-center gap-1">
                            <Calendar size={10} />
                            <span>{feedItem.date}</span>
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-brand-light/60 italic">"{feedItem.comment}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminEmployees;
