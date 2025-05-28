import React, { useContext, useEffect, useState } from "react";
import { makeRequest } from "../axios";
import { useTheme } from "../ThemeContext";
import { AuthContext } from "../authContext";
import emailjs from "@emailjs/browser";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Trash2, 
  Plus, 
  Mail, 
  Image as ImageIcon,
  XCircle,
  Edit2,
  ChevronRight,
  Maximize2,
  Users,
  CalendarDays,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from 'react-hot-toast';

const API_BASE_URL = "https://gordonconnect-production-f2bd.up.railway.app/api";

// Define formatDate function at the top level
const formatDate = (dateString) => {
  if (!dateString) return "TBA";
  
  // Create a date object
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return dateString;
  
  // Format as Month Day, Year (e.g., "Jan 15, 2023")
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const Events = () => {
  const { theme } = useTheme();
  const { currentUser } = useContext(AuthContext);
  const isAdmin = currentUser?.role === "admin";

  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  const [deletingEventId, setDeletingEventId] = useState(null);

  const [joinError, setJoinError] = useState("");

  const today = new Date().toISOString().split('T')[0];

  const formatTimeToAMPM = (timeString) => {
    if (!timeString) return "";
    if (timeString.includes("AM") || timeString.includes("PM")) return timeString;
    const [hours, minutes] = timeString.split(":");
    const hourNum = parseInt(hours, 10);
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minutes.padStart(2, "0")} ${ampm}`;
  };

  const formatTimeTo24Hour = (timeString) => {
    if (!timeString || (!timeString.includes("AM") && !timeString.includes("PM"))) return timeString;
    const timeParts = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeParts) return timeString;
    let [_, hours, minutes, ampm] = timeParts;
    let hourNum = parseInt(hours, 10);
    if (ampm.toUpperCase() === "PM" && hourNum < 12) hourNum += 12;
    if (ampm.toUpperCase() === "AM" && hourNum === 12) hourNum = 0;
    return `${hourNum.toString().padStart(2, "0")}:${minutes.padStart(2, "0")}`;
  };

  const isPastEvent = (eventDate, eventTime) => {
    const now = new Date();
    const [year, month, day] = eventDate.split("-");
    const [hours, minutes] = eventTime.split(":");
    const eventDateTime = new Date(year, month - 1, day, hours, minutes);
    return eventDateTime < now;
  };

  const filterPastEvents = (list) => list.filter((e) => !isPastEvent(e.date, e.time));

  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching events...");
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await makeRequest.get("/events", { headers });
      console.log("Events response:", res.data);
      
      // Handle empty response
      if (!res.data || !Array.isArray(res.data)) {
        console.warn("Events response is not an array:", res.data);
        setEvents([]);
        return;
      }
      
      // Filter out past events and sort by date (newest first)
      const upcomingEvents = filterPastEvents(res.data);
      
      // Sort events by date (newest first)
      const sortedEvents = upcomingEvents.sort((a, b) => {
        // Create Date objects for comparison
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        // Sort descending (newest first)
        return dateB - dateA;
      });
      
      setEvents(sortedEvents);
    } catch (err) {
      console.error("Failed to fetch events", err);
      // Set empty array instead of showing error
      setEvents([]);
      
      // Show toast notification
      toast.error("Failed to load events. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(() => {
      setEvents((prev) => filterPastEvents(prev));
    }, 3600000); // hourly cleanup
    return () => clearInterval(interval);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    try {
      let imageUrl = null;
      
      // If there's an image, upload it first
      if (selectedImage) {
        try {
          const formData = new FormData();
          formData.append("file", selectedImage);
          const token = localStorage.getItem("token");
          
          const uploadRes = await makeRequest.post("upload", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              "Authorization": `Bearer ${token}`
            },
          });
          
          // Just use the filename without the path prefix
          imageUrl = uploadRes.data; 
          console.log("Image uploaded successfully, filename:", imageUrl);
        } catch (uploadErr) {
          console.error("Image upload failed:", uploadErr);
          toast.error("Image upload failed. Creating event without image.");
          imageUrl = null; // Continue without image
        }
      }
      
      // Format the date correctly for the API
      const formattedDate = formatDateForAPI(newEvent.date);
      
      const eventData = {
        ...newEvent,
        date: formattedDate,
        image: imageUrl,
      };
      
      console.log("Creating event with data:", eventData);

      const token = localStorage.getItem("token");
      await makeRequest.post("events", eventData, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      fetchEvents();
      setNewEvent({ title: "", date: "", time: "", location: "", description: "" });
      setSelectedImage(null);
      setImagePreview(null);
      setShowForm(false);
      toast.success("Event created successfully!");
    } catch (err) {
      console.error("Failed to create event:", err);
      if (err.response) {
        console.error("Server response:", err.response.data);
        toast.error(`Failed to create event: ${err.response.data.message || err.response.data}`);
      } else {
        toast.error("Failed to create event. Please try again.");
      }
    }
  };

  const handleDelete = async (id) => {
    setDeletingEventId(id);
    // Wait for animation to finish before removing
    setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Deleting event with ID:", id);
        console.log("Using token:", token);
        
        await makeRequest.delete(`events/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setEvents(events.filter((e) => e.id !== id));
        toast.success("Event deleted successfully");
      } catch (err) {
        console.error("Failed to delete event", err);
        console.error("Response data:", err.response?.data);
        console.error("Response status:", err.response?.status);
        toast.error("Failed to delete event: " + (err.response?.data || err.message));
      } finally {
        setDeletingEventId(null);
      }
    }, 300);
  };

  const handleAvailClick = (event) => {
    setSelectedEvent(event);
    setShowEmailModal(true);
  };

  const getTimeFromISO = (isoString) => {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDatePretty = formatDate;

  const sendJoinEmail = async () => {
    if (!selectedEvent || !emailInput) return;
    setJoinError("");
    // 1. Save join in backend
    try {
      await makeRequest.post(`events/${selectedEvent.id}/avail`, { email: emailInput });
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setJoinError("This email has already joined this event.");
        toast.error("This email has already joined this event.");
      } else {
        setJoinError("Failed to record your join. Please try again.");
        toast.error("Failed to record your join. Please try again.");
      }
      return;
    }

    // 2. Send email
    const userName = emailInput.split("@")[0]; // basic name fallback
    const templateParams = {
      user_name: userName,
      user_email: emailInput,
      event_title: selectedEvent.title,
      event_date: formatDate(selectedEvent.date),
      event_time: formatTimeToAMPM(getTimeFromISO(selectedEvent.time)),
      event_location: selectedEvent.location,
    };

    emailjs
      .send("service_r276hri", "template_w24leai", templateParams, "VciD--jXYRWjpdqNe")
      .then(() => {
        toast.success("You've successfully joined the event! A confirmation email has been sent.");
        setShowEmailModal(false);
        setEmailInput("");
        setShowSuccessModal(true);
        fetchEvents(); // Refresh join count after joining
      })
      .catch((err) => {
        console.error("Email sending failed:", err);
        toast.error("Failed to send confirmation email.");
      });
  };

  const handleEventClick = (event) => {
    setEventDetails(event);
    setShowEventDetails(true);
  };

  const handleEditClick = (event) => {
    setEditEvent({ ...event });
    setEditImage(null);
    setEditImagePreview(event.image || null);
    setShowEditForm(true);
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setEditImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    try {
      let imageUrl = editEvent.image;

      if (editImage) {
        try {
          const formData = new FormData();
          formData.append("file", editImage);
          const uploadRes = await makeRequest.post("upload", formData, {
            headers: { 
              "Content-Type": "multipart/form-data",
              "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
          });
          // Just use the filename
          imageUrl = uploadRes.data;
          console.log("Image uploaded successfully, filename:", imageUrl);
        } catch (uploadErr) {
          console.error("Image upload failed:", uploadErr);
          toast.error("Image upload failed. Keeping existing image.");
          // Keep existing image
        }
      }

      // Format the date correctly for the API
      const formattedDate = formatDateForAPI(editEvent.date);
      
      const updatedEvent = {
        ...editEvent,
        date: formattedDate,
        image: imageUrl,
      };

      console.log("Updating event with data:", updatedEvent);

      await makeRequest.put(`events/${editEvent.id}`, updatedEvent, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      // Fetch all emails who joined this event
      const emailRes = await makeRequest.get(`events/${editEvent.id}/emails`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const emailList = emailRes.data;

      // Send email to each user
      const sendEmails = emailList.map((email) => {
        const templateParams = {
          user_email: email,
          event_title: updatedEvent.title,
          event_date: formatDate(updatedEvent.date),
          event_time: formatTimeToAMPM(updatedEvent.time),
          event_location: updatedEvent.location,
          event_description: updatedEvent.description,
        };

        return emailjs.send(
          "service_2gykz5c", // your EmailJS service ID
          "template_nsf502r", // your EmailJS template ID
          templateParams,
          "i_iqDN7LX-XhcK9R6" // your EmailJS public key
        );
      });

      await Promise.allSettled(sendEmails);

      toast.success("Event updated and notifications sent.");
      setShowEditForm(false);
      setEditEvent(null);
      setEditImage(null);
      setEditImagePreview(null);
      fetchEvents();

    } catch (err) {
      console.error("Failed to update event or send emails:", err);
      alert("Failed to update event or send notifications.");
    }
  };
  

  const handleImageClick = (image) => {
    // Don't do anything if there's no image
    if (!image) return;
    
    // Format the image URL correctly
    let imageUrl = image;
    
    // If it's just a filename (not a full URL and doesn't start with /upload/)
    if (!image.startsWith('http') && !image.startsWith('/upload/')) {
      imageUrl = `${API_BASE_URL}/upload/${image}`;
    } 
    // If it starts with /upload/ but not with http
    else if (image.startsWith('/upload/') && !image.startsWith('http')) {
      imageUrl = `${API_BASE_URL}${image}`;
    }
    
    console.log("Opening image preview with URL:", imageUrl);
    setPreviewImage(imageUrl);
    setShowImagePreview(true);
  };

  // Add a function to format dates correctly for the API
  const formatDateForAPI = (dateString) => {
    // If it's already in YYYY-MM-DD format, return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // If it's an ISO string or Date object, convert to YYYY-MM-DD
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Add this function alongside formatDate
  const formatTime = (timeString) => {
    if (!timeString) return "TBA";
    
    // If it's already in 12-hour format, return as is
    if (timeString.includes("AM") || timeString.includes("PM")) {
      return timeString;
    }
    
    // Try to parse the time (assuming HH:MM 24-hour format)
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      
      // Convert to 12-hour format
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      
      return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (err) {
      // If parsing fails, return the original string
      return timeString;
    }
  };

  // Filter out past events before rendering
  const upcomingEvents = events.filter(e => !isPastEvent(e.date, e.time));

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-50"}`}>
      <div className="max-w-7xl mx-auto p-2 sm:p-4 md:p-6 lg:p-8">
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
                  <Calendar size={28} className={
                    theme === "dark" ? "text-emerald-400" : "text-emerald-600"
                  } />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                    Upcoming Events
                  </h1>
                  <p className={`text-base ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    Join and participate in our community events
                  </p>
                </div>
              </div>
              
              {isAdmin && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-full font-medium shadow-md transition-all duration-200 whitespace-nowrap"
                >
                  <Plus size={20} />
                  Create Event
                </motion.button>
              )}
            </div>
            
            {/* Event Info */}
            <div className={`mt-6 p-4 rounded-xl text-sm ${
              theme === "dark" ? "bg-gray-700/50 text-gray-300" : "bg-gray-50 text-gray-700"
            }`}>
              <p className="flex items-center gap-2">
                <Users size={16} className={theme === "dark" ? "text-amber-400" : "text-amber-500"} />
                <span>Connect with others at our community events and expand your network.</span>
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Events Grid with Original Card Design */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 size={40} className="animate-spin mx-auto mb-4 text-emerald-500" />
            <p className="text-gray-500">Loading events...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className={`rounded-xl overflow-hidden shadow-lg border ${
                  theme === "dark" 
                    ? "bg-gray-800 border-gray-700" 
                    : "bg-white border-gray-200"
                }`}
              >
                {/* Event image */}
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={event.image ? `/upload/${event.image}` : "/event-placeholder.jpg"} 
                    alt={event.title} 
                    className="w-full h-full object-cover"
                  />
                  {/* Date overlay */}
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
                    theme === "dark" 
                      ? "bg-gray-800/90 text-white" 
                      : "bg-white/90 text-gray-900"
                  }`}>
                    {formatDate(event.date)}
                  </div>
                </div>
                
                {/* Event details */}
                <div className="p-4">
                  <h3 className={`text-lg font-semibold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {event.title}
                  </h3>
                  
                  {/* Event metadata */}
                  <div className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{formatTimeToAMPM(event.time)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  
                  {/* Admin actions */}
                  {isAdmin && (
                    <div className="flex justify-end mt-3 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(event);
                        }}
                        className={`p-2 rounded-full ${
                          theme === "dark" 
                            ? "bg-gray-700 hover:bg-gray-600" 
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        <Edit2 size={16} className={theme === "dark" ? "text-gray-300" : "text-gray-600"} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEventToDelete(event);
                          setShowDeleteModal(true);
                        }}
                        className={`p-2 rounded-full ${
                          theme === "dark" 
                            ? "bg-red-500/20 hover:bg-red-500/30" 
                            : "bg-red-100 hover:bg-red-200"
                        }`}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  )}
                  
                  {/* Join button */}
                  <button
                    onClick={() => handleEventClick(event)}
                    className={`w-full mt-3 py-2 rounded-lg text-sm font-medium ${
                      theme === "dark"
                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                    }`}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Empty State */}
        {upcomingEvents.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-20 px-4 rounded-3xl ${
              theme === "dark" 
                ? "bg-gray-800/40 backdrop-blur-md border border-gray-700/50" 
                : "bg-white shadow-lg border border-gray-100"
            }`}
          >
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
              theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
            }`}>
              <Calendar size={40} className={theme === "dark" ? "text-teal-400" : "text-emerald-500"} />
            </div>
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              No Upcoming Events
            </h2>
            <p className={`text-lg mb-8 max-w-md mx-auto ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
              {isAdmin 
                ? "Be the first to create an exciting event for our community" 
                : "Stay tuned! New events will be announced soon"}
            </p>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowForm(true)}
                className={`px-8 py-3 rounded-xl text-white font-medium flex items-center gap-2 ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-teal-500 via-teal-600 to-teal-500 hover:from-teal-600 hover:via-teal-700 hover:to-teal-600"
                    : "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-500"
                } transition-all shadow-lg`}
              >
                <Plus size={20} />
                Create First Event
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Enhanced Create Event Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`w-full max-w-2xl rounded-2xl p-6 ${
                  theme === "dark" ? "bg-gray-900" : "bg-white"
                } shadow-2xl`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-1">
                    <h2 className={`text-2xl font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      Create New Event
                    </h2>
                    <p className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                      Fill in the details to create an exciting event
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowForm(false)}
                    className={`p-2 rounded-lg transition-colors duration-200
                      ${theme === "dark"
                        ? "text-gray-400 hover:text-white hover:bg-gray-800"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                  >
                    <XCircle size={24} strokeWidth={2.5} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Title
                    </label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className={`w-full p-3 rounded-lg outline-none transition-all duration-200
                        ${theme === "dark"
                          ? "bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700"
                          : "bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-gray-100"
                        }`}
                      placeholder="Event title"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        Date
                      </label>
                      <input
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                        className={`w-full p-3 rounded-lg outline-none transition-all duration-200
                          ${theme === "dark"
                            ? "bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700"
                            : "bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-gray-100"
                          }`}
                        min={today}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        Time
                      </label>
                      <input
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                        className={`w-full p-3 rounded-lg outline-none transition-all duration-200
                          ${theme === "dark"
                            ? "bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700"
                            : "bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-gray-100"
                          }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      className={`w-full p-3 rounded-lg outline-none transition-all duration-200
                        ${theme === "dark"
                          ? "bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700"
                          : "bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-gray-100"
                        }`}
                      placeholder="Event location"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Description
                    </label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      rows="4"
                      className={`w-full p-3 rounded-lg outline-none resize-none transition-all duration-200
                        ${theme === "dark"
                          ? "bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700"
                          : "bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-gray-100"
                        }`}
                      placeholder="Event description"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                      Add Image <span className="font-normal text-gray-400">(Optional)</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        id="event-image"
                        accept="image/jpeg,image/png,image/gif,image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="event-image"
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl cursor-pointer border transition-all duration-200 font-medium shadow-sm
                          ${theme === "dark"
                            ? "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                            : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"}
                        `}
                      >
                        <ImageIcon size={20} />
                        <span>Choose Image</span>
                      </label>
                      {imagePreview && (
                        <div className="relative w-20 h-20">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            onClick={() => {
                              setSelectedImage(null);
                              setImagePreview(null);
                            }}
                            className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white"
                          >
                            <XCircle size={32} strokeWidth={2.5} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className={`mt-2 text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                      Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowForm(false)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200
                        ${theme === "dark"
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreate}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200
                        ${theme === "dark"
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                          : "bg-teal-500 hover:bg-teal-600 text-white"
                        }`}
                    >
                      Create Event
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Event Details Modal */}
        <AnimatePresence>
          {showEventDetails && eventDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-800" 
                    : "bg-gradient-to-br from-white via-gray-50 to-white border-gray-100"
                }`}
              >
                {/* Only show image in event details if it exists */}
                {eventDetails.image && (
                  <div className="relative h-64 cursor-pointer group" onClick={() => handleImageClick(eventDetails.image)}>
                    <img
                      src={
                        eventDetails.image.startsWith("http") 
                          ? eventDetails.image 
                          : eventDetails.image.startsWith("/upload/") 
                            ? `${API_BASE_URL}${eventDetails.image}`
                            : `${API_BASE_URL}/upload/${eventDetails.image}`
                      }
                      alt={eventDetails.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        console.error("Image failed to load:", eventDetails.image);
                        // Provide a fallback image instead of hiding
                        e.target.src = "/placeholder-event.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Maximize2 className="text-white w-10 h-10" />
                    </div>
                  </div>
                )}
                
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-2xl sm:text-3xl font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {eventDetails.title}
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowEventDetails(false)}
                      className={`p-2 rounded-full transition-colors duration-200
                        ${theme === "dark"
                          ? "text-gray-400 hover:text-white hover:bg-gray-800"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                    >
                      <XCircle size={24} strokeWidth={2.5} />
                    </motion.button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className={`flex items-center gap-3 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      <div className={`p-2 rounded-lg ${
                        theme === "dark" ? "bg-gray-800" : "bg-gray-100"
                      }`}>
                        <Calendar size={20} className={theme === "dark" ? "text-emerald-400" : "text-teal-500"} />
                      </div>
                      <div>
                        <p className="text-sm opacity-70">Date</p>
                        <p className="font-medium">{formatDatePretty(eventDetails.date)}</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-3 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      <div className={`p-2 rounded-lg ${
                        theme === "dark" ? "bg-gray-800" : "bg-gray-100"
                      }`}>
                        <Clock size={20} className={theme === "dark" ? "text-emerald-400" : "text-teal-500"} />
                      </div>
                      <div>
                        <p className="text-sm opacity-70">Time</p>
                        <p className="font-medium">{formatTimeToAMPM(eventDetails.time)}</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-3 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      <div className={`p-2 rounded-lg ${
                        theme === "dark" ? "bg-gray-800" : "bg-gray-100"
                      }`}>
                        <MapPin size={20} className={theme === "dark" ? "text-emerald-400" : "text-teal-500"} />
                      </div>
                      <div>
                        <p className="text-sm opacity-70">Location</p>
                        <p className="font-medium">{eventDetails.location}</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-3 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      <div className={`p-2 rounded-lg ${
                        theme === "dark" ? "bg-gray-800" : "bg-gray-100"
                      }`}>
                        <Users size={20} className={theme === "dark" ? "text-emerald-400" : "text-teal-500"} />
                      </div>
                      <div>
                        <p className="text-sm opacity-70">Participants</p>
                        <p className="font-medium">{eventDetails.joinCount || 0} joined</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className={`text-lg font-semibold mb-2 ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    }`}>
                      Description
                    </h3>
                    <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      {eventDetails.description}
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAvailClick(eventDetails)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-200 shadow-lg ${
                        theme === "dark"
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                          : "bg-teal-500 hover:bg-teal-600 text-white"
                      }`}
                    >
                      <Mail size={20} />
                      <span>Join Event</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Email Modal */}
        <AnimatePresence>
          {showEmailModal && selectedEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`w-full max-w-md rounded-2xl p-6 ${
                  theme === "dark" ? "bg-gray-900" : "bg-white"
                } shadow-2xl`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-semibold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    Join Event
                  </h2>
                  <button
                    onClick={() => { setShowEmailModal(false); setJoinError(""); }}
                    className={`p-2 rounded-lg transition-colors duration-200
                      ${theme === "dark"
                        ? "text-gray-400 hover:text-white hover:bg-gray-800"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                  >
                    <XCircle size={32} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Error message */}
                  {joinError && (
                    <div className="mb-2 px-3 py-2 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-sm">
                      {joinError}
                    </div>
                  )}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => { setEmailInput(e.target.value); setJoinError(""); }}
                      className={`w-full p-3 rounded-lg outline-none transition-all duration-200
                        ${theme === "dark"
                          ? "bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700"
                          : "bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-gray-100"
                        }`}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowEmailModal(false)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200
                        ${theme === "dark"
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={sendJoinEmail}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200
                        ${theme === "dark"
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                          : "bg-teal-500 hover:bg-teal-600 text-white"
                        }`}
                    >
                      Confirm
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Image Preview Modal */}
        <AnimatePresence>
          {showImagePreview && previewImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
              onClick={() => setShowImagePreview(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full h-full flex items-center justify-center"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowImagePreview(false)}
                  className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-emerald-500 hover:text-white shadow-lg transition-all duration-200 z-10"
                >
                  <XCircle size={32} strokeWidth={2.5} />
                </button>
                <div className="max-w-[90vw] max-h-[90vh] overflow-auto flex items-center justify-center">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                    style={{ display: 'block' }}
                    onError={(e) => {
                      console.error("Preview image failed to load:", previewImage);
                      // Close the preview modal if the image fails to load
                      setShowImagePreview(false);
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Success Modal */}
        <AnimatePresence>
          {showSuccessModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`w-full max-w-md rounded-2xl p-8 text-center ${
                  theme === "dark" ? "bg-gray-900" : "bg-white"
                } shadow-2xl`}
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="mb-6"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={40} className="text-emerald-500" />
                  </div>
                  <h2 className={`text-2xl font-bold mb-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    Successfully Joined!
                  </h2>
                  <p className={`${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}>
                    You've successfully joined the event.<br />
                    A confirmation email has been sent to you.
                  </p>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSuccessModal(false)}
                  className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                    theme === "dark"
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                      : "bg-teal-500 hover:bg-teal-600 text-white"
                  }`}
                >
                  Close
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Delete Modal */}
        {showDeleteModal && eventToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className={`w-full max-w-md rounded-2xl p-8 text-center ${theme === "dark" ? "bg-gray-900" : "bg-white"} shadow-2xl`}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={40} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-red-500">Delete Event</h2>
                <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                  Are you sure you want to delete this event?<br />
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setEventToDelete(null);
                  }}
                  className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                    theme === "dark"
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await handleDelete(eventToDelete.id);
                      setShowDeleteModal(false);
                      setEventToDelete(null);
                    } catch (error) {
                      console.error("Error in delete button handler:", error);
                    }
                  }}
                  className="px-6 py-2 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Edit Event Modal */}
        <AnimatePresence>
          {showEditForm && editEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`w-full max-w-2xl rounded-2xl p-6 ${
                  theme === "dark" ? "bg-gray-900" : "bg-white"
                } shadow-2xl`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-1">
                    <h2 className={`text-2xl font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      Edit Event
                    </h2>
                    <p className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                      Update the details of your event
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEditForm(false)}
                    className={`p-2 rounded-lg transition-colors duration-200
                      ${theme === "dark"
                        ? "text-gray-400 hover:text-white hover:bg-gray-800"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                  >
                    <XCircle size={24} strokeWidth={2.5} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Title
                    </label>
                    <input
                      type="text"
                      value={editEvent.title}
                      onChange={e => setEditEvent({ ...editEvent, title: e.target.value })}
                      className={`w-full p-3 rounded-lg outline-none transition-all duration-200
                        ${theme === "dark"
                          ? "bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700"
                          : "bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-gray-100"
                        }`}
                      placeholder="Event title"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        Date
                      </label>
                      <input
                        type="date"
                        value={editEvent.date}
                        onChange={e => setEditEvent({ ...editEvent, date: e.target.value })}
                        className={`w-full p-3 rounded-lg outline-none transition-all duration-200
                          ${theme === "dark"
                            ? "bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700"
                            : "bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-gray-100"
                          }`}
                        min={today}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        Time
                      </label>
                      <input
                        type="time"
                        value={editEvent.time}
                        onChange={e => setEditEvent({ ...editEvent, time: e.target.value })}
                        className={`w-full p-3 rounded-lg outline-none transition-all duration-200
                          ${theme === "dark"
                            ? "bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700"
                            : "bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-gray-100"
                          }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={editEvent.location}
                      onChange={e => setEditEvent({ ...editEvent, location: e.target.value })}
                      className={`w-full p-3 rounded-lg outline-none transition-all duration-200
                        ${theme === "dark"
                          ? "bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700"
                          : "bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-gray-100"
                        }`}
                      placeholder="Event location"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Description
                    </label>
                    <textarea
                      value={editEvent.description}
                      onChange={e => setEditEvent({ ...editEvent, description: e.target.value })}
                      rows="4"
                      className={`w-full p-3 rounded-lg outline-none resize-none transition-all duration-200
                        ${theme === "dark"
                          ? "bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700"
                          : "bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-gray-100"
                        }`}
                      placeholder="Event description"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                      Edit Image <span className="font-normal text-gray-400">(Optional)</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        id="edit-event-image"
                        accept="image/jpeg,image/png,image/gif,image/*"
                        onChange={handleEditImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="edit-event-image"
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl cursor-pointer border transition-all duration-200 font-medium shadow-sm
                          ${theme === "dark"
                            ? "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                            : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"}
                        `}
                      >
                        <ImageIcon size={20} />
                        <span>Choose Image</span>
                      </label>
                      {editImagePreview && (
                        <div className="relative w-20 h-20">
                          <img
                            src={editImagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            onClick={() => {
                              setEditImage(null);
                              setEditImagePreview(null);
                            }}
                            className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white"
                          >
                            <XCircle size={32} strokeWidth={2.5} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className={`mt-2 text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                      Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowEditForm(false)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200
                        ${theme === "dark"
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUpdate}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200
                        ${theme === "dark"
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                          : "bg-teal-500 hover:bg-teal-600 text-white"
                        }`}
                    >
                      Update Event
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Events;
















































