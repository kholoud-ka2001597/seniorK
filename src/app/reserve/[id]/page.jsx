"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BuildingIcon, UsersIcon, ScissorsIcon, TreePineIcon, PlaneIcon, PlayIcon, DumbbellIcon } from 'lucide-react';
import Select from 'react-select';

export default function ReserveService({ params }) {
  const { id } = params;
  const [loading, setLoading] = useState(false);
  const [service, setService] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [dates, setDates] = useState([]); // Array of { startTime, endTime } for each service
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [withDriver, setWithDriver] = useState(false);

  const router = useRouter();
  const userId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null;
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem("userEmail") : null;

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/services/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setService({ ...data.service, specificService: data.specificService });
            setTotalPrice(0);
          } else {
            console.error("Service not found");
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching service details:", err);
          setLoading(false);
        });
    }
  }, [id]);

  useEffect(() => {
    if (!userEmail && typeof window !== 'undefined') {
      router.push("/login");
    }
  }, [userEmail, router]);

  useEffect(() => {
    // Update total price when selected options or quantity change
    if (selectedOptions.length > 0) {
      const total = selectedOptions.reduce((sum, option) => sum + option.price, 0) * quantity;
      setTotalPrice(total);
    } else {
      setTotalPrice((service?.price || 0) * quantity);
    }
  }, [selectedOptions, quantity, service]);

  useEffect(() => {
    // Sync dates array with selected options
    setDates((prevDates) =>
      selectedOptions.map((_, index) => prevDates[index] || { startTime: "", endTime: "" })
    );
  }, [selectedOptions]);

  const handleDateChange = (index, field, value) => {
    setDates((prevDates) => {
      const newDates = [...prevDates];
      newDates[index] = { ...newDates[index], [field]: value };
      if (field === "startTime" && newDates[index].endTime && new Date(value) > new Date(newDates[index].endTime)) {
        newDates[index].endTime = "";
      }
      return newDates;
    });
  };

  const handleQuantityChange = (e) => {
    const value = Math.max(1, parseInt(e.target.value) || 1);
    setQuantity(value);
  };

  const handleCheckboxChange = () => {
    setWithDriver(!withDriver);
  };

  const validateForm = () => {
    if (selectedOptions.length === 0 && service.specificService?.length > 0) {
      setError("Please select at least one service type.");
      return false;
    }

    for (let i = 0; i < selectedOptions.length; i++) {
      const { startTime, endTime } = dates[i] || {};
      if (!startTime) {
        setError(`Start date is required for ${getSpecificServiceName(selectedOptions[i], service.type)}.`);
        return false;
      }
      if (['hotel', 'car', 'hall'].includes(service.type) && !endTime) {
        setError(`End date is required for ${getSpecificServiceName(selectedOptions[i], service.type)}.`);
        return false;
      }
      if (endTime && new Date(startTime) >= new Date(endTime)) {
        setError(`End date should be later than start date for ${getSpecificServiceName(selectedOptions[i], service.type)}.`);
        return false;
      }
    }
    setError("");
    return true;
  };

  const handleConfirmReservation = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Create one Reservation with multiple ReservationItems
    const reservation = {
      userId: userId,
      userEmail: userEmail,
      status: "pending",
      totalPrice: withDriver ? totalPrice + 5 : totalPrice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reservationItems: selectedOptions.map((option, index) => ({
        serviceId: id,
        price: option.price * quantity,
        startTime: dates[index].startTime,
        endTime: dates[index].endTime || dates[index].startTime,
        specificService: {
          ...option,
          name: getSpecificServiceName(option, service.type),
        },
        editable: true,
        isFilled: false,
        isPublic: true,
      })),
    };

    // Store in localStorage
    const existingReservations = JSON.parse(localStorage.getItem(userEmail)) || [];
    const updatedReservations = [...existingReservations, reservation];
    localStorage.setItem(userEmail, JSON.stringify(updatedReservations));

    // Reset form
    setDates([]);
    setQuantity(1);
    setSelectedOptions([]);
    alert("Reservation saved successfully!");
    router.push("/reservations");
  };

  const getSpecificServiceName = (option, type) => {
    switch (type) {
      case 'hotel':
        return `${option.roomType} Room`;
      case 'car':
        return option.carModel;
      case 'gym':
        return `One ${option.membershipTypes} Pass`;
      case 'salon':
        return option.salonSpecialty;
      case 'flight':
        return `${option.flightClass} Class`;
      case 'hall':
        return option.eventType;
      case 'activity':
        return option.activityType;
      case 'playground':
        return option.playgroundType;
      case 'restaurant':
        return `${option.diningOption} Dining`;
      default:
        return option.name || '';
    }
  };

  const getServiceIcon = (type) => {
    switch (type) {
      case 'hotel':
        return <BuildingIcon className="w-5 h-5" />;
      case 'car':
        return <UsersIcon className="w-5 h-5" />;
      case 'gym':
        return <DumbbellIcon className="w-5 h-5" />;
      case 'salon':
        return <ScissorsIcon className="w-5 h-5" />;
      case 'hall':
        return <BuildingIcon className="w-5 h-5" />;
      case 'activity':
        return <TreePineIcon className="w-5 h-5" />;
      case 'flight':
        return <PlaneIcon className="w-5 h-5" />;
      case 'playground':
        return <PlayIcon className="w-5 h-5" />;
      case 'restaurant':
        return <BuildingIcon className="w-5 h-5" />;
      default:
        return <BuildingIcon className="w-5 h-5" />;
    }
  };

  const renderServiceSpecificFields = () => {
    if (!service) return null;

    if (selectedOptions.length === 0 && service.specificService?.length > 0) {
      return null;
    }

    if (selectedOptions.length === 1) {
      const commonFields = (
        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-700">Date:</label>
          <input
            type="datetime-local"
            value={dates[0]?.startTime || ""}
            onChange={(e) => handleDateChange(0, "startTime", e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
      );

      switch (service.type) {
        case 'hotel':
        case 'car':
        case 'hall':
        case 'restaurant':
          return (
            <>
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700">Start Date:</label>
                <input
                  type="datetime-local"
                  value={dates[0]?.startTime || ""}
                  onChange={(e) => handleDateChange(0, "startTime", e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700">End Date:</label>
                <input
                  type="datetime-local"
                  value={dates[0]?.endTime || ""}
                  onChange={(e) => handleDateChange(0, "endTime", e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  min={dates[0]?.startTime || new Date().toISOString().slice(0, 16)}
                />
              </div>
            </>
          );
        default:
          return commonFields;
      }
    } else {
      return selectedOptions.map((option, index) => (
        <div key={index} className="mt-4 border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700">
            Dates for {getSpecificServiceName(option, service.type)}:
          </h4>
          {['hotel', 'car', 'hall', 'restaurant'].includes(service.type) ? (
            <>
              <div className="mt-2">
                <label className="block text-sm font-semibold text-gray-700">Start Date:</label>
                <input
                  type="datetime-local"
                  value={dates[index]?.startTime || ""}
                  onChange={(e) => handleDateChange(index, "startTime", e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="mt-2">
                <label className="block text-sm font-semibold text-gray-700">End Date:</label>
                <input
                  type="datetime-local"
                  value={dates[index]?.endTime || ""}
                  onChange={(e) => handleDateChange(index, "endTime", e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  min={dates[index]?.startTime || new Date().toISOString().slice(0, 16)}
                />
              </div>
            </>
          ) : (
            <div className="mt-2">
              <label className="block text-sm font-semibold text-gray-700">Date:</label>
              <input
                type="datetime-local"
                value={dates[index]?.startTime || ""}
                onChange={(e) => handleDateChange(index, "startTime", e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}
        </div>
      ));
    }
  };

  const renderQuantityField = () => {
    if (!service) return null;

    let label;
    switch (service.type) {
      case 'hotel':
        label = 'Number of Rooms';
        break;
      case 'flight':
        label = 'Number of Passengers';
        break;
      case 'car':
        label = 'Number of Vehicles';
        break;
      case 'gym':
        label = 'Number of Memberships';
        break;
      case 'salon':
        label = 'Number of Appointments';
        break;
      case 'hall':
        label = 'Number of Halls';
        break;
      case 'activity':
      case 'playground':
        label = 'Number of Tickets';
        break;
      case 'restaurant':
        label = 'Number of Seats';
        break;
      default:
        label = 'Quantity';
    }

    return (
      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-700">{label}:</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={handleQuantityChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
    );
  };

  const renderOptionsSelection = () => {
    if (!service || !service.specificService || service.specificService.length === 0) {
      return null;
    }

    let label;
    switch (service.type) {
      case 'hotel':
        label = 'Room Type';
        break;
      case 'car':
        label = 'Vehicle Model';
        break;
      case 'gym':
        label = 'Membership Type';
        break;
      case 'salon':
        label = 'Service Type';
        break;
      case 'flight':
        label = 'Class';
        break;
      case 'hall':
        label = 'Hall Type';
        break;
      case 'activity':
        label = 'Activity Type';
        break;
      case 'playground':
        label = 'Playground Type';
        break;
      case 'restaurant':
        label = 'Dining Option';
        break;
      default:
        label = 'Options';
    }

    const selectOptions = service.specificService.map((option) => ({
      value: option,
      label: `${getSpecificServiceName(option, service.type)} - QAR ${option.price}`,
      price: option.price,
      ...option,
    }));

    return (
      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-700">{label}:</label>
        <Select
          isMulti
          options={selectOptions}
          value={selectedOptions.map((option) => ({
            value: option,
            label: `${getSpecificServiceName(option, service.type)} - QAR ${option.price}`,
            price: option.price,
            ...option,
          }))}
          onChange={(selected) => setSelectedOptions(selected.map((item) => item.value))}
          className="mt-1"
          placeholder={`Select ${label.toLowerCase()}...`}
          styles={{
            control: (base) => ({
              ...base,
              borderColor: '#d1d5db',
              padding: '2px',
              borderRadius: '0.375rem',
            }),
            multiValue: (base) => ({
              ...base,
              backgroundColor: '#e5e7eb',
              borderRadius: '0.25rem',
            }),
            multiValueLabel: (base) => ({
              ...base,
              color: '#374151',
            }),
            multiValueRemove: (base) => ({
              ...base,
              color: '#6b7280',
              ':hover': {
                backgroundColor: '#d1d5db',
                color: '#374151',
              },
            }),
          }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!service) {
    return <div className="p-6">Service not found.</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-white rounded-lg shadow">{getServiceIcon(service.type)}</div>
          <h1 className="text-3xl font-bold">Reserve: {service.name}</h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <img
            src={`/images/${service.type}.jpg`}
            alt={service.name}
            className="w-full h-56 object-cover"
            onError={(e) => (e.target.src = "/fallback-image.jpg")}
          />

          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
            <p className="text-gray-600 mb-4">{service.description}</p>
            <p className="text-sm text-gray-500 mb-6">
              {service.location && <span className="block">Location: {service.location}</span>}
            </p>

            <form onSubmit={handleConfirmReservation} className="space-y-4">
              {renderOptionsSelection()}
              {renderServiceSpecificFields()}
              {renderQuantityField()}
              {service.type === "car" && (
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="withDriver"
                    checked={withDriver}
                    onChange={handleCheckboxChange}
                    className="mr-2"
                  />
                  <label htmlFor="withDriver" className="text-gray-700">
                    With Driver (+5 QAR)
                  </label>
                </div>
              )}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Price:</span>
                  <span className="text-xl font-bold">
                    QAR {withDriver ? (totalPrice + 5).toFixed(2) : totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <button
                type="submit"
                className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 focus:outline-none transition-colors"
              >
                Confirm Reservation
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}