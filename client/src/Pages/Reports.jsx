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
        // Format the post data to ensure image paths are correct
        const post = response.data[0];
        
        // Ensure profilePic has the correct format
        if (post.profilePic && !post.profilePic.startsWith('http') && !post.profilePic.startsWith('/upload/')) {
          post.profilePic = `/upload/${post.profilePic}`;
        }
        
        // Ensure img has the correct format
        if (post.img && !post.img.startsWith('http') && !post.img.startsWith('/upload/')) {
          post.img = `/upload/${post.img}`;
        }
        
        setSelectedPost(post);
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

  if (loading && !isRefreshing && !postModalOpen) {
    return (
      <div className={`flex items-center justify-center min-h-[50vh] ${
        theme === "dark" ? "text-gray-300" : "text-gray-700"
      }`}>
        <div className="text-center">
          <RefreshCw size={40} className="animate-spin mx-auto mb-4 text-emerald-500" />
          <p className="text-lg font-semibold">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error && !postModalOpen) {
    return (
      <div className={`flex items-center justify-center min-h-[50vh] ${
        theme === "dark" ? "text-red-400" : "text-red-600"
      }`}>
        <div className="text-center">
          <AlertCircle size={40} className="mx-auto mb-4" />
          <p className="text-lg font-semibold">{error}</p>
          <button 
            onClick={handleRefresh}
            className={`mt-4 px-4 py-2 rounded-lg ${
              theme === "dark" 
                ? "bg-gray-800 hover:bg-gray-700 text-white" 
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-2 sm:p-4 md:p-6 lg:p-8 ${theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
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
            <div className="absolute inset-0 bg-repeat" style={{ backgroundImage: "url('/pattern-light.svg')" }}></div>
          </div>
          
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  theme === "dark" ? "bg-red-900/30" : "bg-red-100"
                }`}>
                  <Flag className={`h-8 w-8 ${
                    theme === "dark" ? "text-red-400" : "text-red-500"
                  }`} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Content Reports</h1>
                  <p className={`mt-1 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}>
                    Review and manage reported content
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    theme === "dark" 
                      ? "hover:bg-gray-700 text-gray-300" 
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                  disabled={isRefreshing}
                >
                  <RefreshCw size={20} className={isRefreshing ? "animate-spin text-emerald-500" : ""} />
                </button>
                
                <button
                  onClick={exportAllReports}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                    theme === "dark" 
                      ? "bg-gray-700 hover:bg-gray-600 text-white" 
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }`}
                >
                  <FileSpreadsheet size={18} />
                  <span className="hidden sm:inline">Export All</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reports Table */}
        <div className={`rounded-3xl shadow-lg overflow-hidden border ${
          theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`text-left ${
                theme === "dark" ? "bg-gray-900/50" : "bg-gray-50"
              }`}>
                <tr>
                  <th className="px-6 py-4 font-semibold">Report</th>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Reason</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <Flag className={`h-12 w-12 mx-auto mb-4 opacity-30 ${
                        theme === "dark" ? "text-gray-500" : "text-gray-400"
                      }`} />
                      <p className="text-lg font-medium">No reports found</p>
                      <p className={`mt-1 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}>
                        There are currently no content reports to review
                      </p>
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className={`${
                      theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                    }`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={`font-medium ${
                            theme === "dark" ? "text-gray-200" : "text-gray-900"
                          }`}>
                            #{report.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}>
                          {report.user_name || `User ${report.user_id}` || "Anonymous"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`max-w-xs truncate ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`} title={report.reason}>
                          {report.reason || "No reason provided"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}>
                          {new Date(report.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          report.reviewed === 0 || report.reviewed === null
                            ? theme === "dark" 
                              ? "bg-yellow-900/30 text-yellow-400" 
                              : "bg-yellow-100 text-yellow-800"
                            : report.reviewed === 1
                              ? theme === "dark"
                                ? "bg-green-900/30 text-green-400"
                                : "bg-green-100 text-green-800"
                              : theme === "dark"
                                ? "bg-red-900/30 text-red-400"
                                : "bg-red-100 text-red-800"
                        }`}>
                          {report.reviewed === 0 || report.reviewed === null
                            ? "Pending"
                            : report.reviewed === 1
                              ? "Resolved"
                              : "Rejected"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewPost(report.post_id)}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              theme === "dark" 
                                ? "hover:bg-gray-700 text-blue-400 hover:text-blue-300" 
                                : "hover:bg-gray-100 text-blue-600 hover:text-blue-700"
                            }`}
                            title="View Post"
                          >
                            <Eye size={18} />
                          </button>
                          
                          <button
                            onClick={() => handleExport(report)}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              theme === "dark" 
                                ? "hover:bg-gray-700 text-gray-400 hover:text-gray-300" 
                                : "hover:bg-gray-100 text-gray-600 hover:text-gray-700"
                            }`}
                            title="Export Report"
                          >
                            <Download size={18} />
                          </button>
                          
                          {(report.reviewed === 0 || report.reviewed === null) && (
                            <>
                              <button
                                onClick={() => handleReview(report.id, 1)}
                                className={`p-2 rounded-lg transition-all duration-200 ${
                                  theme === "dark" 
                                    ? "hover:bg-gray-700 text-green-400 hover:text-green-300" 
                                    : "hover:bg-gray-100 text-green-600 hover:text-green-700"
                                }`}
                                title="Mark as Resolved"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              
                              <button
                                onClick={() => handleReview(report.id, 2)}
                                className={`p-2 rounded-lg transition-all duration-200 ${
                                  theme === "dark" 
                                    ? "hover:bg-gray-700 text-red-400 hover:text-red-300" 
                                    : "hover:bg-gray-100 text-red-600 hover:text-red-700"
                                }`}
                                title="Mark as Rejected"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Post Modal */}
      {postModalOpen && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-lg rounded-3xl p-8 shadow-2xl border relative ${
              theme === "dark" 
                ? "bg-gray-900 border-gray-800 text-white" 
                : "bg-white border-gray-100 text-gray-900"
            }`}
          >
            <button
              className={`absolute top-6 right-6 hover:text-gray-700 text-2xl transition ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
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
                  src={selectedPost.profilePic ? 
                    (selectedPost.profilePic.startsWith('http') ? 
                      selectedPost.profilePic : 
                      `/upload/${selectedPost.profilePic}`) 
                    : "/default-profile.jpg"} 
                  alt="User" 
                  className="w-10 h-10 rounded-full mr-3 border-2 border-emerald-400"
                  onError={(e) => {
                    console.error("Failed to load profile image");
                    e.target.src = "/default-profile.jpg";
                  }}
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
                    src={selectedPost.img.startsWith('http') ? 
                      selectedPost.img : 
                      `/upload/${selectedPost.img}`} 
                    alt="Post" 
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                    onError={(e) => {
                      console.error("Failed to load post image");
                      e.target.src = "/placeholder-post.jpg";
                    }}
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
                <div className="text-sm mt-2">
                  <span className="font-medium">Reported by: </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {reports.find(r => r.post_id === selectedPost.id || r.post_id === selectedPost.posts_id)?.user_name || 
                     `User ${reports.find(r => r.post_id === selectedPost.id || r.post_id === selectedPost.posts_id)?.user_id}` || 
                     "Unknown user"}
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
                    className="px-6 py-2 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const report = reports.find(r => r.post_id === selectedPost.id || r.post_id === selectedPost.posts_id);
                      if (report) handleReview(report.id, 2);
                      closePostModal();
                    }}
                    className="px-6 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition"
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
  );
};

export default Reports; 







