import React, { useState, useEffect, useContext } from 'react';
import { makeRequest } from '../axios';
import { CheckCircle2, XCircle, Download, FileSpreadsheet, Flag, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import { AuthContext } from '../authContext';
import { useTheme } from '../ThemeContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const { currentUser } = useContext(AuthContext);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await makeRequest.get('/reports');
      setReports(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch reports. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle viewing a reported post
  const handleViewPost = async (postId) => {
    if (!postId) return;
    
    try {
      setLoading(true);
      console.log("Fetching post with ID:", postId); // Debug log
      
      // First try to get the post directly
      const response = await makeRequest.get(`/posts?userId=&category=&postId=${postId}`);
      console.log("Post data received:", response.data); // Debug log
      
      if (response.data && response.data.length > 0) {
        setSelectedPost(response.data[0]);
        setPostModalOpen(true);
        setError(null);
      } else {
        setError('Failed to fetch post. It may have been deleted.');
      }
    } catch (err) {
      console.error("Error fetching post:", err); // Debug log
      setError('Failed to fetch post. It may have been deleted.');
    } finally {
      setLoading(false);
    }
  };

  // Function to close the post modal
  const closePostModal = () => {
    setPostModalOpen(false);
    setSelectedPost(null);
  };

  // Admin review action (mark as reviewed or false)
  const handleReview = async (id, reviewed) => {
    try {
      await makeRequest.put(`/reports/${id}`, { reviewed });
      fetchReports();
    } catch (err) {
      setError('Failed to update report status.');
    }
  };

  // Function to export all reports as CSV
  const exportAllReports = () => {
    // Create CSV content
    const headers = ['Report ID', 'User ID', 'User Name', 'Post ID', 'Reason', 'Date', 'Status'];
    
    const csvContent = [
      headers.join(','),
      ...reports.map(report => [
        report.id,
        report.user_id || 'Anonymous',
        (report.user_name || 'Anonymous').replace(/,/g, ' '), // Replace commas to avoid CSV issues
        report.post_id,
        (report.reason || '').replace(/,/g, ' ').replace(/\n/g, ' '), // Clean reason text
        new Date(report.created_at).toLocaleDateString(),
        report.reviewed === 0 || report.reviewed === null ? 'Pending' : 
        report.reviewed === 1 ? 'Resolved' : 'Rejected'
      ].join(','))
    ].join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reports_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to export a single report as CSV
  const handleExport = (report) => {
    // Create CSV content for a single report
    const headers = ['Report ID', 'User ID', 'User Name', 'Post ID', 'Reason', 'Date', 'Status'];
    
    const csvContent = [
      headers.join(','),
      [
        report.id,
        report.user_id || 'Anonymous',
        (report.user_name || 'Anonymous').replace(/,/g, ' '), // Replace commas to avoid CSV issues
        report.post_id,
        (report.reason || '').replace(/,/g, ' ').replace(/\n/g, ' '), // Clean reason text
        new Date(report.created_at).toLocaleDateString(),
        report.reviewed === 0 || report.reviewed === null ? 'Pending' : 
        report.reviewed === 1 ? 'Resolved' : 'Rejected'
      ].join(',')
    ].join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Report_${report.id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchReports();
    } catch (error) {
      setError('Failed to refresh reports. Please try again later.');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-lg font-semibold">Loading...</div>;
  if (error) return <div className="text-center py-20 text-red-500 font-semibold">{error}</div>;

  return (
    <div className={`min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header Card */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`mb-8 rounded-3xl shadow-xl overflow-hidden relative ${
                theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden opacity-10">
                <div className="absolute -inset-[10px] bg-[radial-gradient(#4ade80_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
            </div>
            
            <div className="relative p-6 sm:p-8 md:p-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl ${
                            theme === "dark" ? "bg-emerald-500/20" : "bg-emerald-100"
                        }`}>
                            <Flag size={28} className={
                                theme === "dark" ? "text-emerald-400" : "text-emerald-600"
                            } />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                                Content Reports
                            </h1>
                            <p className={`text-base ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                Review and manage reported content
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={exportAllReports}
                            className="px-5 py-2.5 rounded-full flex items-center gap-2 shadow-md transition-all bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white"
                            disabled={reports.length === 0}
                        >
                            <FileSpreadsheet size={18} />
                            Export All
                        </motion.button>
                        
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleRefresh}
                            className="px-5 py-2.5 rounded-full flex items-center gap-2 shadow-md transition-all bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white"
                        >
                            <RefreshCw 
                                size={18} 
                                className={`${isRefreshing ? "animate-spin" : ""}`} 
                            />
                            Refresh Reports
                        </motion.button>
                    </div>
                </div>
                
                {/* Reports Info */}
                <div className={`mt-6 p-4 rounded-xl text-sm ${
                    theme === "dark" ? "bg-gray-700/50 text-gray-300" : "bg-gray-50 text-gray-700"
                }`}>
                    <p className="flex items-center gap-2">
                        <AlertCircle size={16} className={theme === "dark" ? "text-amber-400" : "text-amber-500"} />
                        <span>Review reported content to maintain community standards and safety.</span>
                    </p>
                </div>
            </div>
        </motion.div>
        
        {/* Mobile Card View (visible on small screens only) */}
        <div className="block sm:hidden space-y-4">
          {reports.map((report) => (
            <motion.div 
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-xl overflow-hidden border shadow-md ${
                theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}
            >
              <div className={`px-4 py-3 flex justify-between items-center ${
                theme === "dark" ? "bg-gray-900/50" : "bg-emerald-50"
              }`}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-emerald-200 dark:border-emerald-800 flex-shrink-0">
                    <img 
                      src={report.user_profile ? `/upload/${report.user_profile}` : "/default-profile.jpg"} 
                      alt="User" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{report.user_name || `User ${report.user_id}`}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  report.reviewed === 0 || report.reviewed === null
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' 
                    : report.reviewed === 1
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                }`}>
                  {report.reviewed === 0 || report.reviewed === null ? "Pending" : 
                   report.reviewed === 1 ? "Resolved" : "Rejected"}
                </span>
              </div>
              
              <div className="p-4 space-y-3">
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Report ID</div>
                  <div className="text-sm font-medium">{report.id}</div>
                </div>
                
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Reason</div>
                  <div className="text-sm p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">{report.reason}</div>
                </div>
                
                <div>
                  <button 
                    onClick={() => handleViewPost(report.post_id)}
                    className="w-full py-2 mt-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    View Reported Post
                  </button>
                </div>
              </div>
              
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReview(report.id, 1)}
                  disabled={report.reviewed === 1}
                  className={`p-2 rounded-full ${
                    report.reviewed === 0 || report.reviewed === null
                      ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-800/50 shadow-sm'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                  }`}
                  title="Mark as Resolved"
                >
                  <CheckCircle2 className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReview(report.id, 2)}
                  disabled={report.reviewed === 2}
                  className={`p-2 rounded-full ${
                    report.reviewed === 0 || report.reviewed === null
                      ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/50 shadow-sm'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                  }`}
                  title="Reject Report"
                >
                  <XCircle className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleExport(report)}
                  className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50 shadow-sm"
                  title="Export Report"
                >
                  <Download className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Desktop Table View (hidden on small screens) */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border shadow-lg">
          <table className={`w-full min-w-full divide-y ${theme === "dark" ? "bg-gray-800 border-gray-700 divide-gray-700" : "bg-white border-gray-200 divide-gray-200"}`}>
            <thead className={`${theme === "dark" ? "bg-gray-900/70" : "bg-emerald-50"}`}>
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs sm:text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Report ID</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs sm:text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">User</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs sm:text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Post</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs sm:text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Reason</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs sm:text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Date</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs sm:text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Status</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs sm:text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-200"}`}>
              {reports.map((report) => (
                <tr key={report.id} className={`${theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"} transition-colors`}>
                  <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap font-medium">{report.id}</td>
                  <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-emerald-200 dark:border-emerald-800 mr-3 flex-shrink-0">
                        <img 
                          src={report.user_profile ? `/upload/${report.user_profile}` : "/default-profile.jpg"} 
                          alt="User" 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="font-medium">{report.user_name || `User ${report.user_id}`}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-sm">
                    <button 
                      onClick={() => handleViewPost(report.post_id)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50 transition-colors font-medium text-xs flex items-center gap-1.5"
                    >
                      <Eye size={14} />
                      View Post
                    </button>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-sm">
                    <div className="max-w-[200px] md:max-w-xs truncate">
                      {report.reason}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap">
                    {new Date(report.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-sm">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      report.reviewed === 0 || report.reviewed === null
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' 
                        : report.reviewed === 1
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                    }`}>
                      {report.reviewed === 0 || report.reviewed === null ? "Pending" : 
                       report.reviewed === 1 ? "Resolved" : "Rejected"}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap">
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleReview(report.id, 1)}
                        disabled={report.reviewed === 1}
                        className={`p-2 rounded-full ${
                          report.reviewed === 0 || report.reviewed === null
                            ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-800/50 shadow-sm'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                        }`}
                        title="Mark as Resolved"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleReview(report.id, 2)}
                        disabled={report.reviewed === 2}
                        className={`p-2 rounded-full ${
                          report.reviewed === 0 || report.reviewed === null
                            ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/50 shadow-sm'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                        }`}
                        title="Reject Report"
                      >
                        <XCircle className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleExport(report)}
                        className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50 shadow-sm"
                        title="Export Report"
                      >
                        <Download className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Empty State */}
        {reports.length === 0 && (
          <div className={`text-center py-12 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} shadow-lg`}>
            <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Reports Found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              There are currently no reports to review. All content appears to be following community guidelines.
            </p>
          </div>
        )}
        
        {/* Post Modal */}
        {postModalOpen && selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
              className="w-full max-w-lg rounded-3xl p-8 bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800 relative"
            >
              <button
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl transition"
                onClick={closePostModal}
                aria-label="Close"
              >
                <XCircle size={28} strokeWidth={2.5} />
              </button>
              <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Reported Post</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">This post was reported by a user.</p>
              
              {/* Post Content */}
              <div className="p-5 rounded-xl border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex items-center mb-4">
                  <img 
                    src={selectedPost.profilePic ? `/upload/${selectedPost.profilePic}` : "/default-profile.jpg"} 
                    alt="User" 
                    className="w-10 h-10 rounded-full mr-3 border-2 border-emerald-400"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedPost.name || "Anonymous User"}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(selectedPost.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <p className="mb-4 text-gray-800 dark:text-gray-200">{selectedPost.desc}</p>
                
                {selectedPost.img && (
                  <div className="mt-3">
                    <img 
                      src={`/upload/${selectedPost.img}`} 
                      alt="Post" 
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                    />
                  </div>
                )}
              </div>
              
              {/* Report Information */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Report Information
                </h4>
                <div className="p-4 rounded-xl border bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30">
                  <div className="text-sm mb-2">
                    <span className="font-medium">Reason: </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {reports.find(r => r.post_id === selectedPost.id || r.post_id === selectedPost.posts_id)?.reason || "No reason provided"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Reported on: </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {reports.find(r => r.post_id === selectedPost.id || r.post_id === selectedPost.posts_id)?.created_at 
                        ? new Date(reports.find(r => r.post_id === selectedPost.id || r.post_id === selectedPost.posts_id).created_at).toLocaleString()
                        : "Unknown date"}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={closePostModal}
                  className="px-6 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Close
                </button>
                {reports.find(r => r.post_id === selectedPost.id || r.post_id === selectedPost.posts_id)?.reviewed === 0 && (
                  <>
                    <button
                      onClick={() => {
                        const report = reports.find(r => r.post_id === selectedPost.id || r.post_id === selectedPost.posts_id);
                        if (report) handleReview(report.id, 1);
                        closePostModal();
                      }}
                      className="px-6 py-2 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition shadow"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const report = reports.find(r => r.post_id === selectedPost.id || r.post_id === selectedPost.posts_id);
                        if (report) handleReview(report.id, 2);
                        closePostModal();
                      }}
                      className="px-6 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition shadow"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports; 





























