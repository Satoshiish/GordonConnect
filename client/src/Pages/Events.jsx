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
  Maximize2
} from "lucide-react";
import { toast } from 'react-hot-toast';

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

  const fetchEvents = async () => {
    try {
      const res = await makeRequest.get("events");
      setEvents(filterPastEvents(res.data));
    } catch (err) {
      console.error("Failed to fetch events", err);
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
        const formData = new FormData();
        formData.append("file", selectedImage);
        const uploadRes = await makeRequest.post("upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        imageUrl = "/upload/" + uploadRes.data; // Use the filename directly as in posts
      }

      // Create the event with the image URL
      const eventData = {
        title: newEvent.title,
        date: newEvent.date,
        time: formatTimeTo24Hour(newEvent.time),
        location: newEvent.location,
        description: newEvent.description,
        image: imageUrl
      };

      await makeRequest.post("events", eventData);
      
      fetchEvents();
      setNewEvent({ title: "", date: "", time: "", location: "", description: "" });
      setSelectedImage(null);
      setImagePreview(null);
      setShowForm(false);
    } catch (err) {
      console.error("Failed to create event:", err);
      if (err.response) {
        console.error("Server response:", err.response.data);
        alert(`Failed to create event: ${err.response.data.message || 'Server error'}`);
      } else {
        alert("Failed to create event. Please try again.");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await makeRequest.delete(`events/${id}`);
        setEvents(events.filter((e) => e.id !== id));
      } catch (err) {
        console.error("Failed to delete event", err);
      }
    }
  };

  const handleAvailClick = (event) => {
    setSelectedEvent(event);
    setShowEmailModal(true);
  };

  const sendJoinEmail = () => {
    if (!selectedEvent || !emailInput) return;
  
    const userName = emailInput.split("@")[0]; // basic name fallback
  
    const templateParams = {
      user_name: userName,
      user_email: emailInput,
      event_title: selectedEvent.title,
      event_date: selectedEvent.date,
      event_time: selectedEvent.time,
      event_location: selectedEvent.location,
    };
  
    emailjs
      .send("service_r276hri", "template_w24leai", templateParams, "VciD--jXYRWjpdqNe")
      .then(() => {
        toast.success("You've successfully joined the event! A confirmation email has been sent.");
        setShowEmailModal(false);
        setEmailInput("");
        setShowSuccessModal(true);
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
        const formData = new FormData();
        formData.append("file", editImage);
        const uploadRes = await makeRequest.post("upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = "/upload/" + uploadRes.data;
      }
      const updatedEvent = {
        ...editEvent,
        image: imageUrl,
      };
      await makeRequest.put(`events/${editEvent.id}`, updatedEvent);
      setShowEditForm(false);
      setEditEvent(null);
      setEditImage(null);
      setEditImagePreview(null);
      fetchEvents();
    } catch (err) {
      alert("Failed to update event.");
    }
  };

  const handleImageClick = (image) => {
    setPreviewImage(image);
    setShowImagePreview(true);
  };

  // Filter out past events before rendering
  const upcomingEvents = events.filter(e => !isPastEvent(e.date, e.time));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className={`text-2xl font-bold ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}>
          Upcoming Events
        </h1>
        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${theme === "dark"
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-teal-500 hover:bg-teal-600 text-white"
              }`}
          >
            <Plus size={20} />
            <span>Create Event</span>
          </motion.button>
        )}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upcomingEvents.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`rounded-xl overflow-hidden transition-all duration-200
              ${theme === "dark" 
                ? "bg-gray-800/50 hover:bg-gray-800" 
                : "bg-white hover:bg-gray-50 shadow-sm"}`}
          >
            {event.image && (
              <div className="relative h-48 group cursor-pointer" onClick={() => handleImageClick(event.image)}>
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Maximize2 className="text-white w-8 h-8" />
                </div>
              </div>
            )}
            <div className="p-6 space-y-4">
              <h3 className={`text-xl font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                {event.title}
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} className={theme === "dark" ? "text-emerald-400" : "text-teal-500"} />
                  <span className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                    {new Date(event.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={16} className={theme === "dark" ? "text-emerald-400" : "text-teal-500"} />
                  <span className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                    {formatTimeToAMPM(event.time)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className={theme === "dark" ? "text-emerald-400" : "text-teal-500"} />
                  <span className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                    {event.location}
                  </span>
                </div>
              </div>

              <p className={`text-sm line-clamp-2 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                {event.description}
              </p>

              <div className="flex items-center justify-between pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleEventClick(event)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors duration-200
                    ${theme === "dark"
                      ? "text-emerald-400 hover:text-emerald-300"
                      : "text-teal-600 hover:text-teal-500"
                    }`}
                >
                  <span>View Details</span>
                  <ChevronRight size={16} />
                </motion.button>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEditClick(event)}
                      className={`p-2 rounded-lg transition-colors duration-200
                        ${theme === "dark"
                          ? "text-gray-400 hover:text-emerald-400 hover:bg-gray-700/50"
                          : "text-gray-600 hover:text-teal-600 hover:bg-gray-100"
                        }`}
                    >
                      <Edit2 size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(event.id)}
                      className={`p-2 rounded-lg transition-colors duration-200
                        ${theme === "dark"
                          ? "text-gray-400 hover:text-red-400 hover:bg-gray-700/50"
                          : "text-gray-600 hover:text-red-600 hover:bg-gray-100"
                        }`}
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Event Modal */}
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
              className={`w-full max-w-2xl rounded-xl p-6 ${
                theme === "dark" ? "bg-gray-900" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Create New Event
                </h2>
                <button
                  onClick={() => setShowForm(false)}
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
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Event Image
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      id="event-image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="event-image"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all duration-200
                        ${theme === "dark"
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
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

      {/* Event Details Modal */}
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
              className={`w-full max-w-2xl rounded-xl overflow-hidden ${
                theme === "dark" ? "bg-gray-900" : "bg-white"
              }`}
            >
              {eventDetails.image && (
                <div className="relative h-64 cursor-pointer group" onClick={() => handleImageClick(eventDetails.image)}>
                  <img
                    src={eventDetails.image}
                    alt={eventDetails.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Maximize2 className="text-white w-8 h-8" />
                  </div>
                </div>
              )}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {eventDetails.title}
                  </h2>
                  <button
                    onClick={() => setShowEventDetails(false)}
                    className={`p-2 rounded-lg transition-colors duration-200
                      ${theme === "dark"
                        ? "text-gray-400 hover:text-white hover:bg-gray-800"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                  >
                    <XCircle size={32} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={20} className={theme === "dark" ? "text-emerald-400" : "text-teal-500"} />
                    <span className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                      {new Date(eventDetails.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={20} className={theme === "dark" ? "text-emerald-400" : "text-teal-500"} />
                    <span className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                      {formatTimeToAMPM(eventDetails.time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={20} className={theme === "dark" ? "text-emerald-400" : "text-teal-500"} />
                    <span className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                      {eventDetails.location}
                    </span>
                  </div>
                </div>

                <p className={`text-base ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}>
                  {eventDetails.description}
                </p>

                <div className="flex justify-end pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAvailClick(eventDetails)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                      ${theme === "dark"
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                        : "bg-teal-500 hover:bg-teal-600 text-white"
                      }`}
                  >
                    <Mail size={18} />
                    <span>Join Event</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Modal */}
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
              className={`w-full max-w-md rounded-xl p-6 ${
                theme === "dark" ? "bg-gray-900" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Join Event
                </h2>
                <button
                  onClick={() => setShowEmailModal(false)}
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
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
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

      {/* Image Preview Modal */}
      <AnimatePresence>
        {showImagePreview && previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
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
                className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-emerald-500 hover:text-white shadow-lg transition-all duration-200 z-10 text-3xl"
              >
                <XCircle size={32} strokeWidth={2.5} />
              </button>
              <div className="max-w-[90vw] max-h-[90vh] overflow-auto flex items-center justify-center">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded-lg shadow-lg"
                  style={{ display: 'block' }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Event Modal */}
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
              className={`w-full max-w-2xl rounded-xl p-6 ${
                theme === "dark" ? "bg-gray-900" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Edit Event
                </h2>
                <button
                  onClick={() => setShowEditForm(false)}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-emerald-500 hover:text-white shadow-lg transition-all duration-200 z-10 text-3xl"
                >
                  <XCircle size={32} strokeWidth={2.5} />
                </button>
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
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Event Image
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      id="edit-event-image"
                      accept="image/*"
                      onChange={handleEditImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="edit-event-image"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all duration-200
                        ${theme === "dark"
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
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

      {/* Success Modal after joining event */}
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
              className={`w-full max-w-md rounded-xl p-8 text-center ${theme === "dark" ? "bg-gray-900" : "bg-white"}`}
            >
              <div className="mb-6">
                <Mail size={40} className="mx-auto mb-4 text-emerald-500" />
                <h2 className={`text-2xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Joined Successfully!</h2>
                <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                  You've successfully joined the event.<br />A confirmation email has been sent to you.
                </p>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className={`mt-4 px-6 py-2 rounded-lg font-medium transition-all duration-200
                  ${theme === "dark"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-teal-500 hover:bg-teal-600 text-white"
                  }`}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Events;
