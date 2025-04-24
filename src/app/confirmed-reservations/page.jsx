'use client';

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { CalendarIcon, Clock, Coins, Edit2Icon, Trash2Icon, UserPlusIcon } from "lucide-react";
import { format } from "date-fns";

export default function ConfirmedReservations() {
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [showPartnerPreference, setShowPartnerPreference] = useState(false);
  const [partnerItem, setPartnerItem] = useState(null);
  const [genderPreference, setGenderPreference] = useState("");

  const isBrowser = typeof window !== "undefined";
  const userId = isBrowser ? localStorage.getItem("userId") : null;
  const userEmail = isBrowser ? localStorage.getItem("userEmail") : null;
  const router = useRouter();

  useEffect(() => {
    if (!userEmail || !userId) {
      router.push("/login");
      return;
    }

    const fetchReservations = async () => {
      setIsLoadingReservations(true);
      try {
        const response = await fetch(`/api/reservations/user/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setReservations(data.reservations);
        } else {
          console.error("Failed to fetch reservations");
          toast.error("Failed to fetch reservations");
        }
      } catch (error) {
        console.error("Error fetching reservations:", error);
        toast.error("Error fetching reservations");
      } finally {
        setIsLoadingReservations(false);
      }
    };
    fetchReservations();
  }, [userId, userEmail, router]);

  const handleSelectReservation = async (reservationId, status) => {
    if (status === "COMPLETED") {
      router.push(`/reviews?reservationId=${reservationId}`);
      return;
    }
    
    setIsLoadingItems(true);
    try {
      const response = await fetch(`/api/reservations/${reservationId}/items`);
      if (response.ok) {
        const items = await response.json();
        setSelectedReservation({ id: reservationId, items });
      } else {
        console.error("Failed to fetch reservation items");
        toast.error("Failed to fetch reservation items");
      }
    } catch (error) {
      console.error("Error fetching reservation items:", error);
      toast.error("Error fetching reservation items");
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleDeleteReservationItem = async (itemId) => {
    setIsLoadingItems(true);
    try {
      const response = await fetch(`/api/reservation-items/${itemId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        const updatedItems = selectedReservation.items.filter(
          (item) => item.id !== itemId
        );
        setSelectedReservation((prev) => ({ ...prev, items: updatedItems }));
        toast.success("Reservation item deleted successfully");
      } else {
        console.error("Failed to delete reservation item");
        toast.error("Failed to delete reservation item");
      }
    } catch (error) {
      console.error("Error deleting reservation item:", error);
      toast.error("Error deleting reservation item");
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handlePublicReservation = (e, item) => {
    e.stopPropagation();
    setPartnerItem(item);
    setGenderPreference("");
    setShowPartnerPreference(true);
  };

  const handleSubmitPartnerRequest = async () => {
    setIsLoadingItems(true);
    const filter = {};
    if (genderPreference) {
      filter.gender = genderPreference;
    }
    
    const req = {
      reservationItemID: partnerItem.id,
      requestUser: parseInt(userId),
      status: "pending",
      filter: filter,
    };
    
    try {
      const response = await fetch(`/api/partnerRequests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        const updatedItems = selectedReservation.items.map((item) =>
          item.id === partnerItem.id ? {...item, PartnerRequest: [updatedItem]} : item
        );
        setSelectedReservation((prev) => ({ ...prev, items: updatedItems }));
        
        toast.success(`Partner request submitted successfully${genderPreference ? ` with ${genderPreference} preference` : ''}`);
        setShowPartnerPreference(false);
      } else {
        console.error("Failed to submit partner request");
        toast.error("Failed to submit partner request");
      }
    } catch (error) {
      console.error("Error submitting partner request:", error);
      toast.error("Error submitting partner request");
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleEditClick = (item) => {
    setEditItem(item);
    setStartDate(new Date(item.startTime).toISOString().split("T")[0]);
    setEndDate(new Date(item.endTime).toISOString().split("T")[0]);
  };

  // const handleConfirmEdit = async (e) => {
  //   e.preventDefault();
  //   setIsLoadingItems(true);
  //   let req = {
  //     startTime: new Date(startDate),
  //     endTime: new Date(endDate),
  //   };
  //   try {
  //     const response = await fetch(`/api/reservation-items/${editItem.id}`, {
  //       method: "PATCH",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(req),
  //     });

  //     if (response.ok) {
  //       const updatedItem = await response.json();
  //       const updatedItems = selectedReservation.items.map((item) =>
  //         item.id === updatedItem.id ? updatedItem : item
  //       );
  //       setSelectedReservation((prev) => ({ ...prev, items: updatedItems }));
  //       setEditItem(null);
  //       toast.success("Reservation updated successfully");
  //     } else {
  //       console.error("Failed to edit reservation item");
  //       toast.error("Failed to edit reservation item");
  //     }
  //   } catch (error) {
  //     console.error("Error editing reservation item:", error);
  //     toast.error("Error editing reservation item");
  //   } finally {
  //     setIsLoadingItems(false);
  //   }
  // };

  const handleConfirmEdit = async (e) => {
    e.preventDefault();
    setIsLoadingItems(true);
    let req = {
      startTime: new Date(startDate),
      endTime: new Date(endDate),
    };
    try {
      const response = await fetch(`/api/reservation-items/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
  
      if (response.ok) {
        // Refetch the reservation items to get the enhanced data
        const itemsResponse = await fetch(`/api/reservations/${selectedReservation.id}/items`);
        if (itemsResponse.ok) {
          const updatedItems = await itemsResponse.json();
          setSelectedReservation((prev) => ({ ...prev, items: updatedItems }));
          setEditItem(null);
          toast.success("Reservation updated successfully");
        } else {
          console.error("Failed to refetch reservation items");
          toast.error("Failed to refetch reservation items");
        }
      } else {
        console.error("Failed to edit reservation item");
        toast.error("Failed to edit reservation item");
      }
    } catch (error) {
      console.error("Error editing reservation item:", error);
      toast.error("Error editing reservation item");
    } finally {
      setIsLoadingItems(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Confirmed Reservations</h1>

        {isLoadingReservations ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="h-[calc(100vh-12rem)] overflow-y-auto pr-4 space-y-4">
            {Array.isArray(reservations) && reservations.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500 text-lg">No Confirmed Reservations</p>
              </div>
            ) : (
              reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer ${
                    reservation.status === "COMPLETED" ? "bg-green-50" : ""
                  }`}
                  onClick={() => handleSelectReservation(reservation.id, reservation.status)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                          Reservation #{reservation.id}
                        </h2>
                        <div className="space-y-2">
                          <span className={`inline-flex px-2 py-1 rounded-full text-sm ${
                            reservation.status === "completed" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                          </span>
                          <div className="flex items-center text-gray-600">
                            <Coins className="h-4 w-4 mr-2" />
                            <span>QAR {reservation.totalPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{format(new Date(reservation.createdAt), "PPP p")}</span>
                          </div>
                        </div>
                      </div>
                      {reservation.status === "completed" && (
                        <button onClick={() => router.push("/reviews")}className="ml-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          Leave Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedReservation && (
          <div className="mt-8 bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Reservation Items</h2>
            </div>
            {isLoadingItems ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="p-6">
                <div className="space-y-4">
                  {selectedReservation.items.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="p-6">
                        <div className="flex justify-between">
                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-gray-700">
                              {item.specificService?.name || `Service #${item.serviceId}`}
                            </h3>
                            <div className="flex items-center text-gray-600">
                              <Coins className="h-4 w-4 mr-2" />
                              <span>QAR {item.price.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              <span>
                                {format(new Date(item.startTime), "PPP")} - {format(new Date(item.endTime), "PPP")}
                              </span>
                            </div>
                          </div>
                          
                          {!editItem || editItem.id !== item.id ? (
                            <div className="flex space-x-2">
                              <button
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                              >
                                <Edit2Icon className="h-4 w-4" />
                              </button>
                              {item.PartnerRequest?.length === 0 && (
                                <button
                                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                  onClick={(e) => handlePublicReservation(e, item)}
                                >
                                  <UserPlusIcon className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                onClick={(e) => { e.stopPropagation(); handleDeleteReservationItem(item.id); }}
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <form onSubmit={handleConfirmEdit} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date
                                  </label>
                                  <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date
                                  </label>
                                  <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                              </div>
                              <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Save Changes
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showPartnerPreference && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-lg mx-4">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Partner Preference</h3>
              <p className="text-gray-600 mb-6">
                Would you like to specify a gender preference for your partner?
              </p>
              <div className="space-y-4 mb-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    checked={genderPreference === ""}
                    onChange={() => setGenderPreference("")}
                  />
                  <span className="text-gray-700">No preference</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    checked={genderPreference === "male"}
                    onChange={() => setGenderPreference("male")}
                  />
                  <span className="text-gray-700">Male</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    checked={genderPreference === "female"}
                    onChange={() => setGenderPreference("female")}
                  />
                  <span className="text-gray-700">Female</span>
                </label>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  onClick={() => setShowPartnerPreference(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={handleSubmitPartnerRequest}
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}