'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, MapPin, Users, Clock, Trash2, Edit3, CheckCircle, Square, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function PendingReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);
  const [error, setError] = useState("");
  const [confirmationStatus, setConfirmationStatus] = useState("");
  const [selectedReservations, setSelectedReservations] = useState([]);

  const isBrowser = typeof window !== "undefined";
  const userEmail = isBrowser ? localStorage.getItem("userEmail") : null;
  const router = useRouter();

  useEffect(() => {
    if (isBrowser) {
      if (!userEmail) {
        router.push("/login");
        return;
      }

      setLoading(true);

      const allReservations = localStorage.getItem(userEmail);

      if (!allReservations) {
        setReservations([]);
        setLoading(false);
        return;
      }

      try {
        const parsedReservations = JSON.parse(allReservations);
        const pendingReservations = parsedReservations.filter(
          (res) => res.status === "pending"
        );

        const fetchServiceDetails = async () => {
          try {
            const enrichedReservations = await Promise.all(
              pendingReservations.map(async (reservation) => {
                try {
                  const response = await fetch(`/api/services/${reservation.reservationItems[0].serviceId}`);
                  if (!response.ok) throw new Error("Failed to fetch service details");

                  const serviceDetails = await response.json();
                  return {
                    ...reservation,
                    service: serviceDetails.service,
                    type: reservation.serviceType || serviceDetails.service.type,
                    name: serviceDetails.service.name,
                  };
                } catch (error) {
                  console.error("Error fetching service details:", error);
                  return reservation;
                }
              })
            );

            setReservations(enrichedReservations);
          } catch (error) {
            console.error("Error fetching reservations:", error);
            setReservations([]);
          } finally {
            setLoading(false);
          }
        };

        fetchServiceDetails();
      } catch (error) {
        console.error("Error parsing reservations from localStorage:", error);
        setReservations([]);
        setLoading(false);
      }
    }
  }, [router, userEmail]);

  const handleToggleReservationSelection = (reservation) => {
    setSelectedReservations((prev) =>
      prev.some((r) => r.reservationItems[0].serviceId === reservation.reservationItems[0].serviceId)
        ? prev.filter((r) => r.reservationItems[0].serviceId !== reservation.reservationItems[0].serviceId)
        : [...prev, reservation]
    );
  };

  const handleSelectAll = () => {
    setSelectedReservations(
      selectedReservations.length === reservations.length ? [] : [...reservations]
    );
  };

  const handleEdit = (reservation, item) => {
    setEditingItem({ reservation, item });
    setEditStartDate(item.startTime.split('T')[0]);
    setEditEndDate(item.endTime ? item.endTime.split('T')[0] : "");
    setEditQuantity(reservation.quantity || 1);
    setError("");
  };

  const handleConfirmEdit = (event) => {
    event.preventDefault();

    if (!editStartDate) {
      setError("Please provide a start date.");
      return;
    }

    if (
      ['hotel', 'car', 'hall', 'restaurant'].includes(editingItem.reservation.type) &&
      !editEndDate
    ) {
      setError("Please provide an end date.");
      return;
    }

    if (
      editEndDate &&
      ['hotel', 'car', 'hall', 'restaurant'].includes(editingItem.reservation.type) &&
      new Date(editStartDate) >= new Date(editEndDate)
    ) {
      setError("End date should be later than start date.");
      return;
    }

    const updatedReservations = reservations.map((res) => {
      if (
        res.reservationItems[0].serviceId === editingItem.reservation.reservationItems[0].serviceId
      ) {
        const updatedItems = res.reservationItems.map((item) => {
          if (
            item.specificService.name === editingItem.item.specificService.name &&
            item.startTime === editingItem.item.startTime
          ) {
            const pricePerUnit = item.specificService.price;
            const updatedPrice = pricePerUnit * editQuantity;
            return {
              ...item,
              startTime: editStartDate,
              endTime: editEndDate || editStartDate,
              price: updatedPrice,
            };
          }
          return item;
        });

        const totalPrice = updatedItems.reduce((sum, item) => sum + item.price, 0);
        return {
          ...res,
          reservationItems: updatedItems,
          totalPrice,
          quantity: editQuantity,
        };
      }
      return res;
    });

    localStorage.setItem(userEmail, JSON.stringify(updatedReservations));
    setReservations(updatedReservations);
    setEditingItem(null);
  };

  const handleDelete = (reservation) => {
    if (
      window.confirm(
        `Are you sure you want to delete the reservation for ${reservation.name}?`
      )
    ) {
      const updatedReservations = reservations.filter(
        (r) => r.reservationItems[0].serviceId !== reservation.reservationItems[0].serviceId
      );
      localStorage.setItem(userEmail, JSON.stringify(updatedReservations));
      setReservations(updatedReservations);
      setSelectedReservations((prev) =>
        prev.filter((r) => r.reservationItems[0].serviceId !== reservation.reservationItems[0].serviceId)
      );
    }
  };

  const handleConfirmSelectedReservations = async () => {
    if (selectedReservations.length === 0) {
      setConfirmationStatus("Please select at least one reservation.");
      return;
    }

    setConfirmationStatus("Saving selected reservations...");
    localStorage.setItem(`${userEmail}_checkout`, JSON.stringify(selectedReservations));
    router.push("/checkout");
  };

  const getServiceSpecificLabel = (type) => {
    switch (type) {
      case 'hotel':
        return 'Number of Rooms';
      case 'flight':
        return 'Number of Passengers';
      case 'car':
        return 'Number of Vehicles';
      case 'gym':
        return 'Number of Memberships';
      case 'salon':
        return 'Number of Appointments';
      case 'hall':
        return 'Number of Halls';
      case 'restaurant':
        return 'Number of Tables/Seats';
      case 'activity':
      case 'playground':
        return 'Number of Tickets';
      default:
        return 'Quantity';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-gray-600 text-lg">Loading your reservations...</p>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600">
        <div className="text-6xl mb-4">🏷️</div>
        <h3 className="text-xl font-semibold mb-2">No Pending Reservations</h3>
        <p className="text-gray-500">Your reservation list is currently empty.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={handleSelectAll}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            {selectedReservations.length === reservations.length ? (
              <CheckSquare className="w-5 h-5 mr-2" />
            ) : (
              <Square className="w-5 h-5 mr-2" />
            )}
            <span>
              {selectedReservations.length === reservations.length
                ? "Deselect All"
                : "Select All"}
            </span>
          </button>
          <span className="ml-4 text-gray-600">
            {selectedReservations.length} of {reservations.length} selected
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reservations.map((reservation) => (
          <div
            key={reservation.reservationItems[0].serviceId}
            className={`bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl cursor-pointer ${
              selectedReservations.some(
                (r) => r.reservationItems[0].serviceId === reservation.reservationItems[0].serviceId
              )
                ? "border-2 border-blue-500"
                : "border border-gray-200"
            }`}
            onClick={() => handleToggleReservationSelection(reservation)}
          >
            <div className="relative">
              <div className="absolute top-4 left-4 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleReservationSelection(reservation);
                  }}
                  className="p-1 rounded-full bg-white shadow-md"
                >
                  {selectedReservations.some(
                    (r) => r.reservationItems[0].serviceId === reservation.reservationItems[0].serviceId
                  ) ? (
                    <CheckSquare className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Square className="w-6 h-6 text-gray-400" />
                  )}
                </button>
              </div>

              <img
                src={`/images/${reservation.type || 'default'}.jpg`}
                alt={reservation.name}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.src = '/images/default.jpg';
                }}
              />
              <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-md">
                <span className="text-sm font-semibold text-gray-800">
                  QAR {reservation.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {reservation.name}
              </h3>

              {reservation.reservationItems.map((item, index) => (
                <div
                  key={index}
                  className="mb-6 last:mb-0"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {item.specificService.name}
                    </h4>
                    {!editingItem && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(reservation, item);
                        }}
                        className="text-blue-600 hover:text-blue-800 transition-colors flex items-center text-sm"
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                    )}
                  </div>

                  {editingItem?.item === item ? (
                    <form onSubmit={handleConfirmEdit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={editStartDate}
                          onChange={(e) => setEditStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      {['hotel', 'car', 'hall', 'restaurant'].includes(reservation.type) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={editEndDate}
                            onChange={(e) => setEditEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min={editStartDate || new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {getServiceSpecificLabel(reservation.type)}
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {error && (
                        <p className="text-red-500 text-sm mt-2">{error}</p>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Save Changes
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-5 h-5 mr-3" />
                        <span>
                          {format(new Date(item.startTime), 'MMM dd, yyyy')}
                          {item.endTime &&
                            ` - ${format(new Date(item.endTime), 'MMM dd, yyyy')}`}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <Users className="w-5 h-5 mr-3" />
                        <span>
                          {getServiceSpecificLabel(reservation.type)}: {reservation.quantity || 1}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-5 h-5 mr-3" />
                        <span>{reservation.service?.location || "N/A"}</span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <Clock className="w-5 h-5 mr-3" />
                        <span>Price: QAR {item.price.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(reservation);
                  }}
                  className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete Reservation
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {reservations.length > 0 && (
        <div className="mt-12 text-center">
          <button
            onClick={handleConfirmSelectedReservations}
            disabled={selectedReservations.length === 0}
            className={`text-white py-3 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center mx-auto shadow-lg ${
              selectedReservations.length > 0
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            <CheckCircle className="w-6 h-6 mr-2" />
            Confirm {selectedReservations.length} Reservation{selectedReservations.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {confirmationStatus && (
        <div
          className={`mt-6 p-4 rounded-lg ${
            confirmationStatus.includes("successfully")
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            {confirmationStatus}
          </div>
        </div>
      )}
    </div>
  );
}