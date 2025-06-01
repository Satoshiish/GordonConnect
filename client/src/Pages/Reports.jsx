import React, { useState, useEffect, useContext } from 'react';
import { makeRequest } from '../axios';
import { CheckCircle2, XCircle, Download, FileSpreadsheet, Flag, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import { AuthContext } from '../authContext';
import { useTheme } from '../ThemeContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

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
  // Add this state for categorizing reports
  const [activeCategory, setActiveCategory] = useState('all');

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

  // Function to handle admin review action (mark as reviewed or false)
  const handleReview = async (id, reviewed) => {
    try {
      setLoading(true);
      
      // Get the report details before updating
      const reportToUpdate = reports.find(report => report.id === id);
      
      // Update the report status
      await makeRequest.put(`/reports/${id}`, { 
        reviewed,
        // Include post_id to ensure backend knows which post this affects
        post_id: reportToUpdate?.post_id
      });
      
      // Refresh the reports list
      await fetchReports();
      
      // Show success message using react-hot-toast
      toast.success(
        reviewed === 1 
          ? "Report approved. Post will remain visible." 
          : "Report rejected."
      );
    } catch (err) {
      console.error("Error updating report:", err);
      setError('Failed to update report status.');
      toast.error("Failed to update report status.");
    } finally {
      setLoading(false);
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

  // Add this function to categorize reports
  const getReportCategories = () => {
    return [
      { id: 'all', label: 'All Reports' },
      { 
        id: 'inappropriate', 
        label: 'Inappropriate Content',
        reasons: [
          "Sexual content",
          "Nudity or pornography",
          "Violence or graphic content",
          "Hate speech or symbols",
          "Promotes illegal activities"
        ]
      },
      { 
        id: 'harassment', 
        label: 'Harassment or Bullying',
        reasons: [
          "Targeted harassment",
          "Threatening language",
          "Cyberbullying",
          "Encouraging others to harass"
        ]
      },
      { 
        id: 'misinformation', 
        label: 'False Information',
        reasons: [
          "Contains inaccurate or outdated information",
          "Misleading content",
          "Health misinformation",
          "Manipulated media"
        ]
      },
      { 
        id: 'spam', 
        label: 'Spam or Misleading',
        reasons: [
          "Repetitive posting",
          "Fake engagement",
          "Scams or fraud",
          "Misleading claims or clickbait"
        ]
      },
      { 
        id: 'intellectual', 
        label: 'Intellectual Property',
        reasons: [
          "Copyright infringement",
          "Trademark violation",
          "Unauthorized use of content"
        ]
      },
      { 
        id: 'privacy', 
        label: 'Privacy Violation',
        reasons: [
          "Shares personal information without consent",
          "Doxxing",
          "Impersonation"
        ]
      },
      { 
        id: 'academic', 
        label: 'Academic Integrity',
        reasons: [
          "Cheating or plagiarism",
          "Selling academic materials",
          "Unauthorized sharing of exam content"
        ]
      },
      { 
        id: 'campus', 
        label: 'Campus Policy Violation',
        reasons: [
          "Violates school values or community standards",
          "Fails to follow official GC communication standards",
          "Unfair to certain groups or students",
          "Triggers anxiety or unnecessary pressure"
        ]
      },
      { 
        id: 'other', 
        label: 'Other Issues',
        reasons: [
          "Not accessible (e.g., unclear for PWDs)",
          "Announced too late or last-minute",
          "Irrelevant to my program or department",
          "Other concern not listed"
        ]
      }
    ];
  };

  // Add this to filter reports by category
  const getFilteredReports = () => {
    if (activeCategory === 'all') return reports;
    
    const categories = getReportCategories();
    const category = categories.find(c => c.id === activeCategory);
    
    if (!category || !category.reasons) return reports;
    
    return reports.filter(report => 
      category.reasons.includes(report.reason)
    );
  };

  if (loading) return <div className={`text-center py-20 text-lg font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Loading...</div>;
  if (error) return <div className={`text-center py-20 font-semibold ${theme === "dark" ? "text-red-400" : "text-red-500"}`}>{error}</div>;

  return (
    <div className={`p-2 sm:p-4 md:p-6 lg:p-8 ${theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header Card with better theme contrast */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden relative ${
                theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"
            }`}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden opacity-15">
                <div className="absolute -inset-[10px] bg-[radial-gradient(#4ade80_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
            </div>
            
            <div className="relative p-4 sm:p-6 md:p-8 lg:p-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${
                            theme === "dark" ? "bg-emerald-500/20" : "bg-emerald-100"
                        }`}>
                            <Flag size={24} className={
                                theme === "dark" ? "text-emerald-400" : "text-emerald-600"
                            } />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                                Content Reports
                            </h1>
                            <p className={`text-sm sm:text-base ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                Review and manage reported content
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap w-full sm:w-auto gap-2 sm:gap-3 mt-3 sm:mt-0">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={exportAllReports}
                            className="flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 shadow-md transition-all bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white"
                            disabled={reports.length === 0}
                        >
                            <FileSpreadsheet size={16} />
                            Export All
                        </motion.button>
                        
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleRefresh}
                            className="flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 shadow-md transition-all bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white"
                        >
                            <RefreshCw 
                                size={16} 
                                className={`${isRefreshing ? "animate-spin" : ""}`} 
                            />
                            Refresh
                        </motion.button>
                    </div>
                </div>
                
                {/* Reports Info - improve padding for smaller screens */}
                <div className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg sm:rounded-xl text-xs sm:text-sm ${
                    theme === "dark" ? "bg-gray-800/70 text-gray-200" : "bg-gray-50 text-gray-700"
                }`}>
                    <p className="flex items-center gap-2">
                        <AlertCircle size={14} className={theme === "dark" ? "text-amber-400" : "text-amber-500"} />
                        <span>Review reported content to maintain community standards and safety.</span>
                    </p>
                </div>
            </div>
        </motion.div>
        
        {/* Add Category Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex space-x-2 pb-2 min-w-max">
            {getReportCategories().map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? theme === "dark"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-emerald-100 text-emerald-700"
                    : theme === "dark"
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Improve Mobile Card View spacing and sizing */}
        <div className="block sm:hidden space-y-3">
          {getFilteredReports().map((report) => (
            <motion.div 
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-xl overflow-hidden border shadow-md ${
                theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}
            >
              <div className={`px-3 py-2.5 flex justify-between items-center ${
                theme === "dark" ? "bg-gray-900/50" : "bg-emerald-50"
              }`}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-emerald-200 dark:border-emerald-800 flex-shrink-0">
                    <img 
                      src={report.user_profile ? `/upload/${report.user_profile}` : "/default-profile.jpg"} 
                      alt="User" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{report.user_name || `User ${report.user_id}`}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
              
              <div className="p-3 space-y-2.5">
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Report ID</div>
                  <div className="text-sm font-medium">{report.id}</div>
                </div>
                
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Reason</div>
                  <div className="text-xs p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50">{report.reason}</div>
                </div>
                
                <div>
                  <button 
                    onClick={() => handleViewPost(report.post_id)}
                    className="w-full py-1.5 mt-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50 transition-colors font-medium text-xs flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} />
                    View Reported Post
                  </button>
                </div>
              </div>
              
              <div className="px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReview(report.id, 1)}
                  disabled={report.reviewed === 1}
                  className={`p-1.5 rounded-full ${
                    report.reviewed === 0 || report.reviewed === null
                      ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-800/50 shadow-sm'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                  }`}
                  title="Mark as Resolved"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReview(report.id, 2)}
                  disabled={report.reviewed === 2}
                  className={`p-1.5 rounded-full ${
                    report.reviewed === 0 || report.reviewed === null
                      ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/50 shadow-sm'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                  }`}
                  title="Reject Report"
                >
                  <XCircle className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleExport(report)}
                  className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50 shadow-sm"
                  title="Export Report"
                >
                  <Download className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Improve Desktop Table View responsiveness */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border shadow-lg scrollbar-none">
          <table className={`w-full min-w-full divide-y ${theme === "dark" ? "bg-gray-850 border-gray-700 divide-gray-700" : "bg-white border-gray-200 divide-gray-200"}`}>
            <thead className={`${theme === "dark" ? "bg-gray-900/90" : "bg-emerald-50"}`}>
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-left text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">ID</th>
                <th className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-left text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">User</th>
                <th className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-left text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Post</th>
                <th className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-left text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Reason</th>
                <th className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-left text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Date</th>
                <th className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-left text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Status</th>
                <th className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-left text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === "dark" ? "divide-gray-800" : "divide-gray-200"}`}>
              {getFilteredReports().map((report) => (
                <tr key={report.id} className={`${theme === "dark" ? "hover:bg-gray-800/70" : "hover:bg-gray-50"} transition-colors`}>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm whitespace-nowrap font-medium">{report.id}</td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full overflow-hidden border-2 border-emerald-200 dark:border-emerald-800 mr-2 sm:mr-3 flex-shrink-0">
                        <img 
                          src={report.user_profile ? `/upload/${report.user_profile}` : "/default-profile.jpg"} 
                          alt="User" 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="font-medium">{report.user_name || `User ${report.user_id}`}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                    <button 
                      onClick={() => handleViewPost(report.post_id)}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50 transition-colors font-medium text-xs flex items-center gap-1.5"
                    >
                      <Eye size={14} />
                      View Post
                    </button>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                    <div className="max-w-[120px] sm:max-w-[150px] md:max-w-xs truncate">
                      {report.reason}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm whitespace-nowrap">
                    {new Date(report.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                    <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium ${
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
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm whitespace-nowrap">
                    <div className="flex space-x-1 sm:space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleReview(report.id, 1)}
                        disabled={report.reviewed === 1}
                        className={`p-1.5 sm:p-2 rounded-full ${
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
                        className={`p-1.5 sm:p-2 rounded-full ${
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
                        className="p-1.5 sm:p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50 shadow-sm"
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
        {getFilteredReports().length === 0 && (
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
              className={`w-full max-w-lg rounded-3xl p-8 shadow-2xl border relative ${
                theme === "dark" 
                  ? "bg-gray-900 border-gray-800 text-white" 
                  : "bg-white border-gray-100 text-gray-900"
              }`}
            >
              <button
                className={`absolute top-6 right-6 text-2xl transition ${
                  theme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-700"
                }`}
                onClick={closePostModal}
                aria-label="Close"
              >
                <XCircle size={28} strokeWidth={2.5} />
              </button>
              <h2 className={`text-2xl font-bold mb-1 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>Reported Post</h2>
              <p className={`mb-6 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>This post was reported by a user.</p>
              
              {/* Post Content */}
              <div className={`p-5 rounded-xl border mb-6 ${
                theme === "dark" 
                  ? "bg-gray-800 border-gray-700" 
                  : "bg-gray-50 border-gray-200"
              }`}>
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
                      e.target.src = "/default-profile.jpg";
                    }}
                  />
                  <div>
                    <div className={`font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>{selectedPost.name || "Anonymous User"}</div>
                    <div className={`text-xs ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}>
                      {new Date(selectedPost.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <p className={`mb-4 ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}>{selectedPost.desc}</p>
                
                {selectedPost.img && (
                  <div className="mt-3">
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
    </div>
  );
};

export default Reports; 


















