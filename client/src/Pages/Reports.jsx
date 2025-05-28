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

  const handleViewPost = async (postId) => {
    if (!postId) return;
    
    try {
      setLoading(true);
      const response = await makeRequest.get(`/posts?userId=&category=&postId=${postId}`);
      
      if (response.data && response.data.length > 0) {
        const post = response.data[0];
        
        if (post.profilePic && !post.profilePic.startsWith('http') && !post.profilePic.startsWith('/upload/')) {
          post.profilePic = `/upload/${post.profilePic}`;
        }
        
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
      setError('Failed to fetch post. It may have been deleted.');
    } finally {
      setLoading(false);
    }
  };

  const closePostModal = () => {
    setPostModalOpen(false);
    setSelectedPost(null);
  };

  const handleReview = async (id, reviewed) => {
    try {
      await makeRequest.put(`/reports/${id}`, { reviewed });
      fetchReports();
    } catch (err) {
      setError('Failed to update report status.');
    }
  };

  const exportAllReports = () => {
    const headers = ['Report ID', 'User ID', 'User Name', 'Post ID', 'Reason', 'Date', 'Status'];
    
    const csvContent = [
      headers.join(','),
      ...reports.map(report => [
        report.id,
        report.user_id || 'Anonymous',
        (report.user_name || 'Anonymous').replace(/,/g, ' '),
        report.post_id,
        (report.reason || '').replace(/,/g, ' ').replace(/\n/g, ' '),
        new Date(report.created_at).toLocaleDateString(),
        report.reviewed === 0 || report.reviewed === null ? 'Pending' : 
        report.reviewed === 1 ? 'Resolved' : 'Rejected'
      ].join(','))
    ].join('\n');
    
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

  const handleExport = (report) => {
    const headers = ['Report ID', 'User ID', 'User Name', 'Post ID', 'Reason', 'Date', 'Status'];
    
    const csvContent = [
      headers.join(','),
      [
        report.id,
        report.user_id || 'Anonymous',
        (report.user_name || 'Anonymous').replace(/,/g, ' '),
        report.post_id,
        (report.reason || '').replace(/,/g, ' ').replace(/\n/g, ' '),
        new Date(report.created_at).toLocaleDateString(),
        report.reviewed === 0 || report.reviewed === null ? 'Pending' : 
        report.reviewed === 1 ? 'Resolved' : 'Rejected'
      ].join(',')
    ].join('\n');
    
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
    <div className={`p-4 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
      {/* Header */}
      <div className={`bg-white rounded-xl shadow-sm p-6 mb-6 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${theme === "dark" ? "bg-teal-800/30" : "bg-teal-100"}`}>
              <Flag className="h-6 w-6 text-teal-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Content Reports</h1>
              <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                Review and manage reported content
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={exportAllReports}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                theme === "dark" 
                  ? "bg-teal-600 hover:bg-teal-700 text-white" 
                  : "bg-teal-500 hover:bg-teal-600 text-white"
              }`}
            >
              <FileSpreadsheet size={18} />
              <span>Export All</span>
            </button>
            
            <button
              onClick={handleRefresh}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                theme === "dark" 
                  ? "bg-teal-600 hover:bg-teal-700 text-white" 
                  : "bg-teal-500 hover:bg-teal-600 text-white"
              }`}
              disabled={isRefreshing}
            >
              <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        <div className="mt-4">
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            theme === "dark" ? "bg-yellow-800/20 text-yellow-300" : "bg-yellow-50 text-yellow-700"
          }`}>
            <AlertCircle size={18} />
            <p className="text-sm">Review reported content to maintain community standards and safety.</p>
          </div>
        </div>
      </div>
      
      {/* Reports Table */}
      <div className={`rounded-xl overflow-hidden border ${
        theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`text-left ${
              theme === "dark" ? "bg-gray-700" : "bg-gray-50"
            }`}>
              <tr>
                <th className="px-4 py-3 font-medium text-sm">ID</th>
                <th className="px-4 py-3 font-medium text-sm">USER</th>
                <th className="px-4 py-3 font-medium text-sm">POST</th>
                <th className="px-4 py-3 font-medium text-sm">REASON</th>
                <th className="px-4 py-3 font-medium text-sm">DATE</th>
                <th className="px-4 py-3 font-medium text-sm">STATUS</th>
                <th className="px-4 py-3 font-medium text-sm">ACTIONS</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              theme === "dark" ? "divide-gray-700" : "divide-gray-200"
            }`}>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center">
                    <Flag className={`h-10 w-10 mx-auto mb-2 opacity-30 ${
                      theme === "dark" ? "text-gray-500" : "text-gray-400"
                    }`} />
                    <p className="font-medium">No reports found</p>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className={`${
                    theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                  }`}>
                    <td className="px-4 py-3 text-sm">{report.id}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                          {report.user_name ? report.user_name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <span>{report.user_name || `User ${report.user_id}` || "Anonymous"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewPost(report.post_id)}
                        className={`px-3 py-1 text-xs rounded-md ${
                          theme === "dark" 
                            ? "bg-blue-900/30 text-blue-400 hover:bg-blue-800/50" 
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                      >
                        View Post
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-[200px] truncate">
                      {report.reason || "No reason provided"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs ${
                        report.reviewed === 0 || report.reviewed === null
                          ? theme === "dark" 
                            ? "bg-yellow-900/30 text-yellow-400" 
                            : "bg-yellow-100 text-yellow-700"
                          : report.reviewed === 1
                            ? theme === "dark"
                              ? "bg-green-900/30 text-green-400"
                              : "bg-green-100 text-green-700"
                            : theme === "dark"
                              ? "bg-red-900/30 text-red-400"
                              : "bg-red-100 text-red-700"
                      }`}>
                        {report.reviewed === 0 || report.reviewed === null
                          ? "Pending"
                          : report.reviewed === 1
                            ? "Resolved"
                            : "Rejected"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewPost(report.post_id)}
                          className={`p-1 rounded-full ${
                            theme === "dark" 
                              ? "hover:bg-gray-700 text-blue-400" 
                              : "hover:bg-gray-100 text-blue-600"
                          }`}
                          title="View Post"
                        >
                          <Eye size={16} />
                        </button>
                        
                        <button
                          onClick={() => handleExport(report)}
                          className={`p-1 rounded-full ${
                            theme === "dark" 
                              ? "hover:bg-gray-700 text-gray-400" 
                              : "hover:bg-gray-100 text-gray-600"
                          }`}
                          title="Export Report"
                        >
                          <Download size={16} />
                        </button>
                        
                        {(report.reviewed === 0 || report.reviewed === null) && (
                          <>
                            <button
                              onClick={() => handleReview(report.id, 1)}
                              className={`p-1 rounded-full ${
                                theme === "dark" 
                                  ? "hover:bg-gray-700 text-green-400" 
                                  : "hover:bg-gray-100 text-green-600"
                              }`}
                              title="Mark as Resolved"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            
                            <button
                              onClick={() => handleReview(report.id, 2)}
                              className={`p-1 rounded-full ${
                                theme === "dark" 
                                  ? "hover:bg-gray-700 text-red-400" 
                                  : "hover:bg-gray-100 text-red-600"
                              }`}
                              title="Mark as Rejected"
                            >
                              <XCircle size={16} />
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

      {/* Post Modal */}
      {postModalOpen && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-lg rounded-xl p-6 shadow-xl border relative ${
              theme === "dark" 
                ? "bg-gray-800 border-gray-700 text-white" 
                : "bg-white border-gray-200 text-gray-900"
            }`}
          >
            <button
              className={`absolute top-4 right-4 text-2xl transition ${
                theme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-700"
              }`}
              onClick={closePostModal}
              aria-label="Close"
            >
              <XCircle size={24} />
            </button>
            <h2 className="text-xl font-bold mb-4">Reported Post</h2>
            
            {/* Post Content */}
            <div className={`p-4 rounded-lg border mb-4 ${
              theme === "dark" 
                ? "bg-gray-700 border-gray-600" 
                : "bg-gray-50 border-gray-200"
            }`}>
              <div className="flex items-center mb-3">
                <img 
                  src={selectedPost.profilePic ? 
                    (selectedPost.profilePic.startsWith('http') ? 
                      selectedPost.profilePic : 
                      `/upload/${selectedPost.profilePic}`) 
                    : "/default-profile.jpg"} 
                  alt="User" 
                  className="w-10 h-10 rounded-full mr-3"
                  onError={(e) => {
                    e.target.src = "/default-profile.jpg";
                  }}
                />
                <div>
                  <div className="font-medium">{selectedPost.name || "Anonymous User"}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(selectedPost.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <p className="mb-3">{selectedPost.desc}</p>
              
              {selectedPost.img && (
                <div className="mt-2">
                  <img 
                    src={selectedPost.img.startsWith('http') ? 
                      selectedPost.img : 
                      `/upload/${selectedPost.img}`} 
                    alt="Post" 
                    className={`w-full rounded-lg border shadow-sm ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                    onError={(e) => {
                      e.target.src = "/placeholder-post.jpg";
                    }}
                  />
                </div>
              )}
            </div>
            
            {/* Report Information */}
            <div className="mb-6">
              <h4 className={`text-sm font-medium mb-2 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}>
                Report Information
              </h4>
              <div className={`p-4 rounded-xl border ${
                theme === "dark" 
                  ? "bg-red-900/20 border-red-800/30" 
                  : "bg-red-50 border-red-100"
              }`}>
                <div className="text-sm mb-2">
                  <span className="font-medium">Reason: </span>
                  <span className={
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }>
                    {reports.find(r => r.post_id === selectedPost.id || r.post_id === selectedPost.posts_id)?.reason || "No reason provided"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Reported on: </span>
                  <span className={
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }>
                    {reports.find(r => r.post_id === selectedPost.id || r.post_id === selectedPost.posts_id)?.created_at 
                      ? new Date(reports.find(r => r.post_id === selectedPost.id || r.post_id === selectedPost.posts_id).created_at).toLocaleString()
                      : "Unknown date"}
                  </span>
                </div>
                <div className="text-sm mt-2">
                  <span className="font-medium">Reported by: </span>
                  <span className={
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }>
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
                className={`px-6 py-2 rounded-xl font-semibold transition ${
                  theme === "dark" 
                    ? "bg-gray-800 text-gray-200 hover:bg-gray-700" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
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









